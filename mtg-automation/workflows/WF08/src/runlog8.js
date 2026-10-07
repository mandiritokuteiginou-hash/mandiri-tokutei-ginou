const cfg = $('Config').first().json;
const all = $input.all().map((i) => i.json);
const jobs = all.filter((j) => j._kind === 'job');
const meta = all.filter((j) => j._kind === 'meta')[0];
const o = (x) => jobs.filter((j) => j.outcome === x).length;
return [{ json: { run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(), queue_status: meta ? meta.status : 'OK', publish_mode: String(cfg.publish_mode || 'DRY_RUN'), seen: jobs.length, not_eligible: o('NOT_ELIGIBLE'), stale: o('STALE'), legal_hold: o('LEGAL_HOLD'), skipped_published: o('SKIP_PUBLISHED'), dry_run: o('DRY_RUN'), published: o('PUBLISHED'), failed: o('FAILED') + o('LOCK_FAILED'), manual_review: o('MANUAL_REVIEW') + o('MANUAL_HOLD') + o('VERIFY_PENDING'), deferred: o('DEFERRED_CAP'), waiting_retry: o('WAIT_RETRY'), summary_json: JSON.stringify({ attention: jobs.filter((j) => ['FAILED', 'MANUAL_REVIEW', 'VERIFY_PENDING', 'LEGAL_HOLD', 'STALE', 'LOCK_FAILED'].indexOf(j.outcome) >= 0).map((j) => (j.job_number || j.job_key) + ' ' + (j.platform || '-') + ' ' + j.outcome + ' ' + (j.error_code || '')).slice(0, 15) }).slice(0, 3000) } }];
