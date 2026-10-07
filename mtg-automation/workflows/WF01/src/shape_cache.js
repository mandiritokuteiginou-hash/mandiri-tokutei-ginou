// Shape Cache Rows: terminal job outcomes that must not be re-processed. Retryable statuses are NOT cached.
const cfg = $('Config').first().json;
const CACHE = ['REJECT_PREFILTER', 'REJECT_GATE', 'REJECT_AI_SCREEN', 'REJECT_QUALITY', 'NOTION_DUPLICATE', 'WRITTEN_VERIFIED', 'VERIFY_FAILED'];
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  if (j._kind !== 'outcome' || !j.job_key || CACHE.indexOf(j.status) < 0) continue;
  out.push({ json: { job_key: j.job_key, source: j.source || '', status: j.status, reason: String(j.reason || '').slice(0, 500), company: j.company || '', title: String(j.title || '').slice(0, 120), job_score: (j.score && j.score.total) || 0, run_id: cfg.run_id, notion_page_id: j.notion_page_id || '', first_seen: new Date().toISOString() } });
}
return out;
