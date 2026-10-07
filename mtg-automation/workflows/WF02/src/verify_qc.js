// Verify QC write: read-back every property we sent and compare (CJK corruption / silent failure check).
const plain = (arr) => (arr || []).map((x) => x.plain_text || '').join('');
const nz = (s) => String(s || '').replace(/\r/g, '').trim();
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {}; let patched = {};
  try { job = $('Final QC').itemMatching(k).json; } catch (e) { job = {}; }
  try { patched = $('Notion PATCH').itemMatching(k).json; } catch (e) { patched = {}; }
  const base = Object.assign({}, job); delete base.notion_patch_body;
  const finish = (write_status, reason, extra) => out.push({ json: Object.assign(base, { _kind: 'qc_row', write_status, write_reason: reason, company_upsert_needed: write_status === 'OK' && job.decision === 'APPROVED' ? 'true' : 'false' }, extra || {}) });
  if (!patched || !patched.id || patched.object === 'error') { finish('NOTION_ERROR', 'PATCH failed: ' + String((patched && patched.message) || (patched && patched.error && patched.error.message) || 'no page id').slice(0, 200)); continue; }
  const props = (it.json && it.json.properties) || {};
  if (!it.json || it.json.id !== job.page_id) { finish('VERIFY_FAILED', 'read-back failed (page not returned)'); continue; }
  const bad = []; const sent = job.notion_sent || {};
  for (const key of Object.keys(sent)) {
    const p = props[key]; const want = sent[key]; let got;
    if (!p) { bad.push(key + ': missing'); continue; }
    if (p.type === 'title') got = plain(p.title); else if (p.type === 'rich_text') got = plain(p.rich_text); else if (p.type === 'number') got = p.number; else if (p.type === 'select') got = p.select && p.select.name; else if (p.type === 'checkbox') got = p.checkbox; else if (p.type === 'date') got = p.date && p.date.start; else continue;
    const ok = typeof want === 'string' ? nz(got) === nz(want) : got === want;
    if (!ok) bad.push(key + ': sent[' + String(want).slice(0, 30) + '] got[' + String(got).slice(0, 30) + ']');
  }
  if (bad.length) finish('VERIFY_FAILED', 'read-back mismatch (' + bad.length + '): ' + bad.slice(0, 5).join(' ; '));
  else finish('OK', 'read-back OK (' + Object.keys(sent).length + ' fields)');
}
return out;
