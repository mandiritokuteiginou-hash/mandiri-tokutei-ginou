const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'write_row' && j._kind !== 'job') continue;
  rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), page_id: String(j.page_id || ''), mtg_job_id: String(j.mtg_job_id || ''), action: String(j.action || ''), method: String(j.method || ''), content_hash: String(j.hash || j.cur_hash || ''), channel_lengths: String(j.channel_lengths || ''), issues: (j.issues || []).join(' | ').slice(0, 400), reason: String(j.reason || '').slice(0, 200), write_status: String(j.write_status || '') } });
}
return rows;
