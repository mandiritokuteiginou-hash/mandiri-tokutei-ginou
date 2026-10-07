// Plan Monitor (WF10): pure, deterministic, READ-ONLY analysis. Emits: fix (R1), prune_queue, prune_state, and ONE digest item.
// Never writes to Notion. No PII is ever copied into findings (allow-listed fields only, sanitised, truncated).
const cfg = $('Config').first().json;
const now = Date.parse(cfg.run_started) || Date.now();
const N = (v, d) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const T = (v) => Date.parse(String(v || '')) || 0;
const hrs = (t) => (now - t) / 3600000;
const clean = (s, n) => String(s == null ? '' : s).replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]').replace(/\+?\d[\d\s().-]{5,}\d/g, '[num]').replace(/\s+/g, ' ').trim().slice(0, n || 120);
const rows = (name) => { try { return $(name).all().map((i) => i.json).filter((j) => j && typeof j === 'object' && Object.keys(j).length && !j.error); } catch (e) { return []; } };
const B = (v) => String(v) === 'true';
const stale_run_hours = N(cfg.stale_run_hours, 26), stuck_min = N(cfg.publishing_stuck_minutes, 90), failed_h = N(cfg.failed_stale_hours, 12), mr_h = N(cfg.manual_review_row_hours, 24);
const findings = [];
const add = (code, severity, subject, detail) => findings.push({ code, severity, subject: clean(subject, 60), detail: clean(detail, 160), key: code + '|' + clean(subject, 60) });

// ---- 1. run-log health (WF01-WF09) ----
const WFS = [['WF01', 'Get RL WF01'], ['WF02', 'Get RL WF02'], ['WF03', 'Get RL WF03'], ['WF04', 'Get RL WF04'], ['WF05', 'Get RL WF05'], ['WF06', 'Get RL WF06'], ['WF07', 'Get RL WF07'], ['WF08', 'Get RL WF08'], ['WF09', 'Get RL WF09']];
const STALEMAP = { WF06: 'CONTENT_STALE', WF07: 'IMAGE_STALE', WF08: 'DISTRIBUTION_STALE' };
const HEALTHY_QS = ['', 'OK', 'EMPTY', 'NO_WORK', 'NO_JOBS'];
const wfSummary = {};
WFS.forEach(([wf, node]) => {
  const runs = rows(node).filter((r) => r.run_id).sort((a, b) => T(b.started_at) - T(a.started_at));
  if (!runs.length) { add('NEVER_RAN', B(cfg.expect_runs) ? 'WARN' : 'INFO', wf, 'no run-log rows'); wfSummary[wf] = 'never'; return; }
  const l = runs[0], p = runs[1];
  const lt = T(l.finished_at) || T(l.started_at);
  if (!lt) add('RUN_STALE', 'WARN', wf, 'last run timestamp unreadable');
  else { const a = hrs(lt); if (a > 2 * stale_run_hours) add('RUN_STALE', 'HIGH', wf, 'last run ' + Math.round(a) + 'h ago'); else if (a > stale_run_hours) add('RUN_STALE', 'WARN', wf, 'last run ' + Math.round(a) + 'h ago'); }
  if (wf !== 'WF09' && l.queue_status !== undefined && HEALTHY_QS.indexOf(String(l.queue_status).toUpperCase()) < 0) add('RUN_QUEUE_STATUS', 'WARN', wf, 'queue_status=' + clean(l.queue_status, 40));
  const er = (r) => N(r && r.write_errors, 0) + N(r && r.verify_failed, 0);
  if (er(l) > 0) { if (p && er(p) > 0) add('RUN_REPEATED_ERRORS', 'HIGH', wf, 'write/verify errors in 2 consecutive runs (' + er(l) + ',' + er(p) + ')'); else add('RUN_WRITE_ERRORS', 'WARN', wf, 'write/verify errors=' + er(l)); }
  if (STALEMAP[wf] && N(l.stale, 0) > 0) add(STALEMAP[wf], p && N(p.stale, 0) > 0 ? 'HIGH' : 'WARN', wf, 'stale=' + N(l.stale, 0) + (p && N(p.stale, 0) > 0 ? ' (2 consecutive runs)' : ''));
  wfSummary[wf] = 'ok';
});

