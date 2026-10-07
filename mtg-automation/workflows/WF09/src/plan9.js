// Plan Leads (WF09): the whole deterministic state machine. No AI decision, no send, no write to the Master Job DB.
const cfg = $('Config').first().json;
//@LIB
const TODAY = cfg.run_date; const NOW = cfg.run_started;
const rtx = (p) => ((p && (p.rich_text || p.title)) || []).map((x) => x.plain_text || (x.text && x.text.content) || '').join('');
const sel = (p) => (p && p.select && p.select.name) || '';
const num = (p) => (p && typeof p.number === 'number' ? p.number : null);
const dts = (p) => (p && p.date && p.date.start) || '';
const chk = (p) => !!(p && p.checkbox);
const FT = { 'Lead ID': 'title', 'Lead Key': 'rich_text', 'Phone Hash': 'rich_text', 'Phone': 'phone_number', 'Name': 'rich_text', 'Job ID': 'rich_text', 'Lead Status': 'select', 'Prev Status': 'select', 'Status Reason': 'rich_text', 'Status Changed': 'date', 'Source': 'select', 'Consent Status': 'select', 'Consent Date': 'date', 'Consent Source': 'select', 'Consent Version': 'rich_text', 'Consent Requested At': 'date', 'Applicant JLPT': 'select', 'JFT-Basic': 'select', 'Skill Test Passed': 'select', 'Tech Intern Completed': 'select', 'Has License': 'select', 'Experience Years': 'number', 'Age': 'number', 'Facts Hash': 'rich_text', 'Eligibility Result': 'select', 'Eligibility Detail': 'rich_text', 'Last Intent': 'select', 'Last Inbound': 'date', 'Reply Draft': 'rich_text', 'Draft Kind': 'select', 'Draft Facts Hash': 'rich_text', 'Human Action': 'select', 'Last Contact': 'date', 'Handoff Ref': 'rich_text', 'Purge After': 'date', 'PII Purged': 'checkbox', 'PII Purged At': 'date', 'Last Run': 'rich_text' };
const ALLOWED = new Set(Object.keys(FT)); // Lead Notes is intentionally NOT writable
const readLead = (pg) => { const p = pg.properties || {}; const o = { _page: pg.id, _created: pg.created_time || '' }; Object.keys(FT).forEach((k) => { const t = FT[k]; o[k] = t === 'title' || t === 'rich_text' ? rtx(p[k]) : t === 'select' ? sel(p[k]) : t === 'number' ? num(p[k]) : t === 'date' ? dts(p[k]) : t === 'checkbox' ? chk(p[k]) : t === 'phone_number' ? ((p[k] && p[k].phone_number) || '') : ''; }); return o; };
const ser = (t, v) => t === 'title' ? { title: [{ text: { content: String(v || '').slice(0, 200) } }] } : t === 'rich_text' ? { rich_text: v ? [{ text: { content: String(v).slice(0, 1900) } }] : [] } : t === 'select' ? { select: v ? { name: String(v) } : null } : t === 'number' ? { number: v === '' || v === null || v === undefined ? null : Number(v) } : t === 'date' ? { date: v ? { start: String(v) } : null } : t === 'checkbox' ? { checkbox: !!v } : { phone_number: v ? String(v) : null };
const ACTIVE = ['CONTACTED', 'SCREENING', 'ELIGIBLE', 'DOCS_REQUESTED'];
const PRE_DOCS = ['NEW', 'CONTACTED', 'SCREENING', 'ELIGIBLE'];
const LEGAL = { '': ['NEW', 'MANUAL_REVIEW'], NEW: ['CONTACTED', 'DORMANT', 'WITHDRAWN', 'MANUAL_REVIEW'], CONTACTED: ['SCREENING', 'DORMANT', 'WITHDRAWN', 'MANUAL_REVIEW'], SCREENING: ['ELIGIBLE', 'NOT_ELIGIBLE', 'DORMANT', 'WITHDRAWN', 'MANUAL_REVIEW'], ELIGIBLE: ['NOT_ELIGIBLE', 'SCREENING', 'DOCS_REQUESTED', 'DORMANT', 'WITHDRAWN', 'MANUAL_REVIEW'], NOT_ELIGIBLE: ['ELIGIBLE', 'SCREENING', 'DORMANT', 'WITHDRAWN', 'MANUAL_REVIEW'], DOCS_REQUESTED: ['DOCS_RECEIVED', 'DORMANT', 'WITHDRAWN', 'MANUAL_REVIEW'], DOCS_RECEIVED: ['HANDOFF', 'WITHDRAWN', 'MANUAL_REVIEW'], HANDOFF: ['WITHDRAWN', 'MANUAL_REVIEW'], DORMANT: ['NEW', 'CONTACTED', 'SCREENING', 'ELIGIBLE', 'NOT_ELIGIBLE', 'DOCS_REQUESTED', 'DOCS_RECEIVED', 'WITHDRAWN', 'MANUAL_REVIEW'], MANUAL_REVIEW: ['NEW', 'CONTACTED', 'SCREENING', 'ELIGIBLE', 'NOT_ELIGIBLE', 'DOCS_REQUESTED', 'DOCS_RECEIVED', 'HANDOFF', 'DORMANT', 'WITHDRAWN'], WITHDRAWN: ['NEW'] };
const FACT_KEYS = ['Applicant JLPT', 'JFT-Basic', 'Skill Test Passed', 'Tech Intern Completed', 'Has License', 'Experience Years', 'Age'];
const PII_CLEAR = ['Phone', 'Name', 'Applicant JLPT', 'JFT-Basic', 'Skill Test Passed', 'Tech Intern Completed', 'Has License', 'Experience Years', 'Age', 'Eligibility Result', 'Eligibility Detail', 'Reply Draft', 'Draft Kind', 'Draft Facts Hash', 'Facts Hash'];
const errors = []; const outItems = [];
// ---- guard: salt
if (!cfg.hash_salt || cfg.hash_salt === 'CHANGE_ME') return [{ json: { _kind: 'meta', action: 'NONE', queue_status: 'SALT_NOT_SET', errors: [{ stage: 'config', type: 'SALT_NOT_SET', msg: 'hash_salt is not set; WF09 refuses to hash/write' }], counts: {} } }];
// ---- inputs
const leadsRes = (($('Query Leads').first().json) || {});
const rawLeads = leadsRes.results || []; const truncated = leadsRes.has_more === true;
let intents = []; try { intents = $('Intents').all().map((i) => i.json); } catch (e) { intents = []; }
const msgs = intents.filter((x) => x._kind === 'message'); const metaIn = intents.find((x) => x._kind === 'meta') || {};
const jobs = {};
$input.all().forEach((it) => { const r = it.json && it.json.results && it.json.results[0]; if (!r) return; const p = r.properties || {}; const u = p['Job ID'] && p['Job ID'].unique_id; if (!u) return; jobs[(u.prefix || 'MTG') + '-' + u.number] = { id: (u.prefix || 'MTG') + '-' + u.number, title: rtx(p['Job Title']), company: rtx(p['Company']), lifecycle: sel(p['Lifecycle Status']), jlpt: sel(p['JLPT Required']), license: sel(p['License Required']), exp: sel(p['Experience Required']), expiry: dts(p['Expiry Date']) }; });
let requested = null; try { requested = new Set($('Prepare Job Lookups').all().map((i) => String(i.json.job_id || '').toUpperCase()).filter(Boolean)); } catch (e) { requested = new Set(); }
const leads = rawLeads.map(readLead);
// ---- indexes
leads.sort((a, b) => String(a._created).localeCompare(String(b._created)));
const byKey = {}; const byPh = {}; const dupOf = {};
leads.forEach((L) => { if (L['Lead Key']) { if (byKey[L['Lead Key']]) dupOf[L._page] = byKey[L['Lead Key']]._page; else byKey[L['Lead Key']] = L; } if (L['Phone Hash']) (byPh[L['Phone Hash']] = byPh[L['Phone Hash']] || []).push(L); });
// ---- eligibility
const LV = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
const yn = (v) => (v === 'Yes' ? true : v === 'No' ? false : null);
function evaluate(S, job) {
  const R = {}; const missing = []; const unmet = []; let jobUnknown = false;
  const age = S['Age']; R.R1 = age === null ? 'UNKNOWN' : age >= 18 ? 'MET' : 'NOT_MET'; if (R.R1 === 'UNKNOWN') missing.push('Age'); if (R.R1 === 'NOT_MET') unmet.push('usia minimal 18 tahun');
  const jr = job.jlpt || ''; const jl = LV[jr] || 0;
  if (jr === 'None') R.R2 = 'NA'; else if (!jl) { R.R2 = 'UNKNOWN'; jobUnknown = true; }
  else { const al = S['Applicant JLPT'] === 'None' ? 0 : (LV[S['Applicant JLPT']] || null); const jft = yn(S['JFT-Basic']);
    if ((al !== null && al >= jl) || (jft === true && jl <= 2)) R.R2 = 'MET';
    else if (al !== null && (jft === false || jl > 2)) R.R2 = 'NOT_MET';
    else { R.R2 = 'UNKNOWN'; missing.push('Applicant JLPT'); if (jl <= 2) missing.push('JFT-Basic'); } }
  if (R.R2 === 'NOT_MET') unmet.push('kemampuan bahasa Jepang (' + jr + ')');
  if (cfg.require_ssw_baseline === 'true') { const sk = yn(S['Skill Test Passed']); const ti = yn(S['Tech Intern Completed']); R.R3 = (sk === true || ti === true) ? 'MET' : (sk === false && ti === false) ? 'NOT_MET' : 'UNKNOWN'; if (R.R3 === 'UNKNOWN') missing.push('Skill Test Passed', 'Tech Intern Completed'); if (R.R3 === 'NOT_MET') unmet.push('tes keterampilan atau magang teknis'); } else R.R3 = 'NA';
  const lic = job.license; if (lic === 'No' || lic === 'Preferred') R.R4 = 'NA'; else if (lic === 'Yes') { const h = yn(S['Has License']); R.R4 = h === true ? 'MET' : h === false ? 'NOT_MET' : 'UNKNOWN'; if (R.R4 === 'UNKNOWN') missing.push('Has License'); if (R.R4 === 'NOT_MET') unmet.push('lisensi yang diminta lowongan'); } else { R.R4 = 'UNKNOWN'; jobUnknown = true; }
  const ex = job.exp; if (ex === 'No') R.R5 = 'NA'; else if (ex === 'Yes') { const y = S['Experience Years']; R.R5 = y === null ? 'UNKNOWN' : y > 0 ? 'MET' : 'NOT_MET'; if (R.R5 === 'UNKNOWN') missing.push('Experience Years'); if (R.R5 === 'NOT_MET') unmet.push('pengalaman kerja yang diminta'); } else { R.R5 = 'UNKNOWN'; jobUnknown = true; }
  const vals = Object.values(R); const overall = vals.includes('NOT_MET') ? 'NOT_ELIGIBLE' : vals.includes('UNKNOWN') ? 'UNKNOWN' : 'ELIGIBLE';
  return { R, overall, missing: [...new Set(missing)], unmet, jobUnknown, detail: Object.keys(R).map((k) => k + ':' + R[k]).join(' ') };
}
const anyFact = (S) => FACT_KEYS.some((k) => (typeof S[k] === 'number') || (S[k] && S[k] !== 'Unknown'));
const factsHash = (S, job) => HS(['facts', JSON.stringify(FACT_KEYS.map((k) => S[k])), job.jlpt || '', job.license || '', job.exp || '', cfg.require_ssw_baseline]);
// ---- drafts (fixed templates, no generated text)
const FL = { 'Age': 'usia', 'Applicant JLPT': 'level JLPT (N5-N1, atau belum punya)', 'JFT-Basic': 'apakah sudah lulus JFT-Basic', 'Skill Test Passed': 'apakah sudah lulus tes keterampilan (SSW)', 'Tech Intern Completed': 'apakah pernah menyelesaikan magang teknis (ginou jisshu)', 'Has License': 'lisensi/SIM yang diminta lowongan (ada atau tidak)', 'Experience Years': 'pengalaman kerja di bidang terkait (berapa tahun)' };
const disc = String(cfg.legal_disclosure_line || '').trim();
const TPL = {
  CONSENT_REQUEST: (c) => 'Halo Kak, terima kasih sudah menghubungi ' + cfg.brand_name + '. Untuk membantu info lowongan ' + c.jobid + ', kami perlu menyimpan nomor WhatsApp dan informasi yang Kakak berikan (misalnya kemampuan bahasa Jepang dan pengalaman kerja). Data hanya dipakai untuk informasi lowongan ini, pesan dipilah dengan bantuan sistem otomatis/AI, dan Kakak bisa minta data dihapus kapan saja. Setuju? Balas YA jika setuju, atau TIDAK jika tidak. ' + disc,
  QUESTIONS: (c) => 'Terima kasih Kak. Untuk lowongan ' + c.jobid + (c.title ? ' (' + c.title + ')' : '') + ', boleh kami minta info berikut: ' + c.missing.map((k) => FL[k]).filter(Boolean).join('; ') + '. Jawab seadanya saja; jika belum ada, tulis "belum".',
  NEXT_STEP: (c) => 'Terima kasih informasinya Kak. Dari data yang diberikan, profil Kakak memenuhi persyaratan awal lowongan ' + c.jobid + '. Ini baru pengecekan awal, belum keputusan akhir. Untuk lanjut, tim kami akan meminta dokumen berikut: ' + cfg.docs_list + '. ' + disc,
  NOT_ELIGIBLE_NOTICE: (c) => 'Terima kasih informasinya Kak. Untuk lowongan ' + c.jobid + ', persyaratan berikut belum terpenuhi saat ini: ' + c.unmet.join('; ') + '. Jika ada lowongan lain yang cocok, kami kabari.',
  WITHDRAW_ACK: () => 'Baik Kak, permintaan Kakak sudah kami catat. Data Kakak akan dihapus sesuai kebijakan kami dan kami tidak akan menghubungi lagi.'
};
const draftOK = (txt) => { let body = NF(txt); if (disc) body = body.split(NF(disc)).join(' '); const lists = (k) => String(cfg[k] || '').split('|').map((s) => s.trim()).filter(Boolean); const bad = [...lists('banned_phrases'), ...lists('regulatory_phrases')].find((b) => wre(b).test(body)); return bad ? 'DRAFT_POLICY:' + bad : ''; };
// ---- state object
function makeState(L) { return Object.assign({}, L); }
function runLead(L0, ev, job, opts) {
  const S = makeState(L0); const O = {}; Object.keys(L0).forEach((k) => { O[k] = L0[k]; });
  const steps = []; const logs = []; const fl = { legal: false, withdraw: false, ambiguous: !!opts.ambiguous, consentNo: false, supply: false, docs: false, resumed: false, close: false, reopen: false };
  const set = (k, v) => { S[k] = v; };
  const reasons = [];
  const go = (to, why) => { if (S['Lead Status'] === to) return false; const from = S['Lead Status']; if (!(LEGAL[from] || []).includes(to)) { steps.push({ from, to: 'MANUAL_REVIEW', reason: 'ILLEGAL_TRANSITION:' + from + '>' + to }); if (from !== 'MANUAL_REVIEW') { set('Prev Status', from); set('Lead Status', 'MANUAL_REVIEW'); } set('Status Reason', 'ILLEGAL_TRANSITION'); set('Status Changed', TODAY); return true; } if (to === 'MANUAL_REVIEW') set('Prev Status', from === '' ? '' : from); steps.push({ from, to, reason: why }); set('Lead Status', to); set('Status Reason', why); set('Status Changed', TODAY); return true; };
  // reopen
  if (opts.reopen && (S['Lead Status'] === 'WITHDRAWN' || S['PII Purged'])) { fl.reopen = true; set('PII Purged', false); set('PII Purged At', ''); set('Purge After', ''); set('Consent Status', 'NONE'); set('Consent Date', ''); set('Consent Source', ''); set('Consent Requested At', ''); set('Prev Status', ''); set('Reply Draft', ''); set('Draft Kind', ''); set('Draft Facts Hash', ''); if (opts.phone) set('Phone', opts.phone); if (S['Lead Status'] === 'WITHDRAWN') { steps.push({ from: 'WITHDRAWN', to: 'NEW', reason: 'REOPENED_BY_INBOUND' }); set('Lead Status', 'NEW'); set('Status Reason', 'REOPENED_BY_INBOUND'); set('Status Changed', TODAY); } else { set('Status Reason', 'REOPENED_BY_INBOUND'); } }
  if (!S['Phone'] && opts.phone && !S['PII Purged']) set('Phone', opts.phone);
  if (opts.name && !S['Name'] && !S['PII Purged']) set('Name', opts.name);
  // purge due (and nothing reopened)
  if (!fl.reopen && !S['PII Purged'] && S['Purge After'] && S['Purge After'] <= TODAY && S['Lead Status'] !== '' && S['Lead Status'] !== 'HANDOFF') {
    if (S['Lead Status'] === 'NEW' && S['Consent Status'] !== 'GRANTED') go('DORMANT', 'CONSENT_NOT_RECEIVED');
    PII_CLEAR.forEach((k) => set(k, FT[k] === 'number' ? null : FT[k] === 'select' ? '' : '')); set('Lead Notes', undefined); set('PII Purged', true); set('PII Purged At', TODAY); set('Purge After', '');
    logs.push({ event: 'PURGE', reason: 'RETENTION' }); return finish(S, O, steps, logs, fl, job, opts, true);
  }
  if (S['PII Purged']) return finish(S, O, steps, logs, fl, job, opts, true);
  // phone / keys
  if (S['Phone']) { const np = normPhone(S['Phone']); if (np) { if (np !== S['Phone']) set('Phone', np); const ph = HS(['phone', np]); if (S['Phone Hash'] !== ph) set('Phone Hash', ph); const jid = String(S['Job ID'] || '').trim().toUpperCase().replace(/^MTG[-\s]?/, 'MTG-'); if (jid && /^MTG-\d+$/.test(jid)) { if (jid !== S['Job ID']) set('Job ID', jid); const lk = HS(['lead', np, jid]); if (S['Lead Key'] !== lk) set('Lead Key', lk); } } else fl.phoneBad = true; }
  if (!S['Lead ID']) set('Lead ID', S['Lead Key'] ? 'LD-' + S['Lead Key'].slice(0, 8).toUpperCase() : 'LD-NOJOB-' + String(S['Phone Hash'] || HS(['nj', S._page])).slice(0, 8).toUpperCase());
  if (S['Lead Key'] && S['Lead ID'].startsWith('LD-NOJOB-')) set('Lead ID', 'LD-' + S['Lead Key'].slice(0, 8).toUpperCase());
  // human action
  const ha = S['Human Action']; const haState = { cleared: false };
  if (ha) {
    const st = S['Lead Status'];
    if (ha === 'DRAFT_SENT') { if (S['Reply Draft']) { if (S['Draft Kind'] === 'CONSENT_REQUEST') set('Consent Requested At', TODAY); set('Last Contact', TODAY); set('Reply Draft', ''); set('Draft Kind', ''); logs.push({ event: 'ACTION_DRAFT_SENT', reason: '' }); } else logs.push({ event: 'ACTION_IGNORED', reason: 'ACTION_INVALID_FOR_STATE' }); }
    else if (ha === 'CLOSE') fl.close = true;
    else if (ha === 'RESUME') { if (st === 'MANUAL_REVIEW') fl.resumed = true; else logs.push({ event: 'ACTION_IGNORED', reason: 'ACTION_INVALID_FOR_STATE' }); }
    else if (ha === 'DOCS_REQUESTED') { if (st !== 'ELIGIBLE') { logs.push({ event: 'ACTION_IGNORED', reason: 'ACTION_INVALID_FOR_STATE' }); fl.haIgnored = true; } }
    else if (ha === 'DOCS_RECEIVED') { if (st !== 'DOCS_REQUESTED') { logs.push({ event: 'ACTION_IGNORED', reason: 'ACTION_INVALID_FOR_STATE' }); fl.haIgnored = true; } }
    set('Human Action', ''); haState.cleared = true; S._ha = ha;
  }
  // messages
  const nowMsg = ev.length > 0;
  ev.forEach((m) => {
    set('Last Intent', m.intent); if (!S['Last Inbound'] || String(m.ts).slice(0, 10) > S['Last Inbound']) set('Last Inbound', String(m.ts).slice(0, 10));
    if (m.intent === 'WITHDRAW') fl.withdraw = true;
    else if (m.intent === 'LEGAL_SENSITIVE' || m.sensitive) { fl.legal = true; if (m.intent !== 'LEGAL_SENSITIVE') set('Last Intent', 'LEGAL_SENSITIVE'); }
    else if (m.intent === 'CONSENT_NO') fl.consentNo = true;
    else if (m.intent === 'CONSENT_YES') {
      const req = S['Consent Requested At']; const okWin = req && dayDiff(String(m.ts).slice(0, 10), req) >= 0 && dayDiff(String(m.ts).slice(0, 10), req) <= Number(cfg.consent_window_days || 7);
      if (S['Consent Status'] === 'NONE' && okWin && S['Lead Status'] !== 'WITHDRAWN') { set('Consent Status', 'GRANTED'); set('Consent Date', String(m.ts).slice(0, 10)); set('Consent Source', 'WA_OPTIN'); set('Consent Version', cfg.consent_version); set('Purge After', ''); logs.push({ event: 'CONSENT_GRANTED', reason: 'WA_OPTIN_AFTER_DRAFT_SENT' }); }
      else reasons.push('CONSENT_YES_IGNORED_NO_REQUEST');
    }
    else if (m.intent === 'SUPPLY_INFO') fl.supply = true;
    else if (m.intent === 'DOCS_SENT') fl.docs = true;
  });
  if (fl.supply) reasons.push('FACTS_TO_ENTER'); if (fl.docs) reasons.push('DOCS_MENTIONED');
  // ---- transition loop
  const lastAct = () => [S['Last Inbound'], S['Last Contact'], S['Status Changed']].filter(Boolean).sort().pop() || TODAY;
  const jobBad = !job ? 'JOB_NOT_FOUND' : (job.lifecycle !== 'ACTIVE' ? 'JOB_NOT_ACTIVE' : (job.expiry && job.expiry < TODAY ? 'JOB_EXPIRED' : ''));
  const jobCheck = requested.has(String(S['Job ID'] || '').toUpperCase()) ? jobBad : '';
  let guard = 0; const visited = new Set();
  while (guard++ < 4) {
    const st = S['Lead Status']; const before = st + '|' + S['Consent Status'];
    let moved = false;
    if (st === 'WITHDRAWN') break;
    if (S['Consent Status'] === 'WITHDRAWN' || fl.withdraw || fl.consentNo) { fl.withdraw = false; fl.consentNo = false; if (S['Consent Status'] !== 'WITHDRAWN') { set('Consent Status', 'WITHDRAWN'); logs.push({ event: 'CONSENT_WITHDRAWN', reason: '' }); } moved = go('WITHDRAWN', 'WITHDRAWN_BY_APPLICANT'); if (moved) { set('Purge After', addDays(TODAY, Number(cfg.withdrawn_purge_days || 3))); } break; }
    if (fl.close && st !== 'DORMANT') { fl.close = false; if (st === 'HANDOFF') { logs.push({ event: 'ACTION_IGNORED', reason: 'ACTION_INVALID_FOR_STATE' }); } else { set('Prev Status', st); go('DORMANT', 'CLOSED_BY_HUMAN'); set('Purge After', addDays(TODAY, Number(cfg.purge_dormant_days || 180))); } continue; }
    if (st === 'HANDOFF') { if (fl.legal) reasons.push('LEGAL_FLAG_IN_HANDOFF'); if (dayDiff(TODAY, S['Status Changed'] || TODAY) >= Number(cfg.handoff_review_days || 365)) go('MANUAL_REVIEW', 'RETENTION_REVIEW'); break; }
    // MANUAL_REVIEW triggers
    const trig = []; if (fl.phoneBad) trig.push('PHONE_INVALID'); if (!S['Job ID'] || !/^MTG-\d+$/.test(S['Job ID'])) trig.push('NO_JOB_REF'); if (dupOf[S._page]) trig.push('DUPLICATE_LEAD'); if (PRE_DOCS.includes(st) && jobCheck && S['Job ID']) trig.push(jobCheck);
    if (!['', 'NEW', 'DORMANT', 'MANUAL_REVIEW', 'WITHDRAWN'].includes(st) && S['Consent Status'] !== 'GRANTED') trig.push('CONSENT_MISSING');
    const evtTrig = []; if (fl.legal) evtTrig.push('LEGAL_SENSITIVE'); if (fl.ambiguous) evtTrig.push('AMBIGUOUS_TARGET');
    if (st === 'MANUAL_REVIEW') { if (fl.resumed) { fl.resumed = false; if (trig.length || evtTrig.length) { const why = (trig.concat(evtTrig))[0]; set('Status Reason', why); reasons.push('RESUME_REFUSED:' + why); break; } const to = S['Prev Status'] || 'NEW'; fl.resumeDone = true; go(to, 'RESUMED_BY_HUMAN'); set('Prev Status', ''); evtTrig.length = 0; fl.legal = false; fl.ambiguous = false; continue; } if (evtTrig.length) set('Status Reason', evtTrig.join(',')); break; }
    if (trig.length || evtTrig.length) { go('MANUAL_REVIEW', trig.concat(evtTrig).join(',')); fl.legal = false; fl.ambiguous = false; break; }
    if (st === '') { go('NEW', 'INTAKE'); if (!S['Purge After'] && S['Consent Status'] !== 'GRANTED') set('Purge After', addDays(String(S._created || TODAY).slice(0, 10) || TODAY, Number(cfg.purge_no_consent_days || 14))); if (!S['Source']) set('Source', 'MANUAL'); if (!S['Consent Status']) set('Consent Status', 'NONE'); continue; }
    if (st === 'DORMANT') { if (nowMsg && !fl.withdraw) { moved = go(S['Prev Status'] && S['Prev Status'] !== 'DORMANT' ? S['Prev Status'] : 'CONTACTED', 'REVIVED_BY_INBOUND'); set('Purge After', ''); if (moved) continue; } break; }
    if (st === 'NEW') { if (S['Consent Status'] === 'GRANTED') { go('CONTACTED', 'CONSENT_GRANTED'); set('Purge After', ''); continue; } break; }
    const dorm = ACTIVE.includes(st) && dayDiff(TODAY, lastAct()) >= Number(cfg.dormant_after_days || 21);
    if (dorm) { set('Prev Status', st); go('DORMANT', 'INACTIVE'); set('Purge After', addDays(TODAY, Number(cfg.purge_dormant_days || 180))); break; }
    if (st === 'CONTACTED') { if (anyFact(S)) { go('SCREENING', 'FACTS_PRESENT'); continue; } break; }
    if (['SCREENING', 'ELIGIBLE', 'NOT_ELIGIBLE'].includes(st)) {
      const e = evaluate(S, job || {}); const fh = factsHash(S, job || {});
      const changed = fh !== S['Facts Hash']; S._eval = e; S._fh = fh;
      if (st === 'ELIGIBLE' && S._ha === 'DOCS_REQUESTED' && !fl.haIgnored && e.overall === 'ELIGIBLE') { go('DOCS_REQUESTED', 'DOCS_REQUESTED_BY_HUMAN'); continue; }
      if (st === 'SCREENING' || changed) {
        if (e.overall === 'ELIGIBLE' && st !== 'ELIGIBLE') { go('ELIGIBLE', 'RULES_MET'); continue; }
        if (e.overall === 'NOT_ELIGIBLE' && st !== 'NOT_ELIGIBLE') { go('NOT_ELIGIBLE', 'RULE_NOT_MET:' + Object.keys(e.R).filter((k) => e.R[k] === 'NOT_MET').join('+')); set('Purge After', addDays(TODAY, Number(cfg.purge_not_eligible_days || 90))); continue; }
        if (e.overall === 'UNKNOWN' && st !== 'SCREENING') { go('SCREENING', 'FACTS_CHANGED'); continue; }
        if (e.overall === 'UNKNOWN' && st === 'SCREENING' && e.jobUnknown && !e.missing.length) { go('MANUAL_REVIEW', 'JOB_REQ_UNKNOWN'); break; }
      }
      break;
    }
    if (st === 'DOCS_REQUESTED') { if (S._ha === 'DOCS_RECEIVED' && !fl.haIgnored) { go('DOCS_RECEIVED', 'DOCS_RECEIVED_BY_HUMAN'); continue; } break; }
    if (st === 'DOCS_RECEIVED') { go('HANDOFF', 'AUTO_HANDOFF'); set('Handoff Ref', 'HANDOFF ' + S['Job ID'] + ' / ' + S['Lead ID']); set('Purge After', ''); continue; }
    break;
  }
  return finish(S, O, steps, logs, fl, job, opts, false, reasons);
}
function finish(S, O, steps, logs, fl, job, opts, purgedNow, reasons) {
  reasons = reasons || [];
  const st = S['Lead Status']; const jobid = S['Job ID']; const e = S._eval; let draftKind = ''; let draft = '';
  // eligibility fields
  if (!purgedNow && S['Consent Status'] === 'GRANTED' && ['SCREENING', 'ELIGIBLE', 'NOT_ELIGIBLE'].includes(st)) { const ev = e || evaluate(S, job || {}); S['Eligibility Result'] = ev.overall; S['Eligibility Detail'] = ev.detail; S['Facts Hash'] = S._fh || factsHash(S, job || {}); S._eval = ev; }
  // drafts
  if (!purgedNow && S['Phone']) {
    const c = { jobid, title: job && job.title, missing: [], unmet: [] };
    if (st === 'NEW' && S['Consent Status'] === 'NONE') draftKind = 'CONSENT_REQUEST';
    else if (st === 'CONTACTED') { const ev = evaluate(S, job || {}); c.missing = ev.missing; if (c.missing.length) draftKind = 'QUESTIONS'; }
    else if (st === 'SCREENING' && S._eval && S._eval.missing.length) { c.missing = S._eval.missing; draftKind = 'QUESTIONS'; }
    else if (st === 'ELIGIBLE') draftKind = 'NEXT_STEP';
    else if (st === 'NOT_ELIGIBLE' && S._eval) { c.unmet = S._eval.unmet; draftKind = c.unmet.length ? 'NOT_ELIGIBLE_NOTICE' : ''; }
    else if (st === 'WITHDRAWN') draftKind = 'WITHDRAW_ACK';
    if (fl.legal || st === 'MANUAL_REVIEW') draftKind = '';
    if (draftKind) {
      const dkh = HS(['draft', draftKind, S._fh || S['Facts Hash'] || '-', c.missing.join(','), c.unmet.join(',')]);
      if (S['Draft Facts Hash'] === dkh) { /* same draft already created or already sent: do nothing */ }
      else { draft = TPL[draftKind](c); const bad = draftOK(draft); if (bad) { errors.push({ stage: 'draft', type: 'DRAFT_POLICY', msg: bad }); draftKind = ''; draft = ''; } else { S['Reply Draft'] = draft; S['Draft Kind'] = draftKind; S['Draft Facts Hash'] = dkh; logs.push({ event: 'DRAFT', reason: draftKind }); } }
    } else if (S['Reply Draft'] && S['Draft Kind'] !== 'WITHDRAW_ACK' && (fl.legal || ['MANUAL_REVIEW', 'DOCS_REQUESTED', 'DOCS_RECEIVED', 'HANDOFF', 'DORMANT'].includes(st))) { S['Reply Draft'] = ''; S['Draft Kind'] = ''; }
  }
  if (reasons.length && !steps.length) S['Status Reason'] = [...new Set(reasons)].join(',');
  else if (reasons.length && steps.length) S['Status Reason'] = [S['Status Reason'], ...reasons].filter(Boolean).join(',').slice(0, 300);
  // purge after for NEW without consent when missing
  if (!purgedNow && ['NEW', 'MANUAL_REVIEW'].includes(st) && S['Consent Status'] !== 'GRANTED' && !S['Purge After']) S['Purge After'] = addDays(String(S._created || TODAY).slice(0, 10) || TODAY, Number(cfg.purge_no_consent_days || 14));
  // diff
  const diff = {}; const sent = {};
  Object.keys(FT).forEach((k) => { const a = O[k] === undefined ? '' : O[k]; const b = S[k] === undefined ? '' : S[k]; const na = a === null ? '' : a; const nb = b === null ? '' : b; if (String(na) !== String(nb)) { diff[k] = b; } });
  if (Object.keys(diff).length) { diff['Last Run'] = cfg.run_id; }
  Object.keys(diff).forEach((k) => { if (!ALLOWED.has(k)) throw new Error('WRITE_NOT_ALLOWED:' + k); sent[k] = { t: FT[k], v: diff[k] === null ? '' : diff[k] }; });
  return { S, O, steps, logs, diff, sent, draftKind: S['Draft Kind'], purgedNow, e: S._eval };
}
// ---- message resolution
const events = {}; const newLeads = {}; const noops = [];
const jobOf = (jid) => jobs[String(jid || '').toUpperCase()] || null;
msgs.forEach((m) => {
  const intent = m.det_intent || m.ai_intent || 'OTHER'; const sens = m.ai_sensitive === 'true' || intent === 'LEGAL_SENSITIVE';
  if (m.phone_valid !== 'true') { noops.push({ hash: m.msg_hash, reason: 'PHONE_INVALID' }); return; }
  const ph = HS(['phone', m.phone]); const ev = { intent, sensitive: sens && intent !== 'WITHDRAW', ts: m.ts, hash: m.msg_hash, phone: m.phone, name: m.name };
  let target = null; let amb = false; let reopen = false;
  if (m.job_ref) { const key = HS(['lead', m.phone, m.job_ref]); target = byKey[key] || null; if (!target) { const nl = newLeads[key] = newLeads[key] || { key, phone: m.phone, ph, job: m.job_ref, name: m.name, ev: [] }; nl.ev.push(ev); return; } }
  else { const c = byPh[ph] || []; if (!c.length) { const key = 'NOJOB:' + ph; const nl = newLeads[key] = newLeads[key] || { key: '', phone: m.phone, ph, job: '', name: m.name, ev: [] }; nl.ev.push(ev); return; } if (c.length === 1) target = c[0]; else { const live = c.filter((x) => !x['PII Purged']); const pool = live.length ? live : c; pool.sort((a, b) => String(b['Last Inbound'] || b['Status Changed']).localeCompare(String(a['Last Inbound'] || a['Status Changed']))); target = pool[0]; amb = true; } }
  if ((target['Lead Status'] === 'WITHDRAWN' || target['PII Purged']) && !['WITHDRAW', 'CONSENT_YES', 'CONSENT_NO'].includes(intent)) reopen = true;
  else if (target['Lead Status'] === 'WITHDRAWN' || (target['PII Purged'] && ['WITHDRAW', 'CONSENT_YES', 'CONSENT_NO'].includes(intent))) { noops.push({ hash: m.msg_hash, reason: 'IGNORED_AFTER_WITHDRAWAL', key: target['Lead Key'] }); return; }
  const e0 = events[target._page] = events[target._page] || { ev: [], amb: false, reopen: false, phone: m.phone, name: m.name, hashes: [] };
  e0.ev.push(ev); e0.hashes.push(m.msg_hash); e0.amb = e0.amb || amb; e0.reopen = e0.reopen || reopen;
});
// ---- run per lead
const counts = { leads_loaded: leads.length, created: 0, transitions: 0, drafts: 0, manual_review: 0, withdrawn: 0, purged: 0, noop: 0 };
const proposals = [];
leads.forEach((L) => {
  const e0 = events[L._page]; const job = jobOf(L['Job ID']);
  let r; try { r = runLead(L, e0 ? e0.ev : [], job, { ambiguous: e0 && e0.amb, reopen: e0 && e0.reopen, phone: e0 && e0.phone, name: e0 && e0.name }); } catch (err) { errors.push({ stage: 'plan', type: 'PLAN_ERROR', msg: maskErr(err.message) }); return; }
  proposals.push({ L, r, hashes: e0 ? e0.hashes : [] });
});
Object.keys(newLeads).forEach((k) => { const nl = newLeads[k]; const base = { _page: '', _created: NOW, 'Lead Status': '', 'Consent Status': 'NONE', 'Source': 'WHATSAPP', 'Phone': nl.phone, 'Name': nl.name || '', 'Job ID': nl.job, 'Last Intent': '', 'Last Inbound': '', 'PII Purged': false, 'Lead ID': '', 'Lead Key': '', 'Phone Hash': '', 'Human Action': '', 'Applicant JLPT': '', 'JFT-Basic': '', 'Skill Test Passed': '', 'Tech Intern Completed': '', 'Has License': '', 'Experience Years': null, 'Age': null };
  FACT_KEYS.forEach((f) => { if (base[f] === undefined) base[f] = ''; }); Object.keys(FT).forEach((f) => { if (base[f] === undefined) base[f] = FT[f] === 'number' ? null : FT[f] === 'checkbox' ? false : ''; });
  let r; try { r = runLead(base, nl.ev, jobOf(nl.job), { phone: nl.phone, name: nl.name }); } catch (err) { errors.push({ stage: 'plan', type: 'PLAN_ERROR', msg: maskErr(err.message) }); return; }
  // new lead: duplicate key against existing pages is impossible here (byKey lookup missed), but another new lead in this batch cannot share the key
  proposals.push({ L: base, r, hashes: nl.ev.map((x) => x.hash), isNew: true });
});
// ---- emit
let writes = 0; const maxW = Number(cfg.max_writes_per_run || 40);
proposals.forEach((p) => {
  const { L, r } = p; const S = r.S;
  const stepRows = r.steps.map((s) => ({ event: 'TRANSITION', from: s.from, to: s.to, reason: s.reason }));
  const rows = stepRows.concat(r.logs.map((l) => ({ event: l.event, from: L['Lead Status'], to: S['Lead Status'], reason: l.reason })));
  if (p.isNew) rows.unshift({ event: 'CREATE', from: '', to: S['Lead Status'], reason: S['Job ID'] ? 'NEW_FROM_WHATSAPP' : 'NO_JOB_REF' });
  const hasDiff = Object.keys(r.diff).length > 0;
  const base = { _kind: 'lead', lead_id: S['Lead ID'], lead_key: S['Lead Key'], job_id: S['Job ID'], from_status: L['Lead Status'], to_status: S['Lead Status'], consent_status: S['Consent Status'], intent: S['Last Intent'], eligibility: S['Eligibility Result'], draft_kind: S['Draft Kind'], reason: S['Status Reason'], log_rows: rows, msg_hashes: p.hashes, purged: r.purgedNow };
  if (r.steps.length) counts.transitions += r.steps.length; if (S['Lead Status'] === 'MANUAL_REVIEW' && L['Lead Status'] !== 'MANUAL_REVIEW') counts.manual_review++; if (S['Lead Status'] === 'WITHDRAWN' && L['Lead Status'] !== 'WITHDRAWN') counts.withdrawn++; if (r.purgedNow) counts.purged++; if (r.logs.some((l) => l.event === 'DRAFT')) counts.drafts++;
  if (!hasDiff && !p.isNew) { counts.noop++; outItems.push({ json: Object.assign(base, { action: 'NOOP', page_id: L._page, commit_ok: true }) }); return; }
  if (writes >= maxW) { outItems.push({ json: Object.assign(base, { action: 'DEFERRED', page_id: L._page, msg_hashes: [], commit_ok: false, reason: 'WRITE_CAP' }) }); return; }
  writes++;
  if (p.isNew) { counts.created++; const props = {}; const sent = {}; const all = {}; Object.keys(FT).forEach((k) => { const v = S[k]; if (v === '' || v === null || v === undefined || v === false) return; if (!ALLOWED.has(k)) throw new Error('WRITE_NOT_ALLOWED:' + k); all[k] = v; }); all['Last Run'] = cfg.run_id; Object.keys(all).forEach((k) => { props[k] = ser(FT[k], all[k]); sent[k] = { t: FT[k], v: all[k] === null ? '' : all[k] }; }); outItems.push({ json: Object.assign(base, { action: 'CREATE', page_id: '', notion_props: props, sent }) }); }
  else { const props = {}; Object.keys(r.diff).forEach((k) => { props[k] = ser(FT[k], r.diff[k]); }); outItems.push({ json: Object.assign(base, { action: 'PATCH', page_id: L._page, notion_props: props, sent: r.sent }) }); }
});
noops.forEach((n) => { outItems.push({ json: { _kind: 'lead', action: 'NOOP', page_id: '', lead_id: '', lead_key: n.key || '', job_id: '', from_status: '', to_status: '', consent_status: '', intent: '', eligibility: '', draft_kind: '', reason: n.reason, log_rows: [{ event: 'MESSAGE_IGNORED', from: '', to: '', reason: n.reason }], msg_hashes: n.reason === 'PHONE_INVALID' ? [n.hash] : [n.hash], commit_ok: true } }); });
if (truncated) errors.push({ stage: 'query_leads', type: 'LEADS_TRUNCATED', msg: 'more than one page of leads; paging not implemented in V1.0' });
outItems.push({ json: { _kind: 'meta', action: 'NONE', queue_status: 'OK', inbox_status: metaIn.inbox_status || '', messages_seen: metaIn.messages_seen || 0, messages_new: metaIn.messages_new || 0, errors: errors.concat(metaIn.errors || []), counts } });
return outItems;
