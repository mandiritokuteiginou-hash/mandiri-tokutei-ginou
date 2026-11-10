import {
  JLPT_RANK,
  type Candidate,
  type GateResult,
  type Job,
  type RuleSet,
  type Tri,
} from './types';

const norm = (s: string) => s.normalize('NFKC').trim().toLowerCase();
const gate = (id: string, status: Tri, code: string, text: string): GateResult => ({
  id,
  status,
  code,
  text,
});

/** Case/width-insensitive check that every wanted name is in `have`. Returns missing names, or null if `have` is unknown. */
function missingNames(want: string[], have: string[] | null): string[] | null {
  if (have === null) return null;
  const set = new Set(have.map(norm));
  return want.filter((w) => !set.has(norm(w)));
}

/** Gate 0: personal data may only be processed for matching with recorded consent. */
export function consentGate(c: Candidate): GateResult {
  return c.consentRecorded
    ? gate('consent', 'PASS', 'consent_recorded', 'Candidate consent is recorded.')
    : gate(
        'consent',
        'FAIL',
        'consent_not_recorded',
        'Consent is not recorded; the candidate cannot be matched or contacted.',
      );
}

/** The job itself must be verified and live before anyone is matched to it. */
export function jobVerificationGate(j: Job): GateResult {
  const v = j.verification;
  if (j.lifecycle === 'EXPIRED' || j.lifecycle === 'ARCHIVED')
    return gate('job_verification', 'FAIL', 'job_not_live', `Job is ${j.lifecycle.toLowerCase()}.`);
  if (v.qcStatus === 'QC_REJECTED')
    return gate('job_verification', 'FAIL', 'job_qc_rejected', 'Job was rejected in QC.');
  if (
    v.qcStatus === 'QC_APPROVED' &&
    v.jobVerified &&
    v.sourceVerified &&
    (j.lifecycle === 'APPROVED' || j.lifecycle === 'PUBLISHED')
  )
    return gate(
      'job_verification',
      'PASS',
      'job_verified',
      'Job is QC-approved with verified job and source.',
    );
  return gate(
    'job_verification',
    'UNKNOWN',
    'job_not_fully_verified',
    'Job is not yet QC-approved with verified job and source.',
  );
}

/** Kokunai (in Japan) vs Kokugai (abroad) recruitment eligibility — evaluated separately. */
export function poolGate(c: Candidate, j: Job): GateResult {
  if (j.acceptsPool === 'UNKNOWN')
    return gate(
      'recruitment_pool',
      'UNKNOWN',
      'job_pool_unknown',
      'The job does not state whether it recruits Kokunai or Kokugai candidates.',
    );
  const ok = j.acceptsPool === 'BOTH' || j.acceptsPool === c.pool;
  return ok
    ? gate('recruitment_pool', 'PASS', 'pool_accepted', `Job accepts ${c.pool} candidates.`)
    : gate(
        'recruitment_pool',
        'FAIL',
        'pool_not_accepted',
        `Job recruits ${j.acceptsPool} only; candidate is ${c.pool}.`,
      );
}

/** Overseas applicants need the employer to support the Certificate of Eligibility. */
export function coeGate(c: Candidate, j: Job): GateResult {
  if (c.pool === 'KOKUNAI')
    return gate(
      'coe_support',
      'PASS',
      'coe_not_applicable',
      'Candidate is already in Japan; COE support is not required for matching.',
    );
  if (j.coeSupport === 'CONFIRMED')
    return gate('coe_support', 'PASS', 'coe_confirmed', 'Employer confirmed COE support.');
  if (j.coeSupport === 'DECLINED')
    return gate(
      'coe_support',
      'FAIL',
      'coe_declined',
      'Employer does not support COE for overseas applicants.',
    );
  return gate('coe_support', 'UNKNOWN', 'coe_unknown', 'Employer COE support is not confirmed.');
}

function exemptByIntern2(c: Candidate, j: Job): Tri {
  const g = c.ginouJisshu2;
  if (g.completed === false) return 'FAIL';
  if (g.completed === null) return 'UNKNOWN';
  if (!j.sector) return 'UNKNOWN';
  if (!g.sector) return 'UNKNOWN'; // completed, but related-field status cannot be established
  return norm(g.sector) === norm(j.sector) ? 'PASS' : 'FAIL';
}

