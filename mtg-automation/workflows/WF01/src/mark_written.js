// Mark Written: only after read-back OK AND commit PATCH succeeded.
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let v = {};
  try { v = $('Verify Read-back').itemMatching(k).json; } catch (e) { v = {}; }
  const ok = it.json && it.json.id && !it.json.error && it.json.object !== 'error';
  out.push({ json: Object.assign({}, v, ok ? { _kind: 'outcome', status: 'WRITTEN_VERIFIED', reason: 'created, read-back OK, committed Status=EXTRACTED' } : { _kind: 'outcome', status: 'VERIFY_FAILED', reason: 'commit PATCH failed; page left at Status=NEW: ' + String((it.json && (it.json.message || (it.json.error && it.json.error.message))) || 'unknown').slice(0, 150) }) });
}
return out;
