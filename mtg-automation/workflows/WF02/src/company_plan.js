// Company Upsert Plan: only for APPROVED jobs (company score >= threshold). Update the existing Company DB page, else create one. Never invents data.
const cfg = $('Config').first().json;
const clip = (s, n) => String(s || '').slice(0, n || 1900);
const rt = (v) => ({ rich_text: [{ type: 'text', text: { content: clip(v) } }] });
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let j = {};
  try { j = $('Company Query Body').itemMatching(k).json; } catch (e) { j = {}; }
  const u = j.company_upsert || {};
  const res = it.json && Array.isArray(it.json.results) ? it.json.results : null;
  if (!res || (it.json && it.json.error)) { out.push({ json: { _kind: 'company_write', job_number: j.job_number, company: u.name_jp, status: 'COMPANY_QUERY_ERROR', reason: String((it.json && it.json.error && it.json.error.message) || 'bad response').slice(0, 200), errors: [{ stage: 'company_query', type: 'notion_error', msg: 'query failed' }], skip: 'true' } }); continue; }
  const line = 'WF02 ' + cfg.run_date + ': 法人番号 ' + u.number + ' registry-verified (gBizINFO) | company_score ' + u.score + ' | job ' + u.job_number;
  if (res.length > 0) {
    const pg = res[0]; const prev = plain(((pg.properties || {}).Notes || {}).rich_text);
    const notes = clip(line + (prev ? ' | prev: ' + prev.slice(0, 900) : ''));
    const P = { Notes: rt(notes), 'Last Checked': { date: { start: cfg.run_date } } };
    out.push({ json: { _kind: 'company_plan', op: 'UPDATE', method: 'PATCH', url: 'https://api.notion.com/v1/pages/' + pg.id, body: { properties: P }, sent: { Notes: notes, 'Last Checked': cfg.run_date }, job_number: j.job_number, company: u.name_jp, page_id: pg.id } });
  } else {
    const P = { 'Company Name': { title: [{ type: 'text', text: { content: clip(u.name_jp, 200) } }] }, 'Company Name JP': rt(u.name_jp), Industry: rt(u.sector), Prefecture: rt(u.prefecture), City: rt(u.city), Source: rt('MTG#02 gBizINFO registry-verified + HelloWork job'), 'Source URL': { url: u.source_url }, 'First Found': { date: { start: cfg.run_date } }, 'Last Checked': { date: { start: cfg.run_date } }, Notes: rt(line), 'Partnership Status': { select: { name: 'Prospect' } }, 'Contact Status': { select: { name: 'Not Contacted' } } };
    out.push({ json: { _kind: 'company_plan', op: 'CREATE', method: 'POST', url: 'https://api.notion.com/v1/pages', body: { parent: { type: 'data_source_id', data_source_id: cfg.notion_company_ds_id }, properties: P }, sent: { 'Company Name': clip(u.name_jp, 200), Notes: clip(line), 'Last Checked': cfg.run_date, 'Contact Status': 'Not Contacted' }, job_number: j.job_number, company: u.name_jp } });
  }
}
return out;
