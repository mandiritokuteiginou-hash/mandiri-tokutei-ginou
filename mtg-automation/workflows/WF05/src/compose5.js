// Compose (WF05): validate the AI copy against the FACT SHEET (numbers, names, conditional claims, banned phrases). Any issue -> the whole AI draft is discarded and a deterministic template built from the same facts is used. Footer (source, job number, expiry, disclaimer) is appended by code, never by the model. Builds the Notion PATCH (Content Status = Draft only).
const cfg = $('Config').first().json;
const N = (s) => String(s || '').normalize('NFKC');
const NS = (s) => N(s).replace(/[\s　]+/g, '');
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const yen = (n) => '¥' + Number(n).toLocaleString('en-US');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const banned = String(cfg.banned_phrases || '').split('|').map((s) => s.trim()).filter(Boolean);
const tags = String(cfg.hashtags || '#TokuteiGinou #SSW #KerjaDiJepang #InfoLowongan').trim();
const disclaimer = String(cfg.disclaimer || 'Info dari lowongan publik HelloWork. Bukan jaminan diterima/berangkat. Cek syarat & detail di sumber resmi.');
const brandFooter = String(cfg.brand_footer || '').trim();
const PREF = { '北海道': 'Hokkaido', '青森': 'Aomori', '岩手': 'Iwate', '宮城': 'Miyagi', '秋田': 'Akita', '山形': 'Yamagata', '福島': 'Fukushima', '茨城': 'Ibaraki', '栃木': 'Tochigi', '群馬': 'Gunma', '埼玉': 'Saitama', '千葉': 'Chiba', '東京': 'Tokyo', '神奈川': 'Kanagawa', '新潟': 'Niigata', '富山': 'Toyama', '石川': 'Ishikawa', '福井': 'Fukui', '山梨': 'Yamanashi', '長野': 'Nagano', '岐阜': 'Gifu', '静岡': 'Shizuoka', '愛知': 'Aichi', '三重': 'Mie', '滋賀': 'Shiga', '京都': 'Kyoto', '大阪': 'Osaka', '兵庫': 'Hyogo', '奈良': 'Nara', '和歌山': 'Wakayama', '鳥取': 'Tottori', '島根': 'Shimane', '岡山': 'Okayama', '広島': 'Hiroshima', '山口': 'Yamaguchi', '徳島': 'Tokushima', '香川': 'Kagawa', '愛媛': 'Ehime', '高知': 'Kochi', '福岡': 'Fukuoka', '佐賀': 'Saga', '長崎': 'Nagasaki', '熊本': 'Kumamoto', '大分': 'Oita', '宮崎': 'Miyazaki', '鹿児島': 'Kagoshima', '沖縄': 'Okinawa' };
const out = [];
for (const it of $input.all()) {
  const j = it.json; const F = j.facts || {}; const ai = j.ai || null; const errors = (j.errors || []).slice();
  const title = F.title_jp || F.position_jp || '';
  // ---------- deterministic template (facts only; unknown fields are simply absent)
  const L = [];
  const lines = () => {
    const a = [];
    a.push('Perusahaan: ' + F.company);
    a.push('Posisi: ' + title);
    if (F.sector_id) a.push('Bidang: ' + F.sector_id);
    if (F.location) a.push('Lokasi: ' + F.location);
    a.push('Gaji bulanan (menurut sumber): ' + yen(F.salary_monthly_yen));
    if (F.hourly_yen) a.push('Upah per jam: ' + yen(F.hourly_yen));
    if (F.annual_holidays) a.push('Libur tahunan: ' + F.annual_holidays + ' hari');
    if (F.working_hours_text) a.push('Jam kerja (sumber): ' + F.working_hours_text);
    if (F.overtime_hours_avg !== undefined) a.push('Rata-rata lembur: ' + F.overtime_hours_avg + ' jam/bulan');
    if (F.dormitory === 'Yes') a.push('Asrama/tempat tinggal: tersedia (menurut sumber)');
    if (/^N[1-5]$/.test(F.jlpt || '')) a.push('Bahasa Jepang: JLPT ' + F.jlpt + ' (menurut sumber)'); else if (F.jlpt === 'None') a.push('JLPT: tidak dipersyaratkan (menurut sumber)');
    if (F.license === 'Yes') a.push('Lisensi/sertifikat: ' + (F.license_type || 'diperlukan') + ' (wajib)'); else if (F.license === 'Preferred') a.push('Lisensi/sertifikat: ' + (F.license_type || 'disebutkan') + ' (lebih disukai)'); else if (F.license === 'No') a.push('Lisensi/sertifikat: tidak diwajibkan (menurut sumber)');
    if (F.experience === 'No') a.push('Pengalaman: tidak disyaratkan (menurut sumber)'); else if (F.experience === 'Yes') a.push('Pengalaman: diperlukan' + (F.experience_years_min ? ' minimal ' + F.experience_years_min + ' tahun' : ''));
    return a;
  };
  const tpl = () => { const a = lines(); const pts = [a[0], a[3] ? a.find((x) => /^Lokasi/.test(x)) : '', a.find((x) => /^Gaji/.test(x)), a.find((x) => /^(Bahasa|JLPT)/.test(x)), a.find((x) => /^Pengalaman/.test(x))].filter(Boolean).slice(0, 5);
    return { poster_headline: 'Lowongan Tokutei Ginou' + (F.sector_id ? ' — ' + F.sector_id : ''), poster_points: pts, whatsapp_body: '📢 Info lowongan Tokutei Ginou (SSW)\n' + a.join('\n') + '\nCek persyaratan lengkap di sumber sebelum melamar.', instagram_body: 'Info lowongan Tokutei Ginou' + (F.sector_id ? ' — ' + F.sector_id : '') + '\n\n' + a.join('\n'), tiktok_body: 'Lowongan Tokutei Ginou' + (F.sector_id ? ': ' + F.sector_id : '') + '\n' + (a.find((x) => /^Lokasi/.test(x)) || '') + '\n' + a.find((x) => /^Gaji/.test(x)) }; };
  // ---------- validator
  const allowed = {}; const addNums = (v) => { String(v === undefined || v === null ? '' : v).normalize('NFKC').replace(/[,.]/g, '').replace(/[^0-9]+/g, ' ').trim().split(' ').forEach((x) => { if (x) allowed[String(Number(x))] = true; if (x) allowed[x] = true; }); String(v).normalize('NFKC').replace(/[^0-9]+/g, ' ').trim().split(' ').forEach((x) => { if (x) { allowed[x] = true; allowed[String(Number(x))] = true; } }); };
  Object.keys(F).forEach((k) => { if (k !== 'source_url') addNums(F[k]); });
  const validate = (c) => {
    const issues = [];
    const need = ['poster_headline', 'poster_points', 'whatsapp_body', 'instagram_body', 'tiktok_body'];
    if (!c || need.some((k) => c[k] === undefined || c[k] === null)) return ['missing fields'];
    if (!Array.isArray(c.poster_points) || !c.poster_points.length || c.poster_points.length > 5 || c.poster_points.some((x) => typeof x !== 'string')) issues.push('poster_points shape');
    if ([c.poster_headline, c.whatsapp_body, c.instagram_body, c.tiktok_body].some((x) => typeof x !== 'string' || !x.trim())) return issues.concat(['empty text']);
    const lim = { poster_headline: 80, whatsapp_body: 900, instagram_body: 1100, tiktok_body: 300 }; Object.keys(lim).forEach((k) => { if (c[k].length > lim[k]) issues.push(k + ' too long'); });
    if ((c.poster_points || []).some((x) => x.length > 100)) issues.push('poster point too long');
    const texts = [c.poster_headline].concat(c.poster_points || [], [c.whatsapp_body, c.instagram_body, c.tiktok_body]);
    const all = N(texts.join('\n'));
    banned.forEach((b) => { if (new RegExp(esc(N(b)), 'i').test(all)) issues.push('banned phrase: ' + b); });
    if (/https?:\/\/|www\./i.test(all)) issues.push('url in body');
    for (const m of all.matchAll(/[¥￥]\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:円|yen|JPY)/gi)) { const d = (m[1] || m[2]).replace(/[.,]/g, ''); if (!allowed[d] && !allowed[String(Number(d))]) issues.push('amount not in facts: ' + d); }
    if (/[0-9]\s*(ribu|rb|juta|jt)\b/i.test(all)) issues.push('abbreviated amount');
    for (const m of all.matchAll(/([0-9][0-9.,]*)\s*(jam|hari|tahun|thn|menit|orang|kali|%|persen|bulan)/gi)) { const d = m[1].replace(/[.,]/g, ''); if (!allowed[d]) issues.push('number not in facts: ' + m[1] + ' ' + m[2]); }
    for (const m of all.matchAll(/(?:^|[^A-Za-z])N\s*([1-5])(?![0-9A-Za-z])/g)) { if (!(/^N[1-5]$/.test(F.jlpt || '') && F.jlpt === 'N' + m[1])) issues.push('JLPT N' + m[1] + ' not in facts'); }
    for (const m of all.matchAll(/[0-9]{5,}/g)) { if (!allowed[m[0]] && !allowed[String(Number(m[0]))]) issues.push('long number not in facts: ' + m[0]); }
    if (/(tanpa pengalaman|pemula|belum berpengalaman|fresh graduate)/i.test(all) && F.experience !== 'No') issues.push('experience claim unsupported');
    if (/(asrama|dormitori|tempat tinggal|mess|apartemen)/i.test(all) && F.dormitory !== 'Yes') issues.push('housing claim unsupported');
    if (/(tidak perlu|tanpa)\s*(bahasa jepang|jlpt)|jlpt tidak/i.test(all) && F.jlpt !== 'None') issues.push('language-free claim unsupported');
    if (/(SIM|izin mengemudi|lisensi|sertifikat)/.test(all) && !F.license) issues.push('license claim unsupported');
    Object.keys(PREF).forEach((jp) => { if (String(F.prefecture || '').indexOf(jp) >= 0) return; if (all.indexOf(jp) >= 0 || new RegExp('\\b' + PREF[jp] + '\\b', 'i').test(all)) issues.push('other prefecture mentioned: ' + PREF[jp]); });
    if (!NS(c.whatsapp_body + c.poster_headline + c.poster_points.join('')).includes(NS(F.company))) issues.push('company name missing');
    return issues;
  };
  const foot = 'Sumber: HelloWork No. ' + F.job_number + (F.expiry ? '\nBerlaku s/d: ' + F.expiry : '');
  const footShort = foot + '\n' + disclaimer;
  const footWa = foot + (F.source_url ? '\n' + F.source_url : '') + '\n' + disclaimer + (brandFooter ? '\n' + brandFooter : '');
  let method = 'TEMPLATE'; let copy = tpl(); let issues = [];
  if (ai) { issues = validate(ai); if (!issues.length) { method = 'AI'; copy = ai; } } else if (j.needs_ai === 'true') issues = ['AI unavailable'];
  if (method === 'TEMPLATE' && issues.length) { const ti = validate(copy).filter((x) => !/^banned/.test(x)); if (ti.length) { errors.push({ stage: 'compose', type: 'template_invalid', msg: ti.join('; ').slice(0, 200) }); } }
  const hashtags = tags + (F.sector_id ? ' #' + F.sector_id.replace(/[^A-Za-z]/g, '').slice(0, 20) : '');
  const poster = copy.poster_headline + '\n' + copy.poster_points.map((x) => '• ' + x).join('\n') + '\n' + footShort;
  const channels = { 'Poster Copy': poster, 'WhatsApp Copy': copy.whatsapp_body + '\n\n' + footWa, 'Instagram Caption': copy.instagram_body + '\n\n' + footShort + '\n\n' + hashtags, 'TikTok Caption': copy.tiktok_body + '\n' + hashtags.split(' ').slice(0, 4).join(' ') };
  const P = {}; const sent = {};
  Object.keys(channels).forEach((k) => { const t = clip(channels[k]); P[k] = { rich_text: [{ type: 'text', text: { content: t } }] }; sent[k] = t; });
  P['Content Status'] = { select: { name: 'Draft' } }; sent['Content Status'] = 'Draft';
  P['Content Hash'] = { rich_text: [{ type: 'text', text: { content: j.hash } }] }; sent['Content Hash'] = j.hash;
  P['Content Generated'] = { date: { start: cfg.run_date } }; sent['Content Generated'] = cfg.run_date;
  P['Content Method'] = { select: { name: method } }; sent['Content Method'] = method;
  const notes = clip((method === 'AI' ? 'AI copy passed validation' : 'template used' + (issues.length ? ': ' + issues.slice(0, 6).join(' | ') : '')), 600);
  P['Content Build Notes'] = { rich_text: [{ type: 'text', text: { content: notes } }] }; sent['Content Build Notes'] = notes;
  const base = Object.assign({}, j); delete base.ai; delete base.facts;
  out.push({ json: Object.assign(base, { _kind: 'composed', method, issues, errors, channel_lengths: Object.keys(channels).map((k) => k + ':' + sent[k].length).join(','), needs_write: 'true', notion_patch_body: { properties: P }, notion_sent: sent, outcome: 'DRAFTED' }) });
}
return out;
