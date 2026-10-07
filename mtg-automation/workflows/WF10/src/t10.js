const { run } = require('./harness.js');
let pass = 0, fail = 0; const asrt = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const NOW = '2026-10-07T08:00:00.000Z'; const nowT = Date.parse(NOW);
const ago = (h) => new Date(nowT - h * 3600000).toISOString();
const J = (o) => ({ json: o });
const baseCfg = () => ({ run_id: 'MN-T', run_started: NOW, stale_run_hours: 26, publishing_stuck_minutes: 90, failed_stale_hours: 12, manual_review_row_hours: 24, expect_runs: 'false', auto_recover: 'true', recovery_max_per_run: 10, prune_mode: 'DRY_RUN', prune_dry_run_days: 7, prune_failed_days: 60, prune_published_days: 0, prune_state_days: 14, prune_max_per_run: 50, purge_grace_days: 2, dormant_after_days: 21, dormant_grace_days: 3, lead_review_days: 3, n8n_api_base: '', exec_pruning_confirmed: 'true', exec_max_age_hours: 72, exec_window_hours: 24, exec_fail_high: 5, errlog_spike: 20, realert_high_hours: 12, realert_warn_hours: 48, heartbeat_hours: 24, alert_webhook_url: '', workflow_ids_json: '{}' });
const RL = ['WF01','WF02','WF03','WF04','WF05','WF06','WF07','WF08','WF09'];
const okRun = (h, extra) => Object.assign({ run_id: 'r' + h, started_at: ago(h), finished_at: ago(h - 0.1), queue_status: 'OK', write_errors: 0, verify_failed: 0, stale: 0 }, extra || {});
function mk(o) {
  o = o || {}; const cfg = Object.assign(baseCfg(), o.cfg || {});
  const nodes = { Config: [J(cfg)], 'Get Queue': (o.queue || [{}]).map(J), 'Get Error Log': (o.errlog || [{}]).map(J), 'Get State': (o.state || [{}]).map(J), 'Build Lead Query': [J(o.guard || { ok: true })], 'Lead Query': [J(o.leads || { results: [] })] };
  RL.forEach((w) => { nodes['Get RL ' + w] = ((o.runs && o.runs[w]) || [okRun(5)]).map(J); });
  return { input: [J(o.exec || {})], nodes };
}
const P = (o) => run('./plan10.js', mk(o)).map((x) => x.json);
const D = (r) => r.find((x) => x._kind === 'digest');
const has = (d, c, s) => d.findings.some((f) => f.code === c && (!s || f.severity === s));
const FIN = (d, resp) => { const o = mk({}); o.nodes['Plan Monitor'] = [J(d)]; o.input = [J(resp)]; return run('./finalize10.js', o).map((x) => x.json); };

// ---- healthy baseline
let r = P(); let d = D(r);
asrt(r.length === 1 && d, 'baseline: only a digest');
asrt(d.health === 'OK' && d.runlog.findings_high === 0 && d.runlog.findings_warn === 0, 'baseline OK');
asrt(has(d, 'EXEC_NOT_CONFIGURED', 'INFO'), 'exec not configured is INFO');
asrt(!has(d, 'NEVER_RAN'), 'all wf ran => no NEVER_RAN');
asrt(d.send === false, 'no webhook => nothing to send');

