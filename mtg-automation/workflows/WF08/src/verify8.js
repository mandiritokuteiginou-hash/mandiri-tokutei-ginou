// Verify (WF08): read back every property we wrote and compare (CJK corruption / silent failure check).
const plain = (arr) => (arr || []).map((x) => x.plain_text || '').join('');
const nz = (s) => String(s === null || s === undefined ? '' : s).replace(/\r/g, '').trim();
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let job = {}; let patched = {};
  try { job = $('Summarize Jobs').itemMatching(k).json; } catch (e) { job = {}; }
  try { patched = $('Notion PATCH').itemMatching(k).json; } catch (e) { patched = {}; }
  const base = Object.assign({}, job); delete base.notion_patch_body;
  const fin = (ws, why) => out.push({ json: Object.assign(base, { _kind: 'write_row', write_status: ws, write_reason: why }) });
  if (!patched || !patched.id || patched.object === 'error') { fin('NOTION_ERROR', 'PATCH failed: ' + String((patched && patched.message) || (patched && patched.error && patched.error.message) || 'no page id').slice(0, 200)); continue; }
  const props = (it.json && it.json.properties) || {};
  if (!it.json || it.json.id !== job.page_id) { fin('VERIFY_FAILED', 'read-back failed (page not returned)'); continue; }
  const bad = []; const sent = job.notion_sent || {};
  Object.keys(sent).forEach((key) => {
    const p = props[key]; const want = sent[key]; let got;
    if (!p) { bad.push(key + ': missing'); return; }
    if (p.type === 'rich_text') got = plain(p.rich_text); else if (p.type === 'select') got = p.select ? p.select.name : null; else if (p.type === 'date') got = p.date ? p.date.start : null; else return;
    if (nz(got) !== nz(want)) bad.push(key + ': sent[' + String(want).slice(0, 30) + '] got[' + String(got).slice(0, 30) + ']');
  });
  if (bad.length) fin('VERIFY_FAILED', 'read-back mismatch (' + bad.length + '): ' + bad.slice(0, 5).join(' ; ')); else fin('OK', 'read-back OK (' + Object.keys(sent).length + ' fields)');
}
return out;
