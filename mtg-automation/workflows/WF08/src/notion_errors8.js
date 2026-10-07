const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'write_row' || j.write_status === 'OK') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, source: 'wf08', stage: 'notion_summary', error_type: String(j.write_status), error_message: String(j.write_reason || '').slice(0, 300), retry_status: j.write_status === 'NOTION_ERROR' ? 'next_run' : 'manual', job_key: String(j.job_number || j.page_id || '') } });
}
return rows;
