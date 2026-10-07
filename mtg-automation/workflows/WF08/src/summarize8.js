// Summarize Jobs (WF08): ONE Notion summary write per job (never one per platform, so the ledger cannot be overwritten). Owns ONLY: Distribution Status, Published Platforms, Distribution Ledger, Last Published, Distribution Notes. Nothing is written in DRY_RUN. No write when nothing changed.
const cfg = $('Config').first().json;
if (String(cfg.publish_mode) !== 'LIVE') return [];
const clip = (s, n) => String(s === undefined || s === null ? '' : s).slice(0, n || 1900);
const all = $input.all().map((i) => i.json).filter((j) => j._kind === 'job' && j.page_id);
const byPage = {}; all.forEach((j) => { (byPage[j.page_id] = byPage[j.page_id] || []).push(j); });
const out = [];
Object.keys(byPage).forEach((pid) => {
  const items = byPage[pid]; const first = items[0];
  const jobLevel = items.filter((j) => !j.platform && j.action === 'JOB')[0];
  const plat = items.filter((j) => j.platform && j.action !== 'ROW_UPDATE' || (j.platform && j.action === 'ROW_UPDATE' && j.page_id === pid));
  const prevLedger = String(first.ledger || '').split('\n').filter(Boolean);
  const ledger = prevLedger.slice(); let newlyPublished = false;
  items.forEach((j) => { if (j.outcome === 'PUBLISHED' && j.platform) { const line = [j.platform, j.distribution_hash, j.external_post_id || '', String(j.published_at || cfg.run_date).slice(0, 10)].join('|'); if (!ledger.some((l) => l.split('|')[1] === j.distribution_hash)) { ledger.push(line); newlyPublished = true; } } });
  const ledgerTxt = clip(ledger.slice(-20).join('\n'));
  const state = (j) => (j.outcome === 'PUBLISHED' || j.outcome === 'SKIP_PUBLISHED') ? 'P' : (j.outcome === 'MANUAL_REVIEW' || j.outcome === 'MANUAL_HOLD' || j.outcome === 'VERIFY_PENDING' || j.outcome === 'LOCK_FAILED') ? 'M' : (j.outcome === 'FAILED' || j.outcome === 'WAIT_RETRY') ? 'F' : '';
  const pf = items.filter((j) => j.platform && j.outcome !== 'STALE'); const st = pf.map(state);
  let status = ''; const notes = [];
  if (jobLevel && jobLevel.outcome === 'STALE') { status = 'STALE'; notes.push('STALE: ' + jobLevel.reason); }
  else if (jobLevel && jobLevel.outcome === 'LEGAL_HOLD') { status = 'MANUAL_REVIEW'; notes.push('LEGAL_HOLD: ' + jobLevel.reason); }
  else if (pf.length) {
    const p = st.filter((x) => x === 'P').length;
    if (p && p === pf.length) status = 'PUBLISHED'; else if (p) status = 'PARTIAL'; else if (st.indexOf('M') >= 0) status = 'MANUAL_REVIEW'; else if (st.indexOf('F') >= 0) status = 'FAILED';
    pf.forEach((j) => { if (state(j) !== 'P' && state(j)) notes.push(j.platform + ': ' + j.outcome + (j.error_code ? ' ' + j.error_code : '') + (j.reason ? ' - ' + String(j.reason).slice(0, 100) : '')); });
  }
  if (!status) return;
  const pubList = pf.filter((j) => state(j) === 'P').map((j) => j.platform).filter((x, i, a) => a.indexOf(x) === i);
  const published = pubList.length ? pubList.join(', ') : String(first.published_platforms || '');
  const noteTxt = clip(notes.join('\n'), 1500);
  const changed = status !== first.dist_status || ledgerTxt !== String(first.ledger || '') || (pubList.length && published !== String(first.published_platforms || ''));
  if (!changed) return;
  const P = {}; const sent = {};
  const sel = (k, v) => { P[k] = { select: { name: v } }; sent[k] = v; };
  const txt = (k, v) => { const t = clip(v); P[k] = { rich_text: t ? [{ type: 'text', text: { content: t } }] : [] }; sent[k] = t; };
  sel('Distribution Status', status); txt('Published Platforms', published); txt('Distribution Ledger', ledgerTxt); txt('Distribution Notes', noteTxt || (status === 'PUBLISHED' ? 'all active platforms published' : ''));
  if (newlyPublished) { P['Last Published'] = { date: { start: cfg.run_date } }; sent['Last Published'] = cfg.run_date; }
  out.push({ json: { _kind: 'summary', page_id: pid, job_number: first.job_number || '', job_key: first.job_key || '', dist_status: status, notion_patch_body: { properties: P }, notion_sent: sent, errors: [] } });
});
return out;
