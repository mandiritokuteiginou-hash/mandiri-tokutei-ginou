// Decide (WF06): combines gate, stale check, deterministic QC and AI second pass into ONE decision; builds the diff PATCH. Owns ONLY: Content Status, Content QC Decision, Content Risk, Content QC Attempt, Content QC Fact Hash, Content QC Date, Content QC Flags, Content QC Notes (+ clears Content Hash when sending content back to WF05). Never touches Job QC, lifecycle, tier, Recruitability, salary, company.
const cfg = $('Config').first().json;
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const maxAttempts = Number(cfg.max_attempts) || 3;
const needAi = String(cfg.require_ai_second_pass) !== 'false';
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  if (j._kind !== 'job') { out.push({ json: Object.assign({}, j, { needs_write: 'false' }) }); continue; }
  const base = Object.assign({}, j); delete base.copy; delete base.facts; delete base.ai_req;
  const det = j.det || { result: 'NA', findings: [] }; const ai = j.ai_result || null; const errors = (j.errors || []).slice();
  const done = (o) => out.push({ json: Object.assign(base, { errors }, o) });
  const nowrite = (outcome, why) => done({ outcome, qc_decision: '', risk_level: '', flags: [], needs_write: 'false', reason: why, det_result: det.result, ai_verdict: ai ? ai.verdict : '' });
  if (j.action === 'AWAITING_REGEN') { nowrite('AWAITING_REGEN', j.reason); continue; }
  if (j.action === 'DEFERRED_CAP') { nowrite('DEFERRED_CAP', j.reason); continue; }
  let decision = ''; let status = ''; const flags = []; let notes = []; let clearHash = false; let attempt = j.prev_attempt; let factHashStore = j.fact_hash; let risk = 'MEDIUM'; let outcome = '';
  const sameFacts = j.prev_fact_hash && j.prev_fact_hash === j.fact_hash;
  if (!j.gate_ok) {
    decision = 'REJECTED'; status = 'Rejected'; flags.push('JOB_NOT_ELIGIBLE'); notes.push(j.gate_reason); risk = 'HIGH'; outcome = 'REJECTED'; factHashStore = j.fact_hash || ''; attempt = j.prev_attempt;
  } else if (det.result === 'STALE') {
    flags.push('STALE_CONTENT'); notes.push(det.findings[0].msg);
    if (sameFacts && /STALE_CONTENT/.test(j.prev_flags || '')) { decision = 'MANUAL_REVIEW'; status = 'Manual Review'; flags.push('STALE_LOOP'); notes.push('content was already reset once for these exact facts but is still stale: check template_version / config parity between WF05 and WF06'); risk = 'HIGH'; outcome = 'MANUAL_REVIEW'; attempt = j.prev_attempt; }
    else { decision = 'REJECTED'; status = 'Not Started'; clearHash = true; risk = 'MEDIUM'; outcome = 'STALE'; attempt = 0; }
  } else {
    det.findings.filter((f) => f.sev !== 'INFO').forEach((f) => { flags.push(f.code); notes.push(f.sev + ' ' + f.code + ': ' + f.msg); });
    det.findings.filter((f) => f.sev === 'INFO').forEach((f) => { notes.push('info ' + f.code + ': ' + f.msg); });
    const hard = det.result === 'FAIL_REJECT'; const man = det.result === 'FAIL_MANUAL'; const rev = det.result === 'FAIL_REVISION';
    attempt = (sameFacts ? j.prev_attempt : 0) + 1;
    if (hard) { decision = 'REJECTED'; risk = 'HIGH'; }
    else if (man) { decision = 'MANUAL_REVIEW'; risk = 'HIGH'; }
    else if (rev) { decision = 'REVISION_REQUIRED'; risk = 'MEDIUM'; }
    else if (j.action === 'RECHECK') { outcome = 'STILL_VALID'; }
    else {
      const v = ai ? ai.verdict : 'SKIPPED';
      if (ai && ai.issues && ai.issues.length) ai.issues.forEach((x) => { flags.push('AI_' + x.type.toUpperCase()); notes.push('AI ' + x.type + ' [' + x.channel + '] 「' + x.quote + '」 ' + x.note); });
      if (v === 'PASS') { decision = 'APPROVED'; risk = 'LOW'; }
      else if (v === 'MINOR') { decision = 'REVISION_REQUIRED'; risk = 'MEDIUM'; }
      else if (v === 'FAIL' || v === 'RISK') { decision = 'MANUAL_REVIEW'; risk = 'HIGH'; flags.push('AI_DISAGREES'); notes.push('deterministic QC passed but the AI second pass reported a verified problem; AI cannot reject alone, so a human decides'); }
      else if (v === 'UNSURE') { decision = 'MANUAL_REVIEW'; risk = 'MEDIUM'; flags.push('AI_UNSURE'); }
      else if (needAi) { outcome = 'DEFERRED_NO_AI'; }
      else { decision = 'APPROVED'; risk = 'LOW'; flags.push('DETERMINISTIC_ONLY'); notes.push('approved without AI second pass (require_ai_second_pass=false)'); }
    }
    if (decision === 'REVISION_REQUIRED' && attempt >= maxAttempts) { decision = 'MANUAL_REVIEW'; flags.push('ATTEMPTS_EXHAUSTED'); notes.push('QC attempt ' + attempt + ' of ' + maxAttempts + ': needs a human'); risk = 'MEDIUM'; }
    if (decision === 'REJECTED' && attempt >= maxAttempts) flags.push('ATTEMPTS_EXHAUSTED');
    if (decision === 'APPROVED') { status = 'Approved'; outcome = 'APPROVED'; }
    else if (decision === 'REVISION_REQUIRED') { status = 'Draft'; clearHash = true; outcome = 'REVISION_REQUIRED'; }
    else if (decision === 'REJECTED') { status = 'Rejected'; outcome = 'REJECTED'; }
    else if (decision === 'MANUAL_REVIEW') { status = 'Manual Review'; outcome = 'MANUAL_REVIEW'; }
  }
  if (!decision) { nowrite(outcome || 'NO_DECISION', outcome === 'STILL_VALID' ? 'approved content still matches current facts' : outcome === 'DEFERRED_NO_AI' ? 'AI second pass unavailable; retry next run (no attempt consumed)' : 'no decision'); continue; }
  const P = {}; const sent = {};
  const sel = (k, v) => { P[k] = { select: { name: v } }; sent[k] = v; };
  const txt = (k, v) => { const t = clip(v); P[k] = { rich_text: t ? [{ type: 'text', text: { content: t } }] : [] }; sent[k] = t; };
  sel('Content Status', status); sel('Content QC Decision', decision); sel('Content Risk', risk);
  P['Content QC Attempt'] = { number: attempt }; sent['Content QC Attempt'] = attempt;
  txt('Content QC Fact Hash', factHashStore);
  P['Content QC Date'] = { date: { start: cfg.run_date } }; sent['Content QC Date'] = cfg.run_date;
  txt('Content QC Flags', flags.filter((x, i) => flags.indexOf(x) === i).join(' | '));
  txt('Content QC Notes', notes.join('\n'));
  if (clearHash) txt('Content Hash', '');
  const manual = (decision === 'MANUAL_REVIEW') ? 'true' : 'false';
  done({ outcome, qc_decision: decision, risk_level: risk, flags: flags.filter((x, i) => flags.indexOf(x) === i), qc_attempt: attempt, manual_review: manual, det_result: det.result, ai_verdict: ai ? ai.verdict : '', needs_write: 'true', notion_patch_body: { properties: P }, notion_sent: sent, reason: notes.join(' ; ').slice(0, 300) });
}
return out;
