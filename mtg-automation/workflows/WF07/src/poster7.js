// Build Poster (WF07): deterministic HTML poster from the VISUAL fact sheet (strings taken from stored facts only). Tier templates change visual hierarchy only. Text-fit is computed; a self-check compares every number/name/amount drawn against the facts BEFORE any rendering.
const cfg = $('Config').first().json;
const N = (s) => String(s || '').normalize('NFKC');
const NS = (s) => N(s).replace(/[\s　]+/g, '');
const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const [W, H] = String(cfg.poster_size || '1080x1350').split('x').map(Number);
const banned = String(cfg.banned_phrases || '').split('|').map((s) => s.trim()).filter(Boolean);
const regul = String(cfg.regulatory_phrases || '').split('|').map((s) => s.trim()).filter(Boolean);
const claims = String(cfg.claim_phrases || '').split('|').map((s) => s.trim()).filter(Boolean);
const STYLE = {
  S: { bg: '#0B1F3A', fg: '#FFFFFF', accent: '#FFC21A', accentFg: '#0B1F3A', muted: '#C9D6EA', title: [112, 96, 84, 72, 62, 54], salary: 150 },
  A: { bg: '#12355B', fg: '#FFFFFF', accent: '#FFB703', accentFg: '#12355B', muted: '#CFE0F5', title: [100, 88, 76, 66, 58, 50], salary: 132 },
  B: { bg: '#FFFFFF', fg: '#0F2A43', accent: '#0F5FA8', accentFg: '#FFFFFF', muted: '#40566B', title: [92, 80, 70, 60, 54, 46], salary: 118 },
  C: { bg: '#F2F4F7', fg: '#14212E', accent: '#1F4E79', accentFg: '#FFFFFF', muted: '#3F4D5A', title: [84, 74, 66, 58, 52, 46], salary: 108 }
};
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
// width estimate in em: CJK/fullwidth = 1.0, latin/digits = 0.58
const em = (t) => Array.from(String(t)).reduce((a, ch) => a + (/[　-鿿＀-￯]/.test(ch) ? 1.0 : 0.58), 0);
const lines = (t, size, boxW) => { const per = Math.max(1, Math.floor(boxW / size)); const w = em(t); return Math.max(1, Math.ceil(w / per)); };
const fit = (t, ladder, boxW, boxH, lh) => { for (const s of ladder) { if (lines(t, s, boxW) * s * lh <= boxH) return s; } return 0; };
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  if (j._kind !== 'job' || j.action !== 'GENERATE') { out.push({ json: Object.assign({}, j, { needs_render: 'false' }) }); continue; }
  const V = j.visual; const F = j.facts; const tier = j.tier[0]; const st = STYLE[tier] || STYLE.C;
  const attempt = j.attempt_prev || 0; const variant = ['A', 'B', 'C'][Math.min(attempt, 2)]; const scale = variant === 'A' ? 1 : variant === 'B' ? 0.88 : 0.78;
  const flags = []; const texts = [];
  const T = (id, text) => { if (text) texts.push({ id, text: String(text) }); return text; };
  const PAD = 72; const BW = W - PAD * 2;
  const sc = (n) => Math.round(n * scale);
  const titleSize = fit(V.title, st.title.map(sc), BW, 300, 1.18);
  const compSize = fit(V.company, [44, 40, 36, 32, 28].map(sc), BW, 58, 1.2);
  const locSize = fit(V.location, [54, 48, 42, 36, 32].map(sc), BW, 90, 1.2);
  const factSizes = V.facts.map((f) => fit(f.text, [40, 36, 32, 30, 28].map(sc), 440, 118, 1.2));
  const ctaText = [V.cta, V.contact].filter(Boolean).join(' · ');
  const ctaSize = ctaText ? fit(ctaText, [36, 32, 28, 26].map(sc), BW - 40, 56, 1.15) : 0;
  const secSize = V.sector ? fit(V.sector, [34, 30, 28].map(sc), BW, 50, 1.2) : 28;
  if (!titleSize) flags.push('TEXT_TOO_LONG:title'); if (!compSize) flags.push('TEXT_TOO_LONG:company'); if (!locSize) flags.push('TEXT_TOO_LONG:location');
  factSizes.forEach((s, i) => { if (!s) flags.push('TEXT_TOO_LONG:fact_' + V.facts[i].id); }); if (ctaText && !ctaSize) flags.push('TEXT_TOO_LONG:cta');
  const salSize = sc(st.salary);
  const MINF = 26;
  // ---------- html (absolute boxes, fixed canvas)
  const box = (id, text, x, y, w, h, css) => { T(id, text); return '<div class="b" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + css + '">' + esc(text) + '</div>'; };
  let html = '<div class="p">';
  html += box('label', V.label, PAD, 48, BW, 40, 'font-size:' + sc(30) + 'px;letter-spacing:3px;font-weight:700;color:' + st.accent);
  if (V.sector) html += box('sector', V.sector, PAD, 92, BW, 54, 'font-size:' + secSize + 'px;color:' + st.muted + ';font-weight:500');
  html += box('title', V.title, PAD, 156, BW, 300, 'font-size:' + titleSize + 'px;line-height:1.18;font-weight:900;color:' + st.fg);
  html += box('location', V.location, PAD, 466, BW, 90, 'font-size:' + locSize + 'px;line-height:1.2;font-weight:700;color:' + st.fg);
  html += '<div class="b" style="left:' + PAD + 'px;top:566px;width:' + BW + 'px;height:4px;background:' + st.accent + '"></div>';
  html += box('salary_label', V.salary_label, PAD, 586, BW, 48, 'font-size:' + sc(38) + 'px;font-weight:500;color:' + st.muted);
  html += box('salary', V.salary, PAD, 630, BW, salSize + 20, 'font-size:' + salSize + 'px;line-height:1.05;font-weight:900;color:' + st.accent);
  html += box('salary_note', V.salary_note, PAD, 630 + salSize + 24, BW, 40, 'font-size:' + sc(30) + 'px;color:' + st.muted);
  const gy = 880;
  V.facts.forEach((f, i) => { const col = i % 2; const row = Math.floor(i / 2); const x = PAD + col * 496; const y = gy + row * 138; html += '<div class="b" style="left:' + x + 'px;top:' + y + 'px;width:468px;height:126px;border-left:8px solid ' + st.accent + '"></div>'; html += box('fact_' + f.id, f.text, x + 26, y + 4, 440, 118, 'font-size:' + (factSizes[i] || MINF) + 'px;line-height:1.2;font-weight:700;color:' + st.fg + ';display:flex;align-items:center'); });
  html += box('company', V.company, PAD, 1158, BW, 58, 'font-size:' + compSize + 'px;line-height:1.2;font-weight:700;color:' + st.fg);
  if (ctaText) { html += '<div class="b" style="left:0;top:1222px;width:' + W + 'px;height:58px;background:' + st.accent + '"></div>'; html += box('cta', ctaText, PAD, 1222, BW, 58, 'font-size:' + (ctaSize || MINF) + 'px;line-height:1.15;font-weight:900;color:' + st.accentFg + ';display:flex;align-items:center;justify-content:center;text-align:center'); }
  html += box('source', V.source, PAD, 1286, BW, 34, 'font-size:' + MINF + 'px;line-height:1.15;color:' + st.muted);
  if (V.disclaimer) html += box('disclaimer', V.disclaimer, PAD, 1318, BW, 30, 'font-size:' + (MINF - 2) + 'px;line-height:1.15;color:' + st.muted);
  html += '</div>';
  const css = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{width:" + W + 'px;height:' + H + "px;font-family:'Noto Sans JP','Noto Sans',sans-serif}.p{position:relative;width:" + W + 'px;height:' + H + 'px;background:' + st.bg + ';overflow:hidden}.b{position:absolute;overflow:hidden;overflow-wrap:anywhere}';
  // ---------- spec self-check on what is actually drawn
  const visible = N(html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'));
  texts.forEach((t) => { if (!NS(visible).includes(NS(t.text))) flags.push('SPEC_NOT_RENDERED:' + t.id); });
  const all = texts.map((t) => N(t.text)).join('\n');
  const allowedNum = {}; const addN = (v) => String(v === undefined || v === null ? '' : v).normalize('NFKC').replace(/,/g, '').replace(/[^0-9]+/g, ' ').trim().split(' ').forEach((x) => { if (x) { allowedNum[x] = true; allowedNum[String(Number(x))] = true; } });
  ['salary_monthly_yen', 'jlpt', 'experience_years_min', 'annual_holidays', 'overtime_hours_avg', 'job_number', 'expiry', 'license_type', 'location', 'company', 'title_jp', 'position_jp', 'sector_id'].forEach((k) => addN(F[k]));
  addN(cfg.cta_text); addN(cfg.poster_disclaimer); addN(cfg.contact_line);
  for (const m of all.matchAll(/[0-9][0-9,]*/g)) { const d = m[0].replace(/,/g, ''); if (!allowedNum[d] && !allowedNum[String(Number(d))]) flags.push('SPEC_NUMBER_NOT_IN_FACTS:' + m[0]); }
  for (const m of all.matchAll(/[¥￥]\s*([0-9][0-9,]*)/g)) { if (Number(m[1].replace(/,/g, '')) !== Number(F.salary_monthly_yen)) flags.push('SPEC_AMOUNT_MISMATCH:' + m[1]); }
  const byId = {}; texts.forEach((t) => { byId[t.id] = t.text; });
  if (NS(byId.title) !== NS(F.title_jp || F.position_jp)) flags.push('SPEC_TITLE_MISMATCH'); if (NS(byId.company) !== NS(F.company)) flags.push('SPEC_COMPANY_MISMATCH'); if (NS(byId.location) !== NS(F.location || F.prefecture)) flags.push('SPEC_LOCATION_MISMATCH');
  if (!byId.salary || !byId.title || !byId.location || !byId.company) flags.push('SPEC_REQUIRED_ELEMENT_MISSING');
  const contactOk = (u) => cfg.contact_line && N(cfg.contact_line).indexOf(u) >= 0;
  let scan = all; (j.mask || []).forEach((m) => { scan = scan.split(N(m)).join(' '); });
  for (const m of scan.matchAll(/(?:https?:\/\/|www\.)\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+|\+?[0-9][0-9\-\s()]{7,}[0-9]/g)) { if (m[0].replace(/[^0-9]/g, '').length < 9 && !/[@]|www|http/.test(m[0])) continue; if (!contactOk(m[0])) flags.push('SPEC_CONTACT_NOT_CONFIGURED:' + m[0].slice(0, 30)); }
  const wre = (b) => new RegExp('(?<![A-Za-z0-9])' + rx(N(b)) + '(?![A-Za-z0-9])', 'i');
  banned.forEach((b) => { if (wre(b).test(all)) flags.push('SPEC_BANNED_PHRASE:' + b); }); regul.forEach((b) => { if (wre(b).test(all)) flags.push('SPEC_REGULATORY_CLAIM:' + b); }); claims.forEach((b) => { if (wre(b).test(all)) flags.push('SPEC_UNSUPPORTED_CLAIM:' + b); });
  [[st.fg, st.bg, 'fg/bg'], [st.accent, st.bg, 'accent/bg'], [st.muted, st.bg, 'muted/bg'], [st.accentFg, st.accent, 'cta']].forEach((p) => { if (contrast(p[0], p[1]) < 4.5) flags.push('SPEC_LOW_CONTRAST:' + p[2]); });
  const info = []; if (V.facts.length < 2) info.push('FEW_FACTS:' + V.facts.length);
  const expected = texts.map((t) => ({ id: t.id, text: t.text }));
  out.push({ json: Object.assign({}, j, { needs_render: flags.length ? 'false' : 'true', spec_flags: flags, spec_info: info, layout_variant: variant, expected, render_req: flags.length ? null : { html, css, viewport_width: W, viewport_height: H, device_scale: 1, ms_delay: 800 }, template_label: j.template_id + '/' + (cfg.image_template_version || 'v1') + '/' + variant }) });
}
return out;