// ---- 2. distribution queue ----
const q = rows('Get Queue').filter((r) => r.distribution_hash !== undefined);
const KNOWN = ['PUBLISHING', 'PUBLISHED', 'FAILED', 'MANUAL_REVIEW', 'DRY_RUN'];
const hcount = {}; q.forEach((r) => { hcount[r.distribution_hash] = (hcount[r.distribution_hash] || 0) + 1; });
const dupe = (r) => !r.distribution_hash || hcount[r.distribution_hash] > 1;
const age = (r) => { const t = T(r.updated_at); return t ? hrs(t) : null; };
const fixes = [], pruneQ = [], logs = [];
let mrOld = 0, mrAll = 0, failStale = 0;
q.forEach((r) => {
  const st = String(r.status || ''); const a = age(r); const h8 = String(r.distribution_hash || '').slice(0, 10);
  if (KNOWN.indexOf(st) < 0) add('QUEUE_UNKNOWN_STATUS', 'WARN', h8 || 'row', 'status=' + clean(st, 30));
  if (st === 'PUBLISHING') {
    if (a === null || a * 60 > stuck_min) {
      add('QUEUE_STUCK_PUBLISHING', 'HIGH', h8 || 'row', (a === null ? 'timestamp unreadable' : 'PUBLISHING for ' + Math.round(a * 60) + ' min') + ' (' + clean(r.platform, 20) + ')');
      if (a !== null && B(cfg.auto_recover) && !dupe(r) && fixes.length < N(cfg.recovery_max_per_run, 10)) {
        fixes.push({ _kind: 'fix', recovery: 'R1', row: { distribution_hash: r.distribution_hash, job_id: String(r.job_id || ''), page_id: String(r.page_id || ''), platform: String(r.platform || ''), content_hash: String(r.content_hash || ''), image_build_hash: String(r.image_build_hash || ''), status: 'MANUAL_REVIEW', attempt: N(r.attempt, 1), external_post_id: String(r.external_post_id || ''), published_at: '', error_code: 'AMBIGUOUS_PUBLISH', error_message: 'WF10 R1: PUBLISHING never confirmed; check the platform before any action (no auto retry)', updated_at: cfg.run_started } });
      }
    }
  }
  if (st === 'MANUAL_REVIEW') { mrAll++; if (a === null || a > mr_h) mrOld++; }
  if (st === 'FAILED' && (a === null || a > failed_h)) failStale++;
  if (st === 'PUBLISHED' && !String(r.external_post_id || '').trim()) add('QUEUE_PUBLISHED_NO_ID', 'WARN', h8 || 'row', 'PUBLISHED without external_post_id (' + clean(r.platform, 20) + ')');
  // prune candidates (whitelist; PUBLISHING / MANUAL_REVIEW / unknown never)
  if (!dupe(r) && a !== null) {
    if (st === 'DRY_RUN' && a > N(cfg.prune_dry_run_days, 7) * 24) pruneQ.push({ h: r.distribution_hash, st, why: 'DRY_RUN older than ' + N(cfg.prune_dry_run_days, 7) + 'd' });
    else if (st === 'FAILED' && a > N(cfg.prune_failed_days, 60) * 24) pruneQ.push({ h: r.distribution_hash, st, why: 'FAILED older than ' + N(cfg.prune_failed_days, 60) + 'd' });
    else if (st === 'PUBLISHED' && N(cfg.prune_published_days, 0) > 0 && a > N(cfg.prune_published_days, 0) * 24) pruneQ.push({ h: r.distribution_hash, st, why: 'PUBLISHED older than ' + N(cfg.prune_published_days, 0) + 'd (explicitly enabled)' });
  }
});
Object.keys(hcount).forEach((h) => { if (h && hcount[h] > 1) add('QUEUE_DUPLICATE_HASH', 'HIGH', h.slice(0, 10), hcount[h] + ' queue rows share one distribution_hash'); });
if (mrAll) add('QUEUE_MANUAL_REVIEW', mrOld ? 'HIGH' : 'WARN', 'queue', mrAll + ' row(s) in MANUAL_REVIEW' + (mrOld ? ', ' + mrOld + ' older than ' + mr_h + 'h' : ''));
if (failStale) add('QUEUE_FAILED_STALE', 'WARN', 'queue', failStale + ' FAILED row(s) older than ' + failed_h + 'h');

