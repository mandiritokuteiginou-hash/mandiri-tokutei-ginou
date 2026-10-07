// Enrich Diff (WF04): merge deterministic + validated-AI results, FILL ONLY UNKNOWN fields, never overwrite a known value, never downgrade. Builds the diff-only PATCH. Owns: JLPT / License / Experience / Salary Basis (+ hourly / monthly when empty). Does NOT touch QC, company, Recruitability, lifecycle, tier or Matching Ready.
const cfg = $('Config').first().json;
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const unk = (v) => !v || v === 'Unknown';
const out = [];
for (const it of $input.all()) {
  const j = it.json; const det = j.det || { state: 'UNREACHABLE' }; const ai = j.ai || { ok: false, rejected: [] }; const cur = j.cur || {};
  const errors = (j.errors || []).slice(); const rows = []; const conflicts = [];
  const base = Object.assign({}, j); delete base.detail_text; delete base.needs_ai;
  if (det.state !== 'OK') { out.push({ json: Object.assign(base, { _kind: 'enriched', outcome: 'SOURCE_' + det.state, changed: [], rows, errors, needs_write: 'false', notion_patch_body: { properties: {} }, notion_sent: {} }) }); continue; }
  const pick = (f, dv, dev, av, aev) => { // returns {value, source, evidence}
    if (!unk(dv)) return { value: dv, source: 'DET', evidence: dev, conf: 'HIGH' };
    if (!unk(av)) return { value: av, source: 'AI', evidence: aev, conf: 'MEDIUM' };
    return { value: 'Unknown', source: '', evidence: '', conf: '' };
  };
  const F = { 'JLPT Required': pick('jlpt', det.jlpt, det.jlpt_ev, ai.jlpt, ai.jlpt_ev), 'License Required': pick('lic', det.lic, det.lic_ev, ai.lic, ai.lic_ev), 'Experience Required': pick('exp', det.exp, det.exp_ev, ai.exp, ai.exp_ev) };
  const have = { 'JLPT Required': cur.jlpt, 'License Required': cur.lic, 'Experience Required': cur.exp };
  const P = {}; const sent = {}; const changed = []; const newEv = {};
  const setSel = (k, v) => { P[k] = { select: { name: v } }; sent[k] = v; changed.push(k); };
  Object.keys(F).forEach((k) => {
    const c = F[k]; const h = have[k];
    if (c.value === 'Unknown') { rows.push({ field: k, old_value: h || '', new_value: 'Unknown', evidence: '', confidence: '', source: '', changed: 'false' }); return; }
    if (!unk(h) && h !== c.value) { conflicts.push(k + ': stored ' + h + ' vs source ' + c.value); rows.push({ field: k, old_value: h, new_value: c.value, evidence: clip(c.evidence, 200), confidence: c.conf, source: c.source, changed: 'false' }); return; }
    if (!unk(h) && h === c.value) { rows.push({ field: k, old_value: h, new_value: c.value, evidence: clip(c.evidence, 200), confidence: c.conf, source: c.source, changed: 'false' }); return; }
    setSel(k, c.value); newEv[k] = c.source + ' 「' + clip(c.evidence, 100) + '」';
    rows.push({ field: k, old_value: h || '', new_value: c.value, evidence: clip(c.evidence, 200), confidence: c.conf, source: c.source, changed: 'true' });
  });
  // License type / experience years: fill when empty and the matching field is (now) known
  const licVal = !unk(have['License Required']) ? have['License Required'] : F['License Required'].value;
  const ltype = det.lic_type || ai.lic_type || '';
  if (ltype && !cur.lic_type && (licVal === 'Yes' || licVal === 'Preferred') && F['License Required'].value !== 'Unknown') { P['License Type'] = { rich_text: [{ type: 'text', text: { content: clip(ltype, 60) } }] }; sent['License Type'] = clip(ltype, 60); changed.push('License Type'); rows.push({ field: 'License Type', old_value: '', new_value: clip(ltype, 60), evidence: clip(F['License Required'].evidence, 200), confidence: F['License Required'].conf, source: F['License Required'].source, changed: 'true' }); }
  const expMin = det.exp_min !== null && det.exp_min !== undefined ? det.exp_min : (ai.exp_min !== null && ai.exp_min !== undefined ? ai.exp_min : null);
  const expVal = !unk(have['Experience Required']) ? have['Experience Required'] : F['Experience Required'].value;
  if (expMin !== null && (cur.exp_min === null || cur.exp_min === '' || cur.exp_min === undefined) && expVal === 'Yes') { P['Experience Years Min'] = { number: expMin }; sent['Experience Years Min'] = expMin; changed.push('Experience Years Min'); rows.push({ field: 'Experience Years Min', old_value: '', new_value: String(expMin), evidence: clip(F['Experience Required'].evidence, 200), confidence: F['Experience Required'].conf, source: F['Experience Required'].source, changed: 'true' }); }
  // Salary basis (stated on the page) + stated hourly / monthly only when empty. No assumed hours, no estimates.
  if (det.basis && !cur.basis) { setSel('Salary Basis', det.basis); newEv['Salary Basis'] = 'DET 「' + clip(det.basis_ev, 60) + '」'; rows.push({ field: 'Salary Basis', old_value: '', new_value: det.basis, evidence: clip(det.basis_ev, 200), confidence: 'HIGH', source: 'DET', changed: 'true' }); }
  const isEmpty = (v) => v === null || v === undefined || v === '';
  if (det.hourly && det.basis === 'HOURLY' && isEmpty(cur.hourly)) { P['Effective Hourly Wage'] = { number: det.hourly }; sent['Effective Hourly Wage'] = det.hourly; changed.push('Effective Hourly Wage'); rows.push({ field: 'Effective Hourly Wage', old_value: '', new_value: String(det.hourly), evidence: clip(det.basis_ev, 200), confidence: 'HIGH', source: 'DET', changed: 'true' }); }
  if (det.mmin && det.basis === 'MONTHLY' && isEmpty(cur.mmin)) { P['Monthly Salary Min'] = { number: det.mmin }; sent['Monthly Salary Min'] = det.mmin; changed.push('Monthly Salary Min'); P['Monthly Salary Max'] = { number: det.mmax || det.mmin }; sent['Monthly Salary Max'] = det.mmax || det.mmin; changed.push('Monthly Salary Max'); rows.push({ field: 'Monthly Salary Min', old_value: '', new_value: String(det.mmin), evidence: clip(det.basis_ev, 200), confidence: 'HIGH', source: 'DET', changed: 'true' }); }
  // Evidence text: keep earlier lines for fields not rewritten now
  const keep = {}; String(cur.evidence || '').split('\n').forEach((l) => { const m = l.match(/^([^:]+): /); if (m) keep[m[1]] = l; });
  Object.keys(newEv).forEach((k) => { keep[k] = k + ': ' + newEv[k] + ' @' + cfg.run_date; });
  const evTxt = Object.keys(keep).map((k) => clip(keep[k], 300)).join('\n');
  if (Object.keys(newEv).length && clip(evTxt) !== String(cur.evidence || '')) { P['Enrichment Evidence'] = { rich_text: [{ type: 'text', text: { content: clip(evTxt) } }] }; sent['Enrichment Evidence'] = clip(evTxt); changed.push('Enrichment Evidence'); }
  // Overseas: WF04 never changes Recruitability. An explicit hint is only logged for WF02.
  if (j.recruitability !== 'Overseas Confirmed' && det.overseas_hit && !det.domestic_hit) rows.push({ field: 'overseas_hint', old_value: j.recruitability || '', new_value: 'explicit wording seen (WF02 decides)', evidence: clip(det.overseas_hit, 200), confidence: 'HINT', source: 'DET', changed: 'false' });
  if (det.domestic_hit) rows.push({ field: 'overseas_hint', old_value: j.recruitability || '', new_value: 'domestic-only wording seen (WF02 decides)', evidence: clip(det.domestic_hit, 200), confidence: 'HINT', source: 'DET', changed: 'false' });
  (ai.rejected || []).forEach((r) => rows.push({ field: 'ai_rejected', old_value: '', new_value: '', evidence: clip(r, 200), confidence: '', source: 'AI', changed: 'false' }));
  // Throttle stamp: written whenever it differs, so the job leaves the queue until recheck_days passes
  if (cur.checked !== cfg.run_date) { P['Enrichment Checked'] = { date: { start: cfg.run_date } }; sent['Enrichment Checked'] = cfg.run_date; changed.push('Enrichment Checked'); }
  const real = changed.filter((x) => x !== 'Enrichment Checked');
  const needs = changed.length > 0;
  out.push({ json: Object.assign(base, { _kind: 'enriched', outcome: real.length ? 'ENRICHED' : needs ? 'CHECKED_NO_NEW_DATA' : 'NO_CHANGE', filled: real.filter((x) => x !== 'Enrichment Evidence'), conflicts, changed, rows, errors, ai_used: j.ai ? 'true' : 'false', needs_write: needs ? 'true' : 'false', notion_patch_body: { properties: P }, notion_sent: sent }) });
}
return out;
