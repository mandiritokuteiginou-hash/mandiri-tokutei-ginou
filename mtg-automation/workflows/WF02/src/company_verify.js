// Company Verify: the Notion write response is the stored page; compare every sent value (CJK corruption check).
const plain = (arr) => (arr || []).map((x) => x.plain_text || '').join('');
const nz = (s) => String(s || '').replace(/\r/g, '').trim();
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let plan = {};
  try { plan = $('Company Plan Filter').itemMatching(k).json; } catch (e) { plan = {}; }
  const r = it.json || {};
  const row = { _kind: 'company_write', job_number: plan.job_number, company: plan.company, op: plan.op, errors: [] };
  if (!r.id || r.object === 'error') { out.push({ json: Object.assign(row, { status: 'COMPANY_WRITE_ERROR', reason: String(r.message || (r.error && r.error.message) || 'no page id').slice(0, 200), errors: [{ stage: 'company_write', type: 'notion_error', msg: String(r.message || '').slice(0, 150) }] }) }); continue; }
  const props = r.properties || {}; const bad = [];
  for (const key of Object.keys(plan.sent || {})) { const p = props[key]; const want = plan.sent[key]; let got; if (!p) { bad.push(key + ': missing'); continue; } if (p.type === 'title') got = plain(p.title); else if (p.type === 'rich_text') got = plain(p.rich_text); else if (p.type === 'select') got = p.select && p.select.name; else if (p.type === 'date') got = p.date && p.date.start; else continue; if (nz(got) !== nz(want)) bad.push(key + ': sent[' + String(want).slice(0, 25) + '] got[' + String(got).slice(0, 25) + ']'); }
  out.push({ json: Object.assign(row, bad.length ? { status: 'COMPANY_VERIFY_FAILED', reason: bad.slice(0, 4).join(' ; ') } : { status: 'COMPANY_' + plan.op + '_OK', reason: 'verified ' + Object.keys(plan.sent).length + ' fields', page_id: r.id }) });
}
return out;
