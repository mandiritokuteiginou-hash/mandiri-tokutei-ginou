/**
 * Canonical SSW sector keys and the labels used across MTG sources (Japanese labels in the Candidate Pool and
 * Master Job DB; Indonesian labels in Master Job DB v2). Unknown labels return null: callers must treat that as
 * UNKNOWN, never guess. NOTE: "製造/Manufaktur" is ambiguous in the sources; mapped to industrial_products and flagged.
 */
export const SECTOR_KEYS = [
  'kaigo',
  'building_cleaning',
  'industrial_products',
  'construction',
  'shipbuilding',
  'auto_maintenance',
  'aviation',
  'accommodation',
  'road_transport',
  'railway',
  'agriculture',
  'fishery',
  'food_manufacturing',
  'food_service',
  'forestry',
  'wood_industry',
] as const;
export type SectorKey = (typeof SECTOR_KEYS)[number];

const ALIASES: Record<SectorKey, string[]> = {
  kaigo: ['介護', '介護業', 'kaigo', 'perawatan lansia'],
  building_cleaning: ['ビルクリーニング', 'ビルクリーニング業', 'building cleaning'],
  industrial_products: ['工業製品製造業', '製造', '製造業', 'manufaktur produk industri'],
  construction: ['建設', '建設業', 'konstruksi'],
  shipbuilding: ['造船・舶用工業', '造船舶用工業', 'perkapalan'],
  auto_maintenance: ['自動車整備', '自動車整備業', 'perawatan mobil'],
  aviation: ['航空', '航空業', 'penerbangan'],
  accommodation: ['宿泊', '宿泊業', 'perhotelan'],
  road_transport: ['自動車運送業', 'transportasi darat'],
  railway: ['鉄道', '鉄道業', 'kereta api'],
  agriculture: ['農業', 'pertanian'],
  fishery: ['漁業', 'perikanan'],
  food_manufacturing: [
    '飲食料品製造業',
    '食品製造',
    'manufaktur makanan & minuman',
    'manufaktur makanan dan minuman',
  ],
  food_service: ['外食業', '外食', 'restoran'],
  forestry: ['林業', 'kehutanan'],
  wood_industry: ['木材産業', 'industri kayu'],
};
const LOOKUP = new Map<string, SectorKey>();
for (const [k, labels] of Object.entries(ALIASES))
  for (const l of labels) LOOKUP.set(l.normalize('NFKC').trim().toLowerCase(), k as SectorKey);

export function normalizeSector(label: string | null | undefined): SectorKey | null {
  if (!label) return null;
  return LOOKUP.get(label.normalize('NFKC').trim().toLowerCase()) ?? null;
}
/** Labels that are known to be ambiguous between sectors in the sources. */
export const AMBIGUOUS_SECTOR_LABELS = ['製造', '製造業'];
