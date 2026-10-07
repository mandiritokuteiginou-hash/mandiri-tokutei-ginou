const cfg = $('Config').first().json;
const all = $input.all().map((i) => i.json);
const jobs = all.filter((j) => j._kind === 'job' || j._kind === 'write_row');
const w = all.filter((j) => j._kind === 'write_row');
const meta = all.filter((j) => j._kind === 'meta')[0];
const errs = [].concat.apply([], all.map((j) => Array.isArray(j.errors) ? j.errors : []));
const c = (f) => jobs.filter(f).length;
return [{ json: { run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(), queue_status: meta ? meta.status : 'OK', seen: jobs.length, not_eligible: c((j) => j.action === 'NOT_ELIGIBLE'), insufficient_facts: c((j) => j.action === 'INSUFFICIENT_FACTS'), skipped_unchanged: c((j) => j.action === 'SKIP_UNCHANGED'), drafted: w.length, drafted_ai: w.filter((j) => j.method === 'AI').length, drafted_template: w.filter((j) => j.method === 'TEMPLATE').length, written_ok: w.filter((j) => j.write_status === 'OK').length, write_errors: w.filter((j) => j.write_status === 'NOTION_ERROR').length, verify_failed: w.filter((j) => j.write_status === 'VERIFY_FAILED').length, ai_errors: errs.filter((e) => e.stage === 'ai_content').length, summary_json: JSON.stringify({ issues: w.filter((j) => (j.issues || []).length).map((j) => j.job_number + ': ' + j.issues.slice(0, 2).join('|')).slice(0, 10) }).slice(0, 3000) } }];
