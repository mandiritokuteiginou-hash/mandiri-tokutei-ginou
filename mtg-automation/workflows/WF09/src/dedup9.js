// Dedup Messages (WF09): drops messages whose hash is already committed. One item per NEW message + one meta item.
const cfg = $('Config').first().json;
const seen = new Set($input.all().map((i) => i.json && i.json.msg_hash).filter(Boolean));
const base = $('Normalize Inbox').first().json;
const out = []; let fresh = 0;
(base.messages || []).forEach((m) => { if (seen.has(m.msg_hash)) return; fresh++; out.push({ json: Object.assign({ _kind: 'message', needs_ai: (m.det === 'true' || cfg.use_ai !== 'true') ? 'false' : 'true' }, m) }); });
out.push({ json: { _kind: 'meta', needs_ai: 'false', inbox_status: base.inbox_status, messages_seen: base.messages_seen || 0, messages_new: fresh, errors: base.errors || [] } });
return out;
