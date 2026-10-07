// Commit Dedup (WF09): message hashes are committed ONLY for leads whose write was read-back verified (or that needed no write). At-least-once, effects idempotent.
const cfg = $('Config').first().json; const seen = new Set(); const rows = [];
for (const it of $input.all()) { const j = it.json; if (j._kind !== 'lead' || j.commit_ok !== true) continue; (j.msg_hashes || []).forEach((h) => { if (h && !seen.has(h)) { seen.add(h); rows.push({ json: { msg_hash: h, lead_key: String(j.lead_key || ''), first_seen: cfg.run_started } }); } }); }
return rows;
