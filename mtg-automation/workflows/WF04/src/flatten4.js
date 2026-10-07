// Flatten (WF04): Notion candidate query -> one item per job. Only ACTIVE + QC APPROVED jobs are ever enriched (re-checked here even though the query filters them).
const cfg = $('Config').first().json;
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const pv = (p) => { if (!p) return ''; switch (p.type) { case 'title': return plain(p.title); case 'rich_text': return plain(p.rich_text); case 'number': return p.number === null ? null : p.number; case 'select': return p.select ? p.select.name : ''; case 'url': return p.url || ''; case 'checkbox': return !!p.checkbox; case 'date': return p.date ? p.date.start : ''; case 'unique_id': return p.unique_id ? (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number : ''; default: return ''; } };
const r = $input.first().json;
if (!r || r.error || r.object === 'error' || !Array.isArray(r.results)) return [{ json: { _kind: 'meta', status: 'QUEUE_ERROR', errors: [{ stage: 'queue', type: 'notion_error', msg: String((r && ((r.error && r.error.message) || r.message)) || 'bad response').slice(0, 200) }] } }];
const unk = (v) => !v || v === 'Unknown';
const jobs = [];
r.results.forEach((pg) => {
  const P = pg.properties || {};
  const life = pv(P['Lifecycle Status']); const qc = pv(P['QC Decision']);
  if (life !== 'ACTIVE' || qc !== 'APPROVED') return;
  const cur = { jlpt: pv(P['JLPT Required']), lic: pv(P['License Required']), lic_type: pv(P['License Type']), exp: pv(P['Experience Required']), exp_min: pv(P['Experience Years Min']), basis: pv(P['Salary Basis']), hourly: pv(P['Effective Hourly Wage']), mmin: pv(P['Monthly Salary Min']), mmax: pv(P['Monthly Salary Max']), checked: pv(P['Enrichment Checked']), evidence: pv(P['Enrichment Evidence']) };
  const pri = unk(cur.jlpt) ? 1 : !cur.basis ? 2 : unk(cur.lic) ? 3 : unk(cur.exp) ? 4 : 5;
  jobs.push({ json: { _kind: 'job', page_id: pg.id, page_url: pg.url, mtg_job_id: pv(P['Job ID']), job_number: String(pv(P['Job Number']) || '').trim(), title: pv(P['Job Title']), company: String(pv(P['Company']) || '').trim(), source_url: pv(P['Source URL']), recruitability: pv(P['Recruitability']), lifecycle: life, qc, priority: pri, cur, errors: [] } });
});
if (!jobs.length) return [{ json: { _kind: 'meta', status: 'EMPTY_QUEUE', errors: [] } }];
jobs.sort((a, b) => a.json.priority - b.json.priority || String(a.json.cur.checked || '').localeCompare(String(b.json.cur.checked || '')));
return jobs.slice(0, Number(cfg.max_per_run) || 20);
