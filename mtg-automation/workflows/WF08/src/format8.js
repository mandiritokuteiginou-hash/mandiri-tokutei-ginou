// Format Payload (WF08): platform formatter. Sends the APPROVED stored caption verbatim (never rewritten here). Last-line content checks; any problem = MANUAL_REVIEW (never retried).
const cfg = $('Config').first().json;
const N = (s) => String(s || '').normalize('NFKC');
const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wre = (b) => new RegExp('(?<![A-Za-z0-9])' + rx(N(b)) + '(?![A-Za-z0-9])', 'i');
const lists = (k) => String(cfg[k] || '').split('|').map((s) => s.trim()).filter(Boolean);
const LIM = { instagram: 2200, tiktok: 2200, whatsapp: 4000 };
const disc = [cfg.disclaimer, cfg.brand_footer].filter(Boolean).map(N);
return $input.all().map((it) => {
  const j = it.json; const pf = j.platform; const cap = String(j.caption || '');
  const issues = [];
  if (!cap.trim()) issues.push('EMPTY_CAPTION');
  if (cap.length > (LIM[pf] || 2000)) issues.push('CAPTION_TOO_LONG');
  if (!/^https:\/\/\S+$/.test(String(j.img_url || ''))) issues.push('IMAGE_URL_INVALID');
  let body = N(cap); disc.forEach((d) => { body = body.split(d).join(' '); });
  lists('banned_phrases').forEach((b) => { if (wre(b).test(body)) issues.push('BANNED_PHRASE:' + b); });
  lists('regulatory_phrases').forEach((b) => { if (wre(b).test(body)) issues.push('REGULATORY_CLAIM:' + b); });
  const rowBase = { distribution_hash: j.distribution_hash, job_id: j.job_key, page_id: j.page_id, platform: pf, content_hash: j.cur_hash, image_build_hash: j.build_hash };
  if (issues.length) return { json: Object.assign({}, j, { payload_ok: 'false', outcome: 'MANUAL_REVIEW', qc_status: 'MANUAL_REVIEW', error_code: 'INVALID_CONTENT', error_message: issues.slice(0, 4).join(','), reason: 'content policy: ' + issues.slice(0, 4).join(','), row: Object.assign({}, rowBase, { status: 'MANUAL_REVIEW', attempt: j.attempt, external_post_id: '', published_at: '', error_code: 'INVALID_CONTENT', error_message: issues.slice(0, 4).join(',').slice(0, 200), updated_at: cfg.run_started }) }) };
  let url; let reqBody;
  if (pf === 'instagram') { url = cfg.blotato_post_url; reqBody = { post: { accountId: cfg.ig_account_id, content: { text: cap, platform: 'instagram', mediaUrls: [j.img_url] }, target: { targetType: 'instagram' } } }; }
  else if (pf === 'tiktok') { url = cfg.blotato_post_url; reqBody = { post: { accountId: cfg.tiktok_account_id, content: { text: cap, platform: 'tiktok', mediaUrls: [j.img_url] }, target: { targetType: 'tiktok', privacyLevel: cfg.tiktok_privacy || 'SELF_ONLY', disabledComments: false, disabledDuet: false, disabledStitch: false, isBrandedContent: false, isYourBrand: false, isAiGenerated: false } } }; }
  else { url = cfg.whatsapp_endpoint; reqBody = { channel_id: cfg.whatsapp_channel_id, text: cap, image_url: j.img_url, idempotency_key: j.distribution_hash }; }
  return { json: Object.assign({}, j, { payload_ok: 'true', request_url: url, request_body: reqBody, transport: pf === 'whatsapp' ? 'webhook' : 'blotato', row: Object.assign({}, rowBase, { status: 'PUBLISHING', attempt: j.attempt, external_post_id: '', published_at: '', error_code: '', error_message: '', updated_at: cfg.run_started }) }) };
});
