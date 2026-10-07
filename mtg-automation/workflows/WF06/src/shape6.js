const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'write_row' && j._kind !== 'job') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), job_id: String(j.mtg_job_id || ''), page_id: String(j.page_id || ''), content_hash: String(j.cur_hash || ''), fact_hash: String(j.fact_hash || ''), deterministic_result: String(j.det_result || ''), ai_result: String(j.ai_verdict || ''), qc_decision: String(j.qc_decision || ''), risk_flags: (j.flags || []).join(' | ').slice(0, 400), qc_attempt: String(j.qc_attempt === undefined ? '' : j.qc_attempt), manual_review: String(j.manual_review || 'false'), risk_level: String(j.risk_level || ''), outcome: String(j.outcome || ''), reason: String(j.reason || '').slice(0, 300), write_status: String(j.write_status || '') } });
}
return rows;
