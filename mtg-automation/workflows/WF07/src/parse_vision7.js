// Parse Vision (WF07): JSON parse + shape check only. Comparison with the drawn strings happens in Decide.
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Prepare Vision').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice(); const base = Object.assign({}, j, { ai_req: undefined, errors });
  const a = parseJson(it.json && ((it.json.choices && it.json.choices[0] && it.json.choices[0].message && it.json.choices[0].message.content) || (it.json.content && it.json.content[0] && it.json.content[0].text)));
  const okShape = a && Array.isArray(a.lines) && a.lines.length && a.lines.every((x) => typeof x === 'string') && a.layout && typeof a.layout === 'object';
  if ((it.json && it.json.error) || !okShape) { errors.push({ stage: 'ai_vision', type: 'ai_error', msg: (it.json && it.json.error ? String(it.json.error.message || it.json.error) : 'unparseable or invalid vision JSON').slice(0, 200) }); out.push({ json: Object.assign(base, { vision: { ok: false } }) }); continue; }
  out.push({ json: Object.assign(base, { vision: { ok: true, lines: a.lines.slice(0, 80).map((x) => x.slice(0, 300)), layout: a.layout, notes: String(a.notes || '').slice(0, 100) } }) });
}
return out;