// ---- NEVER_RAN, expect_runs
d = D(P({ runs: { WF03: [{}] } })); asrt(has(d, 'NEVER_RAN', 'INFO'), 'NEVER_RAN INFO when schedules off');
d = D(P({ runs: { WF03: [{}] }, cfg: { expect_runs: 'true' } })); asrt(has(d, 'NEVER_RAN', 'WARN'), 'NEVER_RAN WARN when expect_runs');
// ---- RUN_STALE boundaries
d = D(P({ runs: { WF01: [okRun(25.9)] } })); asrt(!has(d, 'RUN_STALE'), 'stale 25.9h ok');
d = D(P({ runs: { WF01: [okRun(27)] } })); asrt(has(d, 'RUN_STALE', 'WARN'), 'stale 27h WARN');
d = D(P({ runs: { WF01: [okRun(53)] } })); asrt(has(d, 'RUN_STALE', 'HIGH'), 'stale 53h HIGH');
d = D(P({ runs: { WF01: [okRun(30), okRun(2)] } })); asrt(!has(d, 'RUN_STALE'), 'rows re-sorted: latest by started_at wins');
d = D(P({ runs: { WF01: [{ run_id: 'x', started_at: 'garbage' }] } })); asrt(has(d, 'RUN_STALE', 'WARN'), 'unreadable timestamp => finding (Unknown != fine)');
// ---- queue_status / write errors / repeated
d = D(P({ runs: { WF02: [okRun(5, { queue_status: 'NOTION_ERROR' })] } })); asrt(has(d, 'RUN_QUEUE_STATUS', 'WARN'), 'bad queue_status');
d = D(P({ runs: { WF09: [okRun(5, { queue_status: undefined, inbox_status: 'whatever' })] } })); asrt(!has(d, 'RUN_QUEUE_STATUS'), 'WF09 has no queue_status check');
d = D(P({ runs: { WF04: [okRun(5, { write_errors: 2 }), okRun(17)] } })); asrt(has(d, 'RUN_WRITE_ERRORS', 'WARN') && !has(d, 'RUN_REPEATED_ERRORS'), 'single-run write errors WARN');
d = D(P({ runs: { WF04: [okRun(5, { verify_failed: 1 }), okRun(17, { write_errors: 1 })] } })); asrt(has(d, 'RUN_REPEATED_ERRORS', 'HIGH'), 'repeated errors HIGH');
// ---- stale content/image/distribution
d = D(P({ runs: { WF06: [okRun(5, { stale: 2 })], WF07: [okRun(5, { stale: 1 }), okRun(17, { stale: 1 })], WF08: [okRun(5, { stale: 0 })] } }));
asrt(has(d, 'CONTENT_STALE', 'WARN') && has(d, 'IMAGE_STALE', 'HIGH') && !has(d, 'DISTRIBUTION_STALE'), 'stale content WARN / image HIGH(2 runs) / distribution none');
d = D(P({ runs: { WF08: [okRun(5, { stale: 3 })] } })); asrt(has(d, 'DISTRIBUTION_STALE', 'WARN'), 'distribution stale WARN');

