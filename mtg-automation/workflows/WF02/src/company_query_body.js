// Company Query Body: look for an existing Company DB page (by posting name or registry name) before creating anything.
const out = [];
for (const it of $input.all()) {
  const j = it.json; const u = j.company_upsert || {};
  const names = [];
  [u.name_jp, u.posting_name].forEach((n) => { if (n && names.indexOf(n) < 0) names.push(n); });
  const conds = [];
  names.forEach((n) => { conds.push({ property: 'Company Name', title: { equals: n } }); conds.push({ property: 'Company Name JP', rich_text: { equals: n } }); });
  out.push({ json: Object.assign({}, j, { company_query: { filter: { or: conds }, page_size: 3 } }) });
}
return out;
