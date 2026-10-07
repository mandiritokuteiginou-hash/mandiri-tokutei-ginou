// Duplicate / Conflict check against Master Job DB (same company). Notion is the source of truth.
const norm = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {};
  try { job = $('Re-check Source').itemMatching(k).json; } catch (e) { job = {}; }
  const errors = (job.errors || []).slice();
  const res = it.json && Array.isArray(it.json.results) ? it.json.results : null;
  let dup = { state: 'Unknown', note: '' };
  if (!res || (it.json && it.json.error)) { dup.note = 'duplicate query failed'; errors.push({ stage: 'dup_check', type: 'notion_error', msg: String((it.json && it.json.error && it.json.error.message) || 'bad response').slice(0, 200) }); }
  else {
    dup = { state: 'Unique', note: '' };
    const advanced = ['VERIFIED', 'CONTENT_READY', 'IMAGE_READY', 'APPROVED', 'PUBLISHED', 'UPDATED'];
    for (const o of res) {
      if (o.id === job.page_id) continue;
      const P = o.properties || {};
      const ojn = plain((P['Job Number'] || {}).rich_text).trim();
      const ot = plain((P['Job Title'] || {}).title);
      const oc = plain((P['City'] || {}).rich_text); const os = P['Status'] && P['Status'].select ? P['Status'].select.name : '';
      const earlier = String(o.created_time) <= String(job.created_time) || advanced.indexOf(os) >= 0;
      if (ojn && ojn === job.job_number && earlier) { dup = { state: 'Duplicate', note: 'same Job Number as ' + o.id + ' (' + os + ')' }; break; }
      if (norm(ot) === norm(job.title) && norm(oc) === norm(job.city) && earlier && dup.state !== 'Duplicate') dup = { state: 'Possible Duplicate', note: 'same company+title+city as ' + o.id + ' (' + os + ', job ' + ojn + ')' };
    }
  }
  out.push({ json: Object.assign({}, job, { dup, errors, dup_query_body: undefined }) });
}
return out;
