// Build Search Tasks: one item per (source x sector x page). Disabled sources are skipped (listed in Run Log).
const cfg = $('Config').first().json;
const pages = Number(cfg.pages_per_query) || 1;
const registry = [
  { source: 'hellowork', enabled: true, sectors: ['介護', '外食', '食品製造', '建設', '農業', '宿泊', 'ビルクリーニング', '製造', '自動車整備', '漁業'] },
  { source: 'engage', enabled: false, note: 'adapter not built - QC pending' },
  { source: 'jobmedley', enabled: false, note: 'adapter not built - WAF 403 risk' },
  { source: 'indeed', enabled: false, note: 'legal/access/rendering QC pending (locked decision)' },
  { source: 'mintoku', enabled: false, note: 'legal/access/rendering QC pending (locked decision)' }
];
const out = [];
const disabled = [];
for (const s of registry) {
  if (!s.enabled) { disabled.push(s.source); continue; }
  for (const sector of s.sectors) {
    for (let p = 1; p <= pages; p++) {
      const url = 'https://hellowork.careers/' + encodeURIComponent('求人') + '?q=' + encodeURIComponent('特定技能 ' + sector) + '&l=&only_hellowork=c&pg=' + p;
      out.push({ json: { _kind: 'task', source: s.source, sector, page: p, url, run_id: cfg.run_id, sources_disabled: disabled.join(',') } });
    }
  }
}
return out;
