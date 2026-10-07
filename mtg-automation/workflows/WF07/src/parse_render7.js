// Parse Render (WF07): the render provider must return an https image URL. Anything else = FAILED render (retried, max attempts).
const cfg = $('Config').first().json;
const out = []; const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k]; let j = {};
  try { j = $('Build Poster').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice(); const base = Object.assign({}, j, { render_req: undefined, errors });
  const r = it.json || {}; const url = String(r.url || r.image_url || '').trim();
  if (r.error || !/^https:\/\/[^\s]+$/.test(url)) { errors.push({ stage: 'render', type: 'render_error', msg: String(r.error ? (r.error.message || r.error) : (r.message || 'no https image url in response')).slice(0, 200) }); out.push({ json: Object.assign(base, { render_ok: 'false', needs_vision: 'false', image_url: '' }) }); continue; }
  out.push({ json: Object.assign(base, { render_ok: 'true', needs_vision: String(cfg.use_ai) === 'false' ? 'false' : 'true', image_url: url }) });
}
return out;
