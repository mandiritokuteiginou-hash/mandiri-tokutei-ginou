import { aggregate, scoreFactors } from './score';
import { evaluateSalary } from './salary';
import { overallOf, runGates } from './gates';
import {
  DEFAULT_RULES,
  DEFAULT_SALARY_BASELINE_JPY,
  type Candidate,
  type EligibilityClass,
  type Job,
  type MatchContext,
  type MatchResult,
} from './types';

/** Stable stringify (sorted keys) + FNV-1a x2. For reproducibility checks only; NOT cryptographic. */
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
    .join(',')}}`;
}
function fnv(s: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
export const fingerprint = (v: unknown) => {
  const s = stable(v);
  return fnv(s, 0x811c9dc5) + fnv(s, 0x9747b28c);
};

/**
 * Pure and deterministic: same inputs + same rules => identical result (no clock, no randomness, no I/O).
 * Eligibility gates are evaluated first; scoring never influences them. No AI input is accepted here.
 */
export function evaluateMatch(candidate: Candidate, job: Job, ctx: MatchContext = {}): MatchResult {
  const rules = ctx.rules ?? DEFAULT_RULES;
  const baselineJpy = ctx.salaryBaselineJpy ?? DEFAULT_SALARY_BASELINE_JPY;
  const gates = runGates(candidate, job, rules);
  const overall = overallOf(gates);
  const cls: EligibilityClass =
    overall === 'PASS' ? 'ELIGIBLE' : overall === 'UNKNOWN' ? 'NEEDS_REVIEW' : 'INELIGIBLE';

  const salary = evaluateSalary(job.salary, job.prefecture, {
    baselineJpy,
    minimumWages: ctx.minimumWages,
  });
  const factors = scoreFactors(candidate, job, rules, salary);
  const agg = cls === 'INELIGIBLE' ? { total: null, completeness: 0 } : aggregate(factors);

  const missingRequirements = gates.filter((g) => g.status === 'FAIL').map((g) => g.text);
  const unknowns = gates.filter((g) => g.status === 'UNKNOWN').map((g) => g.text);

  const risks: MatchResult['risks'] = [];
  if (salary.verdict === 'BELOW_MINIMUM_WAGE')
    risks.push({
      code: 'below_minimum_wage',
      severity: 'high',
      text: `Base hourly wage is below the local minimum wage (¥${salary.minimumWageJpy}).`,
    });
  if (salary.verdict === 'BELOW_BASELINE')
    risks.push({
      code: 'below_baseline',
      severity: 'high',
      text: `Base pay is below the ¥${baselineJpy.toLocaleString('en-US')} baseline.`,
    });
  if (salary.dependsOnFixedOvertime)
    risks.push({
      code: 'baseline_depends_on_overtime',
      severity: 'medium',
      text: 'Baseline is only reached by counting fixed overtime or allowances.',
    });
  if (salary.verdict === 'REVIEW')
    risks.push({
      code: 'salary_needs_review',
      severity: 'medium',
      text: 'Salary data is incomplete; it cannot be called acceptable.',
    });
  if (
    candidate.expectedMonthlySalary != null &&
    salary.grossMonthly !== null &&
    salary.grossMonthly < candidate.expectedMonthlySalary
  )
    risks.push({
      code: 'below_candidate_expectation',
      severity: 'low',
      text: "Stated pay is below the candidate's expectation.",
    });
  if (job.verification.employerVerified === false)
    risks.push({
      code: 'employer_unverified',
      severity: 'medium',
      text: 'Employer is not verified.',
    });
  const lowConfidence = cls !== 'INELIGIBLE' && agg.completeness < rules.minCompleteness;
  if (lowConfidence)
    risks.push({
      code: 'low_data_completeness',
      severity: 'medium',
      text: `Only ${Math.round(agg.completeness * 100)}% of the score is backed by known data.`,
    });

  let next: MatchResult['recommendedNextAction'];
  if (cls === 'INELIGIBLE') next = 'DO_NOT_PROPOSE';
  else if (salary.verdict === 'BELOW_MINIMUM_WAGE') next = 'HOLD_FOR_QC';
  else if (cls === 'NEEDS_REVIEW' || lowConfidence) next = 'COLLECT_MISSING_INFORMATION';
  else next = 'HUMAN_REVIEW_THEN_PROPOSE';

  const explanation = [
    `Eligibility ${overall}: ${gates.filter((g) => g.status === 'PASS').length} pass, ${gates.filter((g) => g.status === 'UNKNOWN').length} unknown, ${gates.filter((g) => g.status === 'FAIL').length} fail.`,
    ...gates.map((g) => `[${g.status}] ${g.id}: ${g.text}`),
    cls === 'INELIGIBLE'
      ? 'Not scored: a hard eligibility gate failed.'
      : `Score ${agg.total ?? 'n/a'} from known factors (${Math.round(agg.completeness * 100)}% of weight).`,
    ...Object.entries(factors).map(
      ([k, v]) => `${k} (w${v.weight}): ${v.score === null ? 'not scored' : v.score} - ${v.text}`,
    ),
  ];

  return {
    ruleVersion: rules.version,
    candidateId: candidate.id,
    jobId: job.id,
    eligibility: { overall, class: cls, gates },
    score: { total: agg.total, completeness: agg.completeness, lowConfidence, factors },
    salary,
    missingRequirements,
    unknowns,
    risks,
    explanation,
    recommendedNextAction: next,
    humanApprovalRequired: true,
    inputFingerprint: fingerprint({
      candidate,
      job,
      rules,
      baselineJpy,
      minimumWages: ctx.minimumWages ?? null,
    }),
  };
}

export interface AiAssist {
  score: number;
  rationale?: string;
  model?: string;
}
export interface RankedMatch {
  result: MatchResult;
  rank: number;
  adjustedScore: number;
  aiAdjustment: number;
  aiAssist: AiAssist | null;
}

const CLASS_ORDER: Record<EligibilityClass, number> = {
  ELIGIBLE: 0,
  NEEDS_REVIEW: 1,
  INELIGIBLE: 2,
};
/** Maximum points an AI suggestion may move a candidate within its eligibility class. */
export const AI_MAX_ADJUSTMENT = 5;

/**
 * Ranks matches. Ineligible results are excluded. The AI suggestion is bounded (+/-5) and acts only as a
 * tie-breaker WITHIN an eligibility class: it cannot change a gate, an eligibility class, or let a
 * NEEDS_REVIEW result outrank an ELIGIBLE one.
 */
export function rankMatches(
  results: MatchResult[],
  ai: Record<string, AiAssist | undefined> = {},
): RankedMatch[] {
  const rows = results
    .filter((r) => r.eligibility.class !== 'INELIGIBLE')
    .map((r) => {
      const a = ai[`${r.candidateId}:${r.jobId}`] ?? null;
      const raw =
        a && Number.isFinite(a.score)
          ? ((Math.max(0, Math.min(100, a.score)) - 50) / 50) * AI_MAX_ADJUSTMENT
          : 0;
      return {
        result: r,
        aiAssist: a,
        aiAdjustment: raw,
        adjustedScore: (r.score.total ?? 0) + raw,
      };
    })
    .sort(
      (x, y) =>
        CLASS_ORDER[x.result.eligibility.class] - CLASS_ORDER[y.result.eligibility.class] ||
        y.adjustedScore - x.adjustedScore ||
        x.result.jobId.localeCompare(y.result.jobId) ||
        x.result.candidateId.localeCompare(y.result.candidateId),
    );
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
