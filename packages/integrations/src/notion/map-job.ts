import {
  fingerprint,
  normalizeSector,
  AMBIGUOUS_SECTOR_LABELS,
  type Job,
  type JobLifecycle,
  type JobPoolAcceptance,
  type Req,
  type Jlpt,
} from '@mtg/shared';
import type { NotionPage, NotionProp } from './readonly-client';

// ---- generic property readers (Notion API property JSON -> plain values) ----
const plain = (a: unknown): string =>
  Array.isArray(a) ? a.map((x) => (x as { plain_text?: string }).plain_text ?? '').join('') : '';
export function readText(p: NotionProp | undefined): string | null {
  if (!p) return null;
  const v =
    p.type === 'title'
      ? plain(p.title)
      : p.type === 'rich_text'
        ? plain(p.rich_text)
        : p.type === 'select'
          ? (p.select?.name ?? '')
          : p.type === 'url' || p.type === 'email' || p.type === 'phone_number'
            ? (p[p.type] ?? '')
            : p.type === 'formula'
              ? String(p.formula?.string ?? p.formula?.number ?? '')
              : '';
  return v.trim() === '' ? null : v.trim();
}
export const readNumber = (p?: NotionProp): number | null =>
  p && p.type === 'number' && typeof p.number === 'number'
    ? p.number
    : p?.type === 'unique_id'
      ? (p.unique_id?.number ?? null)
      : p?.type === 'formula' && typeof p.formula?.number === 'number'
        ? p.formula.number
        : null;
export const readBool = (p?: NotionProp): boolean | null =>
  p && p.type === 'checkbox' ? !!p.checkbox : null;
export const readDate = (p?: NotionProp): string | null =>
  p && p.type === 'date'
    ? (p.date?.start ?? null)
    : p?.type === 'formula'
      ? (p.formula?.date?.start ?? null)
      : null;

export type SourceVariant = 'master_v1' | 'master_v2';

export interface MappedJob {
  job: Job;
  /** Source facts not representable in the engine's Job type; kept for the importer and the audit trail. */
  meta: {
    sourceRef: string;
    sourceUrl: string | null;
    legacyJobId: number | null;
    originalStatus: string | null;
    roleType: string | null;
    excludeFromMatching: boolean;
    sourceHash: string;
    lastEdited: string | null;
  };
  warnings: string[];
}

const POOL: Record<string, JobPoolAcceptance> = {
  indonesia: 'KOKUGAI',
  jepang: 'KOKUNAI',
  'jepang+indonesia': 'BOTH',
  'jepang & indonesia': 'BOTH',
};

/**
 * Pure mapping. Decisions here are PROPOSED (docs/DECISIONS.md D-004/D-009) and need owner confirmation.
 * Principle: anything the source does not state becomes UNKNOWN/null — requirements are never invented, and a
 * Notion "PUBLISHED" status is not trusted as proof of QC approval.
 */
