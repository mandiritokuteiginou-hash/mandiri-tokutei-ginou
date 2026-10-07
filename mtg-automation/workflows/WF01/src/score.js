// Parse Score: AI qualitative parts (clamped) + deterministic salary / company / source parts + penalties -> total, class, quality decision.
const cfg = $('Config').first().json;
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const clamp = (v, max) => { const n = Math.round(Number(v)); return isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const corpOK = (c) => { if (!/^[0-9]{13}$/.test(c || '')) return false; const d = c.split('').map(Number); let s = 0; for (let n = 1; n <= 12; n++) { const p = d[13 - n]; s += p * (n % 2 === 1 ? 1 : 2); } return (9 - (s % 9)) === d[0]; };
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {};
  try { job = $('Prepare Score').itemMatching(k).json; } catch (e) { job = {}; }
  const base = Object.assign({}, job); delete base.ai_score_req;
  const a = parseJson(it.json && ((it.json.choices && it.json.choices[0] && it.json.choices[0].message && it.json.choices[0].message.content) || (it.json.content && it.json.content[0] && it.json.content[0].text)));
  if ((it.json && it.json.error) || !a) { out.push({ json: Object.assign(base, { _kind: 'outcome', status: 'AI_ERROR', reason: 'score failed: ' + (it.json && it.json.error ? String(it.json.error.message || it.json.error).slice(0, 200) : 'unparseable JSON'), detail_text: undefined }) }); continue; }
  const e = job.extract || {}; const flags = (job.flags || []).slice();
  // salary 0-25 (deterministic; basic monthly excluding fixed overtime)
  const fixedOt = Number(e.salary && e.salary.fixed_overtime_amount) || 0;
  const basic = (Number(e.monthly_min) || 0) - fixedOt;
  let sal = basic >= 300000 ? 25 : basic >= 280000 ? 21 : basic >= 260000 ? 17 : basic >= 240000 ? 12 : basic >= 220000 ? 7 : basic > 0 ? 3 : 0;
  if (fixedOt > 0) flags.push('includes_fixed_overtime');
  if (e.hourly) sal = Math.max(0, sal - 3);
  if (a.q4_salary_basis === 'OVERTIME_DEPENDENT' || a.q4_salary_basis === 'COMMISSION_DEPENDENT') { sal = Math.max(0, sal - 5); flags.push('salary_' + a.q4_salary_basis); }
  // company verification 0-15 (deterministic)
  const corpValid = corpOK(e.corporate_number_n);
  const comp = corpValid ? 15 : (e.company_type === 'DIRECT_EMPLOYER' ? 8 : 3);
  if (!corpValid) flags.push('corporate_number_unverified');
  // source reliability 0-10 (HelloWork public job info = 10)
  const src = job.source === 'hellowork' ? 10 : 5;
  const ssw = clamp(a.ssw_clarity, 20), det = clamp(a.detail_completeness, 15), ben = clamp(a.benefits_conditions, 10), jp = clamp(a.japanese_clarity, 5);
  let total = sal + comp + src + ssw + det + ben + jp;
  let penalty = 0;
  if (flags.some((f) => /^stale_over/.test(f))) penalty += 20;
  total = Math.max(0, Math.min(100, total - penalty));
  const veto = [];
  if (a.q1_is_ssw_job === false) veto.push('Q1 not an SSW job');
  if (a.q2_sector_valid_for_ssw === false) veto.push('Q2 sector invalid');
  if (a.q3_salary_matches_source === false) veto.push('Q3 salary mismatch');
  if (a.q5_posting_active === false) veto.push('Q5 posting not active');
  const th = Number(cfg.job_threshold) || 80;
  const cls = total >= 90 ? 'HIGH_PRIORITY' : total >= th ? 'GOOD_CANDIDATE' : total >= 70 ? 'NEEDS_REVIEW' : 'REJECT_ARCHIVE';
  // company score 0-100 (deterministic, facts only)
  let cscore = 0; const cparts = {};
  cparts.corp = corpValid ? 35 : 0; cparts.direct = e.company_type === 'DIRECT_EMPLOYER' && !flags.some((f) => f === 'employer_type_unverified') ? 20 : 0;
  cparts.ssw = 20; cparts.loc = (e.prefecture && e.prefecture !== 'UNKNOWN' && e.address && e.address !== 'UNKNOWN') ? 10 : 0;
  cparts.source = job.source === 'hellowork' ? 10 : 0; cparts.job = total >= th ? 5 : 0;
  cscore = cparts.corp + cparts.direct + cparts.ssw + cparts.loc + cparts.source + cparts.job;
  const parts = { salary: sal, company_verification: comp, source: src, ssw_clarity: ssw, detail: det, benefits: ben, japanese: jp, penalty };
  const quality_pass = veto.length === 0 && total >= th;
  out.push({ json: Object.assign(base, { _kind: 'scored', score: { total, class: cls, parts, company_score: cscore, company_parts: cparts, veto, ai: a }, flags, quality_pass, status: quality_pass ? 'SCORED_PASS' : (veto.length ? 'REJECT_AI_SCREEN' : 'REJECT_QUALITY'), reason: veto.length ? veto.join(' | ') : 'score ' + total + ' < ' + th }) });
}
return out;
