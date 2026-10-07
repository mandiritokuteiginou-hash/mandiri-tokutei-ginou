// Build Lead Query (WF10): PII guard. Only an allow-list of NON-PII Leads columns may be fetched (filter_properties).
// If any property id cannot be resolved the query is REFUSED: the next node then calls a harmless endpoint instead.
const cfg = $('Config').first().json;
const ALLOWED = ['Lead ID', 'Lead Status', 'Status Changed', 'Last Contact', 'Purge After', 'PII Purged', 'Human Action', 'Draft Kind'];
const sch = ($input.first() || { json: {} }).json || {};
const props = sch && sch.properties && typeof sch.properties === 'object' ? sch.properties : {};
const ids = []; const missing = [];
ALLOWED.forEach((n) => { const p = props[n]; if (p && p.id) ids.push(String(p.id)); else missing.push(n); });
if (missing.length || !ids.length) {
  return [{ json: { ok: false, method: 'GET', url: 'https://api.notion.com/v1/users/me', body: {}, missing, allowed: ALLOWED } }];
}
const qs = ids.map((i) => 'filter_properties=' + encodeURIComponent(i)).join('&');
return [{ json: { ok: true, method: 'POST', url: 'https://api.notion.com/v1/data_sources/' + cfg.leads_ds_id + '/query?' + qs, body: { page_size: 100, sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] }, missing: [], allowed: ALLOWED } }];
