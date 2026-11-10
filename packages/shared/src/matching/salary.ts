import {
  DEFAULT_SALARY_BASELINE_JPY,
  type MinimumWageTable,
  type SalaryEvaluation,
  type SalaryTerms,
  type Tri,
} from './types';

const num = (v: number | null | undefined): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

/**
 * Evaluates salary without ever treating "gross above ¥200,000" as sufficient on its own:
 *  - the baseline is compared against BASE pay (excluding fixed overtime, allowances, bonus);
 *  - local minimum wage is checked on the base hourly rate when hours are known;
 *  - missing data yields UNKNOWN / REVIEW, never ACCEPTABLE.
 */
export function evaluateSalary(
  terms: SalaryTerms,
  prefecture: string | null,
  opts: { baselineJpy?: number; minimumWages?: MinimumWageTable | null } = {},
): SalaryEvaluation {
  const baselineJpy = opts.baselineJpy ?? DEFAULT_SALARY_BASELINE_JPY;
  const notes: string[] = [];

  const hours = num(terms.scheduledMonthlyHours);
  const hourlyIn = num(terms.hourlyBase);
  let base = num(terms.baseMonthly);
  if (base === null && hourlyIn !== null && hours !== null) {
    base = Math.round(hourlyIn * hours);
    notes.push('base_monthly_derived_from_hourly');
  }
  const hourly =
    hourlyIn ??
    (base !== null && hours !== null && hours > 0 ? Math.round((base / hours) * 100) / 100 : null);

  const ot = num(terms.fixedOvertimeMonthly);
  const allow = num(terms.allowancesMonthly);
  const bonus = num(terms.bonusAnnual);
  const takeHome = num(terms.takeHomeMonthly);
  const grossStated = num(terms.grossMonthlyStated);

  let gross: number | null = null;
  if (base !== null) {
    gross = base + (ot ?? 0) + (allow ?? 0);
    if (terms.fixedOvertimeMonthly == null) notes.push('fixed_overtime_not_stated');
    if (terms.allowancesMonthly == null) notes.push('allowances_not_stated');
  } else if (grossStated !== null) {
    gross = grossStated;
    notes.push('gross_only_composition_unknown');
  }

  // Baseline: only BASE pay can satisfy it.
  let baseline: Tri = 'UNKNOWN';
  if (base !== null) baseline = base >= baselineJpy ? 'PASS' : 'FAIL';
  else notes.push('base_pay_unknown_baseline_not_assessable');

  const dependsOnFixedOvertime =
    base !== null && base < baselineJpy && gross !== null && gross >= baselineJpy;
  if (dependsOnFixedOvertime) notes.push('baseline_met_only_with_fixed_overtime_or_allowances');

  // Minimum wage (base hourly vs prefectural table supplied by the admin).
  let minimumWage: Tri = 'UNKNOWN';
  let minimumWageJpy: number | null = null;
  const table = opts.minimumWages ?? null;
  if (!table) notes.push('minimum_wage_table_not_configured');
  else if (!prefecture) notes.push('prefecture_unknown_minimum_wage_not_assessable');
  else {
    minimumWageJpy = table.byPrefecture[prefecture] ?? null;
    if (minimumWageJpy === null) notes.push('prefecture_not_in_minimum_wage_table');
  }
  if (minimumWageJpy !== null) {
    if (hourly === null) notes.push('hourly_rate_unknown_minimum_wage_not_assessable');
    else minimumWage = hourly >= minimumWageJpy ? 'PASS' : 'FAIL';
  }

  let verdict: SalaryEvaluation['verdict'];
  if (minimumWage === 'FAIL') verdict = 'BELOW_MINIMUM_WAGE';
  else if (baseline === 'FAIL') verdict = 'BELOW_BASELINE';
  else if (baseline === 'PASS' && minimumWage === 'PASS') verdict = 'ACCEPTABLE';
  else verdict = 'REVIEW';

  return {
    baselineJpy,
    baseMonthly: base,
    grossMonthly: gross,
    fixedOvertimeMonthly: ot,
    allowancesMonthly: allow,
    bonusAnnual: bonus,
    takeHomeMonthly: takeHome,
    hourlyBase: hourly,
    baseline,
    minimumWage,
    minimumWageJpy,
    dependsOnFixedOvertime,
    verdict,
    notes,
  };
}

/** 0..100 salary score, or null when base pay is unknown. Hard-capped by minimum-wage / overtime-dependence findings. */
export function salaryScore(ev: SalaryEvaluation): number | null {
  if (ev.baseMonthly === null) return null;
  if (ev.verdict === 'BELOW_MINIMUM_WAGE') return 0;
  const lo = ev.baselineJpy * 0.8;
  const hi = ev.baselineJpy * 1.2;
  let s = Math.max(0, Math.min(100, ((ev.baseMonthly - lo) / (hi - lo)) * 100));
  if (ev.minimumWage === 'UNKNOWN') s = Math.min(s, 80); // cannot be top-scored without a minimum-wage check
  if (ev.dependsOnFixedOvertime) s = Math.min(s, 60);
  return Math.round(s);
}
