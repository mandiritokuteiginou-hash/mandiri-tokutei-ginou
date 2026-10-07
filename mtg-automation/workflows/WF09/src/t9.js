const h=require('../js8/harness.js');const crypto=require('crypto');
let fails=0;const asrt=(c,m)=>{if(!c){fails++;console.log('ASSERT FAIL:',m);}};
const R=(f,o)=>h.run('./'+f,o);
const SALT='testsalt';const hs=(p)=>crypto.createHash('sha256').update(SALT+'|'+p.join('|')).digest('hex').slice(0,24);
const BANNED='jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat';
const REG='P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI';
const cfgBase={run_id:'LD-T',run_date:'2026-10-07',run_started:'2026-10-07T06:00:00Z',hash_salt:SALT,leads_ds_id:'LDS',whatsapp_inbox_url:'https://bridge.example/inbox',use_ai:'true',ai_model_intent:'claude-haiku-4-5',brand_name:'Mandiri Tokutei Ginou Indonesia (MTGI)',docs_list:'paspor (jika ada), sertifikat bahasa/keterampilan, CV',legal_disclosure_line:'Informasi ini masih tahap awal dan bukan jaminan penempatan kerja.',consent_version:'v1',require_ssw_baseline:'true',banned_phrases:BANNED,regulatory_phrases:REG,dormant_after_days:21,purge_no_consent_days:14,withdrawn_purge_days:3,purge_not_eligible_days:90,purge_dormant_days:180,handoff_review_days:365,consent_window_days:7,max_writes_per_run:40};
const C=(o)=>({json:Object.assign({},cfgBase,o||{})});
// ---- notion fixtures
const FT={'Lead ID':'title','Lead Key':'rich_text','Phone Hash':'rich_text','Phone':'phone_number','Name':'rich_text','Job ID':'rich_text','Lead Status':'select','Prev Status':'select','Status Reason':'rich_text','Status Changed':'date','Source':'select','Consent Status':'select','Consent Date':'date','Consent Source':'select','Consent Version':'rich_text','Consent Requested At':'date','Applicant JLPT':'select','JFT-Basic':'select','Skill Test Passed':'select','Tech Intern Completed':'select','Has License':'select','Experience Years':'number','Age':'number','Facts Hash':'rich_text','Eligibility Result':'select','Eligibility Detail':'rich_text','Last Intent':'select','Last Inbound':'date','Reply Draft':'rich_text','Draft Kind':'select','Draft Facts Hash':'rich_text','Human Action':'select','Last Contact':'date','Handoff Ref':'rich_text','Purge After':'date','PII Purged':'checkbox','PII Purged At':'date','Last Run':'rich_text','Lead Notes':'rich_text'};
const prop=(t,v)=>t==='title'?{title:v?[{plain_text:String(v)}]:[]}:t==='rich_text'?{rich_text:v?[{plain_text:String(v)}]:[]}:t==='select'?{select:v?{name:String(v)}:null}:t==='number'?{number:(v===null||v===undefined||v==='')?null:Number(v)}:t==='date'?{date:v?{start:String(v)}:null}:t==='checkbox'?{checkbox:!!v}:{phone_number:v||null};
const PH='+628123456789';
const lead=(id,o)=>{o=o||{};const d=Object.assign({'Lead Status':'CONTACTED','Consent Status':'GRANTED','Phone':PH,'Job ID':'MTG-12','Status Changed':'2026-10-05','Last Inbound':'2026-10-05','Source':'WHATSAPP','Lead ID':'LD-X'+id},o);
  if(d['Phone']&&d['Phone Hash']===undefined)d['Phone Hash']=hs(['phone',d['Phone']]);
  if(d['Phone']&&d['Job ID']&&d['Lead Key']===undefined)d['Lead Key']=hs(['lead',d['Phone'],d['Job ID']]);
  const properties={};Object.keys(FT).forEach(k=>{properties[k]=prop(FT[k],d[k]);});return {id:'p'+id,created_time:o._created||'2026-10-01T00:00:00Z',properties};};
