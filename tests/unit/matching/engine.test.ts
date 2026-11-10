import { describe, expect, it } from 'vitest';
import { evaluateMatch, rankMatches, type GateResult } from '../../../packages/shared/src';
import { candidate, ctx, job } from './fixtures';

const gate = (r: ReturnType<typeof evaluateMatch>, id: string): GateResult => {
  const g = r.eligibility.gates.find((x) => x.id === id);
  if (!g) throw new Error(`gate ${id} missing`);
  return g;
};

describe('baseline: fully known, eligible case', () => {
  it('is ELIGIBLE with a score and requires human approval', () => {
    const r = evaluateMatch(candidate(), job(), ctx);
    expect(r.eligibility.overall).toBe('PASS');
    expect(r.eligibility.class).toBe('ELIGIBLE');
    expect(r.humanApprovalRequired).toBe(true);
    expect(r.recommendedNextAction).not.toBe('DO_NOT_PROPOSE');
  });
});

describe('Kokunai vs Kokugai eligibility', () => {
  it('Kokunai candidate fails a Kokugai-only job', () => {
    const r = evaluateMatch(candidate({ pool: 'KOKUNAI' }), job({ acceptsPool: 'KOKUGAI' }), ctx);
    expect(gate(r, 'recruitment_pool').status).toBe('FAIL');
    expect(r.eligibility.class).toBe('INELIGIBLE');
  });
  it('Kokugai candidate fails a Kokunai-only job', () => {
    expect(
      gate(
        evaluateMatch(candidate({ pool: 'KOKUGAI' }), job({ acceptsPool: 'KOKUNAI' }), ctx),
        'recruitment_pool',
      ).status,
    ).toBe('FAIL');
  });
  it('unknown job pool is UNKNOWN, not PASS', () => {
    const r = evaluateMatch(candidate(), job({ acceptsPool: 'UNKNOWN' }), ctx);
    expect(gate(r, 'recruitment_pool').status).toBe('UNKNOWN');
    expect(r.eligibility.class).toBe('NEEDS_REVIEW');
  });
  it('Kokugai needs confirmed employer COE support', () => {
    const k = candidate({ pool: 'KOKUGAI' });
    expect(
      gate(evaluateMatch(k, job({ coeSupport: 'CONFIRMED' }), ctx), 'coe_support').status,
    ).toBe('PASS');
    expect(gate(evaluateMatch(k, job({ coeSupport: 'UNKNOWN' }), ctx), 'coe_support').status).toBe(
      'UNKNOWN',
    );
    expect(gate(evaluateMatch(k, job({ coeSupport: 'DECLINED' }), ctx), 'coe_support').status).toBe(
      'FAIL',
    );
  });
  it('COE is not required for Kokunai candidates', () => {
    expect(
      gate(evaluateMatch(candidate(), job({ coeSupport: 'DECLINED' }), ctx), 'coe_support').status,
    ).toBe('PASS');
  });
});

describe('consent and job verification gates', () => {
  it('no consent => INELIGIBLE and not scored', () => {
    const r = evaluateMatch(candidate({ consentRecorded: false }), job(), ctx);
    expect(gate(r, 'consent').status).toBe('FAIL');
    expect(r.score.total).toBeNull();
  });
  it('unverified or unpublished job is never PASS', () => {
    const r = evaluateMatch(
      candidate(),
      job({
        lifecycle: 'QC_REVIEW',
        verification: {
          qcStatus: 'QC_REVIEW',
          jobVerified: false,
          sourceVerified: false,
          employerVerified: false,
        },
      }),
      ctx,
    );
    expect(gate(r, 'job_verification').status).toBe('UNKNOWN');
  });
  it('expired job fails', () => {
    expect(
      gate(evaluateMatch(candidate(), job({ lifecycle: 'EXPIRED' }), ctx), 'job_verification')
        .status,
    ).toBe('FAIL');
  });
});