// ---- queue
const qrow = (h, st, ageMin, extra) => Object.assign({ distribution_hash: h, job_id: 'J1', page_id: 'P1', platform: 'instagram', content_hash: 'c', image_build_hash: 'i', status: st, attempt: 1, external_post_id: '', published_at: '', error_code: '', error_message: '', updated_at: new Date(nowT - ageMin * 60000).toISOString() }, extra || {});
r = P({ queue: [qrow('aaaaaaaaaaaa1', 'PUBLISHING', 89)] }); d = D(r);
asrt(!has(d, 'QUEUE_STUCK_PUBLISHING') && r.length === 1, 'PUBLISHING 89 min: not stuck, no fix');
r = P({ queue: [qrow('aaaaaaaaaaaa1', 'PUBLISHING', 120, { attempt: 2, external_post_id: 'EXT9' })] }); d = D(r);
const fx = r.filter((x) => x._kind === 'fix');
asrt(has(d, 'QUEUE_STUCK_PUBLISHING', 'HIGH') && fx.length === 1, 'PUBLISHING 120 min: HIGH + R1');
asrt(fx[0].row.status === 'MANUAL_REVIEW' && fx[0].row.error_code === 'AMBIGUOUS_PUBLISH' && fx[0].row.published_at === '' && fx[0].row.external_post_id === 'EXT9' && fx[0].row.attempt === 2, 'R1 row: MANUAL_REVIEW, keeps attempt + external id, no published_at');
asrt(fx[0].row.distribution_hash === 'aaaaaaaaaaaa1' && fx[0].row.job_id === 'J1' && fx[0].row.platform === 'instagram' && fx[0].row.content_hash === 'c', 'R1 row keeps identity columns');
asrt(Object.keys(fx[0].row).sort().join() === ['distribution_hash','job_id','page_id','platform','content_hash','image_build_hash','status','attempt','external_post_id','published_at','error_code','error_message','updated_at'].sort().join(), 'R1 row has exactly the queue columns');
const applied = Object.assign({}, fx[0].row);
r = P({ queue: [applied] }); d = D(r);
asrt(r.filter((x) => x._kind === 'fix').length === 0 && !has(d, 'QUEUE_STUCK_PUBLISHING') && has(d, 'QUEUE_MANUAL_REVIEW'), 'idempotent: after R1 no new fix, finding becomes MANUAL_REVIEW');
r = P({ queue: [qrow('h1', 'PUBLISHING', 500)], cfg: { auto_recover: 'false' } }); asrt(r.filter((x) => x._kind === 'fix').length === 0 && has(D(r), 'QUEUE_STUCK_PUBLISHING', 'HIGH'), 'auto_recover=false: alert only');
r = P({ queue: [qrow('h1', 'PUBLISHING', 5, { updated_at: 'zzz' })] }); asrt(r.filter((x) => x._kind === 'fix').length === 0 && has(D(r), 'QUEUE_STUCK_PUBLISHING', 'HIGH'), 'unreadable timestamp: alert only, never fix');
r = P({ queue: Array.from({ length: 15 }, (_, i) => qrow('hh' + i, 'PUBLISHING', 300)), cfg: { recovery_max_per_run: 3 } }); asrt(r.filter((x) => x._kind === 'fix').length === 3, 'recovery cap respected');
r = P({ queue: [qrow('dup', 'PUBLISHING', 300), qrow('dup', 'FAILED', 300)] }); asrt(r.filter((x) => x._kind === 'fix').length === 0 && has(D(r), 'QUEUE_DUPLICATE_HASH', 'HIGH'), 'duplicate hash: alert only');
r = P({ queue: ['FAILED', 'PUBLISHED', 'MANUAL_REVIEW', 'DRY_RUN', 'WEIRD'].map((s, i) => qrow('x' + i, s, 99999, { external_post_id: 'e' })) }); asrt(r.filter((x) => x._kind === 'fix').length === 0, 'non-PUBLISHING rows never fixed');
asrt(has(D(r), 'QUEUE_UNKNOWN_STATUS', 'WARN'), 'unknown status WARN');
d = D(P({ queue: [qrow('m1', 'MANUAL_REVIEW', 60)] })); asrt(has(d, 'QUEUE_MANUAL_REVIEW', 'WARN'), 'fresh MANUAL_REVIEW WARN');
d = D(P({ queue: [qrow('m1', 'MANUAL_REVIEW', 60 * 25)] })); asrt(has(d, 'QUEUE_MANUAL_REVIEW', 'HIGH'), 'old MANUAL_REVIEW HIGH');
d = D(P({ queue: [qrow('f1', 'FAILED', 60 * 11)] })); asrt(!has(d, 'QUEUE_FAILED_STALE'), 'FAILED 11h ok');
d = D(P({ queue: [qrow('f1', 'FAILED', 60 * 13)] })); asrt(has(d, 'QUEUE_FAILED_STALE', 'WARN'), 'FAILED 13h WARN');
d = D(P({ queue: [qrow('p1', 'PUBLISHED', 10)] })); asrt(has(d, 'QUEUE_PUBLISHED_NO_ID', 'WARN'), 'PUBLISHED without id WARN');
d = D(P({ queue: [qrow('p1', 'PUBLISHED', 10, { external_post_id: 'x' })] })); asrt(!has(d, 'QUEUE_PUBLISHED_NO_ID'), 'PUBLISHED with id fine');

