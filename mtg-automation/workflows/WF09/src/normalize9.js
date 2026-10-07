// Normalize Inbox (WF09): parses the bridge response into ONE item. Phones -> E.164, deterministic scan (withdraw > legal > consent) BEFORE any AI. Raw text exists only in memory and is dropped after intent.
const cfg = $('Config').first().json;
//@LIB
const msgs = []; let status = cfg.whatsapp_inbox_url ? 'OK' : 'NOT_CONFIGURED'; const errors = [];
for (const it of $input.all()) {
  const j = it.json || {};
  if (j.error) { status = 'ERROR'; errors.push({ stage: 'inbox', type: 'INBOX_ERROR', msg: maskErr((j.error && (j.error.message || j.error)) || 'inbox fetch failed') }); continue; }
  const arr = Array.isArray(j.messages) ? j.messages : (Array.isArray(j.body && j.body.messages) ? j.body.messages : null);
  if (!arr) continue;
  arr.slice(0, 200).forEach((m) => msgs.push(m));
}
const out = []; const seen = new Set();
msgs.forEach((m) => {
  const id = String(m.message_id || m.id || '').trim(); if (!id) return;
  const mh = HS(['msg', id]); if (seen.has(mh)) return; seen.add(mh);
  const phone = normPhone(m.from || m.phone || ''); const text = String(m.text || m.body || '');
  const mref = String(m.job_ref || '').match(/mtg[-\s]?(\d{1,6})/i) || text.match(/\bmtg[-\s]?(\d{1,6})\b/i);
  const sc = scanText(text);
  out.push({ msg_hash: mh, phone, phone_valid: phone ? 'true' : 'false', name: String(m.name || '').slice(0, 80), text, ts: String(m.timestamp || cfg.run_started), job_ref: mref ? 'MTG-' + parseInt(mref[1], 10) : '', det_intent: sc.intent, det: sc.det ? 'true' : 'false' });
});
return [{ json: { inbox_status: status, messages_seen: out.length, messages: out, errors } }];
