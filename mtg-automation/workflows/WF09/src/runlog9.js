// Run Log (WF09): counts only.
const cfg = $('Config').first().json; const items = $input.all().map((i) => i.json);
const meta = items.find((x) => x._kind === 'meta') || {}; const c = meta.counts || {};
const w = items.filter((x) => x._kind === 'lead');
const ok = w.filter((x) => x.verify_status === 'OK').length; const bad = w.filter((x) => ['WRITE_ERROR', 'VERIFY_FAILED', 'BLOCKED'].includes(x.verify_status)).length;
const sum = { counts: c, written_ok: ok, write_errors: bad, deferred: w.filter((x) => x.action === 'DEFERRED').length };
return [{ json: { run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(), inbox_status: String(meta.inbox_status || meta.queue_status || ''), summary_json: JSON.stringify(sum), messages_seen: meta.messages_seen || 0, messages_new: meta.messages_new || 0, leads_loaded: c.leads_loaded || 0, created: c.created || 0, transitions: c.transitions || 0, drafts: c.drafts || 0, manual_review: c.manual_review || 0, withdrawn: c.withdrawn || 0, purged: c.purged || 0, written_ok: ok, write_errors: bad } }];
