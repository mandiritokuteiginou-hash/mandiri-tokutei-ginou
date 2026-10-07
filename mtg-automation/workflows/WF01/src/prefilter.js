// Pre-Filter (deterministic, zero AI cost). Rejects obvious traps; caps AI workload per run.
const cfg = $('Config').first().json;
const maxAi = Number(cfg.max_ai_jobs) || 40;
const AGENCY = /協同組合|事業協同|登録支援機関|登録支援|人材派遣|人材紹介|職業紹介|人材センター|人材サービス|スタッフィング|スタッフサービス|派遣/;
const PLATFORM = /デルタマーケティング|京進|グローバル・ビジネス・ネットワーク|ヒノデ|日の出|求人ボックス/;
const out = [];
const seen = {};
let accepted = 0;
for (const it of $input.all()) {
  const j = it.json;
  if (seen[j.job_key]) continue; // same job found by several sector queries in this run
  seen[j.job_key] = true;
  let status = 'candidate';
  let reason = '';
  const nameBlob = (j.company || '');
  if (AGENCY.test(nameBlob)) { status = 'REJECT_PREFILTER'; reason = 'PF1 agency/co-op/dispatch company name'; }
  else if (PLATFORM.test(nameBlob)) { status = 'REJECT_PREFILTER'; reason = 'PF1 platform operator name'; }
  else if (!j.job_number || !j.detail_url) { status = 'REJECT_PREFILTER'; reason = 'PF2 missing job number or detail url'; }
  else if (/^HW-/.test(j.job_key) && !/^\d{5}-\d{8}$/.test(j.job_number)) { status = 'REJECT_PREFILTER'; reason = 'PF2 malformed job number'; }
  else if (accepted >= maxAi) { status = 'DEFERRED'; reason = 'PF9 per-run AI cap reached (' + maxAi + '); retried next run'; }
  if (status === 'candidate') accepted++;
  const cand = status === 'candidate';
  out.push({ json: Object.assign({}, j, { is_candidate: cand, _kind: cand ? 'job' : 'outcome', status: cand ? 'CANDIDATE' : status, reason: reason }) });
}
return out;