export function mapNotionJob(page: NotionPage, variant: SourceVariant, now: Date): MappedJob {
  const P = page.properties;
  const warnings: string[] = [];
  const t = (k: string) => readText(P[k]);

  // --- verification ---
  const qcDecision = t('QC Decision');
  const mtgQc = t('MTG QC Status');
  const qcStatus: Job['verification']['qcStatus'] =
    mtgQc === 'QC Approved' || (mtgQc === null && qcDecision === 'APPROVED')
      ? 'QC_APPROVED'
      : mtgQc?.startsWith('QC Rejected') || (mtgQc === null && qcDecision === 'REJECT')
        ? 'QC_REJECTED'
        : 'QC_REVIEW';
  const jobVerified =
    variant === 'master_v2'
      ? t('Verifikasi Muse') === 'Terverifikasi Muse'
      : (readBool(P['Job Verified']) ?? false);
  const verification = {
    qcStatus,
    jobVerified,
    sourceVerified: readBool(P['Source Verified']) ?? false,
    employerVerified: readBool(P['Employer Verified']) ?? false,
  };

  // --- lifecycle ---
  const status = t('Status');
  const expiry = readDate(P['Expiry Date']);
  const approvedAndVerified =
    qcStatus === 'QC_APPROVED' && jobVerified && verification.sourceVerified;
  let lifecycle: JobLifecycle;
  switch (status) {
    case 'NEW':
    case 'EXTRACTED':
      lifecycle = 'DRAFT';
      break;
    case 'CLOSED':
      lifecycle = 'ARCHIVED';
      break;
    case 'VERIFIED':
    case 'CONTENT_READY':
    case 'IMAGE_READY':
    case 'APPROVED':
      lifecycle = qcStatus === 'QC_APPROVED' ? 'APPROVED' : 'QC_REVIEW';
      break;
    case 'PUBLISHED':
    case 'UPDATED':
      if (approvedAndVerified) lifecycle = 'PUBLISHED';
      else {
        lifecycle = 'QC_REVIEW';
        warnings.push('source_status_published_without_qc_approval');
      }
      break;
    default:
      lifecycle = 'QC_REVIEW';
      if (status === null) warnings.push('source_status_missing');
      else warnings.push('source_status_unrecognised');
  }
  if (expiry && new Date(expiry) < now && lifecycle !== 'ARCHIVED') lifecycle = 'EXPIRED';

  // --- recruitment pool / visa ---
  const poolLabel =
    (variant === 'master_v2' ? t('Bisa Dilamar Dari') : t('Pool Type'))?.toLowerCase() ?? null;
  const acceptsPool = poolLabel ? (POOL[poolLabel] ?? 'UNKNOWN') : 'UNKNOWN';
  if (!poolLabel) warnings.push('pool_type_missing');
  const visaLabel = variant === 'master_v2' ? t('Kategori Visa') : t('Visa Track');
  let visaTrack: Job['visaTrack'] = null;
  if (visaLabel === 'TG' || visaLabel === 'Tokutei Ginou 1') visaTrack = 'TG';
  else if (visaLabel === 'Tokutei Ginou 2') {
    visaTrack = 'TG';
    warnings.push('ssw_level_2_not_modelled');
  } else if (visaLabel === 'Gijinkoku') visaTrack = 'GIJINKOKU';
  else warnings.push('visa_track_unknown');

  // --- sector (labels differ between sources; unknown stays null) ---
  const sectorLabel = t('Field');
  const sector = normalizeSector(sectorLabel);
  if (sectorLabel && !sector) warnings.push(`sector_label_unmapped:${sectorLabel}`);
  if (sectorLabel && AMBIGUOUS_SECTOR_LABELS.includes(sectorLabel))
    warnings.push('sector_label_ambiguous');

  // --- requirements: tri-state, never invented ---
  const jl = t('JLPT Required');
  const jlpt: Req<{ level: Jlpt }> =
    jl && /^N[1-5]$/.test(jl)
      ? { kind: 'required', mandatory: true, level: jl as Jlpt }
      : jl === 'None'
        ? { kind: 'none' }
        : { kind: 'unknown' };
  const expReq = t('Experience Required');
  const minYears = readNumber(P['Experience Years Min']);
  let experience: Req<{ minYears: number; sector?: string }> = { kind: 'unknown' };
  if (expReq === 'No') experience = { kind: 'none' };
  else if (expReq === 'Yes') {
    if (minYears !== null)
      experience = { kind: 'required', mandatory: true, minYears, ...(sector ? { sector } : {}) };
    else warnings.push('experience_required_but_years_missing');
  }
  const lic = t('License Required');
  const licNames = (t('License Type') ?? '')
    .split(/[、,，/／\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  let certificates: Req<{ names: string[] }> = { kind: 'unknown' };
  if (lic === 'No') certificates = { kind: 'none' };
  else if ((lic === 'Yes' || lic === 'Preferred') && licNames.length > 0)
    certificates = { kind: 'required', mandatory: lic === 'Yes', names: licNames };
  else if (lic === 'Yes' || lic === 'Preferred') warnings.push('license_required_but_type_missing');

  // --- salary: the source has NO base-pay field; min/max are of unspecified composition ---
  const gross = readNumber(P['Monthly Salary Min']);
  warnings.push('base_pay_not_available_in_source');

  const roleType = t('Role Type');
  const excludeFromMatching = roleType !== null && roleType !== 'Pekerja langsung';
  if (excludeFromMatching) warnings.push('support_role_not_a_candidate_job');

  const job: Job = {
    id: `notion:${page.id}`,
    jobNumber: t('Job Number'),
    title: t('Job Title') ?? '(untitled)',
    sector,
    visaTrack,
    acceptsPool,
    coeSupport: t('CoE Support') === 'Confirmed' ? 'CONFIRMED' : 'UNKNOWN',
    prefecture: t('Prefecture'),
    employerKey: t('Corporate Number') ?? t('Company'),
    sourceUrl: t('Source URL'),
    lifecycle,
    verification,
    requirements: {
      jlpt,
      certificates,
      experience,
      skills: { kind: 'unknown' },
      preferredSkills: [],
    },
    salary: { grossMonthlyStated: gross, takeHomeMonthly: null },
    dormitory: ((): boolean | null => {
      const d = t('Dormitory Available');
      return d === 'Yes' ? true : d === 'No' ? false : null;
    })(),
  };
  return {
    job,
    meta: {
      sourceRef: page.id,
      sourceUrl: page.url ?? null,
      legacyJobId: readNumber(P['Job ID']),
      originalStatus: status,
      roleType,
      excludeFromMatching,
      sourceHash: fingerprint(P),
      lastEdited: page.last_edited_time ?? null,
    },
    warnings,
  };
}
