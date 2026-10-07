// Flatten (WF03): union of Query A (recent / un-organized) + Query B (ACTIVE due for source check), de-duplicated by page. One item per job page with every field WF03 needs.
const cfg = $('Config').first().json;
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const pv = (p) => { if (!p) return ''; switch (p.type) { case 'title': return plain(p.title); case 'rich_text': return plain(p.rich_text); case 'number': return p.number === null ? null : p.number; case 'select': return p.select ? p.select.name : ''; case 'url': return p.url || ''; case 'checkbox': return !!p.checkbox; case 'date': return p.date ? p.date.start : ''; case 'unique_id': return p.unique_id ? (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number : ''; default: return ''; } };
const seen = {}; const jobs = []; const errors = [];
const resps = $input.all().map((i) => i.json);
resps.forEach((r, idx) => {
  if (!r || r.error || r.object === 'error' || !Array.isArray(r.results)) { errors.push({ stage: 'queue_' + (idx === 0 ? 'A' : 'B'), type: 'notion_error', msg: String((r && ((r.error && r.error.message) || r.message)) || 'bad response').slice(0, 200) }); return; }
  r.results.forEach((pg) => {
    if (seen[pg.id]) { if (idx === 1) seen[pg.id].json.maintenance = true; return; }
    const P = pg.properties || {};
    const notes = String(pv(P['Audit Notes']) || '');
    const it = { json: { _kind: 'job', maintenance: idx === 1, page_id: pg.id, page_url: pg.url, created_time: pg.created_time,
      mtg_job_id: pv(P['Job ID']), status: pv(P['Status']), job_number: String(pv(P['Job Number']) || '').trim(), title: pv(P['Job Title']), company: String(pv(P['Company']) || '').trim(),
      prefecture: pv(P['Prefecture']), city: pv(P['City']), address: pv(P['Address']), sector: pv(P['Field']), source_url: pv(P['Source URL']),
      monthly_min: pv(P['Monthly Salary Min']), hourly: pv(P['Effective Hourly Wage']), annual_holidays: Number(String(pv(P['Annual Holidays']) || '').replace(/[^0-9]/g, '')) || null,
      quality_score: pv(P['Quality Score']), company_score: pv(P['Data Confidence']), qc: pv(P['QC Decision']), qc_reject_reason: pv(P['QC Reject Reason']), recruitability: pv(P['Recruitability']),
      housing: [pv(P['Housing']), pv(P['Housing Type'])].filter(Boolean).join(' / '), benefits: pv(P['Benefits']), jp_level: pv(P['Japanese Level']), requirements: [pv(P['Requirements']), pv(P['Certificates'])].filter(Boolean).join(' / '), experience: pv(P['Experience']), overtime: pv(P['Overtime']),
      audit_notes: notes,
      cur: { lifecycle: pv(P['Lifecycle Status']), tier: pv(P['Priority Tier']), tier_reason: pv(P['Tier Reason']), reason: pv(P['Lifecycle Reason']), checked: pv(P['Lifecycle Checked']), expiry: pv(P['Expiry Date']), ckey: pv(P['Canonical Key']), curl: pv(P['Canonical URL']), ccompany: pv(P['Canonical Company']), corp: pv(P['Corporate Number']), cloc: pv(P['Canonical Location']), csal: pv(P['Canonical Monthly Salary']), canon_of: pv(P['Canonical Of']), dorm: pv(P['Dormitory Available']), jlpt: pv(P['JLPT Required']), lic: pv(P['License Required']), exp: pv(P['Experience Required']), ot: pv(P['Overtime Hours Avg']), ready: pv(P['Matching Ready']), mrr: pv(P['Matching Readiness Reason']), dupcheck: pv(P['Duplicate Check']) } } };
    seen[pg.id] = it; jobs.push(it);
  });
});
if (!jobs.length) return [{ json: { _kind: 'meta', status: errors.length ? 'QUEUE_ERROR' : 'EMPTY_QUEUE', errors } }];
const out = jobs.slice(0, Number(cfg.max_per_run) || 40);
if (errors.length) out[0].json.errors = errors;
return out;
