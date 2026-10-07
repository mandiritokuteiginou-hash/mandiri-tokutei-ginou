// Parse Intent (WF09): AI can only pick a benign intent or ESCALATE (sensitive=true). Invalid/failed AI -> OTHER (never blocks the pipeline).
const OK = ['GREETING', 'INTEREST', 'JOB_QUESTION', 'SUPPLY_INFO', 'DOCS_SENT', 'OTHER'];
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Prepare AI').itemMatching(k).json; } catch (e) { j = {}; }
  const a = parseJson(it.json && ((it.json.choices && it.json.choices[0] && it.json.choices[0].message && it.json.choices[0].message.content) || (it.json.content && it.json.content[0] && it.json.content[0].text)));
  const ok = a && OK.includes(a.intent);
  out.push({ json: Object.assign({}, j, { ai_req: undefined, ai_ok: ok ? 'true' : 'false', ai_intent: ok ? a.intent : 'OTHER', ai_sensitive: ok && a.sensitive === true ? 'true' : 'false', ai_error: ok ? '' : ((it.json && it.json.error) ? 'AI_ERROR' : 'AI_UNPARSEABLE') }) });
}
return out;
