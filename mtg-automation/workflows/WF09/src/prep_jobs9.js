// Prepare Job Lookups (WF09): one READ query per distinct Job ID (leads in pre-handoff states + message job refs). Master Job DB is never written.
const cfg = $('Config').first().json;
const leads = (($('Query Leads').first().json || {}).results) || [];
const ids = new Set();
const rt = (p) => ((p && (p.rich_text || p.title)) || []).map((x) => x.plain_text || (x.text && x.text.content) || '').join('');
leads.forEach((pg) => { const pr = pg.properties || {}; const st = pr['Lead Status'] && pr['Lead Status'].select && pr['Lead Status'].select.name; const purged = pr['PII Purged'] && pr['PII Purged'].checkbox; const jid = rt(pr['Job ID']).trim(); if (jid && !purged && !['HANDOFF', 'WITHDRAWN', 'DORMANT', 'NOT_ELIGIBLE'].includes(st)) ids.add(jid.toUpperCase()); });
$input.all().forEach((it) => { if (it.json && it.json.job_ref) ids.add(String(it.json.job_ref).toUpperCase()); });
const out = [];
[...ids].slice(0, 40).forEach((jid) => { const n = parseInt(jid.replace(/\D/g, ''), 10); if (!n) return; out.push({ json: { dummy: 'false', job_id: jid, lookup_body: { filter: { property: 'Job ID', unique_id: { equals: n } }, page_size: 1 } } }); });
if (!out.length) out.push({ json: { dummy: 'true' } });
return out;