describe('SSW visa gates', () => {
  it('passes with a passed skill test in the job sector', () => {
    expect(gate(evaluateMatch(candidate(), job(), ctx), 'visa_skill').status).toBe('PASS');
  });
  it('fails when the test is for another sector or not passed', () => {
    expect(
      gate(
        evaluateMatch(
          candidate({ skillTests: [{ sector: 'gaishoku', status: 'PASSED' }] }),
          job(),
          ctx,
        ),
        'visa_skill',
      ).status,
    ).toBe('FAIL');
    expect(
      gate(
        evaluateMatch(
          candidate({ skillTests: [{ sector: 'kaigo', status: 'SCHEDULED' }] }),
          job(),
          ctx,
        ),
        'visa_skill',
      ).code,
    ).toBe('skill_test_scheduled');
  });
  it('unknown skill-test data is UNKNOWN', () => {
    expect(
      gate(evaluateMatch(candidate({ skillTests: null }), job(), ctx), 'visa_skill').status,
    ).toBe('UNKNOWN');
  });
  it('Intern 2 completion in the same sector exempts test and language', () => {
    const c = candidate({
      skillTests: [],
      jlpt: 'NONE',
      jftBasicA2: false,
      ginouJisshu2: { completed: true, sector: 'kaigo' },
    });
    const r = evaluateMatch(c, job(), ctx);
    expect(gate(r, 'visa_skill').status).toBe('PASS');
    expect(gate(r, 'visa_language').status).toBe('PASS');
  });
  it('Intern 2 completed but sector relation unknown => UNKNOWN, not PASS', () => {
    const c = candidate({ skillTests: [], ginouJisshu2: { completed: true } });
    expect(gate(evaluateMatch(c, job(), ctx), 'visa_skill').status).toBe('UNKNOWN');
  });
  it('Gijinkoku is never auto-FAILed', () => {
    const r = evaluateMatch(candidate({ degree: 'NONE' }), job({ visaTrack: 'GIJINKOKU' }), ctx);
    expect(gate(r, 'visa_gijinkoku').status).toBe('UNKNOWN');
    expect(
      evaluateMatch(candidate({ degree: 'BACHELOR' }), job({ visaTrack: 'GIJINKOKU' }), ctx)
        .eligibility.overall,
    ).toBe('PASS');
  });
  it('job without a visa track is UNKNOWN', () => {
    expect(
      gate(evaluateMatch(candidate(), job({ visaTrack: null }), ctx), 'visa_track').status,
    ).toBe('UNKNOWN');
  });
});

describe('mandatory Japanese language requirement', () => {
  const need = (level: 'N3' | 'N2', mandatory = true) =>
    job({ requirements: { ...job().requirements, jlpt: { kind: 'required', mandatory, level } } });
  it('FAILs below the mandatory level and PASSes at or above', () => {
    expect(
      gate(evaluateMatch(candidate({ jlpt: 'N4' }), need('N3'), ctx), 'language_requirement')
        .status,
    ).toBe('FAIL');
    expect(
      gate(evaluateMatch(candidate({ jlpt: 'N3' }), need('N3'), ctx), 'language_requirement')
        .status,
    ).toBe('PASS');
    expect(
      gate(evaluateMatch(candidate({ jlpt: 'N1' }), need('N3'), ctx), 'language_requirement')
        .status,
    ).toBe('PASS');
  });
  it('unknown candidate level is UNKNOWN', () => {
    expect(
      gate(evaluateMatch(candidate({ jlpt: null }), need('N3'), ctx), 'language_requirement')
        .status,
    ).toBe('UNKNOWN');
  });
  it('a merely preferred level creates no gate (only affects score)', () => {
    const r = evaluateMatch(candidate({ jlpt: 'N4' }), need('N2', false), ctx);
    expect(r.eligibility.gates.some((g) => g.id === 'language_requirement')).toBe(false);
    expect(r.score.factors.japanese.score).toBeLessThan(100);
  });
  it('a job that does not state any language requirement is UNKNOWN (requirement is not invented as "none")', () => {
    const j = job({ requirements: { ...job().requirements, jlpt: { kind: 'unknown' } } });
    expect(gate(evaluateMatch(candidate(), j, ctx), 'language_requirement').status).toBe('UNKNOWN');
  });
});