/** SSW (Tokutei Ginou) skill-test route. Technical Intern 2 completion in the same sector is an exemption route. */
export function sswSkillGate(c: Candidate, j: Job): GateResult {
  if (!j.sector)
    return gate(
      'visa_skill',
      'UNKNOWN',
      'job_sector_unknown',
      'Job sector is not stated, so the skill test cannot be matched.',
    );
  const sector = norm(j.sector);
  const exempt = exemptByIntern2(c, j);
  if (exempt === 'PASS')
    return gate(
      'visa_skill',
      'PASS',
      'skill_exempt_intern2',
      'Technical Intern Training 2 completed in the same sector.',
    );
  if (c.skillTests !== null) {
    const t = c.skillTests.find((x) => norm(x.sector) === sector);
    if (t?.status === 'PASSED')
      return gate(
        'visa_skill',
        'PASS',
        'skill_test_passed',
        'SSW skill test passed for this sector.',
      );
    if (exempt === 'UNKNOWN')
      return gate(
        'visa_skill',
        'UNKNOWN',
        'intern2_relation_unknown',
        'No passed skill test; Intern 2 exemption cannot be established from the data.',
      );
    return gate(
      'visa_skill',
      'FAIL',
      t?.status === 'SCHEDULED' ? 'skill_test_scheduled' : 'skill_test_not_passed',
      t?.status === 'SCHEDULED'
        ? 'SSW skill test is scheduled but not yet passed.'
        : 'No passed SSW skill test for this sector.',
    );
  }
  return gate('visa_skill', 'UNKNOWN', 'skill_test_unknown', 'SSW skill test status is unknown.');
}

/** SSW Japanese-language requirement (JFT-Basic A2 or JLPT >= configured level), or Intern 2 exemption. */
export function sswLanguageGate(c: Candidate, j: Job, rules: RuleSet): GateResult {
  const need = JLPT_RANK[rules.sswMinJlpt];
  if (exemptByIntern2(c, j) === 'PASS')
    return gate(
      'visa_language',
      'PASS',
      'language_exempt_intern2',
      'Technical Intern Training 2 completed in the same sector.',
    );
  if (c.jftBasicA2 === true)
    return gate('visa_language', 'PASS', 'jft_basic_a2', 'JFT-Basic A2 passed.');
  if (c.jlpt && c.jlpt !== 'NONE' && JLPT_RANK[c.jlpt] >= need)
    return gate(
      'visa_language',
      'PASS',
      'jlpt_meets_ssw',
      `JLPT ${c.jlpt} meets the SSW minimum ${rules.sswMinJlpt}.`,
    );
  if (c.jlpt === null && c.jftBasicA2 === null)
    return gate(
      'visa_language',
      'UNKNOWN',
      'language_unknown',
      'Japanese-language qualification is unknown.',
    );
  if (c.jlpt === null || c.jftBasicA2 === null)
    return gate(
      'visa_language',
      'UNKNOWN',
      'language_partially_known',
      'Japanese-language evidence is incomplete.',
    );
  return gate(
    'visa_language',
    'FAIL',
    'language_below_ssw',
    `Neither JFT-Basic A2 nor JLPT ${rules.sswMinJlpt}+ is held.`,
  );
}

/** Gijinkoku: never auto-FAIL — the legal basis (degree / experience / relation to duties) needs human review. */
export function gijinkokuGate(c: Candidate): GateResult {
  if (c.degree === 'BACHELOR' || c.degree === 'MASTER')
    return gate(
      'visa_gijinkoku',
      'PASS',
      'degree_present',
      'Bachelor/Master degree present (duty relation still requires human review).',
    );
  return gate(
    'visa_gijinkoku',
    'UNKNOWN',
    'gijinkoku_needs_review',
    'Engineer/Specialist in Humanities eligibility cannot be decided automatically.',
  );
}

/** Job-stated mandatory Japanese level. Preferred levels only affect score. */
export function jlptRequirementGate(c: Candidate, j: Job): GateResult | null {
  const r = j.requirements.jlpt;
  if (r.kind === 'unknown')
    return gate(
      'language_requirement',
      'UNKNOWN',
      'job_language_requirement_unknown',
      'The job does not state a Japanese-language requirement.',
    );
  if (r.kind === 'none' || !r.mandatory) return null;
  if (c.jlpt === null)
    return gate(
      'language_requirement',
      'UNKNOWN',
      'candidate_jlpt_unknown',
      `JLPT ${r.level} is required; candidate level is unknown.`,
    );
  const have = c.jlpt === 'NONE' ? 0 : JLPT_RANK[c.jlpt];
  return have >= JLPT_RANK[r.level]
    ? gate(
        'language_requirement',
        'PASS',
        'jlpt_requirement_met',
        `JLPT ${c.jlpt} meets required ${r.level}.`,
      )
    : gate(
        'language_requirement',
        'FAIL',
        'jlpt_requirement_not_met',
        `JLPT ${r.level} is mandatory; candidate holds ${c.jlpt}.`,
      );
}

