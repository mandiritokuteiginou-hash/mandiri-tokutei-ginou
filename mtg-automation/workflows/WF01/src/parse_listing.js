// Parse Listing: turns each fetch response into job items + one meta item (or an error item). Pairs back to task via pairedItem.
const tasks = $('Build Search Tasks').all();
const cfg = $('Config').first().json;
const strip = (s) => (s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let task = {};
  try { task = $('Build Search Tasks').itemMatching(k).json; } catch (e) { task = (tasks[k] || tasks[0] || { json: {} }).json; }
  const base = { run_id: cfg.run_id, source: task.source, sector: task.sector, page: task.page, task_url: task.url };
  const html = (it.json && (it.json.data || it.json.body)) || '';
  if (it.json && it.json.error) {
    const e = it.json.error;
    out.push({ json: Object.assign({ _kind: 'error', stage: 'fetch_listing', error_type: (e.code || e.name || 'FETCH_ERROR'), error_message: String(e.message || e).slice(0, 300), retry_status: 'retries_exhausted' }, base) });
    continue;
  }
  if (typeof html !== 'string' || html.length < 2000) {
    out.push({ json: Object.assign({ _kind: 'error', stage: 'fetch_listing', error_type: 'EMPTY_RESPONSE', error_message: 'response too short (' + (html || '').length + ')', retry_status: 'none' }, base) });
    continue;
  }
  const parts = html.split('<div class="row" id="');
  let n = 0;
  for (let i = 1; i < parts.length; i++) {
    const blk = parts[i].slice(0, 6000);
    const idm = blk.match(/^(\d{5}-\d{8})"/);
    if (!idm) continue;
    const job_number = idm[1];
    const link = (blk.match(/class=jobtitle><a href="([^"]+)"/) || [])[1] || '';
    const title = strip((blk.match(/class=jobtitle><a href="[^"]+">([\s\S]*?)<\/a>/) || [])[1]);
    const company = strip((blk.match(/<span class=company>([\s\S]*?)<\/span>/) || [])[1]);
    const location = strip((blk.match(/<span class="location">([\s\S]*?)<\/span>/) || [])[1]);
    const sm = blk.match(/<td class=snip>\s*<nobr>([\s\S]*?)<\/nobr>\s*-\s*([^<\n]+)/);
    const snip = sm ? strip(sm[1] + ' - ' + sm[2]) : '';
    const office = strip((blk.match(/<span class=sdn>([\s\S]*?)<\/span>/) || [])[1]);
    const dates = strip((blk.match(/<span class=date>([\s\S]*?)<\/span>/) || [])[1]);
    const summary = strip((blk.match(/<span class=summary>([\s\S]*?)<\/span>\s*<\/div>/) || [])[1]).slice(0, 400);
    const kft = /<span class="kft">特定技能<\/span>/.test(blk);
    out.push({ json: Object.assign({ _kind: 'job', job_key: 'HW-' + job_number, job_number, title, company, location, listing_salary: snip, office, dates_text: dates, summary, kft_in_summary: kft, detail_url: link }, base) });
    n++;
  }
  out.push({ json: Object.assign({ _kind: 'meta', rows_found: n, error_type: '', stage: 'parse_listing' }, base) });
}
return out;