describe('mandatory certificates, skills and experience', () => {
  it('missing mandatory certificate FAILs and is listed; known holder PASSes; unknown list is UNKNOWN', () => {
    const j = job({
      requirements: {
        ...job().requirements,
        certificates: { kind: 'required', mandatory: true, names: ['Forklift', 'Driver License'] },
      },
    });
    const fail = evaluateMatch(candidate({ certificates: ['driver license'] }), j, ctx);
    expect(gate(fail, 'certificates').status).toBe('FAIL');
    expect(fail.missingRequirements.join(' ')).toContain('Forklift');
    expect(
      gate(
        evaluateMatch(candidate({ certificates: ['FORKLIFT', 'driver license'] }), j, ctx),
        'certificates',
      ).status,
    ).toBe('PASS');
    expect(
      gate(evaluateMatch(candidate({ certificates: null }), j, ctx), 'certificates').status,
    ).toBe('UNKNOWN');
  });
  it('optional (non-mandatory) certificates never gate', () => {
    const j = job({
      requirements: {
        ...job().requirements,
        certificates: { kind: 'required', mandatory: false, names: ['Forklift'] },
      },
    });
    expect(
      evaluateMatch(candidate({ certificates: [] }), j, ctx).eligibility.gates.some(
        (g) => g.id === 'certificates',
      ),
    ).toBe(false);
  });
  it('mandatory experience counts only the stated sector', () => {
    const j = job({
      requirements: {
        ...job().requirements,
        experience: { kind: 'required', mandatory: true, minYears: 3, sector: 'kaigo' },
      },
    });
    expect(
      gate(
        evaluateMatch(
          candidate({
            experience: [
              { sector: 'kaigo', years: 2 },
              { sector: 'other', years: 5 },
            ],
          }),
          j,
          ctx,
        ),
        'experience',
      ).status,
    ).toBe('FAIL');
    expect(
      gate(
        evaluateMatch(candidate({ experience: [{ sector: 'kaigo', years: 3 }] }), j, ctx),
        'experience',
      ).status,
    ).toBe('PASS');
    expect(gate(evaluateMatch(candidate({ experience: null }), j, ctx), 'experience').status).toBe(
      'UNKNOWN',
    );
  });
  it('mandatory skills gate', () => {
    const j = job({
      requirements: {
        ...job().requirements,
        skills: { kind: 'required', mandatory: true, names: ['welding'] },
      },
    });
    expect(gate(evaluateMatch(candidate({ skills: ['care'] }), j, ctx), 'skills').status).toBe(
      'FAIL',
    );
  });
});

describe('unknown eligibility conditions are never PASS', () => {
  it('a job with every requirement unknown yields NEEDS_REVIEW, never ELIGIBLE', () => {
    const j = job({
      requirements: {
        jlpt: { kind: 'unknown' },
        certificates: { kind: 'unknown' },
        experience: { kind: 'unknown' },
        skills: { kind: 'unknown' },
        preferredSkills: [],
      },
    });
    const r = evaluateMatch(candidate(), j, ctx);
    expect(r.eligibility.class).toBe('NEEDS_REVIEW');
    expect(r.unknowns.length).toBeGreaterThanOrEqual(4);
    expect(r.recommendedNextAction).toBe('COLLECT_MISSING_INFORMATION');
  });
  it('a FAIL dominates UNKNOWN', () => {
    const r = evaluateMatch(
      candidate({ pool: 'KOKUGAI' }),
      job({ acceptsPool: 'KOKUNAI', coeSupport: 'UNKNOWN' }),
      ctx,
    );
    expect(r.eligibility.overall).toBe('FAIL');
  });
  it('explicit mobility limit: outside = FAIL, unknown job location = UNKNOWN', () => {
    const c = candidate({ mobilityRestrictedTo: ['Other-ken'] });
    expect(gate(evaluateMatch(c, job({ prefecture: 'Test-ken' }), ctx), 'location').status).toBe(
      'FAIL',
    );
    expect(gate(evaluateMatch(c, job({ prefecture: null }), ctx), 'location').status).toBe(
      'UNKNOWN',
    );
  });
});

