// Parse Verify: AI output is DATA. Every quote must exist verbatim in the source text; unverified claims are discarded. AI can only downgrade, never upgrade.
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const norm = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let j = {};
  try { j = $('Prepare Verify').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice();
  const a = parseJson(it.json && ((it.json.choices && it.json.choices[0] && it.json.choices[0].message && it.json.choices[0].message.content) || (it.json.content && it.json.content[0] && it.json.content[0].text)));
  const base = Object.assign({}, j, { ai_verify_req: undefined, errors });
  if ((it.json && it.json.error) || !a) { errors.push({ stage: 'ai_verify', type: 'ai_error', msg: (it.json && it.json.error ? String(it.json.error.message || it.json.error) : 'unparseable JSON').slice(0, 200) }); out.push({ json: Object.assign(base, { ai: { ok: false } }) }); continue; }
  const T = norm(j.detail_text);
  const q = (s) => { const x = norm(s); return x.length >= 4 && T.indexOf(x) >= 0; };
  const ai = { ok: true, employer: 'UNKNOWN', employer_quote_ok: q(a.employer_quote), ssw_explicit: a.ssw_recruit_explicit === true && q(a.ssw_quote), management: a.role_is_management === true, overseas: 'UNVERIFIED', overseas_quote_ok: q(a.overseas_quote), salary_basis: a.salary_basis_ok === false ? 'FALSE' : a.salary_basis_ok === true ? 'TRUE' : 'UNKNOWN', salary_concern: String(a.salary_concern || '').slice(0, 120), concerns: (Array.isArray(a.other_concerns) ? a.other_concerns : []).slice(0, 3).map((x) => String(x).slice(0, 100)) };
  ai.employer = a.employer_is_direct === false ? 'FALSE' : a.employer_is_direct === true ? 'TRUE' : 'UNKNOWN';
  if (a.overseas_applicability === 'DOMESTIC_ONLY' && ai.overseas_quote_ok) ai.overseas = 'DOMESTIC_ONLY';
  else if (a.overseas_applicability === 'VERIFIED' && ai.overseas_quote_ok) ai.overseas = 'VERIFIED';
  out.push({ json: Object.assign(base, { ai }) });
}
return out;
