/** Three-valued gate result. UNKNOWN is never treated as PASS anywhere in this module. */
export type Tri = 'PASS' | 'FAIL' | 'UNKNOWN';

export type PoolType = 'KOKUNAI' | 'KOKUGAI'; // already in Japan / still abroad
export type JobPoolAcceptance = 'KOKUNAI' | 'KOKUGAI' | 'BOTH' | 'UNKNOWN';
export type Jlpt = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export const JLPT_RANK: Record<Jlpt, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };

/**
 * A job requirement is tri-state so that we never invent requirements:
 *  - unknown  : the source does not say (kept as UNKNOWN, never assumed absent)
 *  - none     : the source explicitly says nothing is required
 *  - required : stated; `mandatory` separates hard requirements from preferred ones
 */
export type Req<T> =
  { kind: 'unknown' } | { kind: 'none' } | ({ kind: 'required'; mandatory: boolean } & T);

export interface SalaryTerms {
  /** Basic (base) monthly pay, excluding fixed overtime, allowances and bonuses. */
  baseMonthly?: number | null;
  /** Base hourly wage if the posting is hourly. */
  hourlyBase?: number | null;
  /** Hours per month the base wage covers (needed to compare with hourly minimum wage). */
  scheduledMonthlyHours?: number | null;
  /** Fixed / deemed overtime pay included in the monthly figure. */
  fixedOvertimeMonthly?: number | null;
  allowancesMonthly?: number | null;
  bonusAnnual?: number | null;
  takeHomeMonthly?: number | null;
  /** A gross figure whose composition is not specified by the source (e.g. a min–max range). */
  grossMonthlyStated?: number | null;
}

export interface JobVerification {
  qcStatus: 'QC_APPROVED' | 'QC_REVIEW' | 'QC_REJECTED';
  jobVerified: boolean;
  sourceVerified: boolean;
  employerVerified: boolean;
}

export type JobLifecycle =
  'DRAFT' | 'QC_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export interface Job {
  id: string;
  jobNumber?: string | null;
  title: string;
  sector: string | null;
  visaTrack: 'TG' | 'GIJINKOKU' | null;
  acceptsPool: JobPoolAcceptance;
  /** Employer willing to process the Certificate of Eligibility for overseas applicants. Only from employer evidence. */
  coeSupport: 'CONFIRMED' | 'DECLINED' | 'UNKNOWN';
  prefecture: string | null;
  employerKey?: string | null;
  sourceUrl?: string | null;
  lifecycle: JobLifecycle;
  verification: JobVerification;
  requirements: {
    jlpt: Req<{ level: Jlpt }>;
    certificates: Req<{ names: string[] }>;
    experience: Req<{ minYears: number; sector?: string }>;
    skills: Req<{ names: string[] }>;
    preferredSkills: string[];
  };
  salary: SalaryTerms;
  dormitory?: boolean | null;
}

export type Degree = 'NONE' | 'VOCATIONAL' | 'BACHELOR' | 'MASTER';

export interface Candidate {
  id: string;
  pool: PoolType;
  /** Matching requires recorded consent (UU PDP / privacy-first pool). */
  consentRecorded: boolean;
  /** null = not provided. Arrays use null for "unknown" and [] for "known: none". */
  jlpt: Jlpt | 'NONE' | null;
  jftBasicA2: boolean | null;
  skillTests: { sector: string; status: 'PASSED' | 'SCHEDULED' | 'NOT_YET' }[] | null;
  ginouJisshu2: { completed: boolean | null; sector?: string | null };
  degree: Degree | null;
  certificates: string[] | null;
  experience: { sector: string; years: number }[] | null;
  skills: string[] | null;
  preferredPrefectures: string[];
  /** Explicit hard mobility limit set by the candidate. Empty/undefined = no limit. */
  mobilityRestrictedTo?: string[];
  preferredSectors?: string[];
  wantsDormitory?: boolean | null;
  expectedMonthlySalary?: number | null;
}

export interface MinimumWageTable {
  /** Hourly minimum wage (JPY) by prefecture name. Must be supplied from an official source — never hard-coded here. */
  byPrefecture: Record<string, number>;
  effectiveFrom: string;
  source: string;
}

export interface RuleSet {
  version: string;
  /** Minimum JLPT for the SSW language requirement (configurable; confirm with legal/owner). */
  sswMinJlpt: Jlpt;
  weights: {
    skills: number;
    japanese: number;
    salary: number;
    experience: number;
    location: number;
    preferences: number;
  };
  /** Below this share of weight with known data, a result is flagged low-confidence. */
  minCompleteness: number;
}

export const DEFAULT_SALARY_BASELINE_JPY = 200_000;

export const DEFAULT_RULES: RuleSet = {
  version: 'mtg-match-rules/0.1.0',
  sswMinJlpt: 'N4',
  weights: { skills: 25, japanese: 20, salary: 20, experience: 15, location: 10, preferences: 10 },
  minCompleteness: 0.5,
};

export interface MatchContext {
  rules?: RuleSet;
  salaryBaselineJpy?: number;
  minimumWages?: MinimumWageTable | null;
}

export interface GateResult {
  id: string;
  status: Tri;
  /** Machine-readable reason (stable, for i18n). */
  code: string;
  /** English explanation for operators. */
  text: string;
}

export type SalaryVerdict = 'ACCEPTABLE' | 'REVIEW' | 'BELOW_BASELINE' | 'BELOW_MINIMUM_WAGE';

export interface SalaryEvaluation {
  baselineJpy: number;
  baseMonthly: number | null;
  grossMonthly: number | null;
  fixedOvertimeMonthly: number | null;
  allowancesMonthly: number | null;
  bonusAnnual: number | null;
  takeHomeMonthly: number | null;
  hourlyBase: number | null;
  baseline: Tri;
  minimumWage: Tri;
  minimumWageJpy: number | null;
  dependsOnFixedOvertime: boolean;
  verdict: SalaryVerdict;
  notes: string[];
}

export interface FactorScore {
  score: number | null; // 0..100, null when the data needed is unknown
  weight: number;
  text: string;
}

export type EligibilityClass = 'ELIGIBLE' | 'NEEDS_REVIEW' | 'INELIGIBLE';

export interface MatchResult {
  ruleVersion: string;
  candidateId: string;
  jobId: string;
  eligibility: { overall: Tri; class: EligibilityClass; gates: GateResult[] };
  score: {
    total: number | null; // null when ineligible or nothing scorable
    completeness: number; // 0..1 share of weight backed by known data
    lowConfidence: boolean;
    factors: Record<keyof RuleSet['weights'], FactorScore>;
  };
  salary: SalaryEvaluation;
  missingRequirements: string[];
  unknowns: string[];
  risks: { code: string; severity: 'low' | 'medium' | 'high'; text: string }[];
  explanation: string[];
  recommendedNextAction:
    'DO_NOT_PROPOSE' | 'COLLECT_MISSING_INFORMATION' | 'HOLD_FOR_QC' | 'HUMAN_REVIEW_THEN_PROPOSE';
  /** Always true: this engine is advisory; a person must approve any outward action. */
  humanApprovalRequired: true;
  /** Hash of the normalised inputs + rule version, for reproducibility checks (not cryptographic). */
  inputFingerprint: string;
}