describe('explainability and reproducibility', () => {
  it('every gate and factor is explained; failed results say why they are unscored', () => {
    const r = evaluateMatch(candidate({ pool: 'KOKUGAI' }), job({ acceptsPool: 'KOKUNAI' }), ctx);
    expect(r.explanation.some((l) => l.startsWith('[FAIL] recruitment_pool'))).toBe(true);
    expect(r.explanation.some((l) => l.includes('Not scored'))).toBe(true);
    for (const g of r.eligibility.gates) expect(g.text.length).toBeGreaterThan(5);
    const ok = evaluateMatch(candidate(), job(), ctx);
    for (const k of ['skills', 'japanese', 'salary', 'experience', 'location', 'preferences'])
      expect(ok.explanation.join('\n')).toContain(k);
  });
  it('is deterministic and records the rule version + input fingerprint', () => {
    const a = evaluateMatch(candidate(), job(), ctx);
    const b = evaluateMatch(candidate(), job(), ctx);
    expect(b).toEqual(a);
    expect(a.ruleVersion).toMatch(/^mtg-match-rules\//);
    expect(evaluateMatch(candidate({ jlpt: 'N3' }), job(), ctx).inputFingerprint).not.toBe(
      a.inputFingerprint,
    );
  });
  it('does not mutate its inputs', () => {
    const c = candidate();
    const j = job();
    const snap = JSON.stringify([c, j]);
    evaluateMatch(c, j, ctx);
    expect(JSON.stringify([c, j])).toBe(snap);
  });
});

describe('AI score isolation from hard gates', () => {
  it('a perfect AI score cannot rescue a failed gate: INELIGIBLE results are never ranked', () => {
    const bad = evaluateMatch(
      candidate({ pool: 'KOKUGAI' }),
      job({ id: 'BAD', acceptsPool: 'KOKUNAI' }),
      ctx,
    );
    const ranked = rankMatches([bad], { [`${bad.candidateId}:BAD`]: { score: 100 } });
    expect(ranked).toHaveLength(0);
    expect(bad.eligibility.overall).toBe('FAIL'); // the result itself is unchanged
  });
  it('AI cannot lift NEEDS_REVIEW above ELIGIBLE', () => {
    const ok = evaluateMatch(candidate(), job({ id: 'OK' }), ctx);
    const unk = evaluateMatch(candidate(), job({ id: 'UNK', acceptsPool: 'UNKNOWN' }), ctx);
    const ranked = rankMatches([unk, ok], {
      [`${unk.candidateId}:UNK`]: { score: 100 },
      [`${ok.candidateId}:OK`]: { score: 0 },
    });
    expect(ranked.map((r) => r.result.jobId)).toEqual(['OK', 'UNK']);
  });
  it('AI adjustment is bounded and only breaks ties within a class', () => {
    const a = evaluateMatch(candidate(), job({ id: 'A' }), ctx);
    const b = evaluateMatch(candidate(), job({ id: 'B' }), ctx);
    const ranked = rankMatches([a, b], { [`${a.candidateId}:B`]: { score: 100 } });
    expect(ranked[0]?.result.jobId).toBe('B');
    expect(Math.abs(ranked[0]?.aiAdjustment ?? 99)).toBeLessThanOrEqual(5);
    expect(rankMatches([a], { [`${a.candidateId}:A`]: { score: 1e9 } })[0]?.aiAdjustment).toBe(5);
    expect(
      rankMatches([a], { [`${a.candidateId}:A`]: { score: Number.NaN } })[0]?.aiAdjustment,
    ).toBe(0);
  });
  it('evaluateMatch accepts no AI input, so eligibility is a pure function of data and rules', () => {
    expect(evaluateMatch.length).toBeLessThanOrEqual(3);
  });
});
