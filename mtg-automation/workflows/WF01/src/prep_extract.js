// Prepare Extract: HTML -> plain text, deterministic hard facts, Anthropic request body.
const cfg = $('Config').first().json;
const SYSTEM = `あなたは求人票の「事実抽出」専用エンジンです。入力された求人票テキストに書かれている内容だけをJSONに転記します。推測・補完・一般知識による穴埋めは禁止です。
ルール:
1. 求人票に明記されていない項目は文字列 "UNKNOWN"（数値項目は null）にする。
2. 数値は求人票の記載をそのまま使う。年収→月収の換算、残業込みの総額計算は禁止。固定残業代は別項目に分ける。
3. ssw_mention の分類（厳守）:
   - EXPLICIT_RECRUIT: この求人自体が特定技能外国人を採用対象としていると明記（例: 特定技能の方歓迎/募集/受入可/特定技能1号可）
   - MANAGEMENT_ROLE: 特定技能外国人を管理・教育・支援する側の仕事（例: 外国人スタッフの管理、登録支援、海外人材対策課）
   - HR_LABEL: 社員区分や会社紹介の中での単なる言及（例: 特定技能社員、特定技能外国人が在籍中/活躍中）
   - MENTION_ONLY: 特定技能の語はあるが採用対象かどうか不明
   - NONE: 言及なし
4. ssw_evidence_quote は求人票テキストからの一字一句そのままの引用（60字以内）。見つからなければ "UNKNOWN"。要約や言い換えは禁止。
5. company_type: DIRECT_EMPLOYER / STAFFING_AGENCY（派遣・紹介・請負が主業）/ COOPERATIVE（協同組合・監理団体）/ REGISTERED_SUPPORT_ORG / PLATFORM / UNKNOWN。「派遣・請負等」欄が派遣なら STAFFING_AGENCY。
6. overseas_applicant: 国内在住者のみ・在留カード所持必須・海外在住不可と明記なら DOMESTIC_ONLY、海外からの応募可と明記なら OK、記載なしは UNKNOWN。domestic_evidence_quote に原文引用。（ハローワーク紹介状の記載だけでは DOMESTIC_ONLY にしない）
7. sector_jp は次のいずれか1つ: 介護 / 外食 / 食品製造 / 製造 / 建設 / 農業 / 宿泊 / ビルクリーニング / 造船・舶用工業 / 自動車整備 / 航空 / その他。
8. corporate_number は13桁の数字が求人票に明記されている場合のみ。なければ "UNKNOWN"。
9. 出力はJSONオブジェクトのみ。前後の説明文・コードフェンス禁止。
スキーマ:
{"job_title_jp":"","company_name_jp":"","company_type":"","is_dispatch":"true|false|UNKNOWN","ssw_mention":"","ssw_evidence_quote":"","sector_jp":"","role_summary_jp":"","salary":{"type":"MONTHLY|HOURLY|DAILY|ANNUAL|UNKNOWN","min":null,"max":null,"fixed_overtime_amount":null,"allowances_text":"","calc_note":""},"bonus":"","salary_increase":"","overtime_hours_per_month":"","working_hours":"","work_days_per_month":"","holiday_text":"","annual_holidays":null,"break_minutes":"","housing_text":"","japanese_level":"","experience":"","certificates":"","age_limit_text":"","nationality_text":"","visa_text":"","overseas_applicant":"","domestic_evidence_quote":"","prefecture":"","city":"","address":"","benefits_text":"","insurance_text":"","selection_text":"","quota":null,"posted_date_text":"","expiry_date_text":"","corporate_number":""}`;
const toText = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d|table|dt|dd)>/gi, '\n').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n[ \t　]*(?=\n)/g, '').replace(/\n{2,}/g, '\n').trim();
const out = [];
const inputs = $input.all();
for (let k = 0; k < inputs.length; k++) {
  const it = inputs[k];
  let job = {};
  try { job = $('Pre-Filter').itemMatching(k).json; } catch (e) { job = {}; }
  const err = it.json && it.json.error;
  const html = (it.json && it.json.data) || '';
  if (err || typeof html !== 'string' || html.length < 3000) {
    out.push({ json: Object.assign({}, job, { detail_ok: false, detail_error: err ? String(err.message || err).slice(0, 250) : 'detail response too short (' + (html || '').length + ')' }) });
    continue;
  }
  const full = toText(html);
  const start = full.indexOf('の募集内容、仕事概要');
  const body = (start >= 0 ? full.slice(start) : full).slice(0, 9000);
  const lines = body.split('\n').map((s) => s.trim()).filter((s) => s.length);
  const after = (label) => { const i = lines.indexOf(label); return i >= 0 && i + 1 < lines.length ? lines[i + 1] : ''; };
  const hard = {
    haken_field: after('派遣・請負等'),
    employment: after('雇用形態'),
    wage_monthly_text: after('賃金'),
    wage_form: after('賃金形態'),
    annual_holidays_text: after('年間休日'),
    workhours1: after('就業時間１') || after('就業時間'),
    posted: (full.match(/受理日：([0-9]{1,2})月([0-9]{1,2})日/) || []).slice(1, 3),
    expiry: (full.match(/有効期限：([0-9]{1,2})月([0-9]{1,2})日/) || []).slice(1, 3),
    corporate_number: (body.match(/法人番号[^0-9]{0,6}([0-9]{13})/) || [])[1] || ''
  };
  const jobText = body;
  const userMsg = '求人番号: ' + job.job_number + '\n掲載サイト一覧の会社名: ' + job.company + '\n一覧の見出し: ' + job.title + '\n---求人票本文---\n' + jobText.slice(0, 7500);
  out.push({ json: Object.assign({}, job, { detail_ok: true, detail_text: jobText, hard, ai_extract_req: { model: cfg.ai_model_extract, max_tokens: 2000, temperature: 0, system: SYSTEM, messages: [{ role: 'user', content: userMsg }] } }) });
}
return out;
