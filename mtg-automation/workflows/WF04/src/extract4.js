// Extract (WF04): read the HelloWork page and extract JLPT / license / experience / salary basis DETERMINISTICALLY, each with the verbatim source line as evidence. Anything not explicitly stated stays Unknown (never No).
const cfg = $('Config').first().json;
const N = (s) => String(s || '').normalize('NFKC');
const toText = (h) => N(String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d|table|dt|dd)>/gi, '\n').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n[ \t　]*(?=\n)/g, '').replace(/\n{2,}/g, '\n').trim());
const clip = (s, n) => String(s || '').slice(0, n);
const LABELS = ['年齢', '年齢制限範囲', '学歴', '必要な経験等', '必要な免許・資格', '賃金', '賃金形態', '就業時間', '休憩時間', '年間休日', '求人に関する特記事項', '仕事の内容', '雇用形態', '加入保険等', '通勤手当', '賞与', '昇給', '退職金', '時間外労働時間', '月平均時間外労働時間'];
const OVERSEAS_OK = [/海外(在住)?(の方|者)?(から|在住).{0,8}(応募|可|歓迎|OK)/, /(国外|海外)在住.{0,4}(可|OK|歓迎)/, /来日前.{0,12}(応募|面接|内定|選考)/, /(入国前|渡日前).{0,12}(応募|面接|内定|選考)/, /(海外|来日前).{0,20}オンライン面接|オンライン面接.{0,20}(海外|来日前)/];
const DOMESTIC = [/(海外|国外)在住.{0,4}(不可|不可能|NG)/, /国内(に)?在住(の方|者)?(のみ|限)/, /日本(国)?内に(在住|居住).{0,10}(方|者|必須)/, /在留カード.{0,12}(必須|をお持ちの方のみ)/];
const hit = (arr, t) => { for (const r of arr) { const m = t.match(r); if (m) return m[0].slice(0, 80); } return ''; };
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let job = {};
  try { job = $('Is Candidate?').itemMatching(k).json; } catch (e) { job = {}; }
  const errors = (job.errors || []).slice();
  const err = it.json && it.json.error; const html = (it.json && it.json.data) || '';
  const det = { state: 'OK', jlpt: 'Unknown', jlpt_ev: '', lic: 'Unknown', lic_ev: '', lic_type: '', exp: 'Unknown', exp_min: null, exp_ev: '', basis: '', hourly: null, mmin: null, mmax: null, basis_ev: '', overseas_hit: '', domestic_hit: '', notes: [] };
  let body = '';
  if (err) { det.state = /404|410|not found/i.test(String(err.message || err)) ? 'GONE' : 'UNREACHABLE'; errors.push({ stage: 'source_fetch', type: det.state, msg: String(err.message || err).slice(0, 200) }); }
  else if (typeof html !== 'string' || html.length < 3000) { det.state = 'UNREACHABLE'; errors.push({ stage: 'source_fetch', type: 'UNREACHABLE', msg: 'response too short' }); }
  else {
    const full = toText(html); const start = full.indexOf('の募集内容、仕事概要');
    if (/(掲載を終了|受付を終了|募集を終了|求人は終了|この求人は.{0,6}(終了|締め切)|ページが見つかりません)/.test(full.slice(0, 4000)) && start < 0) det.state = 'CLOSED_ON_SOURCE';
    body = (start >= 0 ? full.slice(start) : full).slice(0, 12000);
    const lines = body.split('\n').map((s) => s.trim()).filter((s) => s.length);
    const idx = (l) => lines.indexOf(l);
    const section = (l, max) => { const i = idx(l); if (i < 0) return []; const res = []; for (let q = i + 1; q < lines.length && res.length < (max || 4); q++) { if (LABELS.indexOf(lines[q]) >= 0) break; res.push(lines[q]); } return res; };
    // ---- JLPT (needs a Japanese-language context in the same line; conflicting levels -> Unknown)
    const levels = {}; let jEv = '';
    lines.forEach((l) => { if (!/日本語|JLPT|語学/.test(l)) return; const m = l.match(/(?:日本語能力試験|JLPT|日本語検定|日本語能力|日本語)[^\n]{0,24}?N\s*([1-5])/i) || l.match(/N\s*([1-5])\s*(以上|程度|レベル|相当|取得|合格|保持)/i); if (m) { levels['N' + m[1]] = levels['N' + m[1]] || clip(l, 120); } });
    const lk = Object.keys(levels);
    if (lk.length === 1) { det.jlpt = lk[0]; det.jlpt_ev = levels[lk[0]]; }
    else if (lk.length > 1) { det.notes.push('jlpt conflict: ' + lk.join('/')); }
    else { const nl = lines.find((l) => /日本語[^\n]{0,12}(不問|不要|問いません|必要ありません)/.test(l)); if (nl) { det.jlpt = 'None'; det.jlpt_ev = clip(nl, 120); } }
    // ---- License
    const ls = section('必要な免許・資格', 4); const lt = ls.join(' ');
    const anyNoLic = lines.find((l) => /(特別な)?(資格|免許)(や[^\n]{0,6})?は?(不要|不問)|(資格|免許)[^\n]{0,8}(不問|不要)/.test(l));
    const typeRe = /(普通自動車(?:第一種)?(?:運転)?免許(?:\([^)]{0,12}\))?|大型自動車(?:運転)?免許|中型自動車(?:運転)?免許|フォークリフト[^\s、。]{0,10}|介護福祉士|介護職員初任者研修|実務者研修|調理師|[^\s、。]{2,12}(?:技能講習|免許|資格))/;
    if (lt) {
      const tm = lt.match(typeRe);
      if (/(不問|不要|特になし|必要ありません)/.test(lt) && !/(必須)/.test(lt)) { det.lic = 'No'; det.lic_ev = clip(lt, 120); }
      else if (/(尚可|歓迎|あれば|優遇|望ましい)/.test(lt)) { det.lic = 'Preferred'; det.lic_ev = clip(lt, 120); det.lic_type = tm ? clip(tm[0], 60) : ''; }
      else if (/(必須|必要|要)/.test(lt.replace(/不要/g, '')) && tm) { det.lic = 'Yes'; det.lic_ev = clip(lt, 120); det.lic_type = clip(tm[0], 60); }
      else { det.notes.push('license section present but no explicit required/preferred/not-required wording'); }
    } else if (anyNoLic) { det.lic = 'No'; det.lic_ev = clip(anyNoLic, 120); }
    // ---- Experience (labelled field first)
    const es = section('必要な経験等', 1).join(' ');
    const expText = es || ''; let eev = es;
    if (expText) {
      const ym = expText.match(/([0-9]+)\s*年以上/);
      if (/(経験不問|未経験(者)?(歓迎|可|OK|大歓迎)|経験(は)?(問いません|不要))/.test(expText)) { det.exp = 'No'; det.exp_ev = clip(eev, 120); }
      else if (ym) { det.exp = 'Yes'; det.exp_min = Number(ym[1]); det.exp_ev = clip(eev, 120); }
      else if (/(経験者|経験必須|経験が必要|実務経験)/.test(expText) && /(必須|必要|経験者)/.test(expText) && !/(歓迎|優遇|尚可)/.test(expText)) { det.exp = 'Yes'; det.exp_ev = clip(eev, 120); }
      else det.notes.push('experience field present but not explicit: ' + clip(expText, 60));
    } else { const l = lines.find((x) => /(未経験(者)?(歓迎|OK|可)|経験不問)/.test(x)); if (l) { det.exp = 'No'; det.exp_ev = clip(l, 120); } }
    // ---- Salary basis
    const sb = (lines[idx('賃金形態') + 1] || '').replace(/,/g, '');
    if (idx('賃金形態') >= 0) {
      det.basis = /^時給/.test(sb) ? 'HOURLY' : /^日給/.test(sb) ? 'DAILY' : /^月給/.test(sb) ? 'MONTHLY' : /^(年俸|年収)/.test(sb) ? 'ANNUAL' : ''; det.basis_ev = clip(sb, 80);
      const hm = sb.match(/時給([0-9]{3,5})/); if (hm && det.basis === 'HOURLY') det.hourly = Number(hm[1]);
      const wl = (lines[idx('賃金') + 1] || '').replace(/,/g, ''); const wm = wl.match(/([0-9]{5,7})円?\s*[〜~]?\s*([0-9]{5,7})?/);
      if (wm && det.basis === 'MONTHLY') { det.mmin = Number(wm[1]); det.mmax = wm[2] ? Number(wm[2]) : Number(wm[1]); }
    }
    det.overseas_hit = hit(OVERSEAS_OK, body); det.domestic_hit = hit(DOMESTIC, body);
  }
  const needsAi = det.state === 'OK' && String(cfg.use_ai) !== 'false' && body.length > 300 && (det.jlpt === 'Unknown' || det.lic === 'Unknown' || det.exp === 'Unknown');
  out.push({ json: Object.assign({}, job, { det, errors, detail_text: det.state === 'OK' ? body : '', needs_ai: needsAi ? 'true' : 'false' }) });
}
return out;