// ---- prune policy
const old = (st, days, extra) => qrow('pr_' + st + '_' + days, st, days * 1440, extra);
const pqueue = [old('DRY_RUN', 8), old('DRY_RUN', 6), old('FAILED', 61), old('FAILED', 59), old('PUBLISHED', 4000, { external_post_id: 'e' }), old('PUBLISHING', 4000), old('MANUAL_REVIEW', 4000), old('WEIRD', 4000)];
r = P({ queue: pqueue }); d = D(r);
asrt(r.filter((x) => x._kind === 'prune_queue').length === 0, 'DRY_RUN prune_mode deletes nothing');
const cands = d.log_rows.filter((l) => l.event === 'PRUNE_CANDIDATE' && l.code === 'PRUNE_QUEUE');
asrt(cands.length === 2 && cands.every((c) => c.outcome === 'DRY_RUN'), 'dry-run logs exactly 2 candidates (old DRY_RUN + old FAILED)');
r = P({ queue: pqueue, cfg: { prune_mode: 'LIVE' } });
const pq = r.filter((x) => x._kind === 'prune_queue').map((x) => x.distribution_hash).sort();
asrt(pq.join() === ['pr_DRY_RUN_8', 'pr_FAILED_61'].sort().join(), 'LIVE prunes only old DRY_RUN + old FAILED: ' + pq.join());
r = P({ queue: [old('PUBLISHED', 4000, { external_post_id: 'e' })], cfg: { prune_mode: 'LIVE' } }); asrt(r.filter((x) => x._kind === 'prune_queue').length === 0, 'PUBLISHED never pruned by default');
r = P({ queue: [old('PUBLISHED', 40, { external_post_id: 'e' })], cfg: { prune_mode: 'LIVE', prune_published_days: 30 } }); asrt(r.filter((x) => x._kind === 'prune_queue').length === 1, 'PUBLISHED pruned only when explicitly enabled');
r = P({ queue: [old('PUBLISHED', 4000, { external_post_id: 'e' }), old('PUBLISHED', 4000, { external_post_id: 'e' })], cfg: { prune_mode: 'LIVE', prune_published_days: 30 } }); asrt(r.filter((x) => x._kind === 'prune_queue').length === 0, 'duplicate-hash rows never pruned');
r = P({ queue: Array.from({ length: 80 }, (_, i) => qrow('dd' + i, 'FAILED', 61 * 1440)), cfg: { prune_mode: 'LIVE', prune_max_per_run: 50 } }); asrt(r.filter((x) => x._kind === 'prune_queue').length === 50, 'prune cap');
r = P({ queue: [qrow('nots', 'FAILED', 1, { updated_at: '' })], cfg: { prune_mode: 'LIVE' } }); asrt(r.filter((x) => x._kind === 'prune_queue').length === 0, 'unreadable timestamp never pruned');
const st = (k, status, days) => ({ state_key: k, code: 'C', severity: 'WARN', subject: 's', status, first_seen: ago(days * 24 + 5), last_seen: ago(days * 24), last_alerted: '', times_alerted: 1 });
r = P({ state: [st('A|a', 'RESOLVED', 15), st('B|b', 'RESOLVED', 2), st('C|c', 'OPEN', 40), st('__HEARTBEAT__', 'OPEN', 40)], cfg: { prune_mode: 'LIVE' } });
asrt(r.filter((x) => x._kind === 'prune_state').map((x) => x.state_key).join() === 'A|a', 'state prune: only old RESOLVED, never OPEN / heartbeat');

