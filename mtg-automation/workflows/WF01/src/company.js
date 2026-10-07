// Company Gate: only verified companies (valid 法人番号 + score >= company threshold) go to the Private Company DB.
const cfg = $('Config').first().json;
const th = Number(cfg.company_threshold) || 90;
const clip = (s, n) => String(s || '').slice(0, n || 1900);
const rt = (v) => ({ rich_text: [{ type: 'text', text: { content: clip(v) } }] });
const out = [];
for (const it of $input.all()) {
  const j = it.json; const e = j.extract || {}; const s = j.score || {};
  const cn = e.corporate_number_n;
  if (!cn || !(s.company_score >= th)) continue;
  const name = e.company_name_final;
  const P = {
    'Company Name': { title: [{ type: 'text', text: { content: clip(name, 200) } }] },
    'Company Name JP': rt(name), Industry: rt(e.sector_notion), Prefecture: rt(e.prefecture), City: rt(e.city),
    Source: rt('MTG#01 hellowork (public job listing)'), 'Source URL': { url: j.detail_url },
    'First Found': { date: { start: cfg.run_date } }, 'Last Checked': { date: { start: cfg.run_date } },
    'SSW Acceptance': rt('Explicit SSW recruitment in job ' + j.job_number + ': ' + clip(e.ssw_evidence_quote, 100)),
    Notes: rt('法人番号: ' + cn + ' (checksum valid; registry lookup pending) | company_score ' + s.company_score + ' | run ' + cfg.run_id),
    'Partnership Status': { select: { name: 'Prospect' } }, 'Contact Status': { select: { name: 'Not Contacted' } }
  };
  out.push({ json: { company_key: 'CO-' + cn, company: name, job_key: j.job_key, notion_company_body: { parent: { type: 'data_source_id', data_source_id: cfg.notion_company_ds_id }, properties: P } } });
}
return out;
