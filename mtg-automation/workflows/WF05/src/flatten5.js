// Flatten (WF05): union of Query New + Query Drafts -> one item per job with a FACT SHEET built only from stored Master-DB fields. Gates: ACTIVE + QC APPROVED + Overseas Confirmed + canonical (Canonical Key set, not a duplicate). Unknown / empty fields are dropped from the fact sheet (never turned into "No").
const cfg = $('Config').first().json;
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const pv = (p) => { if (!p) return ''; switch (p.type) { case 'title': return plain(p.title); case 'rich_text': return plain(p.rich_text); case 'number': return p.number === null ? null : p.number; case 'select': return p.select ? p.select.name : ''; case 'url': return p.url || ''; case 'checkbox': return !!p.checkbox; case 'date': return p.date ? p.date.start : ''; case 'unique_id': return p.unique_id ? (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number : ''; default: return ''; } };
const SECTOR_ID = { '介護': 'Perawatan lansia (Kaigo)', '外食': 'Restoran / jasa makanan (外食業)', '食品製造': 'Manufaktur makanan & minuman', '製造': 'Manufaktur industri', '建設': 'Konstruksi', '農業': 'Pertanian', '宿泊': 'Perhotelan', 'ビルクリーニング': 'Kebersihan gedung', '造船・舶用工業': 'Galangan kapal & industri maritim', '自動車整備': 'Perawatan & perbaikan mobil', '航空': 'Penerbangan', 'その他': '' };
const unk = (v) => v === null || v === undefined || v === '' || v === 'Unknown';
const fnv = (s) => { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = (Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13)) >>> 0; } return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'); };
const allowedTiers = String(cfg.allowed_tiers || 'S-TIER,A-TIER,B-TIER,C-TIER').split(',').map((s) => s.trim());
const seen = {}; const items = []; const errors = [];
$input.all().map((i) => i.json).forEach((r, idx) => {
  if (!r || r.error || r.object === 'error' || !Array.isArray(r.results)) { errors.push({ stage: 'queue_' + (idx === 0 ? 'new' : 'drafts'), type: 'notion_error', msg: String((r && ((r.error && r.error.message) || r.message)) || 'bad response').slice(0, 200) }); return; }
  r.results.forEach((pg) => {
    if (seen[pg.id]) return; seen[pg.id] = true;
    const P = pg.properties || {};
    const g = (k) => pv(P[k]);
    const cstatus = g('Content Status'); const life = g('Lifecycle Status'); const qc = g('QC Decision'); const rec = g('Recruitability'); const tier = g('Priority Tier');
    const base = { _kind: 'job', page_id: pg.id, page_url: pg.url, mtg_job_id: g('Job ID'), job_number: String(g('Job Number') || '').trim(), content_status: cstatus, cur_hash: g('Content Hash'), errors: [] };
    const skip = (action, why) => items.push({ json: Object.assign(base, { action, reason: why }) });
    if (life !== 'ACTIVE' || qc !== 'APPROVED') return skip('NOT_ELIGIBLE', 'lifecycle/QC gate');
    if (rec !== 'Overseas Confirmed') return skip('NOT_ELIGIBLE', 'recruitability is not Overseas Confirmed');
    if (!g('Canonical Key') || g('Canonical Of')) return skip('NOT_ELIGIBLE', 'not a canonical master record');
    if (allowedTiers.indexOf(tier) < 0) return skip('NOT_ELIGIBLE', 'tier ' + (tier || 'none') + ' not allowed');
    if (cstatus && cstatus !== 'Not Started' && cstatus !== 'Draft') return skip('NOT_ELIGIBLE', 'content status ' + cstatus + ' is owned by later workflows');
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
    if (miss.length) return skip('INSUFFICIENT_FACTS', 'missing: ' + miss.join(','));
    const hash = fnv(JSON.stringify(Object.keys(F).sort().map((k) => [k, F[k]])) + '|' + (cfg.template_version || 'v1'));
    if (cstatus === 'Draft' && base.cur_hash === hash) return skip('SKIP_UNCHANGED', 'facts unchanged since last draft');
    items.push({ json: Object.assign(base, { action: 'GENERATE', reason: cstatus === 'Draft' ? 'facts changed' : 'new draft', facts: F, hash, needs_ai: String(cfg.use_ai) !== 'false' ? 'true' : 'false' }) });
  });
});
if (!items.length) return [{ json: { _kind: 'meta', status: errors.length ? 'QUEUE_ERROR' : 'EMPTY_QUEUE', errors } }];
const order = { GENERATE: 0, INSUFFICIENT_FACTS: 1, SKIP_UNCHANGED: 2, NOT_ELIGIBLE: 3 };
items.sort((a, b) => order[a.json.action] - order[b.json.action]);
let gen = 0; const cap = Number(cfg.max_per_run) || 15;
const out = items.filter((x) => { if (x.json.action !== 'GENERATE') return true; gen++; return gen <= cap; });
if (errors.length) out[0].json.errors = (out[0].json.errors || []).concat(errors);
return out;
