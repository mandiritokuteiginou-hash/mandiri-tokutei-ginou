const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; const key = String(j.job_number || '');
  (Array.isArray(j.errors) ? j.errors : []).forEach((e) => rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, source: 'wf04', stage: String(e.stage || ''), error_type: String(e.type || ''), error_message: String(e.msg || '').slice(0, 300), retry_status: 'next_run', job_key: key } }));
  if (j._kind === 'write_row' && j.write_status !== 'OK') rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, source: 'wf04', stage: 'notion_write', error_type: String(j.write_status), error_message: String(j.write_reason || '').slice(0, 300), retry_status: j.write_status === 'NOTION_ERROR' ? 'next_run' : 'manual', job_key: key } });
}
return rows;
