// Flatten (WF07): union of (A) Approved content waiting for an image and (B) READY images to re-check. Rebuilds the CURRENT fact sheet + fact hash with the SAME logic as WF05/WF06 (parity tested), re-checks job + content gates, builds the VISUAL fact sheet and the Image Build Hash.
const cfg = $('Config').first().json;
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const pv = (p) => { if (!p) return ''; switch (p.type) { case 'title': return plain(p.title); case 'rich_text': return plain(p.rich_text); case 'number': return p.number === null ? null : p.number; case 'select': return p.select ? p.select.name : ''; case 'url': return p.url || ''; case 'checkbox': return !!p.checkbox; case 'date': return p.date ? p.date.start : ''; case 'unique_id': return p.unique_id ? (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number : ''; default: return ''; } };
const SECTOR_ID = { '介護': 'Perawatan lansia (Kaigo)', '外食': 'Restoran / jasa makanan (外食業)', '食品製造': 'Manufaktur makanan & minuman', '製造': 'Manufaktur industri', '建設': 'Konstruksi', '農業': 'Pertanian', '宿泊': 'Perhotelan', 'ビルクリーニング': 'Kebersihan gedung', '造船・舶用工業': 'Galangan kapal & industri maritim', '自動車整備': 'Perawatan & perbaikan mobil', '航空': 'Penerbangan', 'その他': '' };
const unk = (v) => v === null || v === undefined || v === '' || v === 'Unknown';
const fnv = (s) => { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = (Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13)) >>> 0; } return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'); };
const allowedTiers = String(cfg.allowed_tiers || 'S-TIER,A-TIER,B-TIER,C-TIER').split(',').map((s) => s.trim());
const seen = {}; const items = []; const errors = [];
const rt = (p) => plain(p && p.rich_text);
$input.all().map((i) => i.json).forEach((r, idx) => {
  if (!r || r.error || r.object === 'error' || !Array.isArray(r.results)) { errors.push({ stage: 'queue_' + (idx === 0 ? 'generate' : 'ready'), type: 'notion_error', msg: String((r && ((r.error && r.error.message) || r.message)) || 'bad response').slice(0, 200) }); return; }
  r.results.forEach((pg) => {
    if (seen[pg.id]) return; seen[pg.id] = true;
    const P = pg.properties || {};
    const g = (k) => pv(P[k]);
    const cstatus = g('Content Status'); const life = g('Lifecycle Status'); const qc = g('QC Decision'); const rec = g('Recruitability');
    const istat = g('Image Status'); const tierRaw = g('Priority Tier');
    const base = { _kind: 'job', page_id: pg.id, page_url: pg.url, mtg_job_id: g('Job ID'), job_number: String(g('Job Number') || '').trim(), content_status: cstatus, cur_hash: g('Content Hash'), content_qc: g('Content QC Decision'), img_status: istat, img_url: g('Image URL'), prev_build_hash: g('Image Build Hash'), prev_attempt: Number(g('Image Attempt')) || 0, tier: /^[SABC]-TIER$/.test(tierRaw) ? tierRaw : 'C-TIER', facts: {}, fact_hash: '', build_hash: '', visual: null, gate_ok: false, gate_reason: '', errors: [] };
    const fin = (action, why) => items.push({ json: Object.assign(base, { action, reason: why }) });
    const GEN = ['', 'Not Started', 'NOT_STARTED', 'REGENERATE', 'STALE', 'FAILED'];
    const isReady = istat === 'READY';
    if (!isReady && !(cstatus === 'Approved' && GEN.indexOf(istat) >= 0)) return;
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
    const same = base.prev_build_hash && base.prev_build_hash === base.build_hash;
    if (isReady) {
      if (gate) return fin('STALE_MARK', gate);
      if (!same) return fin('STALE_MARK', 'Image Build Hash no longer matches (facts, content, visual data or template changed)');
      return fin('SKIP_UNCHANGED', 'image build hash unchanged');
    }
    if (gate) return fin('NOT_ELIGIBLE', gate);
    base.attempt_prev = same ? base.prev_attempt : 0;
    return fin('GENERATE', istat === 'REGENERATE' ? 'regenerate after QC' : istat === 'FAILED' ? 'retry after failed render' : istat === 'STALE' ? 'rebuild stale image' : 'new image');
  });
});
if (!items.length) return [{ json: { _kind: 'meta', status: errors.length ? 'QUEUE_ERROR' : 'EMPTY_QUEUE', errors } }];
const order = { GENERATE: 0, STALE_MARK: 1, SKIP_UNCHANGED: 2, NOT_ELIGIBLE: 3 };
items.sort((a, b) => order[a.json.action] - order[b.json.action]);
let n = 0; const cap = Number(cfg.max_per_run) || 10;
const out = items.filter((x) => { if (x.json.action !== 'GENERATE') return true; n++; if (n > cap) { x.json.action = 'DEFERRED_CAP'; x.json.reason = 'over max_per_run'; } return true; });
if (errors.length) out[0].json.errors = (out[0].json.errors || []).concat(errors);
return out;
