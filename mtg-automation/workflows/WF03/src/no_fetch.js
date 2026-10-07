// No Fetch: jobs that have not been through QC need no source re-check; still build the final-dedup query.
const canonUrl = (u) => String(u || '').trim().replace(/#.*$/, '').replace(/\?.*$/, '').replace(/\/+$/, '');
return $input.all().map((it) => {
  const job = it.json; const cu = canonUrl(job.source_url); const ck = job.job_number ? 'HW:' + job.job_number : ''; const or = [];
  if (job.job_number) or.push({ property: 'Job Number', rich_text: { equals: job.job_number } });
  if (ck) or.push({ property: 'Canonical Key', rich_text: { equals: ck } });
  if (cu) { or.push({ property: 'Canonical URL', url: { equals: cu } }); or.push({ property: 'Source URL', url: { equals: cu } }); }
  if (job.company && job.title && job.city) or.push({ and: [{ property: 'Company', rich_text: { equals: job.company } }, { property: 'Job Title', title: { equals: job.title } }, { property: 'City', rich_text: { equals: job.city } }] });
  return { json: Object.assign({}, job, { sc: { state: 'SKIPPED', conflicts: [] }, errors: job.errors || [], dedup_query: { filter: { or: or.length ? or : [{ property: 'Job Number', rich_text: { equals: '__none__' } }] }, page_size: 20 } }) };
});
