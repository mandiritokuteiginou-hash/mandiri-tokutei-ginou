// Shape Error Rows -> Error Log table (source, timestamp, error type, message, retry status).
const cfg = $('Config').first().json;
const ERR = ['AI_ERROR', 'FETCH_DETAIL_ERROR', 'NOTION_ERROR', 'VERIFY_FAILED'];
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  const isErr = j._kind === 'error' || (j._kind === 'outcome' && ERR.indexOf(j.status) >= 0);
  if (!isErr) continue;
  out.push({ json: { run_id: cfg.run_id, ts: new Date().toISOString(), source: j.source || '', stage: j.stage || j.status, error_type: j.error_type || j.status, error_message: String(j.error_message || j.reason || '').slice(0, 500), retry_status: j.retry_status || (j.status === 'VERIFY_FAILED' ? 'MANUAL_FIX_NEEDED page=' + (j.notion_page_id || '') : 'will retry next run (not cached)'), job_key: j.job_key || '' } });
}
return out;
