// Verify Write (WF09): read-back compare of every field we sent (CJK-safe). commit_ok gates the message-dedup commit.
const rt = (p) => ((p && (p.rich_text || p.title)) || []).map((x) => x.plain_text || (x.text && x.text.content) || '').join('');
const got = (p, t) => !p ? '' : t === 'title' || t === 'rich_text' ? rt(p) : t === 'select' ? ((p.select && p.select.name) || '') : t === 'number' ? (typeof p.number === 'number' ? String(p.number) : '') : t === 'date' ? ((p.date && p.date.start) || '') : t === 'checkbox' ? (p.checkbox ? 'true' : '') : t === 'phone_number' ? (p.phone_number || '') : '';
const want = (t, v) => t === 'checkbox' ? (v ? 'true' : '') : (v === null || v === undefined || v === false) ? '' : String(v);
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Prepare Write').itemMatching(k).json; } catch (e) { j = {}; }
  const base = Object.assign({}, j, { sent: undefined, write_body: undefined });
  const r = it.json || {}; const errs = [];
  if (j.guard === 'BLOCKED') { out.push({ json: Object.assign(base, { verify_status: 'BLOCKED', commit_ok: false, errors: [{ stage: 'guard', type: 'WRITE_BLOCKED', msg: j.guard_reason }] }) }); continue; }
  if (r.error || r.object === 'error' || !r.properties) { out.push({ json: Object.assign(base, { verify_status: 'WRITE_ERROR', commit_ok: false, errors: [{ stage: 'notion_write', type: 'WRITE_ERROR', msg: String((r.error && (r.error.message || r.error)) || r.message || 'no properties returned').slice(0, 200) }] }) }); continue; }
  const bad = [];
  Object.keys(j.sent || {}).forEach((f) => { const s = j.sent[f]; const g = got(r.properties[f], s.t); const w = want(s.t, s.v); const ok = s.t === 'date' ? String(g).slice(0, 10) === String(w).slice(0, 10) : g === w; if (!ok) bad.push(f); });
  const ok = !bad.length;
  out.push({ json: Object.assign(base, { page_id: r.id || j.page_id, verify_status: ok ? 'OK' : 'VERIFY_FAILED', commit_ok: ok, errors: ok ? [] : [{ stage: 'notion_verify', type: 'VERIFY_FAILED', msg: 'read-back mismatch on ' + bad.slice(0, 6).join(', ') }] }) });
}
return out;
