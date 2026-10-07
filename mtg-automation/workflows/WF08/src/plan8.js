// Plan Distribution (WF08): the Final Publish Gate. Rebuilds the CURRENT fact hash + visual data + Image Build Hash (same logic as WF05/06/07, parity tested), checks every gate, the per-record Legal Review (hash-bound), the idempotency ledger (Notion + queue table) and the retry rules, and emits ONE item per (job, platform).
const cfg = $('Config').first().json;
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const pv = (p) => { if (!p) return ''; switch (p.type) { case 'title': return plain(p.title); case 'rich_text': return plain(p.rich_text); case 'number': return p.number === null ? null : p.number; case 'select': return p.select ? p.select.name : ''; case 'url': return p.url || ''; case 'checkbox': return !!p.checkbox; case 'date': return p.date ? p.date.start : ''; case 'unique_id': return p.unique_id ? (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number : ''; default: return ''; } };
const SECTOR_ID = { '介護': 'Perawatan lansia (Kaigo)', '外食': 'Restoran / jasa makanan (外食業)', '食品製造': 'Manufaktur makanan & minuman', '製造': 'Manufaktur industri', '建設': 'Konstruksi', '農業': 'Pertanian', '宿泊': 'Perhotelan', 'ビルクリーニング': 'Kebersihan gedung', '造船・舶用工業': 'Galangan kapal & industri maritim', '自動車整備': 'Perawatan & perbaikan mobil', '航空': 'Penerbangan', 'その他': '' };
const unk = (v) => v === null || v === undefined || v === '' || v === 'Unknown';
const fnv = (s) => { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = (Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13)) >>> 0; } return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'); };
const cands = $('Query Candidates').all().map((i) => i.json); const state = $input.all().map((i) => i.json).filter((r) => r && r.distribution_hash);
const stateByHash = {}; state.forEach((r) => { stateByHash[r.distribution_hash] = r; });
const maxAttempts = Number(cfg.max_attempts) || 3; const retryHours = Number(cfg.retry_after_hours) || 6;
const live = String(cfg.publish_mode) === 'LIVE';
const wantP = String(cfg.platforms_enabled || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const configured = { instagram: !!String(cfg.ig_account_id || '').trim(), tiktok: !!String(cfg.tiktok_account_id || '').trim(), whatsapp: !!String(cfg.whatsapp_endpoint || '').trim() && !!String(cfg.whatsapp_channel_id || '').trim() };
const active = wantP.filter((p) => configured[p] === true);
const items = []; const errors = []; const currentPages = []; const seen = {};
cands.forEach((r, idx) => {
  if (!r || r.error || r.object === 'error' || !Array.isArray(r.results)) { errors.push({ stage: 'queue_candidates', type: 'notion_error', msg: String((r && ((r.error && r.error.message) || r.message)) || 'bad response').slice(0, 200) }); return; }
  r.results.forEach((pg) => {
    if (seen[pg.id]) return; seen[pg.id] = true;
    const P = pg.properties || {};
    const g = (k) => pv(P[k]);
    const cstatus = g('Content Status'); const life = g('Lifecycle Status'); const qc = g('QC Decision'); const rec = g('Recruitability');
    const istat = g('Image Status'); const tierRaw = g('Priority Tier');
    const base = { _kind: 'job', page_id: pg.id, page_url: pg.url, mtg_job_id: g('Job ID'), job_number: String(g('Job Number') || '').trim(), content_status: cstatus, cur_hash: g('Content Hash'), content_qc: g('Content QC Decision'), img_status: istat, img_url: g('Image URL'), prev_build_hash: g('Image Build Hash'), prev_attempt: Number(g('Image Attempt')) || 0, tier: /^[SABC]-TIER$/.test(tierRaw) ? tierRaw : 'C-TIER', facts: {}, fact_hash: '', build_hash: '', visual: null, gate_ok: false, gate_reason: '', errors: [] };
    let gate = '';
    if (life !== 'ACTIVE' || qc !== 'APPROVED') gate = 'lifecycle/QC gate (' + life + '/' + qc + ')';
    else if (rec !== 'Overseas Confirmed') gate = 'recruitability is ' + (rec || 'empty');
    else if (!g('Canonical Key') || g('Canonical Of')) gate = 'not a canonical master record';
    const F = {};
    const put = (k, v) => { if (!unk(v)) F[k] = v; };
    put('job_number', base.job_number); put('company', g('Canonical Company') || g('Company')); put('title_jp', g('Job Title')); put('position_jp', g('Position'));
    const sector = g('Field'); put('sector_jp', sector); put('sector_id', SECTOR_ID[sector] || '');
    put('prefecture', g('Prefecture')); put('location', g('Canonical Location') || [g('Prefecture'), g('City')].filter(Boolean).join(' '));
    put('salary_monthly_yen', g('Canonical Monthly Salary')); put('salary_min_yen', g('Monthly Salary Min')); put('salary_max_yen', g('Monthly Salary Max')); put('salary_basis', g('Salary Basis') === 'UNKNOWN' ? '' : g('Salary Basis')); put('hourly_yen', g('Effective Hourly Wage'));
    const ah = String(g('Annual Holidays') || '').replace(/[^0-9]/g, ''); put('annual_holidays', ah ? Number(ah) : '');
    const wh = String(g('Working Hours') || '').trim(); if (wh && wh.length <= 60) put('working_hours_text', wh);
    put('overtime_hours_avg', g('Overtime Hours Avg'));
    put('dormitory', g('Dormitory Available')); put('jlpt', g('JLPT Required')); put('license', g('License Required')); put('license_type', g('License Type')); put('experience', g('Experience Required')); put('experience_years_min', g('Experience Years Min'));
    put('expiry', g('Expiry Date')); put('source_url', g('Source URL'));
    const need = ['company', 'title_jp', 'prefecture', 'salary_monthly_yen', 'job_number'];
    const miss = need.filter((k) => !F[k] && !(k === 'title_jp' && F.position_jp));
    if (!gate && miss.length) gate = 'insufficient facts: ' + miss.join(',');
    base.facts = F; base.gate_reason = gate; base.gate_ok = !gate;
    if (!gate) {
      const factHash = fnv(JSON.stringify(Object.keys(F).sort().map((k) => [k, F[k]])) + '|' + (cfg.template_version || 'v1'));
      base.fact_hash = factHash;
      if (cstatus !== 'Approved') gate = 'content status is ' + (cstatus || 'empty');
      else if (base.content_qc !== 'APPROVED') gate = 'Content QC Decision is ' + (base.content_qc || 'empty');
      else if (base.cur_hash !== factHash) gate = 'Content Hash is stale vs current facts';
      base.gate_reason = gate; base.gate_ok = !gate;
    }
    if (!gate) {
      // ---- visual fact sheet: EXACTLY the strings that will be drawn (all taken from stored facts)
      const yen = (n) => '¥' + Number(n).toLocaleString('en-US');
      const facts = [];
      if (/^N[1-5]$/.test(F.jlpt || '')) facts.push({ id: 'jlpt', text: 'JLPT ' + F.jlpt }); else if (F.jlpt === 'None') facts.push({ id: 'jlpt', text: 'JLPT tidak dipersyaratkan' });
      if (F.license === 'Yes') facts.push({ id: 'license', text: F.license_type ? 'Lisensi: ' + F.license_type : 'Lisensi diperlukan' }); else if (F.license === 'Preferred') facts.push({ id: 'license', text: (F.license_type ? 'Lisensi: ' + F.license_type : 'Lisensi') + ' (lebih disukai)' });
      if (F.experience === 'No') facts.push({ id: 'experience', text: 'Pengalaman tidak disyaratkan' }); else if (F.experience === 'Yes') facts.push({ id: 'experience', text: F.experience_years_min ? 'Pengalaman min. ' + F.experience_years_min + ' tahun' : 'Pengalaman diperlukan' });
      if (F.dormitory === 'Yes') facts.push({ id: 'dormitory', text: 'Asrama tersedia' });
      if (F.annual_holidays) facts.push({ id: 'holidays', text: 'Libur ' + F.annual_holidays + ' hari/tahun' });
      if (F.overtime_hours_avg !== undefined) facts.push({ id: 'overtime', text: 'Lembur rata-rata ' + F.overtime_hours_avg + ' jam/bulan' });
      const V = { label: 'LOWONGAN TOKUTEI GINOU', sector: F.sector_id || '', title: F.title_jp || F.position_jp, company: F.company, location: F.location || F.prefecture, salary_label: 'Gaji bulanan', salary: yen(F.salary_monthly_yen), salary_note: '(menurut sumber)', facts: facts.slice(0, 4), cta: String(cfg.cta_text || '').trim(), contact: String(cfg.contact_line || '').trim(), source: 'Sumber: HelloWork No. ' + F.job_number + (F.expiry ? ' · Berlaku s/d ' + F.expiry : ''), disclaimer: String(cfg.poster_disclaimer || '').trim() };
      const tplId = 'POSTER_' + base.tier.replace('-', '_');
      const visualHash = fnv(JSON.stringify(V));
      base.mask = [F.job_number, F.expiry].filter(Boolean); base.visual = V; base.template_id = tplId; base.visual_hash = visualHash;
      base.build_hash = fnv([base.fact_hash, base.cur_hash, cfg.image_template_version || 'v1', visualHash, tplId, cfg.poster_size || '1080x1350'].join('|'));
    }

    // ---------------- extra reads for distribution
    const legalStatus = g('Legal Review Status'); const legalHash = g('Legal Reviewed Hash');
    const caps = { instagram: g('Instagram Caption'), tiktok: g('TikTok Caption'), whatsapp: g('WhatsApp Copy') };
    const ledger = g('Distribution Ledger');
    const jobKey = base.mtg_job_id || pg.id;
    Object.assign(base, { legal_status: legalStatus, legal_hash: legalHash, ledger, dist_status: g('Distribution Status'), published_platforms: g('Published Platforms'), dist_notes: g('Distribution Notes'), job_key: jobKey, expiry: F.expiry || '' });
    let jobOutcome = ''; let why = '';
    if (gate) { jobOutcome = /Content Hash is stale/.test(gate) ? 'STALE' : 'NOT_ELIGIBLE'; why = gate; }
    else if (istat !== 'READY') { jobOutcome = 'NOT_ELIGIBLE'; why = 'Image Status is ' + (istat || 'empty'); }
    else if (!/^https:\/\/\S+$/.test(String(base.img_url || ''))) { jobOutcome = 'NOT_ELIGIBLE'; why = 'Image URL missing or not https'; }
    else if (base.prev_build_hash !== base.build_hash) { jobOutcome = 'STALE'; why = 'Image Build Hash is stale vs current facts/content/visual data'; }
    else if (F.expiry && String(F.expiry) < String(cfg.run_date)) { jobOutcome = 'NOT_ELIGIBLE'; why = 'job expired ' + F.expiry; }
    else if (legalStatus !== 'APPROVED') { jobOutcome = 'LEGAL_HOLD'; why = 'Legal Review Status is ' + (legalStatus || 'empty') + ' (per-record approval required)'; }
    else if (legalHash !== base.build_hash) { jobOutcome = 'LEGAL_HOLD'; why = 'Legal approval is not bound to the current Image Build Hash (content/image changed since review)'; }
    const slim = Object.assign({}, base); delete slim.facts; delete slim.visual; delete slim.mask;
    currentPages.push({ page_id: pg.id, build_hash: base.build_hash, content_hash: base.cur_hash, job_key: jobKey, ok: !jobOutcome });
    if (jobOutcome) { items.push({ json: Object.assign(slim, { action: 'JOB', platform: '', outcome: jobOutcome, reason: why, qc_status: jobOutcome === 'STALE' ? 'STALE' : jobOutcome === 'LEGAL_HOLD' ? 'MANUAL_REVIEW' : '' }) }); return; }
    // ---------------- eligible job: one item per active platform
    active.forEach((pf) => {
      const dh = fnv([jobKey, base.cur_hash, base.build_hash, pf].join('|'));
      const rowBase = { distribution_hash: dh, job_id: jobKey, page_id: pg.id, platform: pf, content_hash: base.cur_hash, image_build_hash: base.build_hash };
      const mk = (action, outcome, reason, extra) => items.push({ json: Object.assign({}, slim, rowBase, { action, platform: pf, distribution_hash: dh, outcome, reason, caption: caps[pf] || '' }, extra || {}) });
      const inLedger = String(ledger || '').split('\n').some((l) => l.split('|')[1] === dh);
      const row = stateByHash[dh];
      if ((row && row.status === 'PUBLISHED') || inLedger) { mk('SKIP', 'SKIP_PUBLISHED', 'already published for this exact content/image version', { qc_status: 'PUBLISHED' }); return; }
      if (row && row.status === 'PUBLISHING') { mk('ROW_UPDATE', 'MANUAL_REVIEW', 'AMBIGUOUS_PUBLISH: a previous run started publishing and never recorded the result; check the platform before doing anything (no automatic retry, to avoid a double post)', { row: Object.assign({}, rowBase, { status: 'MANUAL_REVIEW', attempt: Number(row.attempt) || 1, external_post_id: row.external_post_id || '', published_at: '', error_code: 'AMBIGUOUS_PUBLISH', error_message: 'publishing state never resolved', updated_at: cfg.run_started }), qc_status: 'MANUAL_REVIEW' }); return; }
      if (row && row.status === 'MANUAL_REVIEW') { mk('SKIP', 'MANUAL_HOLD', 'platform item is in MANUAL_REVIEW (human decision needed)', { qc_status: 'MANUAL_REVIEW' }); return; }
      let attempt = 1;
      if (row && row.status === 'FAILED') {
        attempt = (Number(row.attempt) || 1) + 1;
        if (attempt > maxAttempts) { mk('ROW_UPDATE', 'MANUAL_REVIEW', 'ATTEMPTS_EXHAUSTED after ' + (attempt - 1) + ' technical attempts', { row: Object.assign({}, rowBase, { status: 'MANUAL_REVIEW', attempt: attempt - 1, external_post_id: '', published_at: '', error_code: row.error_code || 'ATTEMPTS_EXHAUSTED', error_message: 'attempts exhausted: ' + String(row.error_message || '').slice(0, 150), updated_at: cfg.run_started }), qc_status: 'MANUAL_REVIEW' }); return; }
        const last = Date.parse(row.updated_at || row.updatedAt || ''); if (last && (Date.now() - last) < retryHours * 3600000) { mk('SKIP', 'WAIT_RETRY', 'retry backoff (' + retryHours + 'h) not reached', { qc_status: 'FAILED' }); return; }
      }
      mk('PUBLISH', 'PUBLISH', row ? 'retry attempt ' + attempt : 'new publish', { attempt, mode: cfg.publish_mode });
    });
  });
});
// queue rows that can no longer be valid
const validHash = {}; items.forEach((x) => { if (x.json.action === 'PUBLISH' || x.json.action === 'SKIP' || x.json.action === 'ROW_UPDATE') validHash[x.json.distribution_hash] = true; });
const touched = {}; items.forEach((x) => { if (x.json.distribution_hash) touched[x.json.distribution_hash] = true; });
state.forEach((r) => {
  if (touched[r.distribution_hash] || validHash[r.distribution_hash]) return;
  if (r.status === 'FAILED') items.push({ json: { _kind: 'job', action: 'ROW_UPDATE', platform: r.platform, page_id: r.page_id, job_key: r.job_id, mtg_job_id: r.job_id, job_number: '', distribution_hash: r.distribution_hash, cur_hash: r.content_hash, build_hash: r.image_build_hash, outcome: 'STALE', reason: 'pending retry no longer matches current content/image', qc_status: 'STALE', row: { distribution_hash: r.distribution_hash, job_id: r.job_id, page_id: r.page_id, platform: r.platform, content_hash: r.content_hash, image_build_hash: r.image_build_hash, status: 'STALE', attempt: Number(r.attempt) || 1, external_post_id: '', published_at: '', error_code: 'STALE', error_message: 'superseded before retry', updated_at: cfg.run_started }, errors: [] } });
  else if (r.status === 'PUBLISHING') items.push({ json: { _kind: 'job', action: 'ROW_UPDATE', platform: r.platform, page_id: r.page_id, job_key: r.job_id, mtg_job_id: r.job_id, job_number: '', distribution_hash: r.distribution_hash, cur_hash: r.content_hash, build_hash: r.image_build_hash, outcome: 'MANUAL_REVIEW', reason: 'AMBIGUOUS_PUBLISH on a superseded version; check the platform', qc_status: 'MANUAL_REVIEW', row: { distribution_hash: r.distribution_hash, job_id: r.job_id, page_id: r.page_id, platform: r.platform, content_hash: r.content_hash, image_build_hash: r.image_build_hash, status: 'MANUAL_REVIEW', attempt: Number(r.attempt) || 1, external_post_id: r.external_post_id || '', published_at: '', error_code: 'AMBIGUOUS_PUBLISH', error_message: 'publishing state never resolved', updated_at: cfg.run_started }, errors: [] } });
});
if (!items.length) return [{ json: { _kind: 'meta', status: errors.length ? 'QUEUE_ERROR' : 'EMPTY_QUEUE', errors, active_platforms: active.join(',') } }];
// publish cap + dry run
let n = 0; const cap = Number(cfg.max_posts_per_run) || 6;
items.forEach((x) => { const j = x.json; if (j.action !== 'PUBLISH') return; if (!live) { j.action = 'SKIP'; j.outcome = 'DRY_RUN'; j.reason = 'publish_mode is ' + (cfg.publish_mode || 'DRY_RUN') + ': all gates passed, nothing sent'; j.qc_status = ''; return; } n++; if (n > cap) { j.action = 'SKIP'; j.outcome = 'DEFERRED_CAP'; j.reason = 'over max_posts_per_run'; } });
if (errors.length) items[0].json.errors = (items[0].json.errors || []).concat(errors);
items[0].json.active_platforms = active.join(',');
return items;
