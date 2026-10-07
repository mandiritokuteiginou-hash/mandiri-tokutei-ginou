// Prepare Verify: AI second opinion on judgement-type checks only. AI may propose; deterministic code verifies every quote and can only DOWNGRADE.
const cfg = $('Config').first().json;
const SYSTEM = `あなたは求人票の「検証」専用エンジンです。与えられた求人票テキストに書かれていることだけを根拠に判定します。推測・一般知識・補完は禁止。判断できない場合は必ず UNKNOWN / UNVERIFIED にします。
出力はJSONオブジェクトのみ（前後の説明・コードフェンス禁止）。引用は求人票テキストからの一字一句そのままの抜粋（60字以内）。見つからなければ ""。
判定項目:
1. employer_is_direct: この求人の雇用主が自社で直接雇用する事業者なら true。派遣・紹介・請負・登録支援機関・協同組合・プラットフォーム運営なら false。不明なら "UNKNOWN"。employer_quote に根拠引用。
2. ssw_recruit_explicit: この求人自体が特定技能外国人を採用対象としていると明記されているなら true。単なる在籍/活躍/社員区分の言及、管理・支援側の仕事なら false。ssw_quote に根拠引用。
3. role_is_management: 仕事内容が特定技能外国人の「管理・教育・支援・通訳」側の役割なら true、そうでなければ false。
4. overseas_applicability: 海外在住のまま応募・面接・内定が可能と明記されていれば "VERIFIED"、国内在住者のみ/在留カード必須等と明記なら "DOMESTIC_ONLY"、明記なしは "UNVERIFIED"（ハローワーク求人というだけでは UNVERIFIED）。overseas_quote に根拠引用。
5. salary_basis_ok: 賃金が残業代・歩合に依存せず基本給で成立していれば true、依存していれば false、不明なら "UNKNOWN"。salary_concern に一言。
スキーマ: {"employer_is_direct":"","employer_quote":"","ssw_recruit_explicit":false,"ssw_quote":"","role_is_management":false,"overseas_applicability":"","overseas_quote":"","salary_basis_ok":"","salary_concern":"","other_concerns":[]}`;
const out = [];
for (const it of $input.all()) {
  const j = it.json; const co = j.co || {};
  const user = '求人番号: ' + j.job_number + '\nサイト表示の会社名: ' + ((j.rc && j.rc.page_company) || j.company) + '\n登記情報(参考): ' + (co.registry_name || 'なし') + '\n---求人票本文---\n' + String(j.detail_text || '').slice(0, 9000);
  out.push({ json: Object.assign({}, j, { ai_verify_req: { model: cfg.ai_model_verify, max_tokens: 1200, temperature: 0, system: SYSTEM, messages: [{ role: 'user', content: user }] } }) });
}
return out;
