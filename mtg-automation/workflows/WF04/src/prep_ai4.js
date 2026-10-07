// Prepare AI (WF04): AI may only EXTRACT the unresolved fields, with a verbatim quote. It never decides, infers or touches QC / company / overseas.
const cfg = $('Config').first().json;
const SYSTEM = `あなたは求人票の「抽出」専用エンジンです。求人票テキストに明記されている事実だけを抜き出します。推測・一般知識・補完は禁止。明記がなければ必ず "Unknown"。
出力はJSONオブジェクトのみ（前後の説明・コードフェンス禁止）。各項目の quote は求人票テキストからの一字一句そのままの抜粋（60字以内）。見つからなければ ""。
項目:
1. jlpt: 日本語能力試験の必要レベルが明記されていれば "N1"〜"N5"。日本語能力が不問と明記なら "None"。「日常会話ができる」等レベルの明記がないものは "Unknown"。
2. license: 免許・資格が必須と明記 → "Yes"、あれば尚可/歓迎/優遇 → "Preferred"、不問/不要と明記 → "No"、記載なし → "Unknown"。license_type に免許・資格の名称（原文のまま）。
3. experience: 経験不問/未経験歓迎と明記 → "No"、必須または年数の明記 → "Yes"、記載なし → "Unknown"。experience_years_min は「◯年以上」の数字（なければ null）。
スキーマ: {"jlpt":"","jlpt_quote":"","license":"","license_type":"","license_quote":"","experience":"","experience_years_min":null,"experience_quote":""}`;
return $input.all().map((it) => {
  const j = it.json; const want = []; if (j.det.jlpt === 'Unknown') want.push('jlpt'); if (j.det.lic === 'Unknown') want.push('license'); if (j.det.exp === 'Unknown') want.push('experience');
  const user = '求人番号: ' + j.job_number + '\n抽出が必要な項目: ' + want.join(', ') + '\n---求人票本文---\n' + String(j.detail_text || '').slice(0, 9000);
  return { json: Object.assign({}, j, { ai_req: { model: cfg.ai_model_enrich, max_tokens: 700, temperature: 0, system: SYSTEM, messages: [{ role: 'user', content: user }] } }) };
});
