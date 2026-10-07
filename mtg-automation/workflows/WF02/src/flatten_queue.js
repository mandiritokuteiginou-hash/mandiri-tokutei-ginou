// Flatten Queue: Notion query response -> one item per job page (facts as stored by WF01). Empty / error -> a single meta item (never silent).
const cfg = $('Config').first().json;
const resp = ($input.first() && $input.first().json) || {};
const plain = (a) => (a || []).map((x) => x.plain_text || '').join('');
const pv = (p) => { if (!p) return ''; switch (p.type) { case 'title': return plain(p.title); case 'rich_text': return plain(p.rich_text); case 'number': return p.number; case 'select': return p.select ? p.select.name : ''; case 'url': return p.url || ''; case 'checkbox': return !!p.checkbox; case 'date': return p.date ? p.date.start : ''; default: return ''; } };
if (resp.error || resp.object === 'error' || !Array.isArray(resp.results)) {
  return [{ json: { _kind: 'meta', status: 'QUEUE_ERROR', reason: 'Notion queue query failed: ' + String((resp.error && (resp.error.message || resp.error)) || resp.message || 'bad response').slice(0, 250), errors: [{ stage: 'queue', type: 'notion_error', msg: String((resp.error && resp.error.message) || resp.message || 'bad response').slice(0, 250) }] } }];
}
if (resp.results.length === 0) return [{ json: { _kind: 'meta', status: 'EMPTY_QUEUE', reason: 'no EXTRACTED / re-queued jobs', errors: [] } }];
const out = [];
for (const pg of resp.results) {
  const P = pg.properties || {};
  const visa = String(pv(P['Visa Status']) || '');
  const q = (visa.match(/「([^」]+)」/) || [])[1] || '';
  const notes = String(pv(P['Audit Notes']) || '');
  const status = pv(P['Status']);
  out.push({ json: {
    _kind: 'job', page_id: pg.id, page_url: pg.url, created_time: pg.created_time, status,
    requeued: status === 'VERIFICATION_REQUIRED',
    human_employer_verified: status === 'VERIFICATION_REQUIRED' && pv(P['Employer Verified']) === true,
    job_number: String(pv(P['Job Number']) || '').trim(), title: pv(P['Job Title']), company: String(pv(P['Company']) || '').trim(),
    sector: pv(P['Field']), prefecture: pv(P['Prefecture']), city: pv(P['City']), address: pv(P['Address']),
    monthly_min: pv(P['Monthly Salary Min']) === '' ? null : pv(P['Monthly Salary Min']), monthly_max: pv(P['Monthly Salary Max']) === '' ? null : pv(P['Monthly Salary Max']),
    hourly: pv(P['Effective Hourly Wage']) === '' ? null : pv(P['Effective Hourly Wage']),
    annual_holidays: Number(String(pv(P['Annual Holidays']) || '').replace(/[^0-9]/g, '')) || null,
    source_url: pv(P['Source URL']), ssw_quote: q, quality_score: pv(P['Quality Score']) === '' ? null : pv(P['Quality Score']),
    wf01_notes: notes, wf01_corp: (notes.match(/法人番号:\s*([0-9]{13})/) || [])[1] || '', wf01_run: pv(P['Run ID'])
  } });
}
return out;
