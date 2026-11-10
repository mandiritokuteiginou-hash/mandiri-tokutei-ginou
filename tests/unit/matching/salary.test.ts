import { describe, expect, it } from 'vitest';
import {
  evaluateMatch,
  evaluateSalary,
  DEFAULT_SALARY_BASELINE_JPY,
} from '../../../packages/shared/src';
import { TEST_MIN_WAGES, candidate, ctx, job } from './fixtures';

const ev = (
  s: Parameters<typeof evaluateSalary>[0],
  pref: string | null = 'Test-ken',
  baselineJpy?: number,
) => evaluateSalary(s, pref, { minimumWages: TEST_MIN_WAGES, baselineJpy });

describe('salary baseline (¥200,000, configurable)', () => {
  it('default baseline is ¥200,000', () => expect(DEFAULT_SALARY_BASELINE_JPY).toBe(200_000));
  it('base above baseline and above minimum wage is ACCEPTABLE', () => {
    expect(ev({ baseMonthly: 220_000, scheduledMonthlyHours: 160 }).verdict).toBe('ACCEPTABLE');
  });
  it('base below baseline is BELOW_BASELINE', () => {
    expect(ev({ baseMonthly: 190_000, scheduledMonthlyHours: 160 }).verdict).toBe('BELOW_BASELINE');
  });
  it('baseline is configurable by administrators', () => {
    expect(
      ev({ baseMonthly: 210_000, scheduledMonthlyHours: 160 }, 'Test-ken', 230_000).verdict,
    ).toBe('BELOW_BASELINE');
    expect(
      ev({ baseMonthly: 210_000, scheduledMonthlyHours: 160 }, 'Test-ken', 200_000).verdict,
    ).toBe('ACCEPTABLE');
  });
});

describe('gross above ¥200,000 is never sufficient on its own', () => {
  it('baseline met only through fixed overtime is flagged and not ACCEPTABLE', () => {
    const r = ev({
      baseMonthly: 170_000,
      fixedOvertimeMonthly: 40_000,
      scheduledMonthlyHours: 160,
    });
    expect(r.grossMonthly).toBe(210_000);
    expect(r.dependsOnFixedOvertime).toBe(true);
    expect(r.verdict).toBe('BELOW_BASELINE');
  });
  it('allowances do not count toward the base baseline', () => {
    const r = ev({ baseMonthly: 180_000, allowancesMonthly: 50_000, scheduledMonthlyHours: 160 });
    expect(r.baseline).toBe('FAIL');
    expect(r.verdict).not.toBe('ACCEPTABLE');
  });
  it('a gross-only figure (unknown composition) is REVIEW, never ACCEPTABLE', () => {
    const r = ev({ grossMonthlyStated: 250_000 });
    expect(r.baseline).toBe('UNKNOWN');
    expect(r.verdict).toBe('REVIEW');
    expect(r.notes).toContain('gross_only_composition_unknown');
  });
});

describe('missing salary information', () => {
  it('no salary data at all => UNKNOWN / REVIEW with nothing invented', () => {
    const r = ev({});
    expect(r.baseMonthly).toBeNull();
    expect(r.grossMonthly).toBeNull();
    expect(r.baseline).toBe('UNKNOWN');
    expect(r.verdict).toBe('REVIEW');
  });
  it('missing salary does not make a candidate ineligible, but is unscored and reviewed', () => {
    const r = evaluateMatch(candidate(), job({ salary: {} }), ctx);
    expect(r.eligibility.class).toBe('ELIGIBLE');
    expect(r.score.factors.salary.score).toBeNull();
    expect(r.risks.some((x) => x.code === 'salary_needs_review')).toBe(true);
  });
  it('negative / NaN values are ignored, not trusted', () => {
    expect(ev({ baseMonthly: -5, scheduledMonthlyHours: Number.NaN }).baseMonthly).toBeNull();
  });
});

describe('local minimum wage', () => {
  it('base hourly below the prefectural minimum is BELOW_MINIMUM_WAGE even if monthly pay exceeds ¥200,000', () => {
    const r = ev({ baseMonthly: 210_000, scheduledMonthlyHours: 230 }); // ~913 JPY/h < 1000
    expect(r.baseline).toBe('PASS');
    expect(r.minimumWage).toBe('FAIL');
    expect(r.verdict).toBe('BELOW_MINIMUM_WAGE');
  });
  it('uses the right prefecture', () => {
    const s = { baseMonthly: 210_000, scheduledMonthlyHours: 195 }; // ~1077 JPY/h
    expect(ev(s, 'Test-ken').minimumWage).toBe('PASS');
    expect(ev({ ...s, scheduledMonthlyHours: 200 }, 'Other-ken').minimumWage).toBe('FAIL'); // 1050 < 1100
  });
  it('unknown table / prefecture / hours => UNKNOWN, so the verdict cannot be ACCEPTABLE', () => {
    expect(
      evaluateSalary({ baseMonthly: 230_000, scheduledMonthlyHours: 160 }, 'Test-ken', {}).verdict,
    ).toBe('REVIEW');
    expect(ev({ baseMonthly: 230_000, scheduledMonthlyHours: 160 }, null).verdict).toBe('REVIEW');
    expect(ev({ baseMonthly: 230_000, scheduledMonthlyHours: 160 }, 'Nowhere').verdict).toBe(
      'REVIEW',
    );
    expect(ev({ baseMonthly: 230_000 }).verdict).toBe('REVIEW');
  });
  it('hourly postings derive monthly base from hours', () => {
    const r = ev({ hourlyBase: 1250, scheduledMonthlyHours: 160 });
    expect(r.baseMonthly).toBe(200_000);
    expect(r.verdict).toBe('ACCEPTABLE');
  });
  it('minimum-wage breach puts the match on hold for QC and raises a high risk', () => {
    const r = evaluateMatch(
      candidate(),
      job({ salary: { baseMonthly: 210_000, scheduledMonthlyHours: 230 } }),
      ctx,
    );
    expect(r.recommendedNextAction).toBe('HOLD_FOR_QC');
    expect(r.risks.find((x) => x.code === 'below_minimum_wage')?.severity).toBe('high');
    expect(r.score.factors.salary.score).toBe(0);
  });
});

describe('components are kept distinct', () => {
  it('reports base, fixed overtime, allowances, bonus and take-home separately', () => {
    const r = ev({
      baseMonthly: 200_000,
      fixedOvertimeMonthly: 30_000,
      allowancesMonthly: 10_000,
      bonusAnnual: 400_000,
      takeHomeMonthly: 180_000,
      scheduledMonthlyHours: 160,
    });
    expect([
      r.baseMonthly,
      r.fixedOvertimeMonthly,
      r.allowancesMonthly,
      r.bonusAnnual,
      r.takeHomeMonthly,
      r.grossMonthly,
    ]).toEqual([200_000, 30_000, 10_000, 400_000, 180_000, 240_000]);
  });
  it('candidate expectation above the stated pay is a low risk, not a gate', () => {
    const r = evaluateMatch(candidate({ expectedMonthlySalary: 400_000 }), job(), ctx);
    expect(r.risks.some((x) => x.code === 'below_candidate_expectation')).toBe(true);
    expect(r.eligibility.class).toBe('ELIGIBLE');
  });
});
