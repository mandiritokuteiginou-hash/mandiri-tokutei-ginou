// Source Check (WF03): re-read the HelloWork page -> still open? expiry date? did salary / holidays change since QC? Also builds the final-dedup query.
const cfg = $('Config').first().json;
const norm = (s) => String(s || '').replace(/[\s　]+/g, '');
const nowJ = new Date(Date.now() + 9 * 3600 * 1000);
const todayUTC = Date.UTC(nowJ.getUTCFullYear(), nowJ.getUTCMonth(), nowJ.getUTCDate());
const md = (arr) => { if (!arr || arr.length < 2) return null; const m = Number(arr[0]); const d = Number(arr[1]); if (!m || !d) return null; let t = Date.UTC(nowJ.getUTCFullYear(), m - 1, d); if (t < todayUTC - 200 * 86400000) t = Date.UTC(nowJ.getUTCFullYear() + 1, m - 1, d); return t; };
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const toText = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d|table|dt|dd)>/gi, '\n').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n[ \t　]*(?=\n)/g, '').replace(/\n{2,}/g, '\n').trim();
const canonUrl = (u) => String(u || '').trim().replace(/#.*$/, '').replace(/\?.*$/, '').replace(/\/+$/, '');
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let job = {};
  try { job = $('Needs Fetch?').itemMatching(k).json; } catch (e) { job = {}; }
  const errors = (job.errors || []).slice();
  const err = it.json && it.json.error; const html = (it.json && it.json.data) || '';
  const sc = { state: 'OK', conflicts: [] };
  if (err) { const m = String(err.message || err); sc.state = /404|410|not found/i.test(m) ? 'GONE' : 'UNREACHABLE'; errors.push({ stage: 'source_fetch', type: sc.state, msg: m.slice(0, 200) }); }
  else if (typeof html !== 'string' || html.length < 3000) { sc.state = 'UNREACHABLE'; errors.push({ stage: 'source_fetch', type: 'UNREACHABLE', msg: 'response too short' }); }
  else {
    const full = toText(html); const start = full.indexOf('の募集内容、仕事概要');
    if (/(掲載を終了|受付を終了|募集を終了|求人は終了|この求人は.{0,6}(終了|締め切)|ページが見つかりません)/.test(full.slice(0, 4000)) && start < 0) sc.state = 'CLOSED_ON_SOURCE';
    const body = (start >= 0 ? full.slice(start) : full).slice(0, 12000);
    const lines = body.split('\n').map((s) => s.trim()).filter((s) => s.length);
    const after = (l) => { const i = lines.indexOf(l); return i >= 0 && i + 1 < lines.length ? lines[i + 1] : ''; };
    const w = String(after('賃金')).replace(/,/g, '').match(/([0-9]{4,7})/); sc.wage_min = w ? Number(w[1]) : null;
    const hm = String(after('賃金形態')).replace(/,/g, '').match(/時給([0-9]{3,5})/); sc.hourly = hm ? Number(hm[1]) : null;
    sc.annual = Number(String(after('年間休日')).replace(/[^0-9]/g, '')) || null;
    const exp = md((full.match(/有効期限：([0-9]{1,2})月([0-9]{1,2})日/) || []).slice(1, 3));
    sc.expiry = exp ? iso(exp) : ''; sc.days_left = exp ? Math.round((exp - todayUTC) / 86400000) : null;
    if (job.monthly_min && sc.wage_min && !job.hourly && Math.abs(job.monthly_min - sc.wage_min) > Math.max(1000, job.monthly_min * 0.01)) sc.conflicts.push('salary ' + job.monthly_min + '→' + sc.wage_min);
    if (job.hourly && sc.hourly && job.hourly !== sc.hourly) sc.conflicts.push('hourly ' + job.hourly + '→' + sc.hourly);
    if (job.annual_holidays && sc.annual && job.annual_holidays !== sc.annual) sc.conflicts.push('annual holidays ' + job.annual_holidays + '→' + sc.annual);
  }
  const cu = canonUrl(job.source_url); const ck = job.job_number ? 'HW:' + job.job_number : '';
  const or = [];
  if (job.job_number) or.push({ property: 'Job Number', rich_text: { equals: job.job_number } });
  if (ck) or.push({ property: 'Canonical Key', rich_text: { equals: ck } });
  if (cu) { or.push({ property: 'Canonical URL', url: { equals: cu } }); or.push({ property: 'Source URL', url: { equals: cu } }); }
  if (job.company && job.title && job.city) or.push({ and: [{ property: 'Company', rich_text: { equals: job.company } }, { property: 'Job Title', title: { equals: job.title } }, { property: 'City', rich_text: { equals: job.city } }] });
  out.push({ json: Object.assign({}, job, { sc, errors, dedup_query: { filter: { or: or.length ? or : [{ property: 'Job Number', rich_text: { equals: '__none__' } }] }, page_size: 20 } }) });
}
return out;
