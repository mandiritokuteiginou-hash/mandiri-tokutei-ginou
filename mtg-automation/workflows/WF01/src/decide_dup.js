// Decide Dup: Notion is source of truth - skip creation if a page with the same Job Number already exists.
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {};
  try { job = $('Build Notion Payload').itemMatching(k).json; } catch (e) { job = {}; }
  const err = it.json && it.json.error;
  const n = it.json && Array.isArray(it.json.results) ? it.json.results.length : -1;
  if (err || n < 0) { out.push({ json: Object.assign({}, job, { _kind: 'outcome', status: 'NOTION_ERROR', reason: 'dup check failed: ' + String(err ? (err.message || err) : 'bad response').slice(0, 200), notion_create_body: undefined, detail_text: undefined }) }); continue; }
  if (n > 0) { out.push({ json: Object.assign({}, job, { _kind: 'outcome', status: 'NOTION_DUPLICATE', reason: 'Job Number already in Master Job DB: ' + it.json.results[0].id, notion_page_id: it.json.results[0].id, notion_create_body: undefined, detail_text: undefined }) }); continue; }
  out.push({ json: Object.assign({}, job, { _kind: 'to_create', is_new: true }) });
}
return out;
