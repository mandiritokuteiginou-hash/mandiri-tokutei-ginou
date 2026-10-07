// Shape Rows (WF03): lifecycle log rows (only jobs that changed or failed) + error rows.
const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'write_row') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), page_id: String(j.page_id || ''), mtg_job_id: String(j.mtg_job_id || ''), company: String(j.company || '').slice(0, 120), prev_lifecycle: String(j.prev_lifecycle || ''), new_lifecycle: String(j.lifecycle || ''), tier: String(j.tier || ''), qc_decision: String(j.qc || ''), changed_fields: (j.changed || []).join(',').slice(0, 400), reason: String(j.reason || '').slice(0, 300), write_status: String(j.write_status || '') } });
}
return rows;
