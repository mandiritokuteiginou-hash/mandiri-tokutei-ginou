// Prepare AI (WF05): the model only REWRITES the fact sheet into Indonesian copy. No new facts, no promises, no claims about MTGI.
const cfg = $('Config').first().json;
const SYSTEM = `あなたは日本の特定技能求人の「情報」をインドネシア語で分かりやすく伝える編集者です。与えられた FACTS(JSON) に書かれた事実だけを使います。
禁止: FACTSにない数字・条件・福利厚生・会社の評判の追加、推測、誇張、「必ず」「保証」「簡単」等の断定、応募・合格・渡航・費用の約束、MTGIや仲介業者についての主張。FACTSに無い項目には触れない（「なし」と書かない）。
会社名・職種名の原文（日本語）はFACTSの表記のまま使う。金額は円(¥)で、FACTSの数値のみ。JLPTはFACTSにある場合のみ。寮はdormitoryが"Yes"の場合のみ。経験不問はexperienceが"No"の場合のみ。
出力はJSONオブジェクトのみ（前後の説明・コードフェンス禁止）。言語はインドネシア語。絵文字は各文面で最大3個。
スキーマ: {"poster_headline":"(60字以内)","poster_points":["(各60字以内, 最大5個)"],"whatsapp_body":"(700字以内)","instagram_body":"(900字以内)","tiktok_body":"(250字以内)"}`;
return $input.all().map((it) => {
  const j = it.json;
  return { json: Object.assign({}, j, { ai_req: { model: cfg.ai_model_content, max_tokens: 1800, temperature: 0.3, system: SYSTEM, messages: [{ role: 'user', content: 'FACTS:\n' + JSON.stringify(j.facts) }] } }) };
});
