const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'write_row' && j._kind !== 'job') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), job_id: String(j.mtg_job_id || ''), page_id: String(j.page_id || ''), content_hash: String(j.cur_hash || ''), fact_hash: String(j.fact_hash || ''), visual_hash: String(j.visual_hash || ''), image_build_hash: String(j.build_hash || ''), template_version: String(j.template_label || ''), generation_method: j.action === 'GENERATE' ? 'HTML_TEMPLATE' : '', image_status: String(j.image_status || ''), qc_result: String(j.qc_result || ''), qc_flags: (j.flags || []).join(' | ').slice(0, 400), attempt: String(j.qc_attempt === undefined ? '' : j.qc_attempt), image_url: String(j.image_url || ''), outcome: String(j.outcome || ''), reason: String(j.reason || '').slice(0, 300), write_status: String(j.write_status || '') } });
}
return rows;