// ---- leads (PII guard + findings)
const prop = (type, v) => type === 'title' ? { type, title: [{ plain_text: v }] } : type === 'select' ? { type, select: v ? { name: v } : null } : type === 'date' ? { type, date: v ? { start: v } : null } : { type, checkbox: !!v };
const lead = (id, status, o) => ({ properties: Object.assign({ 'Lead ID': prop('title', id), 'Lead Status': prop('select', status), 'Status Changed': prop('date', o.changed || null), 'Last Contact': prop('date', o.contact || null), 'Purge After': prop('date', o.purge || null), 'PII Purged': prop('checkbox', !!o.purged) }, o.extra || {}) });
const D2 = (h) => ago(h * 24);
d = D(P({ leads: { results: [lead('LD-1', 'CONTACTED', { contact: D2(30), changed: D2(30) }), lead('LD-2', 'CONTACTED', { contact: D2(23), changed: D2(30) }), lead('LD-3', 'DORMANT', { contact: D2(90), changed: D2(60) })] } }));
asrt(has(d, 'LEAD_DORMANT_UNMARKED', 'WARN') && d.state_rows.find((s) => s.code === 'LEAD_DORMANT_UNMARKED').detail.indexOf('1 active') === 0, 'dormant unmarked counts exactly the 30d lead');
d = D(P({ leads: { results: [lead('LD-2', 'CONTACTED', { contact: D2(23), changed: D2(30) })] } })); asrt(!has(d, 'LEAD_DORMANT_UNMARKED'), '23d idle < 24d limit => not flagged (latest of contact/changed)');
d = D(P({ leads: { results: [lead('LD-9', 'NOT_ELIGIBLE', { contact: D2(300), changed: D2(300) })] } })); asrt(!has(d, 'LEAD_DORMANT_UNMARKED'), 'terminal lead not flagged');
const pf = D(P({ leads: { results: [lead('LD-4', 'NEW', { purge: D2(3), purged: false }), lead('LD-5', 'NEW', { purge: D2(3), purged: true }), lead('LD-6', 'NEW', { purge: D2(1), purged: false })] } }));
asrt(has(pf, 'LEAD_PURGE_OVERDUE', 'HIGH') && pf.state_rows.find((s) => s.code === 'LEAD_PURGE_OVERDUE').detail.indexOf('1 lead(s)') === 0, 'purge overdue HIGH, counts only unpurged past grace');
d = D(P({ leads: { results: [lead('LD-7', 'MANUAL_REVIEW', { changed: D2(4) }), lead('LD-8', 'MANUAL_REVIEW', { changed: D2(1) })] } })); asrt(has(d, 'LEAD_MANUAL_REVIEW_AGING', 'WARN'), 'manual review aging');
d = D(P({ leads: { results: [], has_more: true } })); asrt(has(d, 'LEADS_TRUNCATED', 'INFO'), 'truncated INFO');
d = D(P({ guard: { ok: false, missing: ['Lead Status'] } })); asrt(has(d, 'LEADS_GUARD_REFUSED', 'HIGH'), 'guard refused HIGH');
d = D(P({ leads: { object: 'error', message: 'rate limited' } })); asrt(has(d, 'LEADS_QUERY_ERROR', 'WARN'), 'leads query error WARN');
const canaryLead = lead('LD-1', 'NEW', { purge: D2(30), purged: false, extra: { Phone: prop('title', '+6281234567890'), Name: prop('title', 'Budi Santoso') } });
r = P({ leads: { results: [canaryLead] } }); d = D(r);
asrt(has(d, 'LEADS_GUARD_REFUSED', 'HIGH') && !has(d, 'LEAD_PURGE_OVERDUE'), 'non-allow-listed column => data discarded');
asrt(JSON.stringify(r).indexOf('6281234567890') < 0 && JSON.stringify(r).indexOf('Budi') < 0, 'PII canary absent from all plan output');

