const h=require('./harness');const path=require('path');
const R=(f,o)=>h.run(path.join(__dirname,f),o);
const cfg5={json:{run_id:'C1',run_started:'2026-10-06T03:00:00Z',run_date:'2026-10-06',max_per_run:15,use_ai:'true',allowed_tiers:'S-TIER,A-TIER,B-TIER,C-TIER',template_version:'v1',banned_phrases:'jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat|resmi MTGI|P3MI|penempatan resmi',hashtags:'#TokuteiGinou #SSW #KerjaDiJepang #InfoLowongan',disclaimer:'Informasi bersumber dari lowongan publik dan bisa berubah. Pastikan detail dan syarat resmi sebelum melamar.',brand_footer:'',ai_model_content:'m'}};
const cfg6={json:Object.assign({},cfg5.json,{run_id:'Q1',max_attempts:3,require_ai_second_pass:'true',ai_model_qc:'m',banned_phrases:'jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat',regulatory_phrases:'P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI'})};
const sel=n=>({type:'select',select:n?{name:n}:null});const rtx=s=>({type:'rich_text',rich_text:s?[{plain_text:s}]:[]});const num=n=>({type:'number',number:n});const dt=d=>({type:'date',date:d?{start:d}:null});
const pg=(id,o={})=>({id,url:'u/'+id,properties:Object.assign({'Job ID':{type:'unique_id',unique_id:{prefix:'MTG',number:1}},'Job Number':rtx('01010-3534'+id),'Job Title':{type:'title',title:[{plain_text:'健康食品の製造オペレーター'}]},Company:rtx('株式会社テスト'),'Canonical Company':rtx('株式会社テスト'),'Canonical Key':rtx('HW:1'),'Canonical Of':rtx(''),'Source URL':{type:'url',url:'https://hellowork.careers/'+id},'Lifecycle Status':sel('ACTIVE'),'QC Decision':sel('APPROVED'),Recruitability:sel('Overseas Confirmed'),'Priority Tier':sel('A-TIER'),Field:sel('食品製造'),Prefecture:rtx('岐阜県'),City:rtx('池田町'),'Canonical Location':rtx('岐阜県 池田町'),'Canonical Monthly Salary':num(285000),'Salary Basis':sel('MONTHLY'),'Annual Holidays':rtx('123日'),'Dormitory Available':sel('Yes'),'JLPT Required':sel('N3'),'License Required':sel('Unknown'),'Experience Required':sel('No'),'Overtime Hours Avg':num(20),'Expiry Date':dt('2026-10-25'),'Content Status':sel(o.cs||''),'Content Hash':rtx(o.hash||''),'Content Method':sel(o.method||''),'Poster Copy':rtx(o.poster||''),'WhatsApp Copy':rtx(o.wa||''),'Instagram Caption':rtx(o.ig||''),'TikTok Caption':rtx(o.tt||''),'Content QC Fact Hash':rtx(o.qfh||''),'Content QC Attempt':num(o.qa===undefined?null:o.qa),'Content QC Flags':rtx(o.qflags||'')},o.over||{})});
// --- WF05 produces a real draft (parity: WF06 must reproduce WF05's fact hash exactly)
const q5=(a)=>[{json:{results:a}},{json:{results:[]}}];
const f5=R('../js5/flatten5.js',{input:q5([pg('a')]),nodes:{Config:[cfg5]}})[0].json;
const good={poster_headline:'Lowongan Manufaktur Makanan di Gifu',poster_points:['株式会社テスト','Gaji ¥285,000/bulan','Persyaratan: JLPT N3','Pengalaman tidak disyaratkan'],whatsapp_body:'Info lowongan di 株式会社テスト, Gifu. Gaji bulanan ¥285,000, libur tahunan 123 hari. Level bahasa JLPT N3. Asrama tersedia menurut sumber. Pengalaman tidak disyaratkan.',instagram_body:'Lowongan 株式会社テスト di Gifu. Gaji ¥285,000 per bulan, libur 123 hari. JLPT N3.',tiktok_body:'株式会社テスト Gifu ¥285,000 JLPT N3'};
const c5=(ai)=>R('../js5/compose5.js',{input:[{json:Object.assign({},f5,{ai,needs_ai:'true'})}],nodes:{Config:[cfg5]}})[0].json;
const mk=(c,over)=>{const s=c.notion_sent;return pg('a',Object.assign({cs:'Draft',hash:f5.hash,method:c.method,poster:s['Poster Copy'],wa:s['WhatsApp Copy'],ig:s['Instagram Caption'],tt:s['TikTok Caption']},over||{}));};
const pipe=(pages,approved,aiText,extra)=>{
  const fl=R('flatten6.js',{input:[{json:{results:pages}},{json:{results:approved||[]}}],nodes:{Config:[cfg6]}});
  const dt6=R('det6.js',{input:fl,nodes:{Config:[cfg6]}});
  // AI step simulation
  let mid=dt6;
  if(aiText!==undefined){
    const pr=R('prep_ai6.js',{input:dt6.filter(x=>x.json.needs_ai==='true'),nodes:{Config:[cfg6]}});
    const resp=pr.map(()=>({json:typeof aiText==='string'?{content:[{text:aiText}]}:aiText}));
    const pa=R('parse_ai6.js',{input:resp,nodes:{Config:[cfg6],'Prepare AI':pr}});
    const map={};pa.forEach(x=>map[x.json.page_id]=x.json);
    mid=dt6.map(x=>map[x.json.page_id]?{json:map[x.json.page_id]}:x);
  }
  return R('decide6.js',{input:mid,nodes:Object.assign({Config:[cfg6]},extra||{})}).map(x=>x.json);
};
const show=(t,r)=>console.log(t.padEnd(34),'->',r.outcome,'|',r.qc_decision||'-','|',r.risk_level||'-','|',(r.flags||[]).join(',')||'-','|att',r.qc_attempt===undefined?'-':r.qc_attempt);
const PASSAI=JSON.stringify({verdict:'PASS',issues:[]});
// 0 parity
const fl0=R('flatten6.js',{input:[{json:{results:[mk(c5(good))]}},{json:{results:[]}}],nodes:{Config:[cfg6]}})[0].json;
console.log('fact-hash parity WF05==WF06:',fl0.fact_hash===f5.hash,fl0.fact_hash);
// 1 happy paths
let r=pipe([mk(c5(good))],[],PASSAI)[0];show('AI draft + AI PASS',r);console.log('  patch status/hash cleared?',r.notion_sent['Content Status'],'| keys',Object.keys(r.notion_sent).join(','));
r=pipe([mk(c5(null))],[],PASSAI)[0];show('template draft + AI PASS',r);
const asrt=(c,m)=>{if(!c){console.log('ASSERT FAIL:',m);process.exitCode=1;}};
asrt(r.qc_decision==='APPROVED','template should approve');
// 2 AI paths
r=pipe([mk(c5(good))],[],JSON.stringify({verdict:'MINOR',issues:[{channel:'whatsapp',type:'wording',quote:'Info lowongan di 株式会社テスト',note:'kaku'}]}))[0];show('AI MINOR (verified quote)',r);asrt(r.qc_decision==='REVISION_REQUIRED'&&r.notion_sent['Content Status']==='Draft'&&r.notion_sent['Content Hash']==='','minor->revision, draft, hash cleared');
r=pipe([mk(c5(good))],[],JSON.stringify({verdict:'FAIL',issues:[{channel:'whatsapp',type:'fact',quote:'Asrama tersedia menurut sumber',note:'ragu'}]}))[0];show('AI FAIL fact (verified)',r);asrt(r.qc_decision==='MANUAL_REVIEW','AI fail alone cannot reject');
r=pipe([mk(c5(good))],[],JSON.stringify({verdict:'FAIL',issues:[{channel:'whatsapp',type:'fact',quote:'kalimat yang tidak ada',note:'x'}]}))[0];show('AI FAIL unverifiable quote',r);asrt(r.qc_decision==='MANUAL_REVIEW'&&r.flags.includes('AI_UNSURE'),'unquotable -> unsure');
r=pipe([mk(c5(good))],[],'not json at all')[0];show('AI down/garbage',r);asrt(r.outcome==='DEFERRED_NO_AI'&&r.needs_write==='false','defer, no write');
r=pipe([mk(c5(good))],[],{error:{message:'overloaded'}})[0];show('AI HTTP error',r);asrt(r.outcome==='DEFERRED_NO_AI','defer on http error');
// AI never overrides deterministic failure
const badWa=Object.assign({},good,{whatsapp_body:'Info 株式会社テスト gaji ¥350,000 per bulan'});
const cb=c5(good);const sent=Object.assign({},cb.notion_sent);
const withEdit=(fn)=>{const c=JSON.parse(JSON.stringify(cb));fn(c.notion_sent);return mk(c);};
r=pipe([withEdit(s=>{s['WhatsApp Copy']=s['WhatsApp Copy'].replace('285,000','350,000');})],[],PASSAI)[0];show('salary edited to 350,000 (AI PASS)',r);asrt(r.qc_decision==='REJECTED'&&r.flags.includes('AMOUNT_MISMATCH')&&r.notion_sent['Content Status']==='Rejected','salary mismatch rejects despite AI pass');
const det=(name,fn,code,dec)=>{r=pipe([withEdit(fn)],[],PASSAI)[0];show(name,r);asrt(r.flags.includes(code)&&(!dec||r.qc_decision===dec),name+' expected '+code+' '+(dec||''));};
det('company changed',s=>{s['Poster Copy']=s['Poster Copy'].replace('株式会社テスト','株式会社ほかの');s['WhatsApp Copy']=s['WhatsApp Copy'].replace(/株式会社テスト/g,'株式会社ほかの');},'COMPANY_MISMATCH','REJECTED');
det('job number changed',s=>{s['Poster Copy']=s['Poster Copy'].replace(/01010-3534a/,'01010-9999');},'JOB_NUMBER_MISMATCH','REJECTED');
det('url changed',s=>{s['WhatsApp Copy']=s['WhatsApp Copy'].replace('hellowork.careers/a','evil.example/x');},'URL_MISMATCH','REJECTED');
det('JLPT N2',s=>{s['Instagram Caption']=s['Instagram Caption'].replace('JLPT N3','JLPT N2');},'JLPT_MISMATCH','REJECTED');
det('license invented',s=>{s['Poster Copy']+='\nWajib SIM B';},'LICENSE_UNSUPPORTED','REJECTED');
det('wrong prefecture',s=>{s['TikTok Caption']=s['TikTok Caption'].replace('Gifu','Tokyo');},'LOCATION_MISMATCH','REJECTED');
det('invented position (JP)',s=>{s['Poster Copy']+='\n介護福祉士を募集';},'POSITION_MISMATCH','REJECTED');
det('new JP term',s=>{s['Instagram Caption']+='\n福利厚生充実';},'NEW_JP_TERM','REVISION_REQUIRED');
det('promise word',s=>{s['TikTok Caption']+=' pasti berangkat';},'BANNED_PHRASE','REVISION_REQUIRED');
det('disclaimer removed',s=>{s['Instagram Caption']=s['Instagram Caption'].replace(/Informasi bersumber[^\n]*/,'');},'DISCLAIMER_MISSING','REVISION_REQUIRED');
det('P3MI claim',s=>{s['WhatsApp Copy']+='\nDiproses oleh P3MI berizin';},'REGULATORY_CLAIM','MANUAL_REVIEW');
det('Indonesia-only claim',s=>{s['WhatsApp Copy']+='\nKhusus pekerja Indonesia';},'INDONESIA_SPECIFIC_CLAIM','MANUAL_REVIEW');
det('empty channel',s=>{s['TikTok Caption']='';},'EMPTY_CHANNEL','REVISION_REQUIRED');
det('extra number (12 jam)',s=>{s['WhatsApp Copy']+='\nLembur 12 jam';},'NUMBER_MISMATCH','REJECTED');
// footer/disclaimer wording must NOT false-trigger (Pastikan, Bukan jaminan variant)
r=pipe([mk(c5(good))],[],PASSAI)[0];asrt(!r.flags.includes('BANNED_PHRASE'),"'Pastikan' in disclaimer must not hit 'pasti'");
// 3 stale
r=pipe([mk(c5(good),{hash:'deadbeef00000000'})],[],PASSAI)[0];show('stale draft',r);asrt(r.outcome==='STALE'&&r.notion_sent['Content Status']==='Not Started'&&r.notion_sent['Content Hash']==='','stale resets');
const apd=mk(c5(good),{cs:'Approved'});
r=pipe([],[apd])[0];show('approved, unchanged',r);asrt(r.outcome==='STILL_VALID'&&r.needs_write==='false','approved unchanged = no write');
const apStale=pg('a',{cs:'Approved',hash:f5.hash,method:'AI',poster:cb.notion_sent['Poster Copy'],wa:cb.notion_sent['WhatsApp Copy'],ig:cb.notion_sent['Instagram Caption'],tt:cb.notion_sent['TikTok Caption'],over:{'Canonical Monthly Salary':num(300000)}});
r=pipe([],[apStale])[0];show('approved, salary changed later',r);asrt(r.outcome==='STALE'&&r.notion_sent['Content Status']==='Not Started','approved goes stale on salary change');
r=pipe([],[pg('a',{cs:'Approved',hash:f5.hash,poster:cb.notion_sent['Poster Copy'],wa:cb.notion_sent['WhatsApp Copy'],ig:cb.notion_sent['Instagram Caption'],tt:cb.notion_sent['TikTok Caption'],over:{'Canonical Company':rtx('株式会社べつ')}}) ])[0];show('approved, company changed later',r);asrt(r.outcome==='STALE','company change => stale');
// stale loop guard
r=pipe([mk(c5(good),{hash:'deadbeef00000000',qfh:f5.hash,qflags:'STALE_CONTENT'})],[],PASSAI)[0];show('stale AGAIN same facts',r);asrt(r.qc_decision==='MANUAL_REVIEW'&&r.flags.includes('STALE_LOOP'),'stale loop -> manual');
// 4 job gate
r=pipe([mk(c5(good),{over:{'Lifecycle Status':sel('EXPIRED')}})],[],PASSAI)[0];show('job expired',r);asrt(r.qc_decision==='REJECTED'&&r.flags.includes('JOB_NOT_ELIGIBLE')&&r.notion_sent['Content Status']==='Rejected','expired job rejects content');
r=pipe([],[mk(c5(good),{cs:'Approved',over:{'QC Decision':sel('REVIEW')}})])[0];show('approved but job QC now REVIEW',r);asrt(r.qc_decision==='REJECTED','approved withdrawn');
r=pipe([mk(c5(good),{over:{'Canonical Of':rtx('u/zz')}})],[],PASSAI)[0];show('job became duplicate',r);asrt(r.flags.includes('JOB_NOT_ELIGIBLE'),'dup');
// 5 attempts
r=pipe([mk(c5(good))],[],JSON.stringify({verdict:'MINOR',issues:[{channel:'whatsapp',type:'wording',quote:'Info lowongan di 株式会社テスト',note:'k'}]}))[0];
const w1=pipe([mk(c5(good),{qfh:f5.hash,qa:1})],[],JSON.stringify({verdict:'MINOR',issues:[{channel:'whatsapp',type:'wording',quote:'Info lowongan di 株式会社テスト',note:'k'}]}))[0];show('attempt 2 minor',w1);asrt(w1.qc_decision==='REVISION_REQUIRED'&&w1.qc_attempt===2,'attempt 2 still revision');
const w2=pipe([mk(c5(good),{qfh:f5.hash,qa:2})],[],JSON.stringify({verdict:'MINOR',issues:[{channel:'whatsapp',type:'wording',quote:'Info lowongan di 株式会社テスト',note:'k'}]}))[0];show('attempt 3 minor',w2);asrt(w2.qc_decision==='MANUAL_REVIEW'&&w2.flags.includes('ATTEMPTS_EXHAUSTED'),'attempt 3 -> manual');
const w3=pipe([mk(c5(good),{qfh:'oldfacts',qa:2})],[],JSON.stringify({verdict:'MINOR',issues:[{channel:'whatsapp',type:'wording',quote:'Info lowongan di 株式会社テスト',note:'k'}]}))[0];show('new facts reset attempts',w3);asrt(w3.qc_attempt===1,'attempt resets on new fact hash');
// 6 awaiting regen / empty / caps / queue error
r=pipe([pg('a',{cs:'Draft',hash:''})],[])[0];show('draft sent back, waiting WF05',r);asrt(r.outcome==='AWAITING_REGEN','awaiting');
const empty=R('flatten6.js',{input:[{json:{results:[]}},{json:{results:[]}}],nodes:{Config:[cfg6]}});console.log('empty queue ->',empty[0].json._kind,empty[0].json.status);
const qerr=R('flatten6.js',{input:[{json:{object:'error',message:'boom'}},{json:{results:[]}}],nodes:{Config:[cfg6]}});console.log('query error ->',qerr[0].json.status);
const rd=R('decide6.js',{input:empty,nodes:{Config:[cfg6]}});console.log('meta passes Decide ->',rd[0].json._kind,rd[0].json.needs_write);
// 7 deterministic-only mode
const cfgNo={json:Object.assign({},cfg6.json,{use_ai:'false',require_ai_second_pass:'false'})};
const flN=R('flatten6.js',{input:[{json:{results:[mk(c5(null))]}},{json:{results:[]}}],nodes:{Config:[cfgNo]}});
const dN=R('det6.js',{input:flN,nodes:{Config:[cfgNo]}});const rN=R('decide6.js',{input:dN,nodes:{Config:[cfgNo]}})[0].json;show('use_ai=false, ai not required',rN);asrt(rN.qc_decision==='APPROVED'&&rN.flags.includes('DETERMINISTIC_ONLY'),'det-only approve');
const cfgN2={json:Object.assign({},cfg6.json,{use_ai:'false'})};
const dN2=R('det6.js',{input:R('flatten6.js',{input:[{json:{results:[mk(c5(null))]}},{json:{results:[]}}],nodes:{Config:[cfgN2]}}),nodes:{Config:[cfgN2]}});const rN2=R('decide6.js',{input:dN2,nodes:{Config:[cfgN2]}})[0].json;show('use_ai=false, ai required',rN2);asrt(rN2.outcome==='DEFERRED_NO_AI','no approval without AI when required');
// 8 verify + shape + errors + runlog
const dec=pipe([mk(c5(good))],[],PASSAI);const d0=dec[0];
const props=(sent)=>{const P={};Object.keys(sent).forEach(k=>{const v=sent[k];P[k]=typeof v==='number'?{type:'number',number:v}:/^(Approved|Draft|Rejected|Manual Review|Not Started|APPROVED|REVISION_REQUIRED|REJECTED|MANUAL_REVIEW|LOW|MEDIUM|HIGH)$/.test(String(v))&&['Content Status','Content QC Decision','Content Risk'].includes(k)?{type:'select',select:{name:v}}:k==='Content QC Date'?{type:'date',date:{start:v}}:{type:'rich_text',rich_text:v?[{plain_text:v}]:[]};});return P;};
const vr=(mut)=>{const P=props(d0.notion_sent);if(mut)mut(P);return R('verify6.js',{input:[{json:{id:d0.page_id,properties:P}}],nodes:{Decide:[{json:d0}],'Notion PATCH':[{json:{id:d0.page_id}}]}})[0].json;};
console.log('verify ok ->',vr().write_status);
console.log('verify CJK/notes corrupted ->',vr(P=>{P['Content QC Notes']={type:'rich_text',rich_text:[{plain_text:'????'}]};}).write_status);
console.log('verify attempt number mismatch ->',vr(P=>{P['Content QC Attempt']={type:'number',number:9};}).write_status);
const wr=Object.assign({},d0,{_kind:'write_row',write_status:'OK'});
const sh=R('shape6.js',{input:[{json:wr}],nodes:{Config:[cfg6]}});console.log('log row cols:',Object.keys(sh[0].json).join(','));
const rl=R('runlog6.js',{input:[{json:wr},{json:Object.assign({},pipe([mk(c5(good),{hash:'x'})],[],PASSAI)[0],{_kind:'write_row',write_status:'VERIFY_FAILED'})}],nodes:{Config:[cfg6]}});console.log(JSON.stringify(rl[0].json));
