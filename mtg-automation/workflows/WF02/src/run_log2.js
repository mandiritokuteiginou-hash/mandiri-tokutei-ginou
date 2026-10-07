// Run Log (WF02): counters for the whole run (single row).
const cfg = $('Config').first().json;
const all = $input.all().map((i) => i.json);
const q = all.filter((j) => j._kind === 'qc_row');
const cnt = (f) => q.filter(f).length;
const errs = [].concat.apply([], all.map((j) => Array.isArray(j.errors) ? j.errors : []));
const ec = (st) => errs.filter((e) => e.stage === st).length;
const dec = {}; q.forEach((j) => { dec[j.decision] = (dec[j.decision] || 0) + 1; });
const why = {}; q.forEach((j) => { Object.keys(j.checks || {}).forEach((k) => { if (j.checks[k] !== 'PASS') why[k + ':' + j.checks[k]] = (why[k + ':' + j.checks[k]] || 0) + 1; }); });
const meta = all.filter((j) => j._kind === 'meta')[0];
return [{ json: { run_id: cfg.run_id, started_at: cfg.run_started, finished_at: new Date().toISOString(), queue_status: meta ? meta.status : 'OK', queued: q.length, approved: cnt((j) => j.decision === 'APPROVED'), review: cnt((j) => j.decision === 'REVIEW'), rejected: cnt((j) => j.decision === 'REJECT'), written_ok: cnt((j) => j.write_status === 'OK'), write_errors: cnt((j) => j.write_status === 'NOTION_ERROR'), verify_failed: cnt((j) => j.write_status === 'VERIFY_FAILED'), source_errors: ec('source_fetch'), registry_errors: ec('registry'), ai_errors: ec('ai_verify'), company_written: all.filter((j) => j._kind === 'company_write' && /_OK$/.test(String(j.status))).length, company_errors: all.filter((j) => j._kind === 'company_write' && !/_OK$/.test(String(j.status))).length, summary_json: JSON.stringify({ decisions: dec, non_pass_checks: why }).slice(0, 4000) } }];
