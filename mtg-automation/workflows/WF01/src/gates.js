// Parse Extract + Hard Gates M1-M8 (deterministic). AI output is only DATA here; gates decide.
const cfg = $('Config').first().json;
const parseJson = (t) => { let s = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } };
const norm = (s) => String(s || '').replace(/[\s　]+/g, '');
const nowJ = new Date(Date.now() + 9 * 3600 * 1000);
const todayUTC = Date.UTC(nowJ.getUTCFullYear(), nowJ.getUTCMonth(), nowJ.getUTCDate());
const md2date = (arr, mode) => { // month/day only -> nearest plausible year
  if (!arr || arr.length < 2) return null; const m = Number(arr[0]); const d = Number(arr[1]); if (!m || !d) return null;
  const y = nowJ.getUTCFullYear(); let t = Date.UTC(y, m - 1, d);
  if (mode === 'posted' && t > todayUTC + 2 * 86400000) t = Date.UTC(y - 1, m - 1, d);
  if (mode === 'expiry' && t < todayUTC - 200 * 86400000) t = Date.UTC(y + 1, m - 1, d);
  return t;
};
const wageNum = (s) => { const m = String(s || '').replace(/,/g, '').match(/([0-9]{4,7})/); return m ? Number(m[1]) : null; };
const SECTORS = ['介護', '外食', '食品製造', '製造', '建設', '農業', '宿泊', 'ビルクリーニング', '造船・舶用工業', '自動車整備', '航空', 'その他'];
const SMAP = { '飲食料品製造業': '食品製造', '工業製品製造業': '製造', '漁業': '農業', '自動車運送業': 'その他', '鉄道': 'その他', '林業': 'その他', '木材産業': 'その他' };
const allowHourly = String(cfg.allow_hourly_sectors || '').split(',');
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {};
  try { job = $('Prepare Extract').itemMatching(k).json; } catch (e) { job = {}; }
  const base = Object.assign({}, job);
  delete base.ai_extract_req;
  const gates = {}; const fails = []; const flags = [];
  const G = (id, ok, why) => { gates[id] = ok ? 'PASS' : 'FAIL: ' + why; if (!ok) fails.push(id + ' ' + why); };
  if (job.detail_ok === false) { out.push({ json: Object.assign(base, { _kind: 'outcome', status: 'FETCH_DETAIL_ERROR', reason: job.detail_error, gate_pass: false, gates }) }); continue; }
  const e = parseJson(it.json && it.json.content && it.json.content[0] && it.json.content[0].text);
  if (it.json && it.json.error || !e) { out.push({ json: Object.assign(base, { _kind: 'outcome', status: 'AI_ERROR', reason: 'extract failed: ' + (it.json && it.json.error ? String(it.json.error.message || it.json.error).slice(0, 200) : 'unparseable JSON'), gate_pass: false, gates, detail_text: undefined }) }); continue; }
  const h = job.hard || {}; const text = norm(job.detail_text);
  const sal = e.salary || {};
  // ---- M1 real direct employer
  const agencyRx = /協同組合|事業協同|登録支援機関|人材派遣|人材紹介|職業紹介|派遣/;
  const haken = /派遣|請負/.test(h.haken_field || '') && !/(ではない|でない|ではありません|なし)/.test(h.haken_field || '') && !/^(-|ー|なし|該当なし)?$/.test((h.haken_field || '').trim());
  const badType = ['STAFFING_AGENCY', 'COOPERATIVE', 'REGISTERED_SUPPORT_ORG', 'PLATFORM'].indexOf(e.company_type) >= 0;
  const cname = e.company_name_jp && e.company_name_jp !== 'UNKNOWN' ? e.company_name_jp : job.company;
  G('M1', !badType && !haken && !agencyRx.test(cname || '') && !!cname, badType ? 'company_type=' + e.company_type : haken ? 'dispatch/contract field: ' + h.haken_field : 'agency-like or missing company name');
  if (e.company_type === 'UNKNOWN') flags.push('employer_type_unverified');
  // ---- M2 job IS an SSW job (evidence quote must exist verbatim in the source text)
  const q = String(e.ssw_evidence_quote || '');
  const quoteInText = q.length >= 4 && q !== 'UNKNOWN' && text.indexOf(norm(q)) >= 0;
  const posRx = /募集|歓迎|可能|可$|可。|可）|対象|受入|受け入れ|採用|応募|在留資格|取得|優遇|ＯＫ|OK/;
  const stateOnly = /在籍|活躍|社員/.test(q) && !posRx.test(q);
  const mgmtRx = /(外国人|海外人材|技能実習|特定技能).{0,12}(管理|教育|支援|対策|サポート|通訳|担当)/.test((e.job_title_jp || '') + (e.role_summary_jp || ''));
  let m2 = e.ssw_mention === 'EXPLICIT_RECRUIT' && quoteInText && q.indexOf('特定技能') >= 0 && posRx.test(q) && !stateOnly;
  let m2why = e.ssw_mention !== 'EXPLICIT_RECRUIT' ? 'ssw_mention=' + e.ssw_mention : !quoteInText ? 'evidence quote not found verbatim in source' : stateOnly ? 'state-only label (在籍/活躍/社員)' : 'quote lacks recruit wording';
  if (m2 && mgmtRx) { m2 = false; m2why = 'SSW management role (hard reject)'; }
  G('M2', m2, m2why);
  // ---- M3 active + dated
  const expiry = md2date(h.expiry, 'expiry'); const posted = md2date(h.posted, 'posted');
  const ageDays = posted ? Math.round((todayUTC - posted) / 86400000) : null;
  G('M3', !!expiry && expiry >= todayUTC, !expiry ? 'no expiry date evidence' : 'posting expired');
  if (ageDays !== null && ageDays > (Number(cfg.staleness_days) || 180)) flags.push('stale_over_' + (Number(cfg.staleness_days) || 180) + 'd');
  // ---- M4 monthly salary stated (hourly only for allowed sectors)
  const form = (h.wage_form || '').slice(0, 2);
  const hourly = form === '時給' || sal.type === 'HOURLY';
  const monthlyMin = hourly ? wageNum(h.wage_monthly_text) : (wageNum(h.wage_monthly_text) || sal.min);
  const sector = SECTORS.indexOf(e.sector_jp) >= 0 ? e.sector_jp : (SMAP[e.sector_jp] || 'その他');
  const hourlyOK = hourly && (allowHourly.indexOf(job.sector) >= 0 || allowHourly.indexOf(sector) >= 0);
  const plausible = monthlyMin && monthlyMin >= 100000 && monthlyMin <= 1000000;
  G('M4', !!plausible && (!hourly || hourlyOK), !plausible ? 'monthly salary missing/implausible (' + monthlyMin + ')' : 'hourly wage not accepted for this sector');
  if (hourly) flags.push('hourly_basis_monthly_converted_by_source');
  // ---- M5 holidays / working conditions
  const annualHw = Number(String(h.annual_holidays_text || '').replace(/[^0-9]/g, '')) || null;
  const annual = Number(e.annual_holidays) || annualHw || null;
  const hasHol = !!annual || (e.holiday_text && e.holiday_text !== 'UNKNOWN');
  const hasHrs = (e.working_hours && e.working_hours !== 'UNKNOWN') || !!h.workhours1;
  G('M5', hasHol && hasHrs, !hasHol ? 'holidays missing' : 'working hours missing');
  if (annual && annual < 105) flags.push('annual_holidays_under_105');
  // ---- M6 identity & location completeness (MTG definition)
  const hasLoc = e.prefecture && e.prefecture !== 'UNKNOWN' && ((e.city && e.city !== 'UNKNOWN') || (e.address && e.address !== 'UNKNOWN'));
  G('M6', !!(hasLoc && cname && (e.job_title_jp && e.job_title_jp !== 'UNKNOWN' || job.title)), 'location/company/title incomplete');
  // ---- M7 applicable to overseas applicant (explicit domestic-only = fail; silence = pass + flag)
  const domRx = /国内在住|国内のみ|海外在住.{0,6}不可|現在日本に在住|在留カード.{0,6}(必須|お持ち|所持)/;
  const dom = e.overseas_applicant === 'DOMESTIC_ONLY' && (norm(e.domestic_evidence_quote).length >= 4 && text.indexOf(norm(e.domestic_evidence_quote)) >= 0) || domRx.test(text);
  G('M7', !dom, 'domestic-only applicant requirement');
  if (e.overseas_applicant !== 'OK') flags.push('overseas_applicability_unverified');
  // ---- M8 source traceable
  G('M8', /^https:\/\//.test(job.detail_url || '') && /^\d{5}-\d{8}$/.test(job.job_number || '') && (job.detail_text || '').length > 800, 'source url / job number / text not traceable');
  const cn = h.corporate_number || (/^[0-9]{13}$/.test(e.corporate_number || '') ? e.corporate_number : '');
  const norm_e = Object.assign({}, e, { sector_notion: sector, monthly_min: monthlyMin, hourly, annual_holidays_n: annual || null, corporate_number_n: cn, company_name_final: cname });
  const pass = fails.length === 0;
  out.push({ json: Object.assign(base, { extract: norm_e, gates, gate_fails: fails, flags, posted_age_days: ageDays, gate_pass: pass, _kind: pass ? 'gated' : 'outcome', status: pass ? 'GATED_PASS' : 'REJECT_GATE', reason: fails.join(' | ') }) });
}
return out;