// ---- executions
const ex = (arr) => ({ data: arr });
const e1 = (st, h, wid) => ({ status: st, startedAt: ago(h), workflowId: wid || 'w1' });
d = D(P({ cfg: { n8n_api_base: 'http://n8n/api/v1' }, exec: ex([e1('error', 2), e1('success', 3), e1('error', 30)]) }));
asrt(has(d, 'EXEC_FAILED', 'WARN') && d.state_rows.find((s) => s.code === 'EXEC_FAILED').detail.indexOf('1 failed') === 0, 'exec failed WARN counts only window');
d = D(P({ cfg: { n8n_api_base: 'http://n8n/api/v1', workflow_ids_json: '{"w1":"WF08"}' }, exec: ex(Array.from({ length: 5 }, () => e1('crashed', 1))) }));
asrt(has(d, 'EXEC_FAILED', 'HIGH') && d.findings.find((f) => f.code === 'EXEC_FAILED').subject === 'WF08', 'exec failed HIGH at 5, id mapped');
d = D(P({ cfg: { n8n_api_base: 'http://n8n/api/v1' }, exec: { message: 'unauthorized' } })); asrt(has(d, 'EXEC_API_ERROR', 'WARN'), 'exec api error');
d = D(P({ cfg: { n8n_api_base: 'http://n8n/api/v1' }, exec: ex([e1('success', 200)]) })); asrt(has(d, 'EXEC_PRUNING_INEFFECTIVE', 'HIGH'), 'pruning ineffective HIGH');
d = D(P({ cfg: { n8n_api_base: 'http://n8n/api/v1' }, exec: ex([e1('success', 100)]) })); asrt(!has(d, 'EXEC_PRUNING_INEFFECTIVE'), '100h < 108h not flagged');
d = D(P({ cfg: { n8n_api_base: 'http://n8n/api/v1' }, exec: ex(Array.from({ length: 100 }, () => e1('success', 200))) })); asrt(!has(d, 'EXEC_PRUNING_INEFFECTIVE'), 'full list (100) cannot prove ineffective');
d = D(P({ cfg: { exec_pruning_confirmed: 'false' } })); asrt(has(d, 'EXEC_PRUNING_UNCONFIRMED', 'WARN'), 'pruning unconfirmed WARN');
d = D(P({ errlog: Array.from({ length: 20 }, () => ({ ts: ago(3), source: 'WF04 fetch' })).concat(Array.from({ length: 30 }, () => ({ ts: ago(40), source: 'WF01' }))) }));
asrt(has(d, 'ERRLOG_SPIKE', 'WARN') && d.findings.filter((f) => f.code === 'ERRLOG_SPIKE').length === 1, 'errlog spike only for last 24h');

// ---- alert state machine
const hi = { queue: [qrow('stk', 'PUBLISHING', 500)] };
const sRow = (sev, lastAl, status) => ({ state_key: 'QUEUE_STUCK_PUBLISHING|stk', code: 'QUEUE_STUCK_PUBLISHING', severity: sev, subject: 'stk', status: status || 'OPEN', first_seen: ago(30), last_seen: ago(12), last_alerted: lastAl, times_alerted: 1 });
d = D(P(hi)); asrt(d.alert_keys.length === 1 && d.findings[0].alert, 'new HIGH alerts');
d = D(P(Object.assign({}, hi, { state: [sRow('HIGH', ago(5))] }))); asrt(d.alert_keys.length === 0, 'HIGH within 12h not re-alerted');
d = D(P(Object.assign({}, hi, { state: [sRow('HIGH', ago(13))] }))); asrt(d.alert_keys.length === 1, 'HIGH after 12h re-alerted');
const keyRow = d.state_rows.find((s) => s.state_key === 'QUEUE_STUCK_PUBLISHING|stk'); asrt(keyRow.first_seen === ago(30) && keyRow.times_alerted === 1, 'first_seen preserved on update');
const wRow = (lastAl) => ({ state_key: 'QUEUE_FAILED_STALE|queue', code: 'QUEUE_FAILED_STALE', severity: 'WARN', subject: 'queue', status: 'OPEN', first_seen: ago(80), last_seen: ago(12), last_alerted: lastAl, times_alerted: 1 });
const warnQ = { queue: [qrow('f1', 'FAILED', 60 * 20)] };
d = D(P(Object.assign({}, warnQ, { state: [wRow(ago(40))] }))); asrt(d.alert_keys.length === 0, 'WARN within 48h quiet');
d = D(P(Object.assign({}, warnQ, { state: [wRow(ago(50))] }))); asrt(d.alert_keys.length === 1, 'WARN after 48h re-alerts');
d = D(P(Object.assign({}, hi, { state: [sRow('WARN', ago(1))] }))); asrt(d.alert_keys.length === 1, 'escalation WARN->HIGH alerts immediately');
d = D(P()); asrt(d.alert_keys.length === 0 && d.findings.some((f) => f.severity === 'INFO'), 'INFO never alerts');
d = D(P({ state: [Object.assign(sRow('HIGH', ago(12)), { state_key: 'OLD|x', code: 'OLD', subject: 'x' })] }));
asrt(d.runlog.resolved === 1 && d.state_rows.find((s) => s.state_key === 'OLD|x').status === 'RESOLVED' && d.log_rows.some((l) => l.event === 'RESOLVED'), 'absent finding => RESOLVED (+ log)');
d = D(P(Object.assign({}, hi, { state: [sRow('HIGH', ago(110), 'RESOLVED')] }))); asrt(d.alert_keys.length === 1 && d.runlog.new_findings >= 1, 'recurrence after RESOLVED alerts as new');
const WH = { alert_webhook_url: 'https://hook.example/x' };
const HB = (h) => ({ state_key: '__HEARTBEAT__', status: 'OPEN', last_alerted: ago(h) });
d = D(P({ cfg: WH })); asrt(d.send === true && d.heartbeat_due, 'heartbeat due on first run');
d = D(P({ cfg: WH, state: [HB(5)] })); asrt(d.send === false, 'no alert + heartbeat <24h => silent');
d = D(P({ cfg: WH, state: [HB(25)] })); asrt(d.send === true, 'heartbeat >24h sends');
d = D(P(Object.assign({ cfg: WH, state: [HB(1)] }, hi))); asrt(d.send === true, 'new HIGH sends');
asrt(d.webhook_body.text.length <= 1500 && d.webhook_body.content === d.webhook_body.text && /health=CRIT/.test(d.webhook_body.text), 'digest body shape');

