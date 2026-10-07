// Shape Lead Rows (WF09): whitelisted columns only. No phone, no name, no message text, no fact values.
const cfg = $('Config').first().json; const rows = [];
for (const it of $input.all()) { const j = it.json; if (j._kind !== 'lead') continue; const outc = j.verify_status || (j.action === 'DEFERRED' ? 'DEFERRED' : 'NOOP');
  (j.log_rows || []).forEach((r) => rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, lead_id: String(j.lead_id || ''), lead_key: String(j.lead_key || ''), job_id: String(j.job_id || ''), event: String(r.event || ''), from_status: String(r.from || ''), to_status: String(r.to || ''), reason: String(r.reason || ''), consent_status: String(j.consent_status || ''), intent: String(j.intent || ''), eligibility: String(j.eligibility || ''), draft_kind: String(j.draft_kind || ''), outcome: outc } })); }
return rows;
