// TEST-ONLY FIXTURES. All data and the minimum-wage figures below are fictional placeholders.
import type { Candidate, Job, MinimumWageTable } from '../../../packages/shared/src';

export const TEST_MIN_WAGES: MinimumWageTable = {
  byPrefecture: { 'Test-ken': 1000, 'Other-ken': 1100 },
  effectiveFrom: '2000-01-01',
  source: 'TEST FIXTURE - not real data',
};

export const candidate = (o: Partial<Candidate> = {}): Candidate => ({
  id: 'CND-T1',
  pool: 'KOKUNAI',
  consentRecorded: true,
  jlpt: 'N4',
  jftBasicA2: null,
  skillTests: [{ sector: 'kaigo', status: 'PASSED' }],
  ginouJisshu2: { completed: false },
  degree: null,
  certificates: ['driver license'],
  experience: [{ sector: 'kaigo', years: 2 }],
  skills: ['care'],
  preferredPrefectures: [],
  ...o,
});

export const job = (o: Partial<Job> = {}): Job => ({
  id: 'J1',
  jobNumber: 'MTG--1',
  title: 'Care worker',
  sector: 'kaigo',
  visaTrack: 'TG',
  acceptsPool: 'BOTH',
  coeSupport: 'CONFIRMED',
  prefecture: 'Test-ken',
  employerKey: 'acme',
  sourceUrl: 'https://example.test/job/1',
  lifecycle: 'PUBLISHED',
  verification: {
    qcStatus: 'QC_APPROVED',
    jobVerified: true,
    sourceVerified: true,
    employerVerified: true,
  },
  requirements: {
    jlpt: { kind: 'none' },
    certificates: { kind: 'none' },
    experience: { kind: 'none' },
    skills: { kind: 'none' },
    preferredSkills: [],
  },
  salary: {
    baseMonthly: 220_000,
    scheduledMonthlyHours: 160,
    fixedOvertimeMonthly: 0,
    allowancesMonthly: 0,
  },
  ...o,
});

/** A job whose every requirement field is stated, so that no gate is UNKNOWN. */
export const ctx = { minimumWages: TEST_MIN_WAGES };