// ---- finalize
const dh = D(P(Object.assign({ cfg: WH }, hi)));
const SK = (f) => f.find((x) => x._kind === 'state' && x.row.state_key === 'QUEUE_STUCK_PUBLISHING|stk').row;
let f = FIN(dh, { statusCode: 204 });
asrt(SK(f).last_alerted === NOW && SK(f).times_alerted === 1, 'sent ok => last_alerted advanced');
asrt(f.find((x) => x._kind === 'state' && x.row.state_key === '__HEARTBEAT__').row.last_alerted === NOW, 'heartbeat advanced on success');
asrt(f.find((x) => x._kind === 'runlog').row.alert_status === 'SENT' && f.some((x) => x._kind === 'log' && x.row.event === 'ALERT_SENT'), 'runlog SENT + ALERT_SENT log');
f = FIN(dh, { statusCode: 500 });
asrt(SK(f).last_alerted === '' && SK(f).times_alerted === 0, 'webhook 500 => NOT marked alerted');
asrt(f.find((x) => x._kind === 'state' && x.row.state_key === '__HEARTBEAT__').row.last_alerted === '', 'heartbeat not advanced on failure');
asrt(f.find((x) => x._kind === 'runlog').row.alert_status === 'FAILED_RETRY_NEXT_RUN' && f.some((x) => x._kind === 'log' && x.row.event === 'ALERT_FAILED'), 'failure recorded');
f = FIN(dh, { error: { message: 'ECONNREFUSED' } }); asrt(SK(f).last_alerted === '', 'network error => not marked');
const dl = D(P(hi)); f = FIN(dl, dl);
asrt(SK(f).last_alerted === NOW && f.find((x) => x._kind === 'runlog').row.alert_status === 'LOGGED', 'log-only: marked as logged');
const dn = D(P({ cfg: WH, state: [HB(2)] })); f = FIN(dn, dn);
asrt(f.find((x) => x._kind === 'runlog').row.alert_status === 'NOTHING_DUE' && f.find((x) => x._kind === 'state' && x.row.state_key === '__HEARTBEAT__').row.last_alerted === ago(2), 'nothing due => heartbeat untouched');
f = FIN(dh, { statusCode: 200 }); const st1 = f.filter((x) => x._kind === 'state').map((x) => x.row);
const run2 = D(P(Object.assign({}, hi, { cfg: Object.assign({}, WH, { run_started: new Date(nowT + 3600000).toISOString() }), state: st1 })));
asrt(run2.alert_keys.length === 0 && run2.send === false, 'second run 1h later: no duplicate alert, no heartbeat spam');
asrt(run2.state_rows.find((s) => s.state_key === 'QUEUE_STUCK_PUBLISHING|stk').first_seen === NOW, 'second run keeps first_seen');
f = FIN(dh, { statusCode: 200 });
const SC = 'state_key,code,severity,subject,status,first_seen,last_seen,last_alerted,times_alerted,detail'.split(',');
asrt(f.filter((x) => x._kind === 'state').every((x) => Object.keys(x.row).sort().join() === SC.slice().sort().join()), 'state rows have exactly the table columns');
const LC = 'run_id,ts,event,code,severity,subject,detail,outcome'.split(',');
asrt(f.filter((x) => x._kind === 'log').every((x) => Object.keys(x.row).sort().join() === LC.slice().sort().join()), 'log rows have exactly the table columns');
const RC = 'run_id,started_at,finished_at,health,findings_high,findings_warn,findings_info,new_findings,resolved,recoveries,prune_candidates,pruned,alert_status,queue_rows,leads_scanned,exec_status,summary_json'.split(',');
asrt(Object.keys(f.find((x) => x._kind === 'runlog').row).sort().join() === RC.slice().sort().join(), 'run-log row has exactly the table columns');

