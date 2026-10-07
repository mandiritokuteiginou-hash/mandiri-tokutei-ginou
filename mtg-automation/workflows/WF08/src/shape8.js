const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'job') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), job_id: String(j.job_key || j.mtg_job_id || ''), page_id: String(j.page_id || ''), platform: String(j.platform || ''), distribution_hash: String(j.distribution_hash || ''), content_hash: String(j.cur_hash || ''), image_build_hash: String(j.build_hash || ''), status: String(j.qc_status || (j.row && j.row.status) || ''), outcome: String(j.outcome || ''), attempt: String(j.attempt === undefined ? '' : j.attempt), external_post_id: String(j.external_post_id || ''), published_at: String(j.published_at || ''), error_code: String(j.error_code || ''), error_message: String(j.error_message || '').slice(0, 300), publish_mode: String(cfg.publish_mode || 'DRY_RUN'), reason: String(j.reason || '').slice(0, 300) } });
}
return rows;
