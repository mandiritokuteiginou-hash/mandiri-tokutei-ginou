// Parse AI (WF04): AI output is DATA. A value is accepted only if its quote exists verbatim in the page AND the quote itself contains the evidence for that value. Otherwise Unknown.
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const N = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Prepare AI').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice();
  const base = Object.assign({}, j, { ai_req: undefined, errors });
  const a = parseJson(it.json && ((it.json.choices && it.json.choices[0] && it.json.choices[0].message && it.json.choices[0].message.content) || (it.json.content && it.json.content[0] && it.json.content[0].text)));
  if ((it.json && it.json.error) || !a) { errors.push({ stage: 'ai_enrich', type: 'ai_error', msg: (it.json && it.json.error ? String(it.json.error.message || it.json.error) : 'unparseable JSON').slice(0, 200) }); out.push({ json: Object.assign(base, { ai: { ok: false, rejected: [] } }) }); continue; }
  const T = N(j.detail_text); const inSrc = (q) => { const x = N(q); return x.length >= 4 && T.indexOf(x) >= 0; };
  const ai = { ok: true, jlpt: 'Unknown', jlpt_ev: '', lic: 'Unknown', lic_ev: '', lic_type: '', exp: 'Unknown', exp_min: null, exp_ev: '', rejected: [] };
  const rej = (f, why) => ai.rejected.push(f + ': ' + why);
  const need = { jlpt: j.det.jlpt === 'Unknown', lic: j.det.lic === 'Unknown', exp: j.det.exp === 'Unknown' };
  // JLPT
  if (need.jlpt && a.jlpt && a.jlpt !== 'Unknown') {
    const q = N(a.jlpt_quote);
    if (!inSrc(a.jlpt_quote)) rej('jlpt', 'quote not in source');
    else if (/^N[1-5]$/.test(a.jlpt) && new RegExp(a.jlpt, 'i').test(q) && /日本語|JLPT|語学|能力/.test(q)) { ai.jlpt = a.jlpt; ai.jlpt_ev = String(a.jlpt_quote).slice(0, 120); }
    else if (a.jlpt === 'None' && /日本語/.test(q) && /(不問|不要|問いません|必要ありません)/.test(q)) { ai.jlpt = 'None'; ai.jlpt_ev = String(a.jlpt_quote).slice(0, 120); }
    else rej('jlpt', 'quote does not support value ' + a.jlpt);
  }
  // License
  if (need.lic && a.license && a.license !== 'Unknown') {
    const q = N(a.license_quote);
    if (!inSrc(a.license_quote)) rej('license', 'quote not in source');
    else if (!/(免許|資格|技能講習|研修|士)/.test(q)) rej('license', 'quote has no license wording');
    else if (a.license === 'No' && /(不問|不要|なし)/.test(q)) { ai.lic = 'No'; ai.lic_ev = String(a.license_quote).slice(0, 120); }
    else if (a.license === 'Preferred' && /(尚可|歓迎|あれば|優遇|望ましい)/.test(q)) { ai.lic = 'Preferred'; ai.lic_ev = String(a.license_quote).slice(0, 120); }
    else if (a.license === 'Yes' && /(必須|必要|要)/.test(q.replace(/不要/g, '')) && !/(尚可|歓迎|あれば|優遇)/.test(q)) { ai.lic = 'Yes'; ai.lic_ev = String(a.license_quote).slice(0, 120); }
    else rej('license', 'quote does not support value ' + a.license);
    if (ai.lic !== 'Unknown' && ai.lic !== 'No' && a.license_type && q.indexOf(N(a.license_type)) >= 0) ai.lic_type = String(a.license_type).slice(0, 60);
  }
  // Experience
  if (need.exp && a.experience && a.experience !== 'Unknown') {
    const q = N(a.experience_quote);
    if (!inSrc(a.experience_quote)) rej('experience', 'quote not in source');
    else if (a.experience === 'No' && /(未経験|経験不問|経験は問|経験不要)/.test(q)) { ai.exp = 'No'; ai.exp_ev = String(a.experience_quote).slice(0, 120); }
    else if (a.experience === 'Yes' && /経験/.test(q) && /(必須|必要|[0-9]+年以上|経験者)/.test(q) && !/(歓迎|優遇|尚可)/.test(q)) { ai.exp = 'Yes'; ai.exp_ev = String(a.experience_quote).slice(0, 120); const ym = q.match(/([0-9]+)年以上/); if (ym && Number(a.experience_years_min) === Number(ym[1])) ai.exp_min = Number(ym[1]); }
    else rej('experience', 'quote does not support value ' + a.experience);
  }
  out.push({ json: Object.assign(base, { ai }) });
}
return out;