// ---- no PII / no salt anywhere
const canary = { cfg: { hash_salt: 'SECRET_SALT_XYZ' }, errlog: [{ ts: ago(1), source: 'mail a@b.com +62 812-3456-7890' }], queue: [qrow('pii', 'PUBLISHING', 500, { error_message: 'phone +6281234567890', platform: 'x@y.org' })] };
r = P(canary); const all = JSON.stringify(r.filter((x) => x._kind !== "fix")) + JSON.stringify(FIN(D(r), { statusCode: 200 }));
asrt(all.indexOf('SECRET_SALT_XYZ') < 0, 'salt never in output');
const leak=["a@b.com","x@y.org","3456-7890","6281234567890"].filter((s)=>all.indexOf(s)>=0); asrt(leak.length===0, "emails / phone numbers masked: leaked="+leak.join());

// ---- Lead query guard node
const LQ = (schema) => run('./lead_query10.js', { input: [J(schema)], nodes: { Config: [J({ leads_ds_id: 'DS1' })] } })[0].json;
const sch = {}; ['Lead ID','Lead Status','Status Changed','Last Contact','Purge After','PII Purged','Human Action','Draft Kind','Phone','Name'].forEach((n, i) => { sch[n] = { id: 'id' + i + '|?' }; });
let q1 = LQ({ properties: sch });
asrt(q1.ok && q1.method === 'POST' && (q1.url.match(/filter_properties=/g) || []).length === 8, 'guard: exactly 8 filter_properties');
asrt(q1.url.indexOf('id8') < 0 && q1.url.indexOf('id9') < 0, 'guard: Phone/Name ids never requested');
asrt(q1.url.indexOf('data_sources/DS1/query?') > 0 && q1.url.indexOf('%7C%3F') > 0, 'guard: ids URL-encoded once');
const s2 = Object.assign({}, sch); delete s2['Purge After'];
q1 = LQ({ properties: s2 }); asrt(!q1.ok && q1.method === 'GET' && q1.url.indexOf('/users/me') > 0 && q1.missing.join() === 'Purge After', 'guard: missing property => refuse, no leads URL');
q1 = LQ({ object: 'error', message: 'x' }); asrt(!q1.ok && q1.url.indexOf('data_sources') < 0, 'guard: schema error => refuse');
q1 = LQ({}); asrt(!q1.ok, 'guard: empty schema => refuse');

// ---- only whitelisted output kinds
r = P({ queue: [qrow('a', 'PUBLISHING', 500), qrow('b', 'FAILED', 70 * 1440)], cfg: { prune_mode: 'LIVE' } });
asrt(r.every((x) => ['fix', 'prune_queue', 'prune_state', 'digest'].indexOf(x._kind) >= 0), 'only whitelisted item kinds');
asrt(r.filter((x) => x._kind === 'fix').every((x) => x.row.status === 'MANUAL_REVIEW'), 'every fix is a MANUAL_REVIEW transition');

console.log('assertions ' + (pass + fail) + ' pass ' + pass + ' fail ' + fail); process.exit(fail ? 1 : 0);
