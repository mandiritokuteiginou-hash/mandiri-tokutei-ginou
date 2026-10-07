// Final QC: the last gate. APPROVED only if EVERY check is PASS. Any REJECT -> REJECT. Anything else -> REVIEW. Builds the Notion PATCH body.
const cfg = $('Config').first().json;
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const rt = (v) => { const t = clip(v); return t ? { rich_text: [{ type: 'text', text: { content: t } }] } : { rich_text: [] }; };
const jobTh = Number(cfg.job_threshold) || 80; const minDays = Number(cfg.min_days_left); const staleDays = Number(cfg.staleness_days) || 180;
const minM = Number(cfg.min_monthly) || 150000; const maxM = Number(cfg.max_monthly) || 1000000; const minH = Number(cfg.min_hourly) || 1000;
const needOverseas = String(cfg.require_overseas_verified) !== 'false';
const out = [];
for (const it of $input.all()) {
  const j = it.json; const rc = j.rc || {}; const co = j.co || { verdict: 'REVIEW', parts: {}, notes: [] }; const ai = j.ai || { ok: false }; const dup = j.dup || { state: 'Unknown' };
  const errors = (j.errors || []).slice();
  const C = {}; const why = [];
  const set = (k, v, r) => { C[k] = v; if (v !== 'PASS' && r) why.push((v === 'REJECT' ? '✗' : '?') + k + ': ' + r); };
  // 1 source validation
  const ss = rc.source_state;
  set('source', !rc.host_ok ? 'REVIEW' : ss === 'CLOSED_ON_SOURCE' || ss === 'GONE' ? 'REJECT' : ss !== 'OK' ? 'REVIEW' : !rc.source_job_match ? 'REVIEW' : 'PASS', !rc.host_ok ? 'source URL host not HelloWork' : ss !== 'OK' ? 'source ' + ss + ' ' + (rc.detail || '') : !rc.source_job_match ? 'job number not found on page' : '');
  // 2 freshness
  const dl = rc.days_left;
  set('freshness', ss !== 'OK' ? (C.source === 'REJECT' ? 'REJECT' : 'REVIEW') : dl === null || dl === undefined ? 'REVIEW' : dl < 0 ? 'REJECT' : dl < (isFinite(minDays) ? minDays : 3) ? 'REVIEW' : (rc.posted_age_days !== null && rc.posted_age_days > staleDays) ? 'REVIEW' : 'PASS', ss !== 'OK' ? 'cannot confirm active' : dl === null || dl === undefined ? 'no expiry date on source' : dl < 0 ? 'expired ' + (-dl) + 'd ago' : dl < (isFinite(minDays) ? minDays : 3) ? 'expires in ' + dl + 'd' : 'posted ' + rc.posted_age_days + 'd ago (stale)');
  // 3 company (registry) + 4 法人番号
  set('company', co.verdict === 'VERIFIED' || co.verdict === 'MANUAL_VERIFIED' ? 'PASS' : co.verdict === 'CLOSED' ? 'REJECT' : 'REVIEW', 'company score ' + co.score + ' / verdict ' + co.verdict + (co.conflict ? ' / ' + co.conflict : '') + ' / ' + (co.notes || []).join('; '));
  set('corporate_number', co.number_confirmed ? 'PASS' : co.verdict === 'MANUAL_VERIFIED' ? 'PASS' : co.verdict === 'CLOSED' ? 'REJECT' : 'REVIEW', co.number ? '法人番号 ' + co.number + ' not confirmed' : '法人番号 not confirmed by registry');
  // 5 employer identity
  const dispatch = (/派遣|請負/.test(rc.haken || '') && !/(ではない|でない|ではありません|なし)/.test(rc.haken || ''));
  set('employer_identity', dispatch || (ai.ok && ai.employer === 'FALSE' && ai.employer_quote_ok) ? 'REJECT' : (!ai.ok || ai.employer !== 'TRUE' || !(co.verdict === 'VERIFIED' || co.verdict === 'MANUAL_VERIFIED') || co.conflict) ? 'REVIEW' : 'PASS', dispatch ? 'dispatch/contract field: ' + rc.haken : !ai.ok ? 'AI verify unavailable' : ai.employer === 'FALSE' ? 'AI: not a direct employer' + (ai.employer_quote_ok ? ' (quote verified)' : ' (quote not verified)') : ai.employer !== 'TRUE' ? 'AI: direct employment not confirmed' : 'registry identity not verified');
  // 6 SSW eligibility
  set('ssw_eligibility', ss === 'OK' && !rc.ssw_in_text ? 'REJECT' : (ai.ok && ai.management) ? 'REJECT' : (ss !== 'OK' ? 'REVIEW' : !rc.ssw_quote_ok ? 'REVIEW' : !ai.ok || !ai.ssw_explicit ? 'REVIEW' : 'PASS'), ss === 'OK' && !rc.ssw_in_text ? 'no 特定技能 on current source' : ai.ok && ai.management ? 'SSW management role' : !rc.ssw_quote_ok ? 'stored evidence quote not found on current source' : !ai.ok ? 'AI verify unavailable' : 'AI: explicit SSW recruitment not confirmed');
  // 7 overseas applicability (explicit text only; looking suitable is NOT evidence)
  const domestic = !!rc.domestic_hit || (ai.ok && ai.overseas === 'DOMESTIC_ONLY');
  const overseasOK = !!rc.overseas_hit && !rc.domestic_hit && !(ai.ok && ai.overseas === 'DOMESTIC_ONLY');
  set('overseas', domestic ? 'REJECT' : overseasOK ? 'PASS' : needOverseas ? 'REVIEW' : 'PASS', domestic ? 'domestic-only wording: ' + (rc.domestic_hit || 'AI quote') : 'overseas_applicability_unverified (no explicit overseas-applicant wording)');
  // 8 salary validation
  const mm = rc.wage_min; const hh = rc.hourly;
  const bad = rc.conflicts.filter((x) => /^(salary|hourly)/.test(x));
  set('salary', ss !== 'OK' ? 'REVIEW' : (hh ? hh < minH : (mm !== null && (mm < minM))) ? 'REVIEW' : (mm !== null && mm > maxM) ? 'REVIEW' : (mm === null && !hh) ? 'REVIEW' : bad.length ? 'REVIEW' : (ai.ok && ai.salary_basis === 'FALSE') ? 'REVIEW' : 'PASS', ss !== 'OK' ? 'cannot re-read salary' : hh && hh < minH ? 'hourly ' + hh + ' below provisional floor ' + minH + ' (min-wage reference pending)' : mm !== null && mm < minM && !hh ? 'monthly ' + mm + ' below provisional floor ' + minM + ' (min-wage reference pending)' : mm === null && !hh ? 'no wage on source' : bad.length ? bad.join('; ') : mm > maxM ? 'monthly implausibly high' : 'AI: salary depends on overtime/commission ' + (ai.salary_concern || ''));
  // 9 duplicate / conflict
  set('duplicate', dup.state === 'Unique' ? 'PASS' : dup.state === 'Duplicate' ? 'REJECT' : 'REVIEW', dup.state + ' ' + (dup.note || ''));
  // 10 WF01 quality score carried over
  set('quality', j.quality_score !== null && j.quality_score >= jobTh ? 'PASS' : 'REVIEW', 'WF01 score ' + j.quality_score + ' < ' + jobTh);
  const vals = Object.keys(C).map((k) => C[k]);
  const decision = vals.indexOf('REJECT') >= 0 ? 'REJECT' : vals.indexOf('REVIEW') >= 0 ? 'REVIEW' : 'APPROVED';
  const conflicts = rc.conflicts.slice(); if (co.conflict) conflicts.push(co.conflict); if (dup.state === 'Possible Duplicate' || dup.state === 'Duplicate') conflicts.push('duplicate: ' + dup.note);
  const reasons = why.join(' | ');
  const checksTxt = Object.keys(C).map((k) => k + '=' + C[k]).join(' ');
  const notes = clip('MTG#02 ' + cfg.workflow_name + ' ' + cfg.run_date + ' → ' + decision + ' | ' + checksTxt + ' | 法人番号 ' + (co.number || 'UNVERIFIED') + (co.registry_name ? ' (' + co.registry_name + ')' : '') + ' | company_score ' + co.score + ' | prev: ' + clip(j.wf01_notes, 600), 1900);
  const P = {}; const sent = {};
  const sel = (k, v) => { P[k] = { select: { name: v } }; sent[k] = v; };
  const chk = (k, v) => { P[k] = { checkbox: v }; sent[k] = v; };
  const txt = (k, v) => { P[k] = rt(v); sent[k] = clip(v); };
  sel('Status', decision === 'APPROVED' ? 'VERIFIED' : decision === 'REVIEW' ? 'VERIFICATION_REQUIRED' : 'CLOSED');
  sel('Audit Status', conflicts.length ? 'Conflict' : decision === 'APPROVED' ? 'Audited' : decision === 'REVIEW' ? 'Needs Review' : 'Unverified');
  sel('Duplicate Check', ['Unique', 'Possible Duplicate', 'Duplicate', 'Unknown'].indexOf(dup.state) >= 0 ? dup.state : 'Unknown');
  chk('Employer Verified', co.verdict === 'VERIFIED' || co.verdict === 'MANUAL_VERIFIED');
  chk('Job Verified', decision === 'APPROVED'); chk('Source Verified', C.source === 'PASS');
  chk('Recheck Required', false);
  // company verification provenance: manual is never recorded as registry verification
  const cvMethod = co.verdict === 'VERIFIED' ? 'Registry' : co.verdict === 'MANUAL_VERIFIED' ? 'Manual' : 'None';
  sel('Company Verification Method', cvMethod);
  sel('Registry Status', co.registry_status || co.verdict || 'REVIEW');
  if (cvMethod !== 'None') { P['Company Verification Date'] = { date: { start: cfg.run_date } }; sent['Company Verification Date'] = cfg.run_date; }
  else { P['Company Verification Date'] = { date: null }; sent['Company Verification Date'] = null; }
  txt('Recheck Reason', decision === 'APPROVED' ? '' : (decision === 'REJECT' ? 'REJECT: ' : 'REVIEW: ') + reasons);
  txt('Data Conflicts', conflicts.join(' | '));
  txt('Audit Notes', notes);
  P['Data Confidence'] = { number: co.score }; sent['Data Confidence'] = co.score;
  P['Last Audit Date'] = { date: { start: cfg.run_date } }; sent['Last Audit Date'] = cfg.run_date;
  sel('QC Decision', decision); sel('MTG QC Status', decision === 'APPROVED' ? 'QC Approved' : decision === 'REVIEW' ? 'QC Review' : 'QC Rejected (MTG internal)');
  txt('QC Reject Reason', decision === 'REJECT' ? reasons : '');
  P['QC Date'] = { date: { start: cfg.run_date } }; sent['QC Date'] = cfg.run_date;
  sel('Recruitability', domestic ? 'Japan Resident' : overseasOK ? 'Overseas Confirmed' : 'Overseas Unverified');
  const checks = C;
  out.push({ json: Object.assign({}, j, { decision, checks, reasons, conflicts, errors, notion_patch_body: { properties: P }, notion_sent: sent, detail_text: undefined, rc: Object.assign({}, rc, { conflicts: undefined }),
    company_upsert: decision === 'APPROVED' ? { name_jp: co.registry_name || rc.page_company || j.company, posting_name: j.company, prefecture: j.prefecture, city: j.city, number: co.number, score: co.score, sector: j.sector, source_url: j.source_url, job_number: j.job_number } : null }) });
}
return out;
