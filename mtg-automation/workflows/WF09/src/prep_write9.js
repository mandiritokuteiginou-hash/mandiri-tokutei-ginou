// Prepare Write (WF09): builds the Notion request for CREATE/PATCH and re-checks the allow-list (defense in depth). Targets ONLY the Leads data source / pages loaded from it. Never the Master Job DB.
const cfg = $('Config').first().json;
const ALLOWED = new Set(['Lead ID', 'Lead Key', 'Phone Hash', 'Phone', 'Name', 'Job ID', 'Lead Status', 'Prev Status', 'Status Reason', 'Status Changed', 'Source', 'Consent Status', 'Consent Date', 'Consent Source', 'Consent Version', 'Consent Requested At', 'Applicant JLPT', 'JFT-Basic', 'Skill Test Passed', 'Tech Intern Completed', 'Has License', 'Experience Years', 'Age', 'Facts Hash', 'Eligibility Result', 'Eligibility Detail', 'Last Intent', 'Last Inbound', 'Reply Draft', 'Draft Kind', 'Draft Facts Hash', 'Human Action', 'Last Contact', 'Handoff Ref', 'Purge After', 'PII Purged', 'PII Purged At', 'Last Run']);
const leadPages = new Set((((($('Query Leads').first().json) || {}).results) || []).map((p) => p.id));
return $input.all().map((it) => {
  const j = it.json; const bad = Object.keys(j.notion_props || {}).filter((k) => !ALLOWED.has(k));
  const isCreate = j.action === 'CREATE';
  const okTarget = isCreate ? !!cfg.leads_ds_id : leadPages.has(j.page_id);
  if (bad.length || !okTarget || !Object.keys(j.notion_props || {}).length) return { json: Object.assign({}, j, { guard: 'BLOCKED', guard_reason: bad.length ? 'FIELD_NOT_ALLOWED:' + bad.join(',') : (!okTarget ? 'TARGET_NOT_LEADS_DB' : 'EMPTY_PATCH'), write_method: 'GET', write_url: 'https://api.notion.com/v1/users/me', write_body: {}, notion_props: undefined }) };
  return { json: Object.assign({}, j, { guard: 'OK', write_method: isCreate ? 'POST' : 'PATCH', write_url: isCreate ? 'https://api.notion.com/v1/pages' : 'https://api.notion.com/v1/pages/' + j.page_id, write_body: isCreate ? { parent: { type: 'data_source_id', data_source_id: cfg.leads_ds_id }, properties: j.notion_props } : { properties: j.notion_props }, notion_props: undefined }) };
});
