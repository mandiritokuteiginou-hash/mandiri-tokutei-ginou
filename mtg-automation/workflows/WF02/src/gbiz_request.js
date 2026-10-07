// Build Registry Request: company verification is its own process (not dependent on 法人番号 being printed in the posting).
const cfg = $('Config').first().json;
const corpOK = (c) => { if (!/^[0-9]{13}$/.test(c || '')) return false; const d = c.split('').map(Number); let s = 0; for (let n = 1; n <= 12; n++) { const p = d[13 - n]; s += p * (n % 2 === 1 ? 1 : 2); } return (9 - (s % 9)) === d[0]; };
const base = String(cfg.gbiz_base || 'https://info.gbiz.go.jp/hojin').replace(/\/$/, '');
const out = [];
for (const it of $input.all()) {
  const j = it.json; const rc = j.rc || {};
  const given = [rc.page_corp, j.wf01_corp].filter((c) => corpOK(c))[0] || '';
  const name = String(rc.page_company || j.company || '').normalize('NFKC').replace(/[\s　]+/g, '');
  let mode = 'NONE'; let url = base + '/v1/hojin?name=' + encodeURIComponent('__none__') + '&limit=1';
  if (given) { mode = 'BY_NUMBER'; url = base + '/v1/hojin/' + given; }
  else if (name) { mode = 'BY_NAME'; url = base + '/v1/hojin?name=' + encodeURIComponent(name) + '&limit=20'; }
  out.push({ json: Object.assign({}, j, { gbiz: { mode, url, given_number: given } }) });
}
return out;
