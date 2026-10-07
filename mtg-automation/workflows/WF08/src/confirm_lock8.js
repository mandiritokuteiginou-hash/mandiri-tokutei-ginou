// Confirm Lock (WF08): the PUBLISHING row MUST be stored before anything is sent. If the lock write failed we do NOT publish (at-most-once).
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Format Payload').itemMatching(k).json; } catch (e) { j = {}; }
  const ok = it.json && !it.json.error && it.json.id !== undefined && it.json.id !== null;
  if (ok) { out.push({ json: Object.assign({}, j, { lock_ok: 'true' }) }); continue; }
  out.push({ json: Object.assign({}, j, { lock_ok: 'false', outcome: 'LOCK_FAILED', qc_status: '', reason: 'queue row could not be written, nothing was sent', error_code: 'LOCK_FAILED', error_message: String((it.json && it.json.error && (it.json.error.message || it.json.error)) || 'no row id returned').slice(0, 200), errors: (j.errors || []).concat([{ stage: 'queue_lock', type: 'lock_failed', msg: String((it.json && it.json.error && (it.json.error.message || it.json.error)) || 'no row id').slice(0, 200) }]) }) });
}
return out;