function namesGate(
  id: string,
  label: string,
  r: { kind: string; mandatory?: boolean; names?: string[] },
  have: string[] | null,
): GateResult | null {
  if (r.kind === 'unknown')
    return gate(
      id,
      'UNKNOWN',
      `job_${id}_unknown`,
      `The job does not state ${label} requirements.`,
    );
  if (r.kind === 'none' || !r.mandatory) return null;
  const missing = missingNames(r.names ?? [], have);
  if (missing === null)
    return gate(id, 'UNKNOWN', `candidate_${id}_unknown`, `Candidate ${label} are unknown.`);
  return missing.length === 0
    ? gate(id, 'PASS', `${id}_met`, `All mandatory ${label} are held.`)
    : gate(id, 'FAIL', `${id}_missing`, `Missing mandatory ${label}: ${missing.join(', ')}.`);
}
export const certificateGate = (c: Candidate, j: Job) =>
  namesGate('certificates', 'certificates', j.requirements.certificates, c.certificates);
export const skillsGate = (c: Candidate, j: Job) =>
  namesGate('skills', 'skills', j.requirements.skills, c.skills);

export function experienceGate(c: Candidate, j: Job): GateResult | null {
  const r = j.requirements.experience;
  if (r.kind === 'unknown')
    return gate(
      'experience',
      'UNKNOWN',
      'job_experience_unknown',
      'The job does not state an experience requirement.',
    );
  if (r.kind === 'none' || !r.mandatory) return null;
  if (c.experience === null)
    return gate(
      'experience',
      'UNKNOWN',
      'candidate_experience_unknown',
      'Candidate experience is unknown.',
    );
  const years = c.experience
    .filter((e) => !r.sector || norm(e.sector) === norm(r.sector))
    .reduce((a, e) => a + e.years, 0);
  return years >= r.minYears
    ? gate(
        'experience',
        'PASS',
        'experience_met',
        `${years} years meets the required ${r.minYears}.`,
      )
    : gate(
        'experience',
        'FAIL',
        'experience_not_met',
        `${years} years is below the mandatory ${r.minYears}${r.sector ? ` in ${r.sector}` : ''}.`,
      );
}

/** Location is a hard gate only when the candidate declared an explicit mobility limit. */
export function locationGate(c: Candidate, j: Job): GateResult {
  const limit = c.mobilityRestrictedTo ?? [];
  if (limit.length === 0)
    return gate(
      'location',
      'PASS',
      'no_mobility_limit',
      'Candidate has no declared location limit.',
    );
  if (!j.prefecture)
    return gate(
      'location',
      'UNKNOWN',
      'job_location_unknown',
      'Job location is unknown but the candidate has a location limit.',
    );
  return limit.map(norm).includes(norm(j.prefecture))
    ? gate(
        'location',
        'PASS',
        'location_allowed',
        `Job prefecture ${j.prefecture} is within the candidate's limit.`,
      )
    : gate(
        'location',
        'FAIL',
        'location_not_allowed',
        `Job prefecture ${j.prefecture} is outside the candidate's declared limit.`,
      );
}

export function runGates(c: Candidate, j: Job, rules: RuleSet): GateResult[] {
  const visa =
    j.visaTrack === 'TG'
      ? [sswSkillGate(c, j), sswLanguageGate(c, j, rules)]
      : j.visaTrack === 'GIJINKOKU'
        ? [gijinkokuGate(c)]
        : [
            gate(
              'visa_track',
              'UNKNOWN',
              'visa_track_unknown',
              'The job does not state a visa track (TG / Gijinkoku).',
            ),
          ];
  return [
    consentGate(c),
    jobVerificationGate(j),
    poolGate(c, j),
    coeGate(c, j),
    ...visa,
    jlptRequirementGate(c, j),
    certificateGate(c, j),
    experienceGate(c, j),
    skillsGate(c, j),
    locationGate(c, j),
  ].filter((g): g is GateResult => g !== null);
}

export const overallOf = (gates: GateResult[]): Tri =>
  gates.some((g) => g.status === 'FAIL')
    ? 'FAIL'
    : gates.some((g) => g.status === 'UNKNOWN')
      ? 'UNKNOWN'
      : 'PASS';
