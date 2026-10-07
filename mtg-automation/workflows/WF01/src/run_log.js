// Run Log: one summary row per run.
const cfg = $('Config').first().json;
const items = $input.all().map((x) => x.json);
const cnt = (st) => items.filter((j) => j._kind === 'outcome' && j.status === st).length;
const metas = items.filter((j) => j._kind === 'meta');
const errs = items.filter((j) => j._kind === 'error');
const found = metas.reduce((a, j) => a + (Number(j.rows_found) || 0), 0);
const outcomes = items.filter((j) => j._kind === 'outcome' && j.job_key);
const written = items.filter((j) => j._kind === 'outcome' && j.status === 'WRITTEN_VERIFIED');
const tasks = $('Build Search Tasks').all();
const summary = {
  run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(),
  sources_enabled: 'hellowork', sources_disabled: (tasks[0] && tasks[0].json.sources_disabled) || '',
  tasks: tasks.length, fetch_errors: errs.length, listings_found: found,
  duplicates_skipped_by_cache: Math.max(0, found - outcomes.length - 0),
  new_after_dedup: outcomes.length,
  prefilter_rejected: cnt('REJECT_PREFILTER'), deferred: cnt('DEFERRED'),
  ai_errors: cnt('AI_ERROR'), detail_fetch_errors: cnt('FETCH_DETAIL_ERROR'),
  gate_rejected: cnt('REJECT_GATE'), ai_screen_rejected: cnt('REJECT_AI_SCREEN'), below_threshold: cnt('REJECT_QUALITY'),
  notion_duplicates: cnt('NOTION_DUPLICATE'), notion_errors: cnt('NOTION_ERROR'), verify_failed: cnt('VERIFY_FAILED'),
  written_verified: written.length, high_priority: written.filter((j) => j.score && j.score.total >= 90).length
};
const candidates = written.map((j) => ({ job_key: j.job_key, title: String(j.title || '').slice(0, 60), company: j.company, score: j.score && j.score.total, url: j.notion_url }));
return [{ json: Object.assign({}, summary, { final_candidates_json: JSON.stringify(candidates).slice(0, 3000) }) }];
