// Parse AI (WF06): an AI issue only counts if its quote exists VERBATIM in the stored copy. Unquotable FAIL/UNSURE -> UNSURE (manual review). AI can never approve over a deterministic failure (that is enforced in Decide).
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const NS = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Prepare AI').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice(); const base = Object.assign({}, j, { ai_req: undefined, errors });
  const a = parseJson(it.json && it.json.content && it.json.content[0] && it.json.content[0].text);
  if ((it.json && it.json.error) || !a || ['PASS', 'MINOR', 'FAIL', 'UNSURE'].indexOf(a.verdict) < 0) { errors.push({ stage: 'ai_qc', type: 'ai_error', msg: (it.json && it.json.error ? String(it.json.error.message || it.json.error) : 'unparseable or invalid verdict').slice(0, 200) }); out.push({ json: Object.assign(base, { ai_result: { ok: false, verdict: 'UNAVAILABLE', issues: [], dropped: 0, model_verdict: '' } }) }); continue; }
  const all = NS([j.copy.poster, j.copy.wa, j.copy.ig, j.copy.tt].join('\n'));
  const issues = []; let dropped = 0;
  (Array.isArray(a.issues) ? a.issues : []).forEach((x) => { const q = NS(x && x.quote); if (q.length >= 4 && all.includes(q) && ['fact', 'risk', 'wording'].indexOf(x.type) >= 0) issues.push({ channel: String(x.channel || '').slice(0, 12), type: x.type, quote: String(x.quote).slice(0, 120), note: String(x.note || '').slice(0, 120) }); else dropped++; });
  let v = 'PASS';
  if (issues.some((x) => x.type === 'fact')) v = 'FAIL'; else if (issues.some((x) => x.type === 'risk')) v = 'RISK'; else if (issues.some((x) => x.type === 'wording')) v = 'MINOR';
  else if (a.verdict === 'FAIL' || a.verdict === 'UNSURE') v = 'UNSURE'; else if (dropped && a.verdict === 'MINOR') v = 'PASS';
  out.push({ json: Object.assign(base, { ai_result: { ok: true, verdict: v, issues, dropped, model_verdict: a.verdict } }) });
}
return out;
