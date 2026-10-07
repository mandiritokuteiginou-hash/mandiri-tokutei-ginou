const cfg = $('Config').first().json;
const all = $input.all().map((i) => i.json);
const jobs = all.filter((j) => j._kind === 'job' || j._kind === 'write_row');
const w = all.filter((j) => j._kind === 'write_row');
const meta = all.filter((j) => j._kind === 'meta')[0];
const errs = [].concat.apply([], all.map((j) => Array.isArray(j.errors) ? j.errors : []));
const o = (x) => jobs.filter((j) => j.outcome === x).length;
return [{ json: { run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(), queue_status: meta ? meta.status : 'OK', seen: jobs.length, awaiting_regen: o('AWAITING_REGEN'), deferred: o('DEFERRED_CAP') + o('DEFERRED_NO_AI'), still_valid: o('STILL_VALID'), approved: o('APPROVED'), revision_required: o('REVISION_REQUIRED'), rejected: o('REJECTED'), stale: o('STALE'), manual_review: o('MANUAL_REVIEW'), written_ok: w.filter((j) => j.write_status === 'OK').length, write_errors: w.filter((j) => j.write_status === 'NOTION_ERROR').length, verify_failed: w.filter((j) => j.write_status === 'VERIFY_FAILED').length, ai_errors: errs.filter((e) => e.stage === 'ai_qc').length, summary_json: JSON.stringify({ flagged: w.filter((j) => (j.flags || []).length).map((j) => j.job_number + ': ' + j.qc_decision + ' ' + j.flags.slice(0, 3).join('|')).slice(0, 12) }).slice(0, 3000) } }];
