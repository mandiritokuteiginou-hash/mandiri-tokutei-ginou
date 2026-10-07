// Shape rows (WF04): one enrichment log row per field decision for jobs that were processed (incl. unchanged, so the audit trail shows why a value stayed Unknown).
const cfg = $('Config').first().json;
const rows = [];
for (const it of $input.all()) {
  const j = it.json; if (j._kind !== 'write_row' && j._kind !== 'enriched') continue;
  (j.rows || []).forEach((r) => rows.push({ json: { run_id: cfg.run_id, ts: cfg.run_started, job_number: String(j.job_number || ''), page_id: String(j.page_id || ''), mtg_job_id: String(j.mtg_job_id || ''), field: String(r.field || ''), old_value: String(r.old_value || '').slice(0, 200), new_value: String(r.new_value || '').slice(0, 200), source_url: String(j.source_url || '').slice(0, 300), evidence: String(r.evidence || '').slice(0, 300), confidence: String(r.confidence || r.source || ''), changed: String(r.changed || 'false'), write_status: String(j.write_status || (j._kind === 'enriched' ? j.outcome : '')) } }));
}
return rows;