// ---- 3. leads (PII-safe columns only) ----
const guard = (() => { try { return $('Build Lead Query').first().json; } catch (e) { return { ok: false, missing: ['guard unavailable'] }; } })();
const lres = (() => { try { return $('Lead Query').first().json; } catch (e) { return {}; } })();
const ALLOWED = guard.allowed || ['Lead ID', 'Lead Status', 'Status Changed', 'Last Contact', 'Purge After', 'PII Purged', 'Human Action', 'Draft Kind'];
let leadsScanned = 0;
if (!guard.ok) add('LEADS_GUARD_REFUSED', 'HIGH', 'leads', 'PII-safe query refused; unresolved: ' + (guard.missing || []).join(',').slice(0, 100));
else if (!lres || lres.object === 'error' || lres.error || !Array.isArray(lres.results)) add('LEADS_QUERY_ERROR', 'WARN', 'leads', 'Notion query failed: ' + clean((lres && (lres.message || (lres.error && lres.error.message) || lres.code)) || 'no results array', 80));
else {
  const pages = lres.results; let viol = false;
  pages.forEach((p) => { Object.keys(p.properties || {}).forEach((k) => { if (ALLOWED.indexOf(k) < 0) viol = true; }); });
  if (viol) add('LEADS_GUARD_REFUSED', 'HIGH', 'leads', 'response contained non-allow-listed columns; lead data discarded (filter_properties not honoured)');
  else {
    const val = (p) => { if (!p) return null; const t = p.type; if (t === 'title') return (p.title || []).map((x) => x.plain_text).join(''); if (t === 'rich_text') return (p.rich_text || []).map((x) => x.plain_text).join(''); if (t === 'select') return p.select ? p.select.name : null; if (t === 'status') return p.status ? p.status.name : null; if (t === 'date') return p.date ? p.date.start : null; if (t === 'checkbox') return !!p.checkbox; return null; };
    const ACTIVE = ['NEW', 'CONTACTED', 'SCREENING', 'ELIGIBLE', 'DOCS_REQUESTED', 'DOCS_RECEIVED'];
    const L = pages.map((p) => ({ id: clean(val(p.properties['Lead ID']), 40), status: String(val(p.properties['Lead Status']) || ''), changed: T(val(p.properties['Status Changed'])), contact: T(val(p.properties['Last Contact'])), purgeAfter: T(val(p.properties['Purge After'])), purged: val(p.properties['PII Purged']) === true }));
    leadsScanned = L.length;
    const pOver = L.filter((l) => l.purgeAfter && !l.purged && hrs(l.purgeAfter) > N(cfg.purge_grace_days, 2) * 24);
    if (pOver.length) add('LEAD_PURGE_OVERDUE', 'HIGH', 'leads', pOver.length + ' lead(s) past Purge After with PII not purged: ' + pOver.slice(0, 5).map((l) => l.id).join(','));
    const lim = (N(cfg.dormant_after_days, 21) + N(cfg.dormant_grace_days, 3)) * 24;
    const dorm = L.filter((l) => ACTIVE.indexOf(l.status) >= 0 && (Math.max(l.contact, l.changed) ? hrs(Math.max(l.contact, l.changed)) > lim : false));
    if (dorm.length) add('LEAD_DORMANT_UNMARKED', 'WARN', 'leads', dorm.length + ' active lead(s) idle > ' + Math.round(lim / 24) + 'd not marked DORMANT: ' + dorm.slice(0, 5).map((l) => l.id).join(','));
    const mr = L.filter((l) => l.status === 'MANUAL_REVIEW' && l.changed && hrs(l.changed) > N(cfg.lead_review_days, 3) * 24);
    if (mr.length) add('LEAD_MANUAL_REVIEW_AGING', 'WARN', 'leads', mr.length + ' lead(s) in MANUAL_REVIEW > ' + N(cfg.lead_review_days, 3) + 'd: ' + mr.slice(0, 5).map((l) => l.id).join(','));
    if (lres.has_more) add('LEADS_TRUNCATED', 'INFO', 'leads', 'more than 100 leads; only the 100 most recently edited were scanned');
  }
}

