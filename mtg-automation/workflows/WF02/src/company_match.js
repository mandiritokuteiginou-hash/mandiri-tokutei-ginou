// Company Score: match registry record vs posting on 法人番号 + name + address (+ active status). Deterministic, facts only.
const cfg = $('Config').first().json;
const th = Number(cfg.company_threshold) || 90;
const N = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');
const core = (s) => N(s).replace(/株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|一般財団法人|公益社団法人|公益財団法人|社会福祉法人|医療法人社団|医療法人財団|医療法人|農事組合法人|協同組合|\(株\)|\(有\)|\(同\)|\(社\)|\(医\)|\(福\)/g, '').replace(/[()（）]/g, '');
const corpOK = (c) => { if (!/^[0-9]{13}$/.test(c || '')) return false; const d = c.split('').map(Number); let s = 0; for (let n = 1; n <= 12; n++) { const p = d[13 - n]; s += p * (n % 2 === 1 ? 1 : 2); } return (9 - (s % 9)) === d[0]; };
const nameMatch = (a, b) => { const x = core(a); const y = core(b); if (!x || !y) return 'NONE'; if (x === y) return 'EXACT'; const [s, l] = x.length <= y.length ? [x, y] : [y, x]; return (l.indexOf(s) >= 0 && s.length / l.length >= 0.7) ? 'PARTIAL' : 'NONE'; };
const addrMatch = (loc, j) => { const L = N(loc); const pref = N(j.prefecture); const city = N(j.city); const rcA = N((j.rc && j.rc.page_address) || ''); const A = N(j.address); let lvl = 'NONE';
  if (pref && L.indexOf(pref) >= 0) lvl = 'PREF';
  if (!pref && rcA) { const m = rcA.match(/^(.{2,3}?[都道府県])/); if (m && L.indexOf(m[1]) >= 0) lvl = 'PREF'; }
  const cityTxt = city || (rcA.replace(/^.{2,3}?[都道府県]/, '').match(/^(.{1,6}?[市区町村郡])/) || [])[1] || '';
  if (cityTxt && L.indexOf(cityTxt) >= 0 && (lvl === 'PREF' || !pref)) lvl = 'CITY';
  return lvl; };
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let j = {};
  try { j = $('Build Registry Request').itemMatching(k).json; } catch (e) { j = {}; }
  const errors = (j.errors || []).slice();
  const g = j.gbiz || {}; const rc = j.rc || {};
  const co = { verdict: 'REVIEW', score: 0, parts: { number: 0, name: 0, address: 0, active: 0, direct: 0 }, number: '', number_source: 'NONE', number_confirmed: false, registry_name: '', registry_location: '', active: null, notes: [], conflict: '' };
  const err = it.json && it.json.error;
  const arr = it.json && (it.json['hojin-infos'] || it.json.hojin_infos || it.json.hojinInfos);
  const msg = err ? String(err.message || err.description || err) : '';
  if (g.mode === 'NONE') { co.verdict = 'REVIEW'; co.notes.push('no company name or 法人番号 to search'); }
  else if (err) {
    if (/404|not found/i.test(msg)) { co.notes.push('registry: not found (' + g.mode + ')'); if (g.mode === 'BY_NUMBER') co.conflict = '法人番号 ' + g.given_number + ' not found in registry'; }
    else { co.verdict = 'REGISTRY_UNAVAILABLE'; co.notes.push('registry request failed: ' + msg.slice(0, 120)); errors.push({ stage: 'registry', type: /401|403|unauthor|forbidden/i.test(msg) ? 'auth' : 'request', msg: msg.slice(0, 200) }); }
  } else if (!Array.isArray(arr)) { co.verdict = 'REGISTRY_UNAVAILABLE'; co.notes.push('registry: unexpected response shape'); errors.push({ stage: 'registry', type: 'shape', msg: 'no hojin-infos array' }); }
  else {
    const postName = rc.page_company || j.company;
    let pick = null;
    if (g.mode === 'BY_NUMBER') { pick = arr.filter((x) => x.corporate_number === g.given_number)[0] || null; if (!pick) co.notes.push('registry returned no matching record for ' + g.given_number); }
    else {
      const cands = arr.filter((x) => nameMatch(x.name, postName) === 'EXACT' && addrMatch(x.location, j) === 'CITY');
      if (cands.length === 1) pick = cands[0];
      else if (cands.length > 1) co.notes.push('ambiguous: ' + cands.length + ' registry records match name+city');
      else { const loose = arr.filter((x) => nameMatch(x.name, postName) !== 'NONE'); co.notes.push('no registry record matches name+city (' + arr.length + ' returned, ' + loose.length + ' loose name hits)'); }
    }
    if (pick) {
      co.registry_name = pick.name || ''; co.registry_location = pick.location || ''; co.number = pick.corporate_number || '';
      co.number_source = g.mode === 'BY_NUMBER' ? 'POSTING' : 'REGISTRY_DISCOVERED';
      const nm = nameMatch(pick.name, postName); const am = addrMatch(pick.location, j);
      co.parts.number = corpOK(co.number) ? 35 : 0; co.number_confirmed = co.parts.number === 35;
      co.parts.name = nm === 'EXACT' ? 25 : nm === 'PARTIAL' ? 12 : 0;
      co.parts.address = am === 'CITY' ? 20 : am === 'PREF' ? 8 : 0;
      const closed = !!pick.close_date || /閉鎖|解散|清算|合併|廃止/.test(String(pick.status || '') + String(pick.close_cause || ''));
      co.active = !closed; co.parts.active = closed ? 0 : 10;
      if (nm === 'NONE') co.conflict = '法人番号 ' + co.number + ' belongs to 「' + co.registry_name + '」 but posting says 「' + postName + '」';
      if (closed) { co.verdict = 'CLOSED'; co.notes.push('registry marks company closed: ' + String(pick.status || '') + ' ' + String(pick.close_date || '')); }
    }
  }
  const dispatch = (/派遣|請負/.test(rc.haken || '') && !/(ではない|でない|ではありません|なし)/.test(rc.haken || ''));
  co.parts.direct = (!dispatch && rc.source_state === 'OK') ? 10 : 0;
  co.score = co.parts.number + co.parts.name + co.parts.address + co.parts.active + co.parts.direct;
  if (co.verdict !== 'CLOSED' && co.verdict !== 'REGISTRY_UNAVAILABLE') co.verdict = (co.score >= th && !co.conflict) ? 'VERIFIED' : 'REVIEW';
  co.registry_status = co.verdict;
  // Per-record manual override ONLY: a human ticked Employer Verified. Affects the registry verdict alone; every other gate still runs. CLOSED is never overridden.
  if (j.human_employer_verified && (co.verdict === 'REVIEW' || co.verdict === 'REGISTRY_UNAVAILABLE')) { co.verdict = 'MANUAL_VERIFIED'; co.notes.push('Employer Verified ticked by a human in Notion (registry status: ' + co.registry_status + '; NOT registry-verified)'); }
  const hard = rc.source_state === 'GONE' || rc.source_state === 'CLOSED_ON_SOURCE' || dispatch || (j.dup && j.dup.state === 'Duplicate') || co.verdict === 'CLOSED' || (rc.days_left !== null && rc.days_left !== undefined && rc.days_left < 0) || (rc.source_state === 'OK' && !rc.ssw_in_text);
  const needs_ai = !hard && !!j.detail_text && rc.source_state === 'OK';
  out.push({ json: Object.assign({}, j, { co: co, errors, needs_ai: needs_ai ? 'true' : 'false' }) });
}
return out;
