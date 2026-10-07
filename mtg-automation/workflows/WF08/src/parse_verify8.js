// Parse Verify (WF08): only a confirmed 'published' status becomes PUBLISHED. A provider-side failure goes to MANUAL_REVIEW (not retried). Anything unresolved stays PUBLISHING and is treated as ambiguous by the next run (no automatic re-post).
const cfg = $('Config').first().json;
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Parse Result').itemMatching(k).json; } catch (e) { j = {}; }
  const r = it.json || {}; const code = Number(r.statusCode) || 0; const body = r.body && typeof r.body === 'object' ? r.body : (() => { try { return JSON.parse(r.body); } catch (e) { return {}; } })();
  const base = Object.assign({}, j); const errors = (j.errors || []).slice();
  const st = String(body.status || '').toLowerCase();
  const rowOf = (status, extra) => Object.assign({}, j.row || {}, { status, updated_at: cfg.run_started }, extra || {});
  if (code >= 200 && code < 300 && st === 'published') { const ts = new Date().toISOString(); out.push({ json: Object.assign(base, { outcome: 'PUBLISHED', qc_status: 'PUBLISHED', published_at: ts, error_code: '', error_message: '', reason: 'delivery verified' + (body.publicUrl ? ' ' + String(body.publicUrl).slice(0, 120) : ''), row: rowOf('PUBLISHED', { published_at: ts, error_code: '', error_message: '' }), errors }) }); continue; }
  if (code >= 200 && code < 300 && (st === 'failed' || st === 'error')) { const m = String(body.errorMessage || body.error || 'provider reported failure').slice(0, 200); errors.push({ stage: 'verify', type: 'PROVIDER_FAILED', msg: m }); out.push({ json: Object.assign(base, { outcome: 'MANUAL_REVIEW', qc_status: 'MANUAL_REVIEW', error_code: 'PROVIDER_FAILED', error_message: m, reason: 'provider failed after accepting; not retried automatically', row: rowOf('MANUAL_REVIEW', { error_code: 'PROVIDER_FAILED', error_message: m }), errors }) }); continue; }
  const m = code ? 'status "' + (st || 'unknown') + '" (HTTP ' + code + ')' : String((r.error && r.error.message) || 'status check failed').slice(0, 150);
  errors.push({ stage: 'verify', type: 'VERIFY_PENDING', msg: m });
  out.push({ json: Object.assign(base, { outcome: 'VERIFY_PENDING', qc_status: 'MANUAL_REVIEW', error_code: 'VERIFY_PENDING', error_message: m, reason: 'accepted but not confirmed published yet; next run will mark it for manual check instead of re-posting', row: rowOf('PUBLISHING', {}), errors }) });
}
return out;
