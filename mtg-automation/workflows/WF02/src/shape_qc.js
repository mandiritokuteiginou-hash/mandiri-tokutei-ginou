// Shape QC Rows: one audit row per job (decision, every check, reasons, write status).
const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'qc_row') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), page_id: String(j.page_id || ''), company: String(j.company || '').slice(0, 120), decision: String(j.decision || ''), company_score: Number(j.co && j.co.score) || 0, corp_number: String((j.co && j.co.number) || ''), checks_json: JSON.stringify(j.checks || {}), reasons: String(j.reasons || '').slice(0, 1500), prev_status: String(j.status || ''), write_status: String(j.write_status || ''), write_reason: String(j.write_reason || '').slice(0, 300) } });
}
return rows;
