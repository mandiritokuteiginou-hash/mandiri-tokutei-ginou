// Parse Result (WF08): classify the adapter response. Technical errors (401/408/429/5xx/network) are retried up to max_attempts; policy/content errors are NEVER retried. Blotato acceptance is not publication: it goes to Verify Delivery.
const cfg = $('Config').first().json;
const maxAttempts = Number(cfg.max_attempts) || 3;
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Confirm Lock').itemMatching(k).json; } catch (e) { j = {}; }
  const r = it.json || {}; const code = Number(r.statusCode) || 0; const body = r.body && typeof r.body === 'object' ? r.body : (() => { try { return JSON.parse(r.body); } catch (e) { return {}; } })();
  const base = Object.assign({}, j); delete base.request_body; delete base.request_url; delete base.caption;
  const rowOf = (status, extra) => Object.assign({}, j.row || {}, { status, updated_at: cfg.run_started, attempt: j.attempt }, extra || {});
  const errors = (j.errors || []).slice();
  const done = (o) => out.push({ json: Object.assign(base, { errors }, o) });
  const fail = (technical, ecode, msg, ambiguous) => {
    const m = String(msg || '').slice(0, 200) + (ambiguous ? ' [AMBIGUOUS_RETRY: the platform may have accepted it; check before the next attempt]' : '');
    errors.push({ stage: 'publish', type: ecode, msg: m.slice(0, 250) });
    if (technical && j.attempt < maxAttempts) done({ outcome: 'FAILED', qc_status: 'FAILED', needs_verify: 'false', error_code: ecode, error_message: m, reason: 'technical error, retry next run (attempt ' + j.attempt + ' of ' + maxAttempts + ')', row: rowOf('FAILED', { error_code: ecode, error_message: m }) });
    else if (technical) done({ outcome: 'MANUAL_REVIEW', qc_status: 'MANUAL_REVIEW', needs_verify: 'false', error_code: ecode, error_message: m, reason: 'ATTEMPTS_EXHAUSTED: ' + ecode, row: rowOf('MANUAL_REVIEW', { error_code: 'ATTEMPTS_EXHAUSTED', error_message: ecode + ': ' + m.slice(0, 150) }) });
    else done({ outcome: 'MANUAL_REVIEW', qc_status: 'MANUAL_REVIEW', needs_verify: 'false', error_code: ecode, error_message: m, reason: 'policy/content error, never retried', row: rowOf('MANUAL_REVIEW', { error_code: ecode, error_message: m }) });
  };
  if (!code) { const msg = String((r.error && (r.error.message || r.error.description)) || 'no HTTP response'); fail(true, 'NETWORK', msg, /timeout|timed out|ETIMEDOUT|ECONNABORTED/i.test(msg)); continue; }
  if (code >= 200 && code < 300) {
    if (j.transport === 'blotato') {
      const id = String(body.postSubmissionId || body.id || '').trim();
      if (!id) { fail(false, 'NO_SUBMISSION_ID', 'accepted (HTTP ' + code + ') but no submission id returned', false); continue; }
      done({ outcome: 'ACCEPTED', qc_status: 'PUBLISHING', needs_verify: 'true', external_post_id: id, verify_url: String(cfg.blotato_status_url || '') + id, reason: 'accepted by Blotato, verifying delivery', row: rowOf('PUBLISHING', { external_post_id: id }) });
    } else {
      if (body && body.ok === false) { fail(false, 'BRIDGE_REJECTED', String(body.error || body.message || 'bridge reported ok=false'), false); continue; }
      const id = String(body.message_id || body.id || '').trim(); const ts = new Date().toISOString();
      done({ outcome: 'PUBLISHED', qc_status: 'PUBLISHED', needs_verify: 'false', external_post_id: id, published_at: ts, error_code: '', error_message: '', reason: id ? 'published' : 'published (bridge returned no id)', row: rowOf('PUBLISHED', { external_post_id: id, published_at: ts, error_code: '', error_message: '' }) });
    }
    continue;
  }
  const emsg = String((body && (body.message || body.error || body.errorMessage)) || r.statusMessage || 'HTTP ' + code).slice(0, 200);
  if (code === 401 || code === 429) fail(true, 'HTTP_' + code, emsg, false);
  else if (code === 408 || code >= 500) fail(true, 'HTTP_' + code, emsg, true);
  else fail(false, 'HTTP_' + code, emsg, false);
}
return out;
