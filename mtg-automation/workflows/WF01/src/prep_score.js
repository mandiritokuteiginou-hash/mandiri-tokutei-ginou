// Prepare Score: Anthropic request for qualitative scoring + screening Q1-Q8 (only jobs that passed M1-M8).
const cfg = $('Config').first().json;
const SYSTEM = `あなたはMTG（外国人材の特定技能就労支援）の求人スクリーニング担当です。渡された「抽出済み事実JSON」と「求人票原文」だけを根拠に、次の項目を採点・判定します。事実の追加・推測は禁止。根拠が原文にない場合は低く採点し、missing_fields に書きます。
採点基準（整数のみ、上限厳守）:
- ssw_clarity (0-20): 特定技能の受入が明確(20)／明記だが条件不明(14)／示唆のみ(7)／不明(0)。分野・職種が特定技能の対象業務と一致するかも考慮。
- detail_completeness (0-15): 仕事内容・就業時間・休日・賃金内訳・勤務地・雇用期間・応募方法の記載の充実度。
- benefits_conditions (0-10): 社会保険完備、賞与、昇給、住宅/寮、交通費、年間休日（105日以上が基準）、残業時間の明示。
- japanese_clarity (0-5): 日本語要件が明記(5)／間接的(3)／不明(0)。
スクリーニング質問への回答（true/false、根拠不足ならfalse）:
q1_is_ssw_job / q2_sector_valid_for_ssw / q3_salary_matches_source / q5_posting_active / q6_employer_identifiable / q7_source_reliable / q8_critical_data_missing
q4_salary_basis は FIXED / RANGE / ESTIMATED / OVERTIME_DEPENDENT / COMMISSION_DEPENDENT / UNKNOWN のいずれか。
出力はJSONオブジェクトのみ（コードフェンス・説明禁止）:
{"ssw_clarity":0,"detail_completeness":0,"benefits_conditions":0,"japanese_clarity":0,"q1_is_ssw_job":false,"q2_sector_valid_for_ssw":false,"q3_salary_matches_source":false,"q4_salary_basis":"UNKNOWN","q5_posting_active":false,"q6_employer_identifiable":false,"q7_source_reliable":false,"q8_critical_data_missing":false,"missing_fields":[],"concerns":[],"rationale_jp":""}`;
const out = [];
for (const it of $input.all()) {
  const j = it.json;
  const msg = '抽出済み事実JSON:\n' + JSON.stringify(j.extract) + '\n\n求人票原文:\n' + String(j.detail_text || '').slice(0, 5000);
  out.push({ json: Object.assign({}, j, { ai_score_req: { model: cfg.ai_model_score, max_tokens: 1200, temperature: 0, system: SYSTEM, messages: [{ role: 'user', content: msg }] } }) });
}
return out;
