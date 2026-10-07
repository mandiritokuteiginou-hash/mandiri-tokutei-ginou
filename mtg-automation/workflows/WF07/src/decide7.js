// Decide (WF07): READY only when spec self-check, render and the vision TRANSCRIPT comparison all pass. Owns ONLY: Image Status, Image URL, Image Build Hash, Image Template, Image Generated, Image QC Result, Image QC Flags, Image Attempt, Image Notes. Never touches Content Status, Job fields or copy.
const cfg = $('Config').first().json;
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const N = (s) => String(s || '').normalize('NFKC');
const NS = (s) => N(s).replace(/[\s　]+/g, '');
const maxAttempts = Number(cfg.max_attempts) || 3;
const needVision = String(cfg.require_vision_pass) !== 'false';
const bigrams = (s) => { const a = []; for (let i = 0; i < s.length - 1; i++) a.push(s.slice(i, i + 2)); return a; };
const dice = (a, b) => { if (a.length < 2 || b.length < 2) return a === b ? 1 : 0; const x = bigrams(a); const y = bigrams(b); const m = {}; y.forEach((g) => { m[g] = (m[g] || 0) + 1; }); let hit = 0; x.forEach((g) => { if (m[g] > 0) { hit++; m[g]--; } }); return (2 * hit) / (x.length + y.length); };
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  if (j._kind !== 'job') { out.push({ json: Object.assign({}, j, { needs_write: 'false' }) }); continue; }
  const base = Object.assign({}, j); delete base.facts; delete base.visual; delete base.render_req; delete base.ai_req; delete base.expected; delete base.vision; delete base.mask;
  const errors = (j.errors || []).slice();
  const done = (o) => out.push({ json: Object.assign(base, { errors }, o) });
  const nowrite = (outcome, why) => done({ outcome, image_status: '', qc_result: '', flags: [], needs_write: 'false', reason: why });
  if (j.action === 'SKIP_UNCHANGED') { nowrite('SKIP_UNCHANGED', j.reason); continue; }
  if (j.action === 'NOT_ELIGIBLE') { nowrite('NOT_ELIGIBLE', j.reason); continue; }
  if (j.action === 'DEFERRED_CAP') { nowrite('DEFERRED_CAP', j.reason); continue; }
  const P = {}; const sent = {};
  const sel = (k, v) => { P[k] = { select: { name: v } }; sent[k] = v; };
  const txt = (k, v) => { const t = clip(v); P[k] = { rich_text: t ? [{ type: 'text', text: { content: t } }] : [] }; sent[k] = t; };
  const finish = (status, qc, flags, notes, attempt, url, keepHash) => {
    const fl = flags.filter((x, i) => flags.indexOf(x) === i);
    sel('Image Status', status);
    if (qc) sel('Image QC Result', qc);
    if (url !== undefined) { P['Image URL'] = { url: url || null }; sent['Image URL'] = url || ''; }
    if (!keepHash) { txt('Image Build Hash', j.build_hash); txt('Image Template', j.template_label); }
    if (status === 'READY') { P['Image Generated'] = { date: { start: cfg.run_date } }; sent['Image Generated'] = cfg.run_date; }
    txt('Image QC Flags', fl.join(' | ')); txt('Image Notes', notes);
    P['Image Attempt'] = { number: attempt }; sent['Image Attempt'] = attempt;
    done({ outcome: status === 'STALE' ? 'STALE' : status, image_status: status, qc_result: qc || '', flags: fl, qc_attempt: attempt, needs_write: 'true', notion_patch_body: { properties: P }, notion_sent: sent, reason: clip(notes, 300) });
  };
  if (j.action === 'STALE_MARK') { finish('STALE', '', ['STALE_IMAGE'], j.reason, 0, '', true); continue; }
  // ---------------- GENERATE
  const attempt = (j.attempt_prev || 0) + 1; const ex = attempt >= maxAttempts;
  const spec = j.spec_flags || [];
  if (spec.length) { finish('MANUAL_REVIEW', 'MANUAL_REVIEW', spec.map((x) => x.split(':')[0]).concat(['SPEC_FAILED']), 'poster spec failed before rendering: ' + spec.slice(0, 5).join(' ; '), attempt, ''); continue; }
  if (j.render_ok !== 'true') { if (ex) finish('MANUAL_REVIEW', 'MANUAL_REVIEW', ['RENDER_FAILED', 'ATTEMPTS_EXHAUSTED'], 'render failed ' + attempt + ' times', attempt, ''); else finish('FAILED', 'FAILED', ['RENDER_FAILED'], 'render failed (attempt ' + attempt + ' of ' + maxAttempts + '); retry next run', attempt, ''); continue; }
  const v = j.vision;
  if (!v || !v.ok) {
    if (needVision) { nowrite('DEFERRED_NO_VISION', 'vision check unavailable; no status written, retried next run'); continue; }
    finish('READY', 'PASS', ['NO_VISION_PASS'], 'READY without vision check (require_vision_pass=false): only the code-built spec was verified', attempt, j.image_url); continue;
  }
  const exp = j.expected || []; const joined = NS(v.lines.join('')); const manual = []; const regen = []; const notes = [];
  exp.forEach((e) => {
    if (joined.includes(NS(e.text))) return;
    const cjk = /[぀-ヿ㐀-鿿]/.test(e.text);
    const best = Math.max.apply(null, v.lines.map((l) => dice(NS(l), NS(e.text))).concat([0]));
    if (cjk && best >= 0.8) { manual.push('OCR_UNCERTAIN:' + e.id); notes.push('transcript differs slightly from ' + e.id + ' (dice ' + best.toFixed(2) + ')'); } else { regen.push('MISSING_TEXT:' + e.id); notes.push('not found in transcript: ' + e.id); }
  });
  const allowed = {}; exp.forEach((e) => { N(e.text).replace(/,/g, '').replace(/[^0-9]+/g, ' ').trim().split(' ').forEach((x) => { if (x) { allowed[x] = true; allowed[String(Number(x))] = true; } }); });
  const seenN = {}; for (const m of N(v.lines.join('\n')).matchAll(/[0-9][0-9,]*/g)) { const d = m[0].replace(/,/g, ''); if (!allowed[d] && !allowed[String(Number(d))] && !seenN[d]) { seenN[d] = true; manual.push('UNEXPECTED_NUMBER:' + m[0]); } }
  const eNS = exp.map((e) => NS(e.text)).filter(Boolean).sort((a, b) => b.length - a.length);
  v.lines.forEach((l) => { const L = NS(l); if (L.length < 6) return; if (eNS.some((x) => x.includes(L))) return; let r = L; eNS.forEach((x) => { r = r.split(x).join(''); }); if (r.length <= 3) return; manual.push('UNEXPECTED_TEXT'); notes.push('extra text in image: ' + l.slice(0, 40)); });
  const contactOk = (u) => cfg.contact_line && N(cfg.contact_line).indexOf(u) >= 0;
  let scan = N(v.lines.join('\n')); (j.mask || []).forEach((m) => { scan = scan.split(N(m)).join(' '); });
  for (const m of scan.matchAll(/(?:https?:\/\/|www\.)\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+|\+?[0-9][0-9\-\s()]{7,}[0-9]/g)) { if (m[0].replace(/[^0-9]/g, '').length < 9 && !/[@]|www|http/.test(m[0])) continue; if (!contactOk(m[0])) manual.push('UNEXPECTED_CONTACT'); }
  const L = v.layout || {};
  if (L.watermark_or_extra_logo === true) { manual.push('WATERMARK_OR_EXTRA_LOGO'); }
  [['clipped_text', 'VIS_CLIPPED'], ['overlapping_text', 'VIS_OVERLAP'], ['low_contrast', 'VIS_LOW_CONTRAST'], ['unreadable_small_text', 'VIS_SMALL_TEXT'], ['cluttered', 'VIS_CLUTTERED']].forEach((p) => { if (L[p[0]] === true) regen.push(p[1]); });
  if (v.notes) notes.push('vision: ' + v.notes);
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  if (manual.length) { finish('MANUAL_REVIEW', 'MANUAL_REVIEW', uniq(manual.concat(regen)), notes.join(' ; '), attempt, j.image_url); continue; }
  if (regen.length) { if (ex) finish('MANUAL_REVIEW', 'MANUAL_REVIEW', uniq(regen.concat(['ATTEMPTS_EXHAUSTED'])), notes.join(' ; '), attempt, j.image_url); else finish('REGENERATE', 'REGENERATE', uniq(regen), notes.join(' ; ') + ' (next layout variant)', attempt, ''); continue; }
  finish('READY', 'PASS', [], 'spec self-check + render + vision transcript match (' + exp.length + ' elements); variant ' + j.layout_variant, attempt, j.image_url);
}
return out;
