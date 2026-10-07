// Company Cache Row: record company in the dedup cache only if the Notion create succeeded.
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let c = {};
  try { c = $('Company Not Cached').itemMatching(k).json; } catch (e) { c = {}; }
  if (it.json && it.json.id && it.json.object !== 'error') out.push({ json: { job_key: c.company_key, source: 'hellowork', status: 'COMPANY_WRITTEN', reason: 'Private Company DB page created', company: c.company, title: '', job_score: 0, run_id: $('Config').first().json.run_id, notion_page_id: it.json.id, first_seen: new Date().toISOString() } });
}
return out;
