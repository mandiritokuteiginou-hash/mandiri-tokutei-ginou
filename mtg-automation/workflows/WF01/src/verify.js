// Verify (read-back / CJK corruption check): compare every value we sent with what Notion returned. Any mismatch = not a success.
const out = [];
const inputs = $input.all();
const plain = (arr) => (arr || []).map((x) => x.plain_text || '').join('');
const nz = (s) => String(s || '').replace(/\r/g, '').trim();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {}; let created = {};
  try { job = $('Build Notion Payload').itemMatching(k).json; } catch (e) { job = {}; }
  try { created = $('Create Job Page').itemMatching(k).json; } catch (e) { created = {}; }
  const base = Object.assign({}, job); delete base.notion_create_body; delete base.notion_query_body; delete base.detail_text;
  if (!created || !created.id || created.object === 'error') { out.push({ json: Object.assign(base, { _kind: 'outcome', status: 'NOTION_ERROR', reason: 'create failed: ' + String((created && created.message) || (created && created.error && created.error.message) || 'no page id').slice(0, 200) }) }); continue; }
  const props = (it.json && it.json.properties) || {};
  if (!it.json || it.json.id !== created.id) { out.push({ json: Object.assign(base, { _kind: 'outcome', status: 'VERIFY_FAILED', notion_page_id: created.id, reason: 'read-back failed (page not returned)' }) }); continue; }
  const bad = [];
  const sent = job.notion_sent || {};
  for (const key of Object.keys(sent)) {
    const p = props[key]; const want = sent[key]; let got;
    if (!p) { bad.push(key + ': missing in read-back'); continue; }
    if (p.type === 'title') got = plain(p.title); else if (p.type === 'rich_text') got = plain(p.rich_text); else if (p.type === 'number') got = p.number; else if (p.type === 'select') got = p.select && p.select.name; else if (p.type === 'url') got = p.url; else if (p.type === 'checkbox') got = p.checkbox; else continue;
    const ok = typeof want === 'string' ? nz(got) === nz(want) : got === want;
    if (!ok) bad.push(key + ': sent[' + String(want).slice(0, 30) + '] got[' + String(got).slice(0, 30) + ']');
  }
  if (bad.length) out.push({ json: Object.assign(base, { _kind: 'outcome', status: 'VERIFY_FAILED', notion_page_id: created.id, notion_url: created.url, reason: 'read-back mismatch (' + bad.length + '): ' + bad.slice(0, 5).join(' ; ') }) });
  else out.push({ json: Object.assign(base, { _kind: 'verified', status: 'VERIFIED', notion_page_id: created.id, notion_url: created.url, reason: 'read-back OK (' + Object.keys(sent).length + ' fields)' }) });
}
return out;