// ---- 4. n8n executions / pruning ----
let execStatus = 'NOT_CONFIGURED';
const ex = (() => { try { return $input.first().json; } catch (e) { return {}; } })();
let idMap = {}; try { idMap = JSON.parse(cfg.workflow_ids_json || '{}'); } catch (e) { idMap = {}; }
if (!String(cfg.n8n_api_base || '').trim()) add('EXEC_NOT_CONFIGURED', 'INFO', 'executions', 'n8n_api_base empty: failed-execution detection off (run-log based detection still active)');
else if (!ex || !Array.isArray(ex.data)) { execStatus = 'API_ERROR'; add('EXEC_API_ERROR', 'WARN', 'executions', 'n8n API unreachable or unexpected response: ' + clean((ex && (ex.message || (ex.error && ex.error.message))) || 'no data array', 80)); }
else {
  execStatus = 'OK'; const win = N(cfg.exec_window_hours, 24);
  const fails = {}; ex.data.forEach((e) => { if (['error', 'crashed'].indexOf(String(e.status)) >= 0 && T(e.startedAt) && hrs(T(e.startedAt)) <= win) { const k = String(e.workflowId || 'unknown'); fails[k] = (fails[k] || 0) + 1; } });
  Object.keys(fails).forEach((k) => add('EXEC_FAILED', fails[k] >= N(cfg.exec_fail_high, 5) ? 'HIGH' : 'WARN', idMap[k] || ('wf:' + k), fails[k] + ' failed execution(s) in ' + win + 'h'));
  const ts = ex.data.map((e) => T(e.startedAt)).filter((x) => x);
  if (ex.data.length < 100 && ts.length && hrs(Math.min.apply(null, ts)) > 1.5 * N(cfg.exec_max_age_hours, 72)) add('EXEC_PRUNING_INEFFECTIVE', 'HIGH', 'executions', 'oldest stored execution ' + Math.round(hrs(Math.min.apply(null, ts))) + 'h old; execution data holds PII, expected pruning at ' + N(cfg.exec_max_age_hours, 72) + 'h');
}
if (!B(cfg.exec_pruning_confirmed)) add('EXEC_PRUNING_UNCONFIRMED', 'WARN', 'executions', 'confirm instance pruning (EXECUTIONS_DATA_MAX_AGE=' + N(cfg.exec_max_age_hours, 72) + ') then set exec_pruning_confirmed=true');

// ---- 5. error-log spike ----
const bySrc = {}; rows('Get Error Log').forEach((e) => { const t = T(e.ts); if (t && hrs(t) <= 24) { const s = clean(e.source || 'unknown', 40); bySrc[s] = (bySrc[s] || 0) + 1; } });
Object.keys(bySrc).forEach((s) => { if (bySrc[s] >= N(cfg.errlog_spike, 20)) add('ERRLOG_SPIKE', 'WARN', s, bySrc[s] + ' error-log rows in 24h'); });

// ---- 6. alert state machine ----
const state = {}; rows('Get State').filter((r) => r.state_key).forEach((r) => { state[r.state_key] = r; });
const sev = { HIGH: 3, WARN: 2, INFO: 1 };
const seen = {}; const stateRows = []; const alertKeys = []; let newCount = 0, resolvedCount = 0;
findings.forEach((f) => {
  if (seen[f.key]) return; seen[f.key] = true;
  const s = state[f.key]; const open = s && s.status === 'OPEN';
  let alert = false; let first = cfg.run_started; let times = 0; let lastAl = '';
  if (open) {
    first = s.first_seen || cfg.run_started; times = N(s.times_alerted, 0); lastAl = s.last_alerted || '';
    const since = lastAl ? hrs(T(lastAl)) : 1e9;
    if (f.severity === 'HIGH' && (since >= N(cfg.realert_high_hours, 12) || s.severity !== 'HIGH')) alert = true;
    if (f.severity === 'WARN' && (since >= N(cfg.realert_warn_hours, 48) || s.severity === 'INFO')) alert = true;
  } else { newCount++; alert = f.severity !== 'INFO'; logs.push({ event: 'FINDING_NEW', code: f.code, severity: f.severity, subject: f.subject, detail: f.detail, outcome: 'OPEN' }); }
  f.alert = alert; if (alert) alertKeys.push(f.key);
  stateRows.push({ state_key: f.key, code: f.code, severity: f.severity, subject: f.subject, status: 'OPEN', first_seen: first, last_seen: cfg.run_started, last_alerted: lastAl, times_alerted: times, detail: f.detail });
});
Object.keys(state).forEach((k) => { const s = state[k]; if (k === '__HEARTBEAT__' || seen[k] || s.status !== 'OPEN') return; resolvedCount++; stateRows.push({ state_key: k, code: s.code, severity: s.severity, subject: s.subject, status: 'RESOLVED', first_seen: s.first_seen, last_seen: s.last_seen, last_alerted: s.last_alerted || '', times_alerted: N(s.times_alerted, 0), detail: 'resolved ' + cfg.run_started }); logs.push({ event: 'RESOLVED', code: s.code, severity: s.severity, subject: s.subject, detail: 'no longer detected', outcome: 'RESOLVED' }); });
const hb = state['__HEARTBEAT__']; const hbDue = !hb || !hb.last_alerted || hrs(T(hb.last_alerted)) >= N(cfg.heartbeat_hours, 24);
const hasWebhook = !!String(cfg.alert_webhook_url || '').trim();

