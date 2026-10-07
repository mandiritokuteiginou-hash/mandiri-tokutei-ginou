// Re-check Source: re-fetch the HelloWork detail page and compare with what WF01 stored. Deterministic. Nothing is trusted from WF01 without re-proof.
const cfg = $('Config').first().json;
const norm = (s) => String(s || '').replace(/[\s　]+/g, '');
const nowJ = new Date(Date.now() + 9 * 3600 * 1000);
const todayUTC = Date.UTC(nowJ.getUTCFullYear(), nowJ.getUTCMonth(), nowJ.getUTCDate());
const md2date = (arr, mode) => { if (!arr || arr.length < 2) return null; const m = Number(arr[0]); const d = Number(arr[1]); if (!m || !d) return null; const y = nowJ.getUTCFullYear(); let t = Date.UTC(y, m - 1, d); if (mode === 'posted' && t > todayUTC + 2 * 86400000) t = Date.UTC(y - 1, m - 1, d); if (mode === 'expiry' && t < todayUTC - 200 * 86400000) t = Date.UTC(y + 1, m - 1, d); return t; };
const toText = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d|table|dt|dd)>/gi, '\n').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n[ \t　]*(?=\n)/g, '').replace(/\n{2,}/g, '\n').trim();
const OVERSEAS_OK = [/海外(在住)?(の方|者)?(から|在住).{0,8}(応募|可|歓迎|OK|ＯＫ)/, /(国外|海外)在住.{0,4}(可|OK|ＯＫ|歓迎)/, /来日前.{0,12}(応募|面接|内定|選考)/, /(入国前|渡日前).{0,12}(応募|面接|内定|選考)/, /(海外|来日前).{0,20}オンライン面接|オンライン面接.{0,20}(海外|来日前)/];
const DOMESTIC = [/(海外|国外)在住.{0,4}(不可|不可能|ＮＧ|NG)/, /国内(に)?在住(の方|者)?(のみ|限)/, /日本(国)?内に(在住|居住).{0,10}(方|者|必須)/, /在留カード.{0,12}(必須|をお持ちの方のみ)/];
const hit = (arr, t) => { for (const r of arr) { const m = t.match(r); if (m) return m[0].slice(0, 80); } return ''; };
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {};
  try { job = $('Flatten Queue').itemMatching(k).json; } catch (e) { job = {}; }
  const err = it.json && it.json.error;
  const html = (it.json && it.json.data) || '';
  const errors = [];
  const rc = { source_state: 'OK', host_ok: /^https:\/\/(www\.)?hellowork\.careers\//.test(job.source_url || '') || /^https:\/\/www\.hellowork\.mhlw\.go\.jp\//.test(job.source_url || ''), conflicts: [] };
  let text = '';
  if (err) { const m = String(err.message || err.description || err); rc.source_state = /404|410|not found/i.test(m) ? 'GONE' : 'UNREACHABLE'; rc.detail = m.slice(0, 200); errors.push({ stage: 'source_fetch', type: rc.source_state, msg: m.slice(0, 200) }); }
  else if (typeof html !== 'string' || html.length < 3000) { rc.source_state = /Fatal error|detail\.php/.test(String(html)) ? 'BROKEN' : 'UNREACHABLE'; rc.detail = 'response too short (' + String(html || '').length + ')'; errors.push({ stage: 'source_fetch', type: rc.source_state, msg: rc.detail }); }
  else {
    const full = toText(html);
    const start = full.indexOf('の募集内容、仕事概要');
    if (/(掲載を終了|受付を終了|募集を終了|求人は終了|この求人は.{0,6}(終了|締め切)|ページが見つかりません)/.test(full.slice(0, 4000)) && start < 0) rc.source_state = 'CLOSED_ON_SOURCE';
    const body = (start >= 0 ? full.slice(Math.max(0, start - 80)) : full).slice(0, 12000);
    text = body;
    const lines = body.split('\n').map((s) => s.trim()).filter((s) => s.length);
    const after = (label) => { const i = lines.indexOf(label); return i >= 0 && i + 1 < lines.length ? lines[i + 1] : ''; };
    const hdr = lines.find((l) => /の募集内容、仕事概要$/.test(l));
    rc.page_company = hdr ? hdr.replace(/の募集内容、仕事概要$/, '').trim() : '';
    const wi = lines.indexOf('勤務地');
    rc.page_address = wi >= 0 ? lines.slice(wi + 1, wi + 4).filter((l) => !/^〒/.test(l) && !/^就業場所|^マイカー|^転勤/.test(l))[0] || '' : '';
    rc.haken = after('派遣・請負等'); rc.wage_text = after('賃金'); rc.wage_form = after('賃金形態'); rc.annual_text = after('年間休日');
    const wnum = String(rc.wage_text).replace(/,/g, '').match(/([0-9]{4,7})/);
    rc.wage_min = wnum ? Number(wnum[1]) : null;
    const hm = String(rc.wage_form).replace(/,/g, '').match(/時給([0-9]{3,5})/);
    rc.hourly = hm ? Number(hm[1]) : null;
    rc.annual = Number(String(rc.annual_text).replace(/[^0-9]/g, '')) || null;
    const posted = md2date((full.match(/受理日：([0-9]{1,2})月([0-9]{1,2})日/) || []).slice(1, 3), 'posted');
    const expiry = md2date((full.match(/有効期限：([0-9]{1,2})月([0-9]{1,2})日/) || []).slice(1, 3), 'expiry');
    rc.days_left = expiry ? Math.round((expiry - todayUTC) / 86400000) : null;
    rc.posted_age_days = posted ? Math.round((todayUTC - posted) / 86400000) : null;
    rc.page_corp = (body.match(/法人番号[^0-9]{0,6}([0-9]{13})/) || [])[1] || '';
    const jn = String(job.job_number || '').replace(/-/g, '');
    rc.source_job_match = !!jn && full.replace(/-/g, '').indexOf(jn) >= 0;
    rc.ssw_in_text = body.indexOf('特定技能') >= 0;
    rc.ssw_quote_ok = !!job.ssw_quote && job.ssw_quote.length >= 4 && norm(body).indexOf(norm(job.ssw_quote)) >= 0;
    rc.overseas_hit = hit(OVERSEAS_OK, body); rc.domestic_hit = hit(DOMESTIC, body);
    // conflicts vs WF01-stored facts
    if (job.monthly_min && rc.wage_min && !job.hourly && Math.abs(job.monthly_min - rc.wage_min) > Math.max(1000, job.monthly_min * 0.01)) rc.conflicts.push('salary: stored ' + job.monthly_min + ' vs source ' + rc.wage_min);
    if (job.hourly && rc.hourly && job.hourly !== rc.hourly) rc.conflicts.push('hourly: stored ' + job.hourly + ' vs source ' + rc.hourly);
    if (job.annual_holidays && rc.annual && job.annual_holidays !== rc.annual) rc.conflicts.push('annual holidays: stored ' + job.annual_holidays + ' vs source ' + rc.annual);
    if (job.wf01_corp && rc.page_corp && job.wf01_corp !== rc.page_corp) rc.conflicts.push('法人番号: stored ' + job.wf01_corp + ' vs source ' + rc.page_corp);
    const core = (s) => String(s || '').normalize('NFKC').replace(/株式会社|有限会社|合同会社|\(株\)|\(有\)|[\s　]/g, '');
    if (job.company && rc.page_company && core(job.company) !== core(rc.page_company)) rc.conflicts.push('company: stored ' + job.company + ' vs source ' + rc.page_company);
  }
  const base = Object.assign({}, job, { rc, detail_text: text, errors });
  base.dup_query_body = job.company
    ? { filter: { property: 'Company', rich_text: { equals: job.company } }, page_size: 25 }
    : { filter: { property: 'Job Number', rich_text: { equals: job.job_number } }, page_size: 25 };
  out.push({ json: base });
}
return out;