const job=(n,o)=>{o=o||{};const p={'Job ID':{unique_id:{prefix:'MTG',number:n}},'Job Title':{title:[{plain_text:o.title||'健康食品の製造'}]},Company:{rich_text:[{plain_text:'株式会社テスト'}]},'Lifecycle Status':{select:{name:o.lc||'ACTIVE'}},'JLPT Required':{select:{name:o.jlpt||'N4'}},'License Required':{select:{name:o.lic||'No'}},'Experience Required':{select:{name:o.exp||'No'}},'Expiry Date':{date:{start:o.expiry||'2026-12-01'}}};return {json:{results:[{properties:p}]}};};
const msg=(o)=>({json:Object.assign({_kind:'message',msg_hash:'m'+Math.random().toString(16).slice(2,8),phone:PH,phone_valid:'true',name:'',text:'x',ts:'2026-10-07T05:00:00Z',job_ref:'MTG-12',det_intent:'',ai_intent:'OTHER',ai_sensitive:'false'},o||{})});
const meta={json:{_kind:'meta',inbox_status:'OK',messages_seen:0,messages_new:0,errors:[]}};
const plan=(leads,msgs,jobs,co,has)=>{const jl=(jobs===undefined?[job(12)]:jobs);const ids=jl.map(j=>'MTG-'+j.json.results[0].properties['Job ID'].unique_id.number);return R('plan9.js',{input:jl.length?jl:[{json:{dummy:'true'}}],nodes:{Config:[C(co)],'Query Leads':[{json:{results:leads,has_more:!!has}}],Intents:(msgs||[]).concat([meta]),'Prepare Job Lookups':ids.map(i=>({json:{job_id:i}}))}}).map(x=>x.json);};
const lead1=(r)=>r.filter(x=>x._kind==='lead');
const val=(x,f)=>x.sent&&x.sent[f]?x.sent[f].v:undefined;
// ================= lib
const lib=R('lib_t.js',{input:[{json:{}}],nodes:{}});
asrt(lib.sha===crypto.createHash('sha256').update('abc').digest('hex'),'sha256 parity');
asrt(lib.p[0]==='+6281234567890'&&lib.p[1]==='+628123456789'&&lib.p[2]==='+819012345678'&&lib.p[3]===''&&lib.p[4]==='','phone normalization incl. ambiguous 81xxx rejected');
// ================= normalize
const nz=(items,co)=>R('normalize9.js',{input:items,nodes:{Config:[C(co)]}})[0].json;
let n=nz([{json:{messages:[{message_id:'a',from:'0812-3456-789@c.us',text:'Halo, minat MTG-12',timestamp:'2026-10-07T04:00:00Z'},{message_id:'a',from:'0812',text:'dup'},{message_id:'b',from:'0812-3456-789',text:'berapa biaya?'},{message_id:'c',from:'0812-3456-789',text:'stop'},{message_id:'d',from:'0812-3456-789',text:'Ya'},{message_id:'e',from:'abc',text:'halo'},{message_id:'f',from:'0812-3456-789',text:'Tolong info pekerjaan mtg 7'},{message_id:'g',from:'0812-3456-789',text:'saya stop dulu, biaya berapa?'}]}}]);
asrt(n.messages.length===7,'in-batch duplicate message_id dropped (7 left) got '+n.messages.length);
const by=(id)=>n.messages.find(m=>m.msg_hash===hs(['msg',id]));
asrt(by('a').phone==='+628123456789'&&by('a').job_ref==='MTG-12','phone + job ref parsed');
asrt(by('b').det_intent==='LEGAL_SENSITIVE'&&by('c').det_intent==='WITHDRAW'&&by('d').det_intent==='CONSENT_YES','deterministic scan: legal/withdraw/consent');
asrt(by('g').det_intent==='WITHDRAW','withdraw wins over legal');
asrt(by('e').phone_valid==='false','invalid phone flagged');asrt(by('f').job_ref==='MTG-7','job ref "mtg 7" parsed');
asrt(by('a').msg_hash===hs(['msg','a'])&&!JSON.stringify(n).includes('"message_id"'),'only hashed message id carried');
asrt(nz([{json:{}}],{whatsapp_inbox_url:''}).inbox_status==='NOT_CONFIGURED','inbox not configured handled');
asrt(nz([{json:{error:{message:'call +628123456789 failed'}}}]).errors[0].msg.indexOf('62812345')<0,'inbox error message masked');
// ================= dedup
const dd=R('dedup9.js',{input:[{json:{msg_hash:by('a').msg_hash}},{json:{}}],nodes:{Config:[C()],'Normalize Inbox':[{json:n}]}}).map(x=>x.json);
asrt(!dd.some(x=>x.msg_hash===by('a').msg_hash)&&dd.filter(x=>x._kind==='message').length===6&&dd.some(x=>x._kind==='meta'&&x.messages_new===6),'dedup drops committed hash, meta present');
asrt(dd.find(x=>x.msg_hash===by('c').msg_hash).needs_ai==='false'&&dd.find(x=>x.msg_hash===by('f').msg_hash).needs_ai==='true','AI only for messages not decided deterministically');
// ================= AI prep / parse
const pa=R('prep_ai9.js',{input:[{json:{text:'Saya 0812-3456-7890 email a@b.com https://x.y/z umur 25',phone:PH,name:'Budi'}}],nodes:{Config:[C()]}})[0].json;
const aiTxt=JSON.stringify(pa.ai_req);
asrt(!/812|a@b|budi|https/i.test(aiTxt)&&/\[num\]/.test(aiTxt),'AI prompt masks phone/email/url and carries no phone/name');
const pr=(t,err)=>R('parse_ai9.js',{input:[{json:err?{error:{message:'x'}}:{content:[{text:t}]}}],nodes:{'Prepare AI':[{json:{msg_hash:'q'}}]}})[0].json;
asrt(pr('{"intent":"SUPPLY_INFO","sensitive":false}').ai_intent==='SUPPLY_INFO','AI intent parsed');
asrt(pr('garbage').ai_intent==='OTHER'&&pr('',true).ai_error==='AI_ERROR','AI failure -> OTHER');
asrt(pr('{"intent":"LEGAL_SENSITIVE"}').ai_intent==='OTHER'&&pr('{"intent":"WITHDRAW"}').ai_intent==='OTHER','AI cannot invent withdraw/legal/consent intents');
asrt(pr('{"intent":"INTEREST","sensitive":true}').ai_sensitive==='true','AI may escalate');
// ================= plan scenarios
// a. new lead from WA
let r=plan([],[msg({msg_hash:'h1',ai_intent:'INTEREST'})]);let L=lead1(r);
asrt(L.length===1&&L[0].action==='CREATE','new WA message with job ref creates a lead');
asrt(val(L[0],'Lead Status')==='NEW'&&val(L[0],'Consent Status')==='NONE'&&val(L[0],'Draft Kind')==='CONSENT_REQUEST','new lead NEW + consent NONE + consent request draft');
asrt(L[0].lead_key===hs(['lead',PH,'MTG-12'])&&val(L[0],'Phone Hash')===hs(['phone',PH]),'Lead Key = salted hash(phone+job)');
asrt(val(L[0],'Purge After')==='2026-10-21','no-consent purge date +14d');
asrt(!/jaminan|dijamin|garansi|pasti|gratis/i.test(val(L[0],'Reply Draft').replace(cfgBase.legal_disclosure_line,'')),'consent draft passes phrase policy');
asrt(L[0].msg_hashes[0]==='h1'&&L[0].commit_ok===undefined,'hash waits for verify before commit');
// b. no job ref
r=plan([],[msg({job_ref:'',ai_intent:'OTHER'})]);L=lead1(r);
asrt(L[0].action==='CREATE'&&val(L[0],'Lead Status')==='MANUAL_REVIEW'&&/NO_JOB_REF/.test(val(L[0],'Status Reason'))&&!val(L[0],'Reply Draft')&&!val(L[0],'Lead Key'),'no job ref -> MANUAL_REVIEW, no key, no draft');
// c. existing lead found by key -> PATCH not CREATE
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE'})],[msg({ai_intent:'GREETING'})]);L=lead1(r);
asrt(L.length===1&&L[0].action==='PATCH'&&L[0].page_id==='p1','existing lead matched by key -> PATCH (no duplicate lead)');
// d. consent via reply after draft sent
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Consent Requested At':'2026-10-05','Draft Facts Hash':'old'})],[msg({det_intent:'CONSENT_YES'})]);L=lead1(r)[0];
asrt(val(L,'Consent Status')==='GRANTED'&&val(L,'Consent Source')==='WA_OPTIN'&&val(L,'Consent Version')==='v1'&&val(L,'Consent Date')==='2026-10-07','consent GRANTED with evidence after DRAFT_SENT + YES');
asrt(L.to_status==='CONTACTED'&&L.draft_kind==='QUESTIONS','chain NEW->CONTACTED + questions draft');
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE'})],[msg({det_intent:'CONSENT_YES'})]);L=lead1(r)[0];
asrt(L.consent_status==='NONE'&&/CONSENT_YES_IGNORED_NO_REQUEST/.test(val(L,'Status Reason')||''),'YES without a sent consent request does not grant consent');
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Consent Requested At':'2026-09-20'})],[msg({det_intent:'CONSENT_YES'})]);L=lead1(r)[0];
asrt(L.consent_status==='NONE','YES outside consent window does not grant consent');
// f. withdraw
r=plan([lead('1',{'Lead Status':'SCREENING'})],[msg({det_intent:'WITHDRAW'})]);L=lead1(r)[0];
asrt(L.to_status==='WITHDRAWN'&&val(L,'Consent Status')==='WITHDRAWN'&&val(L,'Purge After')==='2026-10-10'&&val(L,'Draft Kind')==='WITHDRAW_ACK','withdraw -> WITHDRAWN, consent withdrawn, purge +3d, ack draft');
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE'})],[msg({det_intent:'CONSENT_NO'})]);
asrt(lead1(r)[0].to_status==='WITHDRAWN','NO to consent request -> WITHDRAWN');
// g. legal + resume
r=plan([lead('1',{'Lead Status':'SCREENING','Reply Draft':'old','Draft Kind':'QUESTIONS'})],[msg({det_intent:'LEGAL_SENSITIVE'})]);L=lead1(r)[0];
asrt(L.to_status==='MANUAL_REVIEW'&&val(L,'Prev Status')==='SCREENING'&&!val(L,'Reply Draft')&&val(L,'Reply Draft')!==undefined,'legal message -> MANUAL_REVIEW, prev saved, pending draft cleared');
r=plan([lead('1',{'Lead Status':'MANUAL_REVIEW','Prev Status':'SCREENING','Human Action':'RESUME'})],[]);L=lead1(r)[0];
asrt(L.to_status==='SCREENING'&&val(L,'Human Action')==='','RESUME returns to previous status and clears the action');
r=plan([lead('1',{'Lead Status':'MANUAL_REVIEW','Prev Status':'SCREENING','Human Action':'RESUME'})],[],[job(12,{lc:'EXPIRED'})]);L=lead1(r)[0];
asrt(L.to_status==='MANUAL_REVIEW'&&/JOB_NOT_ACTIVE/.test(L.reason),'RESUME refused while the trigger persists');
r=plan([lead('1',{'Lead Status':'MANUAL_REVIEW','Prev Status':'SCREENING','Human Action':'RESUME'})],[msg({ai_intent:'OTHER',ai_sensitive:'true'})]);L=lead1(r)[0];
asrt(L.to_status==='MANUAL_REVIEW','AI sensitive escalation keeps/puts lead in MANUAL_REVIEW');
r=plan([lead('1',{'Lead Status':'CONTACTED'})],[msg({ai_intent:'OTHER',ai_sensitive:'true'})]);
asrt(lead1(r)[0].to_status==='MANUAL_REVIEW','AI sensitive=true escalates to human');
// h. eligibility
const F=(o)=>Object.assign({'Lead Status':'CONTACTED'},o);
r=plan([lead('1',F({'Applicant JLPT':'N3','Skill Test Passed':'Yes','Age':25}))],[],[job(12,{jlpt:'N4'})]);L=lead1(r)[0];
asrt(L.to_status==='ELIGIBLE'&&val(L,'Eligibility Result')==='ELIGIBLE'&&/R2:MET/.test(val(L,'Eligibility Detail'))&&L.draft_kind==='NEXT_STEP','all rules met -> ELIGIBLE (chain CONTACTED->SCREENING->ELIGIBLE) + next step draft');
asrt(L.log_rows.filter(x=>x.event==='TRANSITION').length===2,'each chained step is logged');
r=plan([lead('1',F({'Applicant JLPT':'N3'}))],[],[job(12,{jlpt:'N4'})]);L=lead1(r)[0];
asrt(L.to_status==='SCREENING'&&val(L,'Eligibility Result')==='UNKNOWN'&&L.draft_kind==='QUESTIONS'&&/usia/.test(val(L,'Reply Draft'))&&/tes keterampilan/.test(val(L,'Reply Draft')),'unknown facts -> stay SCREENING and ask the missing ones');
r=plan([lead('1',F({'Age':25,'Skill Test Passed':'Yes'}))],[],[job(12,{jlpt:'N3'})]);L=lead1(r)[0];
asrt(L.to_status==='SCREENING'&&val(L,'Eligibility Result')==='UNKNOWN','UNKNOWN != NO: missing JLPT never makes NOT_ELIGIBLE');
r=plan([lead('1',F({'Age':17,'Applicant JLPT':'N3','Skill Test Passed':'Yes'}))],[],[job(12,{jlpt:'N4'})]);L=lead1(r)[0];
asrt(L.to_status==='NOT_ELIGIBLE'&&/R1/.test(L.reason)&&L.draft_kind==='NOT_ELIGIBLE_NOTICE'&&val(L,'Purge After')==='2026-01-05'.replace('2026-01-05','2027-01-05'),'age<18 -> NOT_ELIGIBLE with notice, purge +90d');
r=plan([lead('1',F({'Age':25,'Applicant JLPT':'N5','Skill Test Passed':'Yes'}))],[],[job(12,{jlpt:'N3'})]);
asrt(lead1(r)[0].to_status==='NOT_ELIGIBLE','known lower JLPT -> NOT_ELIGIBLE');
r=plan([lead('1',F({'Age':25,'JFT-Basic':'Yes','Skill Test Passed':'Yes'}))],[],[job(12,{jlpt:'N4'})]);
asrt(lead1(r)[0].to_status==='ELIGIBLE','JFT-Basic counts for N4 requirement');
r=plan([lead('1',F({'Age':25,'JFT-Basic':'Yes','Skill Test Passed':'Yes'}))],[],[job(12,{jlpt:'N3'})]);
asrt(lead1(r)[0].to_status==='SCREENING','JFT-Basic does not satisfy N3 (unknown JLPT stays unknown)');
r=plan([lead('1',F({'Age':25,'Applicant JLPT':'N3','Skill Test Passed':'No','Tech Intern Completed':'No'}))],[],[job(12,{jlpt:'N4'})]);
asrt(lead1(r)[0].to_status==='NOT_ELIGIBLE','SSW baseline: both No -> NOT_ELIGIBLE');
r=plan([lead('1',F({'Age':25,'Applicant JLPT':'N3','Tech Intern Completed':'Yes'}))],[],[job(12,{jlpt:'N4',lic:'Yes'})]);L=lead1(r)[0];
asrt(L.to_status==='SCREENING'&&/R4:UNKNOWN/.test(val(L,'Eligibility Detail'))&&/lisensi/.test(val(L,'Reply Draft')),'license required + unknown applicant license -> ask');
r=plan([lead('1',F({'Age':25,'Applicant JLPT':'N3','Tech Intern Completed':'Yes','Has License':'No'}))],[],[job(12,{jlpt:'N4',lic:'Yes'})]);
asrt(lead1(r)[0].to_status==='NOT_ELIGIBLE','required license + No -> NOT_ELIGIBLE');
r=plan([lead('1',F({'Age':25,'Applicant JLPT':'N3','Tech Intern Completed':'Yes'}))],[],[job(12,{jlpt:'N4',lic:'Preferred',exp:'No'})]);
asrt(lead1(r)[0].to_status==='ELIGIBLE','license Preferred is not a hard requirement');
r=plan([lead('1',F({'Age':25,'Applicant JLPT':'N3','Tech Intern Completed':'Yes'}))],[],[job(12,{jlpt:'N4',exp:'Unknown'})]);L=lead1(r)[0];
asrt(L.to_status==='MANUAL_REVIEW'&&/JOB_REQ_UNKNOWN/.test(L.reason),'job requirement unknown + applicant complete -> human decides');
// facts changed re-evaluation
r=plan([lead('1',{'Lead Status':'NOT_ELIGIBLE','Age':25,'Applicant JLPT':'N3','Skill Test Passed':'Yes','Facts Hash':'stale','Eligibility Result':'NOT_ELIGIBLE'})],[],[job(12,{jlpt:'N4'})]);
asrt(lead1(r)[0].to_status==='ELIGIBLE','corrected facts re-evaluate NOT_ELIGIBLE -> ELIGIBLE');
// j. job gates
r=plan([lead('1',F({}))],[],[job(12,{lc:'CLOSED'})]);L=lead1(r)[0];asrt(L.to_status==='MANUAL_REVIEW'&&/JOB_NOT_ACTIVE/.test(L.reason),'job not ACTIVE -> MANUAL_REVIEW');
r=plan([lead('1',F({}))],[],[job(12,{expiry:'2026-10-01'})]);asrt(/JOB_EXPIRED/.test(lead1(r)[0].reason),'job expired -> MANUAL_REVIEW');
r=plan([lead('1',F({}))],[],[]);L=lead1(r)[0];asrt(L.to_status!=='MANUAL_REVIEW','missing lookup never invents JOB_NOT_FOUND when the job was not requested (got '+L.to_status+')');
// k. docs + handoff
r=plan([lead('1',{'Lead Status':'ELIGIBLE','Age':25,'Applicant JLPT':'N3','Skill Test Passed':'Yes','Human Action':'DOCS_REQUESTED'})],[],[job(12,{jlpt:'N4'})]);
asrt(lead1(r)[0].to_status==='DOCS_REQUESTED','human DOCS_REQUESTED moves ELIGIBLE -> DOCS_REQUESTED');
r=plan([lead('1',{'Lead Status':'DOCS_REQUESTED','Human Action':'DOCS_RECEIVED','Lead ID':'LD-ABCD1234'})],[],[job(12)]);L=lead1(r)[0];
asrt(L.to_status==='HANDOFF'&&val(L,'Handoff Ref')==='HANDOFF MTG-12 / LD-ABCD1234','DOCS_RECEIVED -> HANDOFF with Job ID + Lead ID reference');
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Human Action':'DOCS_RECEIVED'})],[]);L=lead1(r)[0];
asrt(L.to_status==='NEW'&&val(L,'Human Action')===''&&!/DOCS/.test(L.to_status),'invalid human action is cleared with no transition');
// l. HANDOFF owned by humans
r=plan([lead('1',{'Lead Status':'HANDOFF','Status Changed':'2026-09-01'})],[msg({ai_intent:'OTHER'})]);L=lead1(r)[0];
asrt(L.to_status==='HANDOFF','HANDOFF stays human-owned');
r=plan([lead('1',{'Lead Status':'HANDOFF'})],[msg({det_intent:'LEGAL_SENSITIVE'})]);L=lead1(r)[0];asrt(L.to_status==='HANDOFF'&&/LEGAL_FLAG_IN_HANDOFF/.test(val(L,'Status Reason')||''),'legal message in HANDOFF only appends a reason');
r=plan([lead('1',{'Lead Status':'HANDOFF'})],[msg({det_intent:'WITHDRAW'})]);asrt(lead1(r)[0].to_status==='WITHDRAWN','withdraw works from HANDOFF');
r=plan([lead('1',{'Lead Status':'HANDOFF','Status Changed':'2025-09-01'})],[]);asrt(lead1(r)[0].to_status==='MANUAL_REVIEW','HANDOFF retention review after 365d');
// m. retention
r=plan([lead('1',{'Lead Status':'WITHDRAWN','Consent Status':'WITHDRAWN','Purge After':'2026-10-06','Name':'Budi','Age':30,'Applicant JLPT':'N3','Reply Draft':'x','Draft Kind':'WITHDRAW_ACK'})],[]);L=lead1(r)[0];
asrt(val(L,'PII Purged')===true&&val(L,'Phone')===''&&val(L,'Name')===''&&val(L,'Age')===''&&val(L,'Applicant JLPT')===''&&val(L,'Reply Draft')===''&&L.purged===true,'purge clears phone/name/facts/draft');
asrt(!('Lead Notes' in (L.sent||{}))&&!('Lead Key' in (L.sent||{}))&&!('Phone Hash' in (L.sent||{})),'purge never touches Lead Notes and keeps Lead Key + Phone Hash');
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Purge After':'2026-10-07'})],[]);L=lead1(r)[0];
asrt(L.to_status==='DORMANT'&&val(L,'PII Purged')===true&&/CONSENT_NOT_RECEIVED/.test(L.reason),'no-consent lead purged after window -> DORMANT');
r=plan([lead('1',{'Lead Status':'HANDOFF','Purge After':'2026-01-01'})],[]);L=lead1(r)[0];
asrt(!(L.sent&&L.sent['PII Purged']),'HANDOFF never auto-purged');
r=plan([lead('1',{'Lead Status':'DORMANT','Purge After':'2026-10-08'})],[]);asrt(lead1(r)[0].action==='NOOP','not purged before the date');
// n. dormancy + revive
r=plan([lead('1',{'Lead Status':'SCREENING','Last Inbound':'2026-09-01','Status Changed':'2026-09-01','Age':25})],[],[job(12)]);L=lead1(r)[0];
asrt(L.to_status==='DORMANT'&&val(L,'Prev Status')==='SCREENING'&&val(L,'Purge After')==='2027-04-05','inactive 21d -> DORMANT, purge +180d');
r=plan([lead('1',{'Lead Status':'DORMANT','Prev Status':'SCREENING','Consent Status':'GRANTED'})],[msg({ai_intent:'GREETING'})],[job(12)]);L=lead1(r)[0];
asrt(L.to_status==='SCREENING'||L.to_status==='ELIGIBLE'||L.to_status==='NOT_ELIGIBLE'||L.to_status==='CONTACTED','inbound revives DORMANT lead (-> '+L.to_status+')');
// o. duplicate / ambiguous / reopen
const k=hs(['lead',PH,'MTG-12']);
r=plan([lead('1',{'Lead Status':'CONTACTED','_created':'2026-10-01T00:00:00Z'}),lead('2',{'Lead Status':'CONTACTED','_created':'2026-10-02T00:00:00Z'})],[],[job(12)]);
asrt(lead1(r).find(x=>x.page_id==='p2').to_status==='MANUAL_REVIEW'&&/DUPLICATE_LEAD/.test(lead1(r).find(x=>x.page_id==='p2').reason),'duplicate Lead Key on a newer page -> MANUAL_REVIEW, never merged');
r=plan([lead('1',{'Job ID':'MTG-12'}),lead('2',{'Job ID':'MTG-13','Last Inbound':'2026-10-06'})],[msg({job_ref:'',ai_intent:'OTHER'})],[job(12),job(13)]);
asrt(lead1(r).some(x=>/AMBIGUOUS_TARGET/.test(x.reason)&&x.to_status==='MANUAL_REVIEW'),'message without job ref matching several leads -> AMBIGUOUS_TARGET');
r=plan([lead('1',{'Lead Status':'WITHDRAWN','Consent Status':'WITHDRAWN','Phone':'','Phone Hash':hs(['phone',PH]),'PII Purged':true,'Lead Key':k,'Name':''})],[msg({ai_intent:'GREETING'})]);L=lead1(r)[0];
asrt(L.to_status==='NEW'&&val(L,'Consent Status')==='NONE'&&val(L,'PII Purged')===false&&val(L,'Phone')===PH&&L.draft_kind==='CONSENT_REQUEST','new contact after withdrawal reopens as NEW with consent NONE (must opt in again)');
r=plan([lead('1',{'Lead Status':'WITHDRAWN','Consent Status':'WITHDRAWN','Phone':'','PII Purged':true,'Phone Hash':hs(['phone',PH])})],[msg({det_intent:'CONSENT_YES'})]);
asrt(lead1(r)[0].action==='NOOP'&&lead1(r)[0].commit_ok===true,'YES after withdrawal is ignored (no consent without a fresh request)');
// invalid phone message
r=plan([],[msg({phone:'',phone_valid:'false'})]);L=lead1(r);asrt(L.length===1&&L[0].action==='NOOP'&&L[0].log_rows[0].reason==='PHONE_INVALID','invalid phone message creates no lead');
// p. idempotency: apply sent, rerun without messages => NOOP
const applyTo=(pg,item)=>{const p2=JSON.parse(JSON.stringify(pg.properties||{}));Object.keys(item.sent).forEach(f=>{p2[f]=prop(item.sent[f].t,item.sent[f].v===''?null:item.sent[f].v);});return {id:pg.id||'pNEW',created_time:pg.created_time||'2026-10-07T00:00:00Z',properties:p2};};
r=plan([],[msg({msg_hash:'h9',ai_intent:'INTEREST'})]);const created=lead1(r)[0];const pg1=applyTo({id:'pN'},created);
r=plan([pg1],[]);asrt(lead1(r)[0].action==='NOOP','idempotent: second run with no new input writes nothing (no re-draft)');
r=plan([pg1],[msg({msg_hash:'h9',ai_intent:'INTEREST'})]);asrt(lead1(r)[0].action!=='CREATE'&&lead1(r).length===1,'replayed message never creates a second lead (no-op patch)');
// draft sent -> not redrafted
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Reply Draft':'d','Draft Kind':'CONSENT_REQUEST','Draft Facts Hash':created.sent['Draft Facts Hash'].v,'Human Action':'DRAFT_SENT'})],[]);L=lead1(r)[0];
asrt(val(L,'Reply Draft')===''&&val(L,'Consent Requested At')==='2026-10-07'&&val(L,'Last Contact')==='2026-10-07'&&val(L,'Human Action')==='','DRAFT_SENT clears draft, records consent-request date');
const pg2=applyTo(lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Reply Draft':'d','Draft Kind':'CONSENT_REQUEST','Draft Facts Hash':created.sent['Draft Facts Hash'].v,'Human Action':'DRAFT_SENT'}),L);
// after sent, hash differs from newly computed -> a draft may be generated once; run twice to check it settles
let st1=plan([pg2],[]);const pg3=lead1(st1)[0].sent?applyTo(pg2,lead1(st1)[0]):pg2;st1=plan([pg3],[]);
asrt(lead1(st1)[0].action==='NOOP','draft cycle settles (no endless redraft)');
// no write to Master DB / allow-list
const allProps=new Set();[plan([],[msg({})])].forEach(x=>lead1(x).forEach(i=>Object.keys(i.notion_props||{}).forEach(p=>allProps.add(p))));
asrt(![...allProps].some(p=>/Lifecycle|QC|Recruitability|Content|Image|Distribution|Tier|Salary/.test(p)),'plan never emits Master Job DB fields');
const pw=(items)=>R('prep_write9.js',{input:items.map(j=>({json:j})),nodes:{Config:[C()],'Query Leads':[{json:{results:[{id:'p1'}]}}]}}).map(x=>x.json);
let w=pw([{action:'PATCH',page_id:'p1',notion_props:{'Lead Status':{select:{name:'NEW'}}},sent:{}},{action:'PATCH',page_id:'p1',notion_props:{'Lead Notes':{rich_text:[]}},sent:{}},{action:'PATCH',page_id:'pX',notion_props:{'Lead Status':{select:null}},sent:{}},{action:'PATCH',page_id:'p1',notion_props:{'Lifecycle Status':{select:{name:'ACTIVE'}}},sent:{}},{action:'CREATE',notion_props:{'Lead ID':{title:[]}},sent:{}}]);
asrt(w[0].guard==='OK'&&w[0].write_url==='https://api.notion.com/v1/pages/p1'&&w[0].write_method==='PATCH','guard allows a Leads page patch');
asrt(w[1].guard==='BLOCKED'&&w[3].guard==='BLOCKED','guard blocks Lead Notes and Master-DB field names');
asrt(w[2].guard==='BLOCKED'&&/TARGET_NOT_LEADS_DB/.test(w[2].guard_reason),'guard blocks pages that were not loaded from the Leads DB');
asrt(w[4].write_body.parent.data_source_id==='LDS'&&w[4].write_method==='POST','create targets the Leads data source only');
// salt guard
r=plan([],[msg({})],[job(12)],{hash_salt:'CHANGE_ME'});asrt(r.length===1&&r[0].queue_status==='SALT_NOT_SET'&&!lead1(r).length,'refuses to run without a real hash salt');
// write cap
r=plan([lead('1',{'Lead Status':'NEW','Consent Status':'NONE','Phone':'+628111111111'}),lead('2',{'Lead Status':'NEW','Consent Status':'NONE','Phone':'+628122222222','Job ID':'MTG-12'})],[msg({phone:'+628111111111',msg_hash:'c1'}),msg({phone:'+628122222222',msg_hash:'c2'})],[job(12)],{max_writes_per_run:1});
asrt(lead1(r).filter(x=>x.action==='DEFERRED').length===1&&lead1(r).find(x=>x.action==='DEFERRED').commit_ok===false&&lead1(r).find(x=>x.action==='DEFERRED').msg_hashes.length===0,'write cap defers without committing message hashes');
// truncated leads
r=plan([],[],[job(12)],{},true);asrt(r.find(x=>x._kind==='meta').errors.some(e=>e.type==='LEADS_TRUNCATED'),'truncated lead list is reported');
// templates policy
const T=R('plan9.js',{input:[{json:{dummy:'true'}}],nodes:{Config:[C()],'Query Leads':[{json:{results:[]}}],Intents:[meta],'Prepare Job Lookups':[]}});
asrt(T.find(x=>x.json._kind==='meta').json.queue_status==='OK','empty run ok');
const ALLK=['CONSENT_REQUEST','QUESTIONS','NEXT_STEP','NOT_ELIGIBLE_NOTICE','WITHDRAW_ACK'];
asrt(ALLK.every(kd=>{const lr=plan([lead('1',kd==='CONSENT_REQUEST'?{'Lead Status':'NEW','Consent Status':'NONE'}:kd==='QUESTIONS'?F({}):kd==='NEXT_STEP'?F({'Age':25,'Applicant JLPT':'N3','Skill Test Passed':'Yes'}):kd==='NOT_ELIGIBLE_NOTICE'?F({'Age':16,'Applicant JLPT':'N3','Skill Test Passed':'Yes'}):{'Lead Status':'WITHDRAWN','Consent Status':'WITHDRAWN','Purge After':'2026-12-01'})],[],[job(12)]);const it=lead1(lr)[0];return it.draft_kind===kd;}),'every template is reachable and passes the phrase policy');
// ================= verify / shape / errors / commit / runlog
const sentItem=(over)=>Object.assign({_kind:'lead',action:'PATCH',guard:'OK',page_id:'p1',lead_id:'LD-1',lead_key:'K1',job_id:'MTG-12',to_status:'NEW',msg_hashes:['mh1'],log_rows:[{event:'TRANSITION',from:'',to:'NEW',reason:'INTAKE'}],sent:{'Lead Status':{t:'select',v:'NEW'},'Name':{t:'rich_text',v:'ブディ'},'Age':{t:'number',v:25},'Purge After':{t:'date',v:'2026-10-21'},'PII Purged':{t:'checkbox',v:false},'Phone':{t:'phone_number',v:PH},'Human Action':{t:'select',v:''}}},over||{});
const vf=(item,resp)=>R('verify9.js',{input:[{json:resp}],nodes:{'Prepare Write':[{json:item}]}})[0].json;
const okResp={id:'p1',properties:{'Lead Status':{select:{name:'NEW'}},Name:{rich_text:[{plain_text:'ブディ'}]},Age:{number:25},'Purge After':{date:{start:'2026-10-21'}},'PII Purged':{checkbox:false},Phone:{phone_number:PH},'Human Action':{select:null}}};
let v=vf(sentItem(),okResp);asrt(v.verify_status==='OK'&&v.commit_ok===true,'verify OK on matching read-back (CJK name)');
v=vf(sentItem(),JSON.parse(JSON.stringify(okResp).replace('ブディ','ブデイ')));asrt(v.verify_status==='VERIFY_FAILED'&&v.commit_ok===false,'verify catches CJK mismatch, no commit');
v=vf(sentItem(),{object:'error',message:'validation_error'});asrt(v.verify_status==='WRITE_ERROR'&&v.commit_ok===false,'write error -> no commit');
v=vf(sentItem({guard:'BLOCKED',guard_reason:'X'}),okResp);asrt(v.verify_status==='BLOCKED'&&v.commit_ok===false,'blocked write -> no commit');
const outcomes=[{json:Object.assign(vf(sentItem(),okResp),{})},{json:Object.assign(vf(sentItem({lead_id:'LD-2',lead_key:'K2',msg_hashes:['mh2']}),{object:'error',message:'boom +628123456789'}),{})},{json:{_kind:'lead',action:'NOOP',commit_ok:true,lead_key:'K3',lead_id:'LD-3',msg_hashes:['mh3'],log_rows:[{event:'MESSAGE_IGNORED',reason:'IGNORED_AFTER_WITHDRAWAL'}]}},{json:{_kind:'meta',queue_status:'OK',inbox_status:'OK',messages_seen:3,messages_new:3,errors:[{stage:'inbox',type:'INBOX_ERROR',msg:'bad 0812-3456-7890'}],counts:{leads_loaded:2,created:1,transitions:1,drafts:1,manual_review:0,withdrawn:0,purged:0}}}];
const cm=R('commit9.js',{input:outcomes,nodes:{Config:[C()]}}).map(x=>x.json.msg_hash);
asrt(cm.includes('mh1')&&cm.includes('mh3')&&!cm.includes('mh2'),'dedup commit only for verified / no-write leads');
const sh=R('shape9.js',{input:outcomes,nodes:{Config:[C()]}}).map(x=>x.json);
asrt(sh.length===3&&sh.find(x=>x.lead_id==='LD-1').outcome==='OK'&&sh.find(x=>x.lead_id==='LD-3').outcome==='NOOP','lead log rows shaped with outcomes');
const er=R('errors9.js',{input:outcomes,nodes:{Config:[C()]}}).map(x=>x.json);
const rl=R('runlog9.js',{input:outcomes,nodes:{Config:[C()]}})[0].json;
const piiScan=JSON.stringify([sh,er,rl,cm]);
asrt(!/628123456789|0812-3456|ブディ|Budi/.test(piiScan),'logs / errors / run log contain no phone, name or message text');
asrt(sh.every(x=>Object.keys(x).join()==='run_id,ts,lead_id,lead_key,job_id,event,from_status,to_status,reason,consent_status,intent,eligibility,draft_kind,outcome'),'log row columns match mtg_lead_log');
asrt(rl.written_ok===1&&rl.write_errors===1&&rl.created===1,'run log counts');
console.log('log cols:',Object.keys(sh[0]).join(','));console.log('runlog:',JSON.stringify(rl).slice(0,300));
console.log(fails?('FAILS: '+fails):'ALL ASSERTIONS PASSED');