// ---- 7. recovery + prune log rows, prune items ----
fixes.forEach((f) => logs.push({ event: 'RECOVERY', code: 'R1', severity: 'HIGH', subject: String(f.row.distribution_hash).slice(0, 10), detail: 'PUBLISHING -> MANUAL_REVIEW (AMBIGUOUS_PUBLISH), no retry', outcome: 'REQUESTED' }));
const live = String(cfg.prune_mode || 'DRY_RUN').toUpperCase() === 'LIVE'; const pmax = N(cfg.prune_max_per_run, 50);
const pq = pruneQ.slice(0, pmax); const pruneItems = [];
pq.forEach((c) => { logs.push({ event: live ? 'PRUNED' : 'PRUNE_CANDIDATE', code: 'PRUNE_QUEUE', severity: 'INFO', subject: String(c.h).slice(0, 10), detail: c.st + ': ' + c.why, outcome: live ? 'REQUESTED' : 'DRY_RUN' }); if (live) pruneItems.push({ _kind: 'prune_queue', distribution_hash: c.h }); });
const stateOld = Object.keys(state).filter((k) => k !== '__HEARTBEAT__' && state[k].status === 'RESOLVED' && T(state[k].last_seen) && hrs(T(state[k].last_seen)) > N(cfg.prune_state_days, 14) * 24).slice(0, pmax);
stateOld.forEach((k) => { logs.push({ event: live ? 'PRUNED' : 'PRUNE_CANDIDATE', code: 'PRUNE_STATE', severity: 'INFO', subject: k.slice(0, 40), detail: 'RESOLVED older than ' + N(cfg.prune_state_days, 14) + 'd', outcome: live ? 'REQUESTED' : 'DRY_RUN' }); if (live) pruneItems.push({ _kind: 'prune_state', state_key: k }); });

// ---- 8. health + digest ----
const cnt = (s) => findings.filter((f) => f.severity === s).length;
const health = cnt('HIGH') ? 'CRIT' : cnt('WARN') ? 'WARN' : 'OK';
const send = hasWebhook && (alertKeys.length > 0 || hbDue);
const lines = []; ['HIGH', 'WARN'].forEach((s) => findings.filter((f) => f.severity === s).slice(0, 12).forEach((f) => lines.push('[' + s + (f.alert ? '*' : '') + '] ' + f.code + ' ' + f.subject + ': ' + f.detail)));
const text = ('MTG WF10 ' + cfg.run_id + ' health=' + health + ' high=' + cnt('HIGH') + ' warn=' + cnt('WARN') + ' info=' + cnt('INFO') + ' recoveries=' + fixes.length + ' prune_candidates=' + pq.length + (live ? ' (LIVE)' : ' (dry-run)') + (lines.length ? '\n' + lines.join('\n') : '\nno open HIGH/WARN findings') + '\n(* = new/re-alert)').slice(0, 1500);
const runlog = { run_id: cfg.run_id, started_at: cfg.run_started, health, findings_high: cnt('HIGH'), findings_warn: cnt('WARN'), findings_info: cnt('INFO'), new_findings: newCount, resolved: resolvedCount, recoveries: fixes.length, prune_candidates: pq.length + stateOld.length, pruned: live ? pruneItems.length : 0, queue_rows: q.length, leads_scanned: leadsScanned, exec_status: execStatus, summary_json: JSON.stringify({ workflows: wfSummary, alerts: alertKeys.length, heartbeat_due: hbDue }).slice(0, 2000) };
const digest = { _kind: 'digest', send, has_webhook: hasWebhook, webhook_body: { text, content: text, run_id: cfg.run_id }, alert_keys: alertKeys, heartbeat_due: hbDue, heartbeat_row: hb || null, state_rows: stateRows, log_rows: logs, runlog, health, findings: findings.map((f) => ({ code: f.code, severity: f.severity, subject: f.subject, key: f.key, alert: !!f.alert })) };
return fixes.map((f) => ({ json: f })).concat(pruneItems.map((p) => ({ json: p }))).concat([{ json: digest }]);
