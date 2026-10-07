// Shape Error Rows (WF09): errors from plan/meta/verify, sanitised (digit runs and emails masked). No PII.
const cfg = $('Config').first().json;
//@LIB
const rows = [];
for (const it of $input.all()) { const j = it.json; const key = String(j.lead_id || '');
  (Array.isArray(j.errors) ? j.errors : []).forEach((e) => rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, source: 'wf09', stage: String(e.stage || ''), error_type: String(e.type || ''), error_message: maskErr(e.msg), retry_status: j.verify_status === 'OK' ? '' : 'next_run', job_key: key } })); }
return rows;
