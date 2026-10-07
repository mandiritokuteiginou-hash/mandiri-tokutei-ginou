// Finalize (WF10): decides what counts as "alerted" and emits state / log / run-log rows. last_alerted advances ONLY after a 2xx webhook answer
// (or when the channel is LOG-only). A failed send leaves last_alerted untouched so the alert is retried next run.
const cfg = $('Config').first().json;
const plan = $('Plan Monitor').all().map((i) => i.json).find((j) => j && j._kind === 'digest');
if (!plan) return [{ json: { _kind: 'runlog', row: { run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(), health: 'UNKNOWN', alert_status: 'NO_PLAN', summary_json: '{}' } } }];
const resp = ($input.first() || { json: {} }).json || {};
const notSent = resp._kind === 'digest';
const sc = Number(resp.statusCode);
const sentOk = !notSent && sc >= 200 && sc < 300;
let alertStatus = 'LOGGED';
if (plan.has_webhook && plan.send) alertStatus = sentOk ? 'SENT' : 'FAILED_RETRY_NEXT_RUN';
else if (plan.has_webhook) alertStatus = 'NOTHING_DUE';
const mark = alertStatus === 'SENT' || !plan.has_webhook;
const out = []; const ts = cfg.run_started;
const keys = {}; (plan.alert_keys || []).forEach((k) => { keys[k] = true; });
plan.state_rows.forEach((r) => {
  const row = Object.assign({}, r);
  if (mark && keys[r.state_key]) { row.last_alerted = ts; row.times_alerted = (Number(r.times_alerted) || 0) + 1; }
  out.push({ json: { _kind: 'state', row } });
});
const hbBase = plan.heartbeat_row || {};
const hbMark = (plan.has_webhook && alertStatus === 'SENT') || (!plan.has_webhook && plan.heartbeat_due);
out.push({ json: { _kind: 'state', row: { state_key: '__HEARTBEAT__', code: 'HEARTBEAT', severity: 'INFO', subject: 'wf10', status: 'OPEN', first_seen: hbBase.first_seen || ts, last_seen: ts, last_alerted: hbMark ? ts : (hbBase.last_alerted || ''), times_alerted: (Number(hbBase.times_alerted) || 0) + (hbMark ? 1 : 0), detail: 'heartbeat marker' } } });
const L = (e, code, sev, subj, det, outc) => out.push({ json: { _kind: 'log', row: { run_id: cfg.run_id, ts, event: e, code, severity: sev, subject: subj, detail: String(det).slice(0, 300), outcome: outc } } });
plan.log_rows.forEach((l) => L(l.event, l.code, l.severity, l.subject, l.detail, l.outcome));
if (plan.has_webhook && plan.send) L(sentOk ? 'ALERT_SENT' : 'ALERT_FAILED', 'DIGEST', plan.health, 'webhook', sentOk ? 'digest delivered (' + plan.alert_keys.length + ' alert key(s))' : 'webhook status ' + (resp.statusCode || 'none') + ': will retry next run', sentOk ? 'SENT' : 'FAILED');
L('HEALTH', 'RUN_HEALTH', plan.health, cfg.run_id, 'high=' + plan.runlog.findings_high + ' warn=' + plan.runlog.findings_warn + ' info=' + plan.runlog.findings_info, alertStatus);
out.push({ json: { _kind: 'runlog', row: Object.assign({}, plan.runlog, { finished_at: new Date().toISOString(), alert_status: alertStatus }) } });
return out;
