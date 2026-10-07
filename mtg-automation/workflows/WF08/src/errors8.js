const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; const key = String(j.job_number || j.job_key || '');
  (Array.isArray(j.errors) ? j.errors : []).forEach((e) => rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, source: 'wf08', stage: String(e.stage || ''), error_type: String(e.type || ''), error_message: String(e.msg || '').slice(0, 300), retry_status: j.outcome === 'FAILED' ? 'next_run' : 'manual', job_key: key + (j.platform ? ':' + j.platform : '') } }));
}
return rows;
