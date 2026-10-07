// Fact QC (WF06): DETERMINISTIC checks of the STORED copy against the CURRENT fact sheet. Severity: REJECT = wrong/unsupported fact, MANUAL = high-risk or ambiguous, REVISION = minor wording/structure, INFO = recorded only. AI never overrides this.
const cfg = $('Config').first().json;
const N = (s) => String(s || '').normalize('NFKC');
const NS = (s) => N(s).replace(/[\s　]+/g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PREF = { '北海道': 'Hokkaido', '青森': 'Aomori', '岩手': 'Iwate', '宮城': 'Miyagi', '秋田': 'Akita', '山形': 'Yamagata', '福島': 'Fukushima', '茨城': 'Ibaraki', '栃木': 'Tochigi', '群馬': 'Gunma', '埼玉': 'Saitama', '千葉': 'Chiba', '東京': 'Tokyo', '神奈川': 'Kanagawa', '新潟': 'Niigata', '富山': 'Toyama', '石川': 'Ishikawa', '福井': 'Fukui', '山梨': 'Yamanashi', '長野': 'Nagano', '岐阜': 'Gifu', '静岡': 'Shizuoka', '愛知': 'Aichi', '三重': 'Mie', '滋賀': 'Shiga', '京都': 'Kyoto', '大阪': 'Osaka', '兵庫': 'Hyogo', '奈良': 'Nara', '和歌山': 'Wakayama', '鳥取': 'Tottori', '島根': 'Shimane', '岡山': 'Okayama', '広島': 'Hiroshima', '山口': 'Yamaguchi', '徳島': 'Tokushima', '香川': 'Kagawa', '愛媛': 'Ehime', '高知': 'Kochi', '福岡': 'Fukuoka', '佐賀': 'Saga', '長崎': 'Nagasaki', '熊本': 'Kumamoto', '大分': 'Oita', '宮崎': 'Miyazaki', '鹿児島': 'Kagoshima', '沖縄': 'Okinawa' };
const banned = String(cfg.banned_phrases || '').split('|').map((s) => s.trim()).filter(Boolean);
const regul = String(cfg.regulatory_phrases || '').split('|').map((s) => s.trim()).filter(Boolean);
const maxAttempts = Number(cfg.max_attempts) || 3;
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  if (j._kind !== 'job' || !j.gate_ok || (j.action !== 'QC' && j.action !== 'RECHECK')) { out.push({ json: Object.assign({}, j, { det: { result: 'NA', findings: [] }, needs_ai: 'false' }) }); continue; }
  const F = j.facts; const C = j.copy; const findings = [];
  const add = (sev, code, msg) => findings.push({ sev, code, msg: String(msg || '').slice(0, 160) });
  const stale = j.cur_hash !== j.fact_hash;
  if (stale) { add('STALE', 'STALE_CONTENT', 'Content Hash ' + j.cur_hash + ' != current fact hash ' + j.fact_hash); out.push({ json: Object.assign({}, j, { det: { result: 'STALE', findings }, needs_ai: 'false' }) }); continue; }
  const chans = { poster: C.poster, wa: C.wa, ig: C.ig, tt: C.tt };
  Object.keys(chans).forEach((k) => { if (!String(chans[k] || '').trim()) add('REVISION', 'EMPTY_CHANNEL', k + ' is empty'); else if (String(chans[k]).length >= 1890) add('REVISION', 'POSSIBLY_TRUNCATED', k + ' length ' + String(chans[k]).length); });
  const full = N([C.poster, C.wa, C.ig, C.tt].join('\n'));
  // mask footer-style identifiers so they are not read as amounts/numbers
  let masked = full; [F.job_number, F.expiry, F.source_url].filter(Boolean).forEach((m) => { masked = masked.split(N(m)).join(' '); });
  // company
  const coNS = NS(F.company);
  if (!NS(C.poster).includes(coNS) || !NS(C.wa).includes(coNS)) {
    add('REVISION', 'COMPANY_MISSING', 'company name not in poster/whatsapp');
  }
  const orgRe = /(株式会社|有限会社|合同会社|社会福祉法人|医療法人|一般社団法人|一般財団法人)[^\s、。,，\n:：()（）]{1,20}|[^\s、。,，\n:：()（）]{1,20}(株式会社|有限会社|合同会社)/g;
  for (const m of full.matchAll(orgRe)) { const t = NS(m[0]); if (!coNS.includes(t) && !t.includes(coNS)) { add('REJECT', 'COMPANY_MISMATCH', 'other organisation name: ' + m[0]); break; } }
  // job number / ids
  for (const m of masked.matchAll(/(?:^|[^0-9])([0-9]{5}-[0-9]{1,})(?![0-9])/g)) add('REJECT', 'JOB_NUMBER_MISMATCH', 'unknown job number ' + m[1]);
  if (!NS(C.poster).includes(NS(F.job_number)) || !NS(C.wa).includes(NS(F.job_number))) add('REVISION', 'JOB_NUMBER_MISSING', 'job number not in poster/whatsapp footer');
  // URL
  for (const m of full.matchAll(/(?:https?:\/\/|www\.)[^\s<>"')]+/gi)) { const u = m[0].replace(/[.,;:!?]+$/, ''); if (!F.source_url || u !== N(F.source_url)) add('REJECT', 'URL_MISMATCH', 'url not equal to Source URL: ' + u.slice(0, 80)); }
  // money
  const okAmt = {}; ['salary_monthly_yen', 'salary_min_yen', 'salary_max_yen', 'hourly_yen'].forEach((k) => { if (F[k] !== undefined) okAmt[String(Number(F[k]))] = true; });
  let monthlySeen = false;
  for (const m of masked.matchAll(/[¥￥]\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:円|yen|JPY)/gi)) { const d = String(Number((m[1] || m[2]).replace(/[.,]/g, ''))); if (!okAmt[d]) add('REJECT', 'AMOUNT_MISMATCH', 'amount ' + d + ' not in facts'); if (d === String(Number(F.salary_monthly_yen))) monthlySeen = true; }
  if (/[0-9]\s*(ribu|rb|juta|jt|万)/i.test(masked)) add('REVISION', 'ABBREVIATED_AMOUNT', 'amount written in abbreviated form');
  if (!monthlySeen) add('REVISION', 'SALARY_MISSING', 'monthly salary amount not shown');
  // numbers: every number with a unit, and any 5+ digit number, must exist in facts
  const allowed = {}; Object.keys(F).forEach((k) => { if (k === 'source_url') return; String(F[k]).normalize('NFKC').replace(/[,]/g, '').replace(/[^0-9]+/g, ' ').trim().split(' ').forEach((x) => { if (x) { allowed[x] = true; allowed[String(Number(x))] = true; } }); });
  for (const m of masked.matchAll(/([0-9][0-9.,]*)\s*(jam|hari|tahun|thn|menit|orang|kali|%|persen|bulan|hari libur|tahun pengalaman)/gi)) { const d = m[1].replace(/[.,]/g, ''); if (!allowed[d] && !allowed[String(Number(d))]) add('REJECT', 'NUMBER_MISMATCH', 'number ' + m[1] + ' ' + m[2] + ' not in facts'); }
  for (const m of masked.matchAll(/[0-9][0-9.,]{4,}/g)) { const d = m[0].replace(/[.,]/g, ''); if (!okAmt[String(Number(d))] && !allowed[d] && !allowed[String(Number(d))]) add('REJECT', 'NUMBER_MISMATCH', 'long number ' + m[0] + ' not in facts'); }
  // JLPT
  const nl = {}; for (const m of full.matchAll(/(?:^|[^A-Za-z])N\s*([1-5])(?![0-9A-Za-z])/g)) nl['N' + m[1]] = true;
  Object.keys(nl).forEach((l) => { if (F.jlpt !== l) add('REJECT', 'JLPT_MISMATCH', l + ' mentioned but fact is ' + (F.jlpt || 'unknown')); });
  if (/(tidak perlu|tanpa|tak perlu|tidak dipersyaratkan)\s*(bahasa jepang|jlpt)|jlpt tidak (diperlukan|disyaratkan|wajib)/i.test(full) && F.jlpt !== 'None') add('REJECT', 'JLPT_MISMATCH', 'no-language claim without fact');
  // license
  const licRe = /(\bSIM\b|izin mengemudi|lisensi|sertifikat|license|licence|免許|資格)/i;
  if (licRe.test(full) && !F.license) add('REJECT', 'LICENSE_UNSUPPORTED', 'license/certificate mentioned but not in facts');
  if (F.license === 'Preferred' && /(lisensi|sertifikat|SIM)[^\n]{0,60}wajib(?!\s*tidak)/i.test(full)) add('REJECT', 'LICENSE_MISMATCH', 'says mandatory but fact is preferred');
  if (F.license === 'Yes' && /(lisensi|sertifikat|SIM)[^\n]{0,60}(tidak diwajibkan|lebih disukai|opsional)/i.test(full)) add('REJECT', 'LICENSE_MISMATCH', 'says optional but fact is required');
  if (F.license === 'No' && /(lisensi|sertifikat|SIM)[^\n]{0,60}\bwajib\b(?!\s*tidak)/i.test(full) && !/tidak (di)?wajib/i.test(full)) add('REJECT', 'LICENSE_MISMATCH', 'says mandatory but fact is no');
  // experience
  if (/(tanpa pengalaman|pemula|belum berpengalaman|fresh graduate|pengalaman tidak disyaratkan|tidak perlu pengalaman|tidak memerlukan pengalaman)/i.test(full) && F.experience !== 'No') add('REJECT', 'EXPERIENCE_MISMATCH', 'no-experience claim without fact');
  if (F.experience === 'Yes' && /(tanpa pengalaman|tidak perlu pengalaman|pengalaman tidak disyaratkan)/i.test(full)) add('REJECT', 'EXPERIENCE_MISMATCH', 'no-experience claim but experience is required');
  // housing
  if (/(asrama|dormitori|tempat tinggal|mess\b|apartemen|akomodasi)/i.test(full) && F.dormitory !== 'Yes') add('REJECT', 'HOUSING_UNSUPPORTED', 'housing claim without fact');
  // location
  Object.keys(PREF).forEach((jp) => { if (String(F.prefecture || '').indexOf(jp) >= 0) return; if (full.indexOf(jp) >= 0 || new RegExp('\\b' + PREF[jp] + '\\b', 'i').test(full)) add('REJECT', 'LOCATION_MISMATCH', 'other prefecture mentioned: ' + PREF[jp]); });
  const title = F.title_jp || F.position_jp || '';
  if (!NS(full).includes(NS(F.prefecture)) && !(F.location && NS(full).includes(NS(F.location)))) add('INFO', 'LOCATION_NOT_SHOWN', 'prefecture not shown in Japanese; Indonesian spelling not checked');
  if (title && !NS(full).includes(NS(title)) && !(F.position_jp && NS(full).includes(NS(F.position_jp)))) add('INFO', 'POSITION_NOT_SHOWN', 'job title (JP) not shown as written');
  // new Japanese terms not found in facts (possible invented fact / different position)
  const factText = NS(Object.keys(F).map((k) => String(F[k])).join(' '));
  const ALLOW = ['株式会社', '特定技能', '外食業', 'ハローワーク', '求人'];
  const seenT = {};
  for (const m of full.matchAll(/[\u3040-\u30ff\u3400-\u9fff々ー]{3,}/g)) { const t = NS(m[0]); if (seenT[t] || ALLOW.some((a) => t === a) || factText.includes(t)) continue; seenT[t] = true; if (/(員|士|師|職|工|者|オペレーター|スタッフ|ヘルパー|作業|担当|マネージャー|リーダー)/.test(t)) add('REJECT', 'POSITION_MISMATCH', 'job-title-like term not in facts: ' + m[0]); else add('REVISION', 'NEW_JP_TERM', 'Japanese term not in facts: ' + m[0]); }
  // wording / compliance (the fixed disclaimer / brand footer text is excluded from phrase checks)
  let body = full; [cfg.disclaimer, cfg.brand_footer].filter(Boolean).forEach((m) => { body = body.split(N(m)).join(' '); });
  const wre = (b) => new RegExp('(?<![A-Za-z0-9])' + esc(N(b)) + '(?![A-Za-z0-9])', 'i');
  banned.forEach((b) => { if (wre(b).test(body)) add('REVISION', 'BANNED_PHRASE', b); });
  regul.forEach((b) => { if (wre(b).test(body)) add('MANUAL', 'REGULATORY_CLAIM', 'licensing/official-status wording: ' + b); });
  if (/\b(WNI|orang Indonesia|pekerja Indonesia|khusus Indonesia|pelamar Indonesia|warga Indonesia)\b/i.test(full)) add('MANUAL', 'INDONESIA_SPECIFIC_CLAIM', 'copy claims the job is open to Indonesians; stored evidence only says Overseas Confirmed');
  if (/(menerima|terbuka untuk|dibuka untuk|khusus)\s*(WNA|pekerja asing|tenaga kerja asing|warga asing|orang asing|pelamar (?:dari )?luar negeri)/i.test(full) && j.recruitability && j.recruitability !== 'Overseas Confirmed') add('REJECT', 'OVERSEAS_CLAIM_NO_EVIDENCE', 'overseas claim without Overseas Confirmed');
  const dis = NS(cfg.disclaimer || '');
  if (dis && (!NS(C.poster).includes(dis) || !NS(C.ig).includes(dis) || !NS(C.wa).includes(dis))) add('REVISION', 'DISCLAIMER_MISSING', 'disclaimer missing in poster/whatsapp/instagram');
  const hard = findings.filter((f) => f.sev === 'REJECT').length; const man = findings.filter((f) => f.sev === 'MANUAL').length; const rev = findings.filter((f) => f.sev === 'REVISION').length;
  const result = hard ? 'FAIL_REJECT' : man ? 'FAIL_MANUAL' : rev ? 'FAIL_REVISION' : 'PASS';
  const needsAi = (j.action === 'QC' && result === 'PASS' && String(cfg.use_ai) !== 'false') ? 'true' : 'false';
  out.push({ json: Object.assign({}, j, { det: { result, findings }, needs_ai: needsAi }) });
}
return out;
