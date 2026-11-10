import { evaluateSalary, salaryScore } from './salary';
import {
  JLPT_RANK,
  type Candidate,
  type FactorScore,
  type Job,
  type RuleSet,
  type SalaryEvaluation,
} from './types';

const norm = (s: string) => s.normalize('NFKC').trim().toLowerCase();
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const f = (score: number | null, weight: number, text: string): FactorScore => ({
  score,
  weight,
  text,
});

export function scoreFactors(
  c: Candidate,
  j: Job,
  rules: RuleSet,
  salary: SalaryEvaluation,
): Record<keyof RuleSet['weights'], FactorScore> {
  const w = rules.weights;

  // Skills: mandatory skills count double; null when the job states none or the candidate's skills are unknown.
  const req = j.requirements.skills;
  const mand = req.kind === 'required' && req.mandatory ? req.names : [];
  const pref = [
    ...j.requirements.preferredSkills,
    ...(req.kind === 'required' && !req.mandatory ? req.names : []),
  ];
  let skills: FactorScore;
  if (mand.length + pref.length === 0)
    skills = f(null, w.skills, 'Job lists no skills to compare.');
  else if (c.skills === null) skills = f(null, w.skills, 'Candidate skills are unknown.');
  else {
    const have = new Set(c.skills.map(norm));
    const hit = (xs: string[]) => xs.filter((x) => have.has(norm(x))).length;
    skills = f(
      clamp(((hit(mand) * 2 + hit(pref)) / (mand.length * 2 + pref.length)) * 100),
      w.skills,
      `Matched ${hit(mand)}/${mand.length} mandatory and ${hit(pref)}/${pref.length} preferred skills.`,
    );
  }

  // Japanese: relative to the level the job states; no stated level -> not scored (we do not invent one).
  const jl = j.requirements.jlpt;
  let japanese: FactorScore;
  if (jl.kind !== 'required')
    japanese = f(null, w.japanese, 'Job states no Japanese level to score against.');
  else if (c.jlpt === null) japanese = f(null, w.japanese, 'Candidate JLPT level is unknown.');
  else {
    const have = c.jlpt === 'NONE' ? 0 : JLPT_RANK[c.jlpt];
    japanese = f(
      clamp(Math.min(1, have / JLPT_RANK[jl.level]) * 100),
      w.japanese,
      `Candidate ${c.jlpt} vs ${jl.mandatory ? 'required' : 'preferred'} ${jl.level}.`,
    );
  }

  // Salary: baseline/min-wage aware; see salary.ts.
  const sScore = salaryScore(salary);
  const sal = f(
    sScore,
    w.salary,
    sScore === null ? 'Base pay unknown; salary not scored.' : `Salary verdict ${salary.verdict}.`,
  );

  // Experience.
  const ex = j.requirements.experience;
  let experience: FactorScore;
  if (ex.kind !== 'required')
    experience = f(null, w.experience, 'Job states no experience to score against.');
  else if (c.experience === null)
    experience = f(null, w.experience, 'Candidate experience is unknown.');
  else {
    const years = c.experience
      .filter((e) => !ex.sector || norm(e.sector) === norm(ex.sector))
      .reduce((a, e) => a + e.years, 0);
    experience = f(
      ex.minYears <= 0 ? 100 : clamp(Math.min(1, years / ex.minYears) * 100),
      w.experience,
      `${years} years vs ${ex.minYears} ${ex.mandatory ? 'required' : 'preferred'}.`,
    );
  }

  // Location preference.
  const location =
    c.preferredPrefectures.length === 0 || !j.prefecture
      ? f(null, w.location, 'No location preference or job location unknown.')
      : c.preferredPrefectures.map(norm).includes(norm(j.prefecture))
        ? f(100, w.location, 'Job is in a preferred prefecture.')
        : f(40, w.location, 'Job is outside the preferred prefectures.');

  // Preferences: average of the sub-preferences that are actually known.
  const subs: number[] = [];
  const notes: string[] = [];
  if (c.preferredSectors && c.preferredSectors.length > 0 && j.sector) {
    const ok = c.preferredSectors.map(norm).includes(norm(j.sector));
    subs.push(ok ? 100 : 30);
    notes.push(ok ? 'sector preferred' : 'sector not preferred');
  }
  if (c.wantsDormitory != null && j.dormitory != null) {
    const ok = !c.wantsDormitory || j.dormitory;
    subs.push(ok ? 100 : 30);
    notes.push(ok ? 'dormitory ok' : 'dormitory wanted but not offered');
  }
  if (c.expectedMonthlySalary != null && salary.grossMonthly !== null) {
    const ok = salary.grossMonthly >= c.expectedMonthlySalary;
    subs.push(ok ? 100 : clamp((salary.grossMonthly / c.expectedMonthlySalary) * 100));
    notes.push(ok ? 'meets expected salary' : 'below expected salary');
  }
  const preferences =
    subs.length === 0
      ? f(null, w.preferences, 'No comparable preferences known.')
      : f(clamp(subs.reduce((a, b) => a + b, 0) / subs.length), w.preferences, notes.join('; '));

  return { skills, japanese, salary: sal, experience, location, preferences };
}

export function aggregate(factors: Record<string, FactorScore>): {
  total: number | null;
  completeness: number;
} {
  const all = Object.values(factors);
  const totalW = all.reduce((a, x) => a + x.weight, 0);
  const known = all.filter((x) => x.score !== null);
  const knownW = known.reduce((a, x) => a + x.weight, 0);
  if (knownW === 0 || totalW === 0) return { total: null, completeness: 0 };
  return {
    total: Math.round(known.reduce((a, x) => a + (x.score as number) * x.weight, 0) / knownW),
    completeness: knownW / totalW,
  };
}

export { evaluateSalary };
