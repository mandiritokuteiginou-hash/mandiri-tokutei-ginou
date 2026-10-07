// Organize (WF03): canonical record + final dedup + lifecycle + priority tier + matching-ready fields. QC Decision / Lifecycle / Recruitability / Tier stay four independent fields.
// Writes ONLY properties whose value changed (idempotent). Nothing is guessed: unknown stays Unknown/empty.
const cfg = $('Config').first().json;
const N = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, ' ').trim();
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const canonUrl = (u) => String(u || '').trim().replace(/#.*$/, '').replace(/\?.*$/, '').replace(/\/+$/, '');
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const T = { s: Number(cfg.tier_s_min_salary) || 300000, a: Number(cfg.tier_a_min_salary) || 270000, b: Number(cfg.tier_b_min_salary) || 240000, sScore: Number(cfg.tier_s_min_score) || 90, aScore: Number(cfg.tier_a_min_score) || 85, bScore: Number(cfg.tier_b_min_score) || 80, comp: Number(cfg.tier_min_company) || 90 };
const qcRank = (q) => q === 'APPROVED' ? 0 : q === 'REVIEW' ? 1 : q === 'REJECT' ? 2 : 3;
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Source Join').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice(); const cur = j.cur || {}; const sc = j.sc || { state: 'SKIPPED', conflicts: [] };
  const res = it.json && Array.isArray(it.json.results) ? it.json.results : null;
  const base = Object.assign({}, j, { dedup_query: undefined, _kind: 'organized' });
  if (!res || (it.json && it.json.error)) { errors.push({ stage: 'dedup_query', type: 'notion_error', msg: String((it.json && it.json.error && it.json.error.message) || 'bad response').slice(0, 200) }); out.push({ json: Object.assign(base, { needs_write: 'false', outcome: 'ERROR_DEDUP_QUERY', errors }) }); continue; }
  // ---- 1. final dedup (Job ID / 求人番号 / canonical key / canonical URL / company+title+location). Master = best QC rank, then oldest.
  const group = [{ id: j.page_id, url: j.page_url, rank: qcRank(j.qc), created: String(j.created_time), jid: j.mtg_job_id }];
  res.forEach((o) => { if (o.id === j.page_id) return; const P = o.properties || {}; const q = P['QC Decision'] && P['QC Decision'].select ? P['QC Decision'].select.name : ''; const jid = P['Job ID'] && P['Job ID'].unique_id ? (P['Job ID'].unique_id.prefix ? P['Job ID'].unique_id.prefix + '-' : '') + P['Job ID'].unique_id.number : ''; group.push({ id: o.id, url: o.url, rank: qcRank(q), created: String(o.created_time), jid }); });
  group.sort((a, b) => a.rank - b.rank || (a.created < b.created ? -1 : a.created > b.created ? 1 : 0) || (a.id < b.id ? -1 : 1));
  const master = group[0]; const isDup = master.id !== j.page_id;
  // ---- 2. canonical record
  const m = String(j.audit_notes || '').match(/法人番号 ([0-9]{13}) \(([^)]*)\)/);
  const corp = m ? m[1] : ''; const regName = m ? N(m[2]) : '';
  const companyVerified = j.qc === 'APPROVED' || (Number(j.company_score) >= T.comp && !!corp);
  const ckey = j.job_number ? 'HW:' + j.job_number : ''; const curl = canonUrl(j.source_url);
  const ccompany = companyVerified && regName ? regName : N(j.company);
  const cloc = [N(j.prefecture), N(j.city)].filter(Boolean).join(' ');
  const csal = Number(j.monthly_min) > 0 ? Number(j.monthly_min) : null;
  // ---- 3. lifecycle (independent of QC)
  let life = ''; let reason = ''; let requeue = false;
  const prev = cur.lifecycle;
  if (isDup) { life = 'ARCHIVED'; reason = 'duplicate of ' + (master.jid || master.id) + ' (' + master.url + ')'; }
  else if (!j.qc) { life = j.status === 'NEW' ? 'DISCOVERED' : j.status === 'EXTRACTED' ? 'EXTRACTED' : (prev || 'DISCOVERED'); reason = 'not yet through QC'; }
  else if (sc.state === 'CLOSED_ON_SOURCE' || sc.state === 'GONE') { life = 'CLOSED'; reason = 'source posting ' + sc.state; }
  else if (sc.state === 'OK' && sc.days_left !== null && sc.days_left < 0) { life = 'EXPIRED'; reason = 'expired ' + sc.expiry; }
  else if (j.qc === 'REJECT') { life = 'ARCHIVED'; reason = 'QC rejected: ' + clip(j.qc_reject_reason, 200); }
  else if (j.qc === 'REVIEW') { life = 'QC_REVIEW'; reason = 'awaiting manual QC'; }
  else if (j.qc === 'APPROVED') {
    if (sc.state === 'OK') {
      if (sc.conflicts.length && (prev === 'ACTIVE')) { life = 'UPDATED'; reason = 'source changed after approval: ' + sc.conflicts.join('; '); requeue = true; }
      else if (sc.conflicts.length && prev === 'UPDATED') { life = 'UPDATED'; reason = 'source differs from stored data: ' + sc.conflicts.join('; '); }
      else { life = 'ACTIVE'; reason = 'approved, source open' + (sc.expiry ? ', expires ' + sc.expiry : ''); }
    } else { life = (prev === 'ACTIVE' || prev === 'UPDATED') ? prev : 'QC_APPROVED'; reason = 'source ' + sc.state + ' - lifecycle unchanged'; }
  } else { life = prev || 'DISCOVERED'; }
  // ---- 4. priority tier (only QC APPROVED + ACTIVE; Overseas Confirmed required for S/A/B)
  let tier = null; let tierWhy = '';
  if (life === 'ACTIVE' && j.qc === 'APPROVED') {
    const ov = j.recruitability === 'Overseas Confirmed'; const sal = csal || 0; const js = Number(j.quality_score) || 0; const cs = Number(j.company_score) || 0;
    if (ov && sal >= T.s && js >= T.sScore && cs >= T.comp) tier = 'S-TIER'; else if (ov && sal >= T.a && js >= T.aScore) tier = 'A-TIER'; else if (ov && sal >= T.b && js >= T.bScore) tier = 'B-TIER'; else tier = 'C-TIER';
    tierWhy = tier + ': ' + (j.recruitability || 'no recruitability') + ' | ¥' + sal + ' | job ' + js + ' | company ' + cs;
  }
  // ---- 5. matching-ready (deterministic parse of stored text; absence of a mention = Unknown, never No)
  const txt = (s) => String(s || '').normalize('NFKC');
  const jl = txt(j.jp_level); const jm = jl.match(/N\s*([1-5])/i);
  // WF04 owns enrichment of these three fields from the live source: a parse of the STORED text that finds nothing (Unknown) must never wipe a value WF04 filled.
  const keepKnown = (parsed, was) => parsed !== 'Unknown' ? parsed : (was && was !== 'Unknown' ? was : 'Unknown');
  const jlpt0 = jm ? 'N' + jm[1] : /不問|不要|なし|問わ/.test(jl) ? 'None' : 'Unknown'; const jlpt = keepKnown(jlpt0, cur.jlpt);
  const hs = txt(j.housing + ' ' + j.benefits);
  const dorm = /(寮|社宅|借上|住宅)[^。\/ ]{0,6}(なし|無し|はありません|無)/.test(hs) ? 'No' : /(寮|社宅|借上げ?社宅|住宅手当|住宅補助)/.test(hs) ? 'Yes' : 'Unknown';
  const rq = txt(j.requirements);
  const lic0 = /免許/.test(rq) ? (/免許[^。\/]{0,12}(不問|不要)|(不問|不要)[^。\/]{0,6}免許/.test(rq) ? 'No' : /(必須|必要|要|取得|お持ち|所持)/.test(rq) ? 'Yes' : 'Unknown') : 'Unknown';
  const lic = keepKnown(lic0, cur.lic);
  const ex = txt(j.experience); const exp0 = /不問|未経験/.test(ex) ? 'No' : /(経験|歴)\s*[0-9]+\s*年|経験者|経験必須|実務経験/.test(ex) ? 'Yes' : 'Unknown';
  const exp = keepKnown(exp0, cur.exp);
  const otm = txt(j.overtime).match(/([0-9]+(?:\.[0-9]+)?)\s*時間/); const ot = otm ? Number(otm[1]) : null;
  // Matching readiness: Ready only when nothing is missing. Unknown stays Unknown (it blocks readiness, it is never turned into No).
  const eligible = life === 'ACTIVE' && j.qc === 'APPROVED'; const miss = [];
  if (eligible) { if (jlpt === 'Unknown') miss.push('MISSING_JLPT'); if (!j.sector) miss.push('MISSING_SECTOR'); if (!csal) miss.push('MISSING_SALARY'); if (!N(j.prefecture)) miss.push('MISSING_LOCATION'); if (lic === 'Unknown' && exp === 'Unknown') miss.push('MISSING_REQUIREMENTS'); }
  const mrr = !eligible ? 'NOT_ELIGIBLE' : miss.length === 0 ? 'READY' : miss.length === 1 ? miss[0] : 'MULTIPLE_UNKNOWN';
  const ready = mrr === 'READY';
  // ---- 6. desired values -> diff vs current -> PATCH only changes
  const want = { 'Lifecycle Status': ['select', life], 'Lifecycle Reason': ['text', clip(reason, 400)], 'Priority Tier': ['select', tier], 'Tier Reason': ['text', tierWhy], 'Canonical Key': ['text', ckey], 'Canonical URL': ['url', curl || null], 'Canonical Company': ['text', ccompany], 'Corporate Number': ['text', corp], 'Canonical Location': ['text', cloc], 'Canonical Monthly Salary': ['number', csal], 'Canonical Of': ['text', isDup ? master.url : ''], 'Dormitory Available': ['select', dorm], 'JLPT Required': ['select', jlpt], 'License Required': ['select', lic], 'Experience Required': ['select', exp], 'Overtime Hours Avg': ['number', ot], 'Matching Ready': ['checkbox', ready], 'Matching Readiness Reason': ['select', mrr] };
  if (isDup) { want['Duplicate Check'] = ['select', 'Duplicate']; }
  if (sc.state === 'OK') { want['Lifecycle Checked'] = ['date', cfg.run_date]; want['Expiry Date'] = ['date', sc.expiry || null]; }
  const have = { 'Lifecycle Status': cur.lifecycle, 'Lifecycle Reason': cur.reason, 'Priority Tier': cur.tier, 'Tier Reason': cur.tier_reason, 'Canonical Key': cur.ckey, 'Canonical URL': cur.curl, 'Canonical Company': cur.ccompany, 'Corporate Number': cur.corp, 'Canonical Location': cur.cloc, 'Canonical Monthly Salary': cur.csal, 'Canonical Of': cur.canon_of, 'Dormitory Available': cur.dorm, 'JLPT Required': cur.jlpt, 'License Required': cur.lic, 'Experience Required': cur.exp, 'Overtime Hours Avg': cur.ot, 'Matching Ready': cur.ready, 'Matching Readiness Reason': cur.mrr, 'Duplicate Check': cur.dupcheck, 'Lifecycle Checked': cur.checked, 'Expiry Date': cur.expiry };
  const P = {}; const sent = {}; const changed = [];
  Object.keys(want).forEach((key) => {
    const [type, v] = want[key]; const h = have[key]; const norm = (x) => x === null || x === undefined ? '' : x;
    if (norm(h) === norm(v) || (type === 'checkbox' && !!h === !!v)) return;
    changed.push(key);
    if (type === 'select') P[key] = { select: v ? { name: v } : null }; else if (type === 'text') P[key] = { rich_text: v ? [{ type: 'text', text: { content: clip(v) } }] : [] }; else if (type === 'url') P[key] = { url: v }; else if (type === 'number') P[key] = { number: v }; else if (type === 'checkbox') P[key] = { checkbox: !!v }; else if (type === 'date') P[key] = { date: v ? { start: v } : null };
    sent[key] = type === 'text' ? clip(v) : v;
  });
  if (requeue) { P['Status'] = { select: { name: 'VERIFICATION_REQUIRED' } }; sent['Status'] = 'VERIFICATION_REQUIRED'; P['Recheck Required'] = { checkbox: true }; sent['Recheck Required'] = true; P['Recheck Reason'] = { rich_text: [{ type: 'text', text: { content: clip('WF03: ' + reason) } }] }; sent['Recheck Reason'] = clip('WF03: ' + reason); changed.push('requeue_to_WF02'); }
  const needs = changed.length > 0;
  out.push({ json: Object.assign(base, { canonical: { key: ckey, url: curl, company: ccompany, corp, location: cloc, salary: csal }, lifecycle: life, mrr, prev_lifecycle: prev || '', tier, dup_of: isDup ? master.url : '', requeue, changed, reason, errors, needs_write: needs ? 'true' : 'false', outcome: needs ? 'CHANGED' : 'NO_CHANGE', notion_patch_body: { properties: P }, notion_sent: sent }) });
}
return out;
