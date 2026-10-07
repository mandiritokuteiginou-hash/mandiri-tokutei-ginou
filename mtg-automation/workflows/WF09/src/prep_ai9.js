// Prepare AI (WF09): intent classification request. Only the masked message text is sent (no phone, no name).
const cfg = $('Config').first().json;
//@LIB
return $input.all().map((it) => {
  const j = it.json; const txt = maskForAI(j.text);
  const system = 'You classify ONE inbound WhatsApp message from a job applicant (Indonesian, Japanese or English). Return ONLY JSON: {"intent":"GREETING|INTEREST|JOB_QUESTION|SUPPLY_INFO|DOCS_SENT|OTHER","language":"id|ja|en|other","sensitive":true|false}. sensitive=true if the message touches money, fees, guarantees, visas, legality/licences, complaints, threats, health or anything a human should answer. You never decide eligibility, consent or facts.';
  return { json: Object.assign({}, j, { ai_req: { model: cfg.ai_model_intent, max_tokens: 120, system, messages: [{ role: 'user', content: txt || '(empty)' }] } }) };
});
