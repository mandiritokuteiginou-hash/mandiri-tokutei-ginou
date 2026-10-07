const h=require('./harness');const path=require('path');
const R=(f,o)=>h.run(path.join(__dirname,f),o);
const asrt=(c,m)=>{if(!c){console.log('ASSERT FAIL:',m);process.exitCode=1;}};
const base5={run_id:'C1',run_started:'2026-10-06T06:00:00Z',run_date:'2026-10-06',max_per_run:15,use_ai:'true',allowed_tiers:'S-TIER,A-TIER,B-TIER,C-TIER',template_version:'v1',banned_phrases:'jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat|resmi MTGI|P3MI|penempatan resmi',hashtags:'#TokuteiGinou #SSW #KerjaDiJepang #InfoLowongan',disclaimer:'Informasi bersumber dari lowongan publik dan bisa berubah. Pastikan detail dan syarat resmi sebelum melamar.',brand_footer:'',ai_model_content:'m'};
const c7=(o)=>({json:Object.assign({},base5,{run_id:'IM1',max_per_run:10,max_attempts:3,use_ai:'true',require_vision_pass:'true',ai_model_vision:'m',image_template_version:'v1',poster_size:'1080x1350',cta_text:'Info lengkap ada di caption',contact_line:'',poster_disclaimer:'Info bersumber dari lowongan publik; bisa berubah.',claim_phrases:'terbaik'},o||{})});
const c8=(o)=>({json:Object.assign({},base5,{run_id:'DS1',publish_mode:'LIVE',platforms_enabled:'instagram,tiktok,whatsapp',ig_account_id:'ig1',tiktok_account_id:'tt1',whatsapp_endpoint:'https://bridge.example/send',whatsapp_channel_id:'ch1',blotato_post_url:'https://backend.blotato.com/v2/posts',blotato_status_url:'https://backend.blotato.com/v2/posts/',tiktok_privacy:'SELF_ONLY',max_attempts:3,max_posts_per_run:6,retry_after_hours:6,banned_phrases:'jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat',regulatory_phrases:'P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI',image_template_version:'v1',poster_size:'1080x1350',cta_text:'Info lengkap ada di caption',contact_line:'',poster_disclaimer:'Info bersumber dari lowongan publik; bisa berubah.'},o||{})});
const sel=n=>({type:'select',select:n?{name:n}:null});const rtx=s=>({type:'rich_text',rich_text:s?[{plain_text:s}]:[]});const num=n=>({type:'number',number:n});const dt=d=>({type:'date',date:d?{start:d}:null});const url=u=>({type:'url',url:u||null});
const pg=(id,o={})=>({id,url:'u/'+id,properties:Object.assign({'Job ID':{type:'unique_id',unique_id:{prefix:'MTG',number:1}},'Job Number':rtx('01010-3534a'),'Job Title':{type:'title',title:[{plain_text:'健康食品の製造オペレーター'}]},Company:rtx('株式会社テスト'),'Canonical Company':rtx('株式会社テスト'),'Canonical Key':rtx('HW:1'),'Canonical Of':rtx(''),'Source URL':{type:'url',url:'https://hellowork.careers/a'},'Lifecycle Status':sel('ACTIVE'),'QC Decision':sel('APPROVED'),Recruitability:sel('Overseas Confirmed'),'Priority Tier':sel(o.tier||'A-TIER'),Field:sel('食品製造'),Prefecture:rtx('岐阜県'),City:rtx('池田町'),'Canonical Location':rtx('岐阜県 池田町'),'Canonical Monthly Salary':num(285000),'Salary Basis':sel('MONTHLY'),'Annual Holidays':rtx('123日'),'Dormitory Available':sel('Yes'),'JLPT Required':sel('N3'),'License Required':sel('Unknown'),'Experience Required':sel('No'),'Overtime Hours Avg':num(20),'Expiry Date':dt(o.expiry||'2026-10-25'),'Content Status':sel(o.cs===undefined?'Approved':o.cs),'Content Hash':rtx(o.hash||''),'Content QC Decision':sel('APPROVED'),'Image Status':sel(o.is||''),'Image URL':url(o.iurl),'Image Build Hash':rtx(o.ibh||''),'Instagram Caption':rtx(o.ig===undefined?'Lowongan 株式会社テスト di Gifu. Gaji ¥285,000.':o.ig),'TikTok Caption':rtx(o.tt===undefined?'株式会社テスト Gifu ¥285,000':o.tt),'WhatsApp Copy':rtx(o.wa===undefined?'Info lowongan 株式会社テスト, Gifu, ¥285,000.':o.wa),'Legal Review Status':sel(o.legal||''),'Legal Reviewed Hash':rtx(o.lh||''),'Distribution Status':sel(o.ds||''),'Distribution Ledger':rtx(o.ledger||''),'Published Platforms':rtx(o.pp||'')},o.over||{})});
// ---- derive WF05/WF07 hashes
const f5=R('../js5/flatten5.js',{input:[{json:{results:[pg('a',{cs:'',})]}},{json:{results:[]}}],nodes:{Config:[{json:base5}]}})[0].json;const FH=f5.hash;
// WF07 flatten needs Content QC Decision (present) and READY/approved candidate
const f7=R('../js7/flatten7.js',{input:[{json:{results:[pg('a',{hash:FH})]}},{json:{results:[]}}],nodes:{Config:[c7()]}})[0].json;const BH=f7.build_hash;
// ---- plan helper
const plan=(pages,state,cfgOpt)=>R('plan8.js',{input:(state&&state.length?state:[{json:{}}]).map(x=>({json:x})),nodes:{Config:[cfgOpt||c8()],'Query Candidates':[{json:{results:pages}}]}});
const good=(o)=>pg('a',Object.assign({hash:FH,is:'READY',ibh:BH,iurl:'https://hcti.example/img/1',legal:'APPROVED',lh:BH},o||{}));
const P=(pages,state,cfgOpt)=>plan(pages,state,cfgOpt).map(x=>x.json);
let r=P([good()]);
console.log('hash parity WF07==WF08:',r[0].build_hash===BH,'| items',r.map(x=>x.platform+':'+x.action).join(','));asrt(r[0].build_hash===BH&&r[0].fact_hash===FH,'parity');
asrt(r.filter(x=>x.action==='PUBLISH').length===3,'3 platforms publish when all gates pass');
// ---- gate matrix
const gate=(name,o,expect,expectAction)=>{const x=P([good(o)]);const j=x[0];console.log(name.padEnd(38),'->',j.outcome,'|',(j.reason||'').slice(0,70));asrt(x.every(y=>y.action!=='PUBLISH'),name+' must not publish');if(expect)asrt(j.outcome===expect,name+' expected '+expect+' got '+j.outcome);};
gate('lifecycle EXPIRED',{over:{'Lifecycle Status':sel('EXPIRED')}},'NOT_ELIGIBLE');
gate('job QC REVIEW',{over:{'QC Decision':sel('REVIEW')}},'NOT_ELIGIBLE');
gate('Overseas Unverified',{over:{Recruitability:sel('Overseas Unverified')}},'NOT_ELIGIBLE');
gate('duplicate (Canonical Of)',{over:{'Canonical Of':rtx('u/zz')}},'NOT_ELIGIBLE');
gate('no Canonical Key',{over:{'Canonical Key':rtx('')}},'NOT_ELIGIBLE');
gate('Content Status Draft',{cs:'Draft'},'NOT_ELIGIBLE');
gate('Image Status not READY',{is:'REGENERATE'},'NOT_ELIGIBLE');
gate('Image URL http (insecure)',{iurl:'http://x/y.png'},'NOT_ELIGIBLE');
gate('Image URL missing',{iurl:''},'NOT_ELIGIBLE');
{const o={expiry:'2026-10-01'};const fh=R('../js5/flatten5.js',{input:[{json:{results:[pg('a',Object.assign({cs:''},o))]}},{json:{results:[]}}],nodes:{Config:[{json:base5}]}})[0].json.hash;const bh=R('../js7/flatten7.js',{input:[{json:{results:[pg('a',Object.assign({hash:fh},o))]}},{json:{results:[]}}],nodes:{Config:[c7()]}})[0].json.build_hash;gate('job expiry passed',Object.assign({hash:fh,ibh:bh,lh:bh},o),'NOT_ELIGIBLE');}
gate('content hash stale',{hash:'deadbeef00000000'},'STALE');
gate('salary changed after approval',{over:{'Canonical Monthly Salary':num(300000)}},'STALE');
gate('image build hash stale',{ibh:'oldoldold'},'STALE');
gate('legal empty',{legal:'',lh:''},'LEGAL_HOLD');
gate('legal NOT_REVIEWED',{legal:'NOT_REVIEWED'},'LEGAL_HOLD');
gate('legal NEEDS_CHANGES',{legal:'NEEDS_CHANGES'},'LEGAL_HOLD');
gate('legal REJECTED',{legal:'REJECTED'},'LEGAL_HOLD');
gate('legal APPROVED but old hash',{lh:'oldhashhashhash'},'LEGAL_HOLD');
gate('legal APPROVED, hash empty',{lh:''},'LEGAL_HOLD');
// no global legal bypass
const bypass=P([good({legal:'',lh:''})],[],c8({skip_legal_gate:'true',require_legal_review:'false',legal_bypass:true}));asrt(bypass.every(x=>x.action!=='PUBLISH'),'config flags cannot bypass legal');console.log('legal bypass flags ignored ->',bypass[0].outcome);
// legal approval binds to hash: change content -> new hash -> legal hold
const cs=R('../js5/flatten5.js',{input:[{json:{results:[pg('a',{cs:'',over:{'Canonical Monthly Salary':num(300000)}})]}},{json:{results:[]}}],nodes:{Config:[{json:base5}]}})[0].json;
const bh2=R('../js7/flatten7.js',{input:[{json:{results:[pg('a',{hash:cs.hash,over:{'Canonical Monthly Salary':num(300000)}})]}},{json:{results:[]}}],nodes:{Config:[c7()]}})[0].json.build_hash;
const reg=P([pg('a',{hash:cs.hash,is:'READY',ibh:bh2,iurl:'https://x/y.png',legal:'APPROVED',lh:BH,over:{'Canonical Monthly Salary':num(300000)}})]);console.log('regenerated content, old legal approval ->',reg[0].outcome);asrt(reg[0].outcome==='LEGAL_HOLD','old legal approval does not carry over');
// ---- dry run (default) and platform configuration
r=P([good()],[],c8({publish_mode:'DRY_RUN'}));console.log('DRY_RUN ->',r.map(x=>x.platform+':'+x.outcome).join(','));asrt(r.every(x=>x.action!=='PUBLISH')&&r.every(x=>x.outcome==='DRY_RUN'),'dry run never publishes');
r=P([good()],[],c8({publish_mode:undefined}));asrt(r.every(x=>x.action!=='PUBLISH'),'missing publish_mode = dry run');
r=P([good()],[],c8({tiktok_account_id:'',whatsapp_endpoint:''}));console.log('only IG configured ->',r.map(x=>x.platform+':'+x.action).join(','));asrt(r.length===1&&r[0].platform==='instagram','unconfigured platforms skipped');
r=P([good()],[],c8({platforms_enabled:'instagram'}));asrt(r.length===1,'platform enable list');
// ---- idempotency
const dh=(pf)=>P([good()]).find(x=>x.platform===pf).distribution_hash;
const hIG=dh('instagram'),hTT=dh('tiktok'),hWA=dh('whatsapp');asrt(new Set([hIG,hTT,hWA]).size===3,'hash differs per platform');
r=P([good()],[{distribution_hash:hIG,status:'PUBLISHED',attempt:1,platform:'instagram'}]);console.log('IG PUBLISHED in queue ->',r.map(x=>x.platform+':'+x.outcome).join(','));asrt(r.find(x=>x.platform==='instagram').outcome==='SKIP_PUBLISHED'&&r.find(x=>x.platform==='tiktok').action==='PUBLISH','skip only the published platform; other platforms continue');
r=P([good({ledger:'instagram|'+hIG+'|ig123|2026-10-05'})],[]);asrt(r.find(x=>x.platform==='instagram').outcome==='SKIP_PUBLISHED','ledger in Notion protects against a lost queue table');
const hAfter=P([pg('a',{hash:cs.hash,is:'READY',ibh:bh2,iurl:'https://x/y.png',legal:'APPROVED',lh:bh2,over:{'Canonical Monthly Salary':num(300000)}})]).find(x=>x.platform==='instagram').distribution_hash;asrt(hAfter!==hIG,'new content/image version = new distribution hash');
// ---- retry rules
const old='2026-10-05T00:00:00Z';
r=P([good()],[{distribution_hash:hIG,status:'FAILED',attempt:1,platform:'instagram',updated_at:old}]);let x=r.find(y=>y.platform==='instagram');console.log('FAILED attempt1 (old) ->',x.action,'attempt',x.attempt);asrt(x.action==='PUBLISH'&&x.attempt===2,'retry attempt 2');
r=P([good()],[{distribution_hash:hIG,status:'FAILED',attempt:1,platform:'instagram',updated_at:'2026-10-06T05:00:00Z'}]);x=r.find(y=>y.platform==='instagram');const realNow=Date.now();
// Date.now is real; use a very recent timestamp for backoff test
r=P([good()],[{distribution_hash:hIG,status:'FAILED',attempt:1,platform:'instagram',updated_at:new Date().toISOString()}]);x=r.find(y=>y.platform==='instagram');console.log('FAILED just now ->',x.outcome);asrt(x.outcome==='WAIT_RETRY','backoff');
r=P([good()],[{distribution_hash:hIG,status:'FAILED',attempt:3,platform:'instagram',updated_at:old,error_code:'HTTP_503',error_message:'x'}]);x=r.find(y=>y.platform==='instagram');console.log('FAILED attempt3 ->',x.action,x.outcome,x.row&&x.row.status);asrt(x.action==='ROW_UPDATE'&&x.row.status==='MANUAL_REVIEW','exhausted -> manual');
r=P([good()],[{distribution_hash:hIG,status:'PUBLISHING',attempt:1,platform:'instagram',updated_at:old,external_post_id:'sub1'}]);x=r.find(y=>y.platform==='instagram');console.log('PUBLISHING left over ->',x.action,x.outcome,'|',x.reason.slice(0,40));asrt(x.action==='ROW_UPDATE'&&x.outcome==='MANUAL_REVIEW','ambiguous publishing never re-posted');
r=P([good()],[{distribution_hash:hIG,status:'MANUAL_REVIEW',attempt:1,platform:'instagram',updated_at:old}]);x=r.find(y=>y.platform==='instagram');asrt(x.outcome==='MANUAL_HOLD'&&x.action==='SKIP','manual hold');
// stale queue rows
r=P([good()],[{distribution_hash:'zzzz0000',status:'FAILED',attempt:1,platform:'tiktok',page_id:'a',job_id:'MTG-1',content_hash:'old',image_build_hash:'old',updated_at:old}]);x=r.find(y=>y.distribution_hash==='zzzz0000');console.log('old FAILED row ->',x&&x.row&&x.row.status);asrt(x&&x.row.status==='STALE','stale pending row marked');
r=P([],[{distribution_hash:'yyyy0000',status:'PUBLISHING',attempt:1,platform:'tiktok',page_id:'gone',job_id:'MTG-9',content_hash:'old',image_build_hash:'old',updated_at:old}]);asrt(r[0].row&&r[0].row.status==='MANUAL_REVIEW','orphan PUBLISHING row -> manual');
r=P([],[{distribution_hash:'pub00000',status:'PUBLISHED',attempt:1,platform:'tiktok',page_id:'gone'}]);asrt(r[0]._kind==='meta','old PUBLISHED rows are left alone');
// cap
const many=[good(),pg('b',{hash:FH,is:'READY',ibh:BH,iurl:'https://x/y.png',legal:'APPROVED',lh:BH})];
r=P(many,[],c8({max_posts_per_run:2}));console.log('cap 2 ->',r.map(x=>x.action+':'+x.outcome).join(','));asrt(r.filter(x=>x.action==='PUBLISH').length<=2,'post cap');
// empty/error
console.log('empty ->',P([])[0].status,'| error ->',R('plan8.js',{input:[{json:{}}],nodes:{Config:[c8()],'Query Candidates':[{json:{object:'error',message:'x'}}]}})[0].json.status);
// ---- format
const pub=P([good()]).filter(x=>x.action==='PUBLISH');const fmt=(items,cfgOpt)=>R('format8.js',{input:items.map(j=>({json:j})),nodes:{Config:[cfgOpt||c8()]}}).map(x=>x.json);
let f=fmt(pub);const ig=f.find(y=>y.platform==='instagram'),tt=f.find(y=>y.platform==='tiktok'),wa=f.find(y=>y.platform==='whatsapp');
console.log('IG body:',JSON.stringify(ig.request_body).slice(0,200));console.log('TT target:',JSON.stringify(tt.request_body.post.target));console.log('WA body keys:',Object.keys(wa.request_body).join(','));
asrt(ig.payload_ok==='true'&&ig.request_body.post.content.text===pub.find(y=>y.platform==='instagram').caption,'caption verbatim');
asrt(tt.request_body.post.target.privacyLevel==='SELF_ONLY'&&tt.request_body.post.target.isAiGenerated===false,'tiktok safe default');
asrt(wa.request_body.idempotency_key===wa.distribution_hash,'whatsapp idempotency key');asrt(ig.row.status==='PUBLISHING','row = PUBLISHING lock');
const badCap=(c,over)=>fmt(P([good(over)]).filter(x=>x.action==='PUBLISH'&&x.platform==='instagram'),c)[0];
let b=badCap(c8(),{ig:'Dijamin berangkat!'});console.log('banned caption ->',b.payload_ok,b.error_code,b.error_message,b.row.status);asrt(b.payload_ok==='false'&&b.row.status==='MANUAL_REVIEW','banned phrase -> manual');
b=badCap(c8(),{ig:'Diproses oleh P3MI berizin'});asrt(b.payload_ok==='false'&&/REGULATORY/.test(b.error_message),'regulatory -> manual');
b=badCap(c8(),{ig:'x'.repeat(2300)});asrt(/CAPTION_TOO_LONG/.test(b.error_message),'too long');
b=badCap(c8(),{ig:''});asrt(/EMPTY_CAPTION/.test(b.error_message),'empty');
b=badCap(c8(),{ig:'Pastikan detail. '+base5.disclaimer});asrt(b.payload_ok==='true','"Pastikan" and the disclaimer text do not false-trigger');
// ---- confirm lock
const lk=(resp)=>R('confirm_lock8.js',{input:[{json:resp}],nodes:{'Format Payload':[{json:ig}]}})[0].json;
asrt(lk({id:5}).lock_ok==='true','lock ok');let l=lk({error:{message:'db down'}});console.log('lock failure ->',l.lock_ok,l.outcome);asrt(l.lock_ok==='false'&&l.outcome==='LOCK_FAILED','no lock = no publish');asrt(lk({}).lock_ok==='false','no id');
// ---- parse result
const pr=(resp,pf,att)=>{const src=pf==='whatsapp'?wa:pf==='tiktok'?tt:ig;const j=Object.assign({},src,{lock_ok:'true',attempt:att||1,row:Object.assign({},src.row,{attempt:att||1})});return R('parse_result8.js',{input:[{json:resp}],nodes:{Config:[c8()],'Confirm Lock':[{json:j}]}})[0].json;};
let p=pr({statusCode:201,body:{postSubmissionId:'sub123'}},'instagram');console.log('Blotato 201 ->',p.outcome,p.needs_verify,p.external_post_id,p.verify_url);asrt(p.needs_verify==='true'&&p.row.status==='PUBLISHING'&&p.verify_url.endsWith('sub123'),'accepted needs verify');
p=pr({statusCode:200,body:{}},'instagram');asrt(p.outcome==='MANUAL_REVIEW'&&p.error_code==='NO_SUBMISSION_ID','no id -> manual');
p=pr({statusCode:401,body:{message:'bad key'}},'instagram');console.log('401 ->',p.outcome,p.row.status);asrt(p.outcome==='FAILED'&&p.row.status==='FAILED','401 retry');
p=pr({statusCode:401,body:{message:'bad key'}},'instagram',3);console.log('401 at attempt 3 ->',p.outcome);asrt(p.outcome==='MANUAL_REVIEW'&&p.error_code,'401 exhausted -> manual');
p=pr({statusCode:429,body:{}},'tiktok');asrt(p.outcome==='FAILED','429 retry');
p=pr({statusCode:503,body:{}},'tiktok');console.log('503 ->',p.outcome,'|',p.error_message.slice(-60));asrt(p.outcome==='FAILED'&&/AMBIGUOUS_RETRY/.test(p.error_message),'5xx retry, flagged ambiguous');
p=pr({statusCode:422,body:{message:'invalid media'}},'instagram');console.log('422 ->',p.outcome,p.reason);asrt(p.outcome==='MANUAL_REVIEW'&&p.row.status==='MANUAL_REVIEW','422 never retried');
p=pr({statusCode:400,body:{}},'tiktok');asrt(p.outcome==='MANUAL_REVIEW','400 manual');p=pr({statusCode:403,body:{}},'tiktok');asrt(p.outcome==='MANUAL_REVIEW','403 manual (policy)');
p=pr({error:{message:'getaddrinfo ENOTFOUND'}},'instagram');asrt(p.outcome==='FAILED'&&p.error_code==='NETWORK','network retry');
p=pr({error:{message:'timeout of 30000ms exceeded'}},'instagram');asrt(/AMBIGUOUS_RETRY/.test(p.error_message),'timeout flagged ambiguous');
p=pr({statusCode:200,body:{message_id:'wamid1'}},'whatsapp');console.log('WA 200 ->',p.outcome,p.row.status);asrt(p.outcome==='PUBLISHED'&&p.needs_verify==='false'&&p.row.published_at,'whatsapp published');
p=pr({statusCode:200,body:{ok:false,error:'channel closed'}},'whatsapp');asrt(p.outcome==='MANUAL_REVIEW','bridge ok=false -> manual');
// ---- parse verify
const pv=(resp)=>{const j=pr({statusCode:201,body:{postSubmissionId:'sub123'}},'instagram');return R('parse_verify8.js',{input:[{json:resp}],nodes:{Config:[c8()],'Parse Result':[{json:j}]}})[0].json;};
let v=pv({statusCode:200,body:{status:'published',publicUrl:'https://instagram.com/p/x'}});console.log('verify published ->',v.outcome,v.row.status);asrt(v.outcome==='PUBLISHED'&&v.row.status==='PUBLISHED','verified published');
v=pv({statusCode:200,body:{status:'failed',errorMessage:'media rejected'}});asrt(v.outcome==='MANUAL_REVIEW'&&v.row.status==='MANUAL_REVIEW','provider failed -> manual');
v=pv({statusCode:200,body:{status:'queued'}});console.log('verify still queued ->',v.outcome,v.row.status);asrt(v.outcome==='VERIFY_PENDING'&&v.row.status==='PUBLISHING','pending stays PUBLISHING');
v=pv({error:{message:'x'}});asrt(v.outcome==='VERIFY_PENDING','verify call failed -> pending');
// ---- summarize
const job=(extra)=>Object.assign({_kind:'job',page_id:'a',job_number:'01010-3534a',job_key:'MTG-1',mtg_job_id:'MTG-1',ledger:'',dist_status:'',published_platforms:'',errors:[]},extra);
const sm=(items,cfgOpt)=>R('summarize8.js',{input:items.map(j=>({json:j})),nodes:{Config:[cfgOpt||c8()]}}).map(x=>x.json);
let s=sm([job({platform:'instagram',action:'PUBLISH',outcome:'PUBLISHED',distribution_hash:'h1',external_post_id:'i1',published_at:'2026-10-06T06:01:00Z'}),job({platform:'tiktok',action:'PUBLISH',outcome:'PUBLISHED',distribution_hash:'h2',external_post_id:'t1',published_at:'2026-10-06T06:01:30Z'}),job({platform:'whatsapp',action:'PUBLISH',outcome:'PUBLISHED',distribution_hash:'h3',external_post_id:'w1',published_at:'2026-10-06T06:02:00Z'})]);
console.log('all published ->',s.length,'patch',s[0]&&s[0].notion_sent['Distribution Status'],'|',s[0]&&s[0].notion_sent['Published Platforms'],'| ledger lines',s[0]&&s[0].notion_sent['Distribution Ledger'].split('\n').length);asrt(s.length===1&&s[0].notion_sent['Distribution Status']==='PUBLISHED'&&s[0].notion_sent['Distribution Ledger'].split('\n').length===3&&s[0].notion_sent['Last Published']==='2026-10-06','ONE patch per job, ledger has all 3');
s=sm([job({platform:'instagram',action:'PUBLISH',outcome:'PUBLISHED',distribution_hash:'h1',external_post_id:'i1',published_at:'2026-10-06T06:01:00Z'}),job({platform:'tiktok',action:'PUBLISH',outcome:'FAILED',error_code:'HTTP_503',reason:'retry'})]);console.log('partial ->',s[0].notion_sent['Distribution Status']);asrt(s[0].notion_sent['Distribution Status']==='PARTIAL','partial');
s=sm([job({platform:'tiktok',action:'PUBLISH',outcome:'FAILED',error_code:'HTTP_503'})]);asrt(s[0].notion_sent['Distribution Status']==='FAILED','failed');
s=sm([job({platform:'tiktok',action:'ROW_UPDATE',outcome:'MANUAL_REVIEW',error_code:'ATTEMPTS_EXHAUSTED'})]);asrt(s[0].notion_sent['Distribution Status']==='MANUAL_REVIEW','manual');
s=sm([job({platform:'',action:'JOB',outcome:'STALE',reason:'Content Hash is stale'})]);asrt(s[0].notion_sent['Distribution Status']==='STALE','stale job summary');
s=sm([job({platform:'',action:'JOB',outcome:'LEGAL_HOLD',reason:'Legal Review Status is empty'})]);asrt(s[0].notion_sent['Distribution Status']==='MANUAL_REVIEW'&&/LEGAL_HOLD/.test(s[0].notion_sent['Distribution Notes']),'legal hold note');
s=sm([job({platform:'',action:'JOB',outcome:'NOT_ELIGIBLE',reason:'x'})]);asrt(s.length===0,'not eligible = no write');
s=sm([job({platform:'instagram',action:'SKIP',outcome:'SKIP_PUBLISHED',dist_status:'PUBLISHED',ledger:'instagram|h1|i1|2026-10-05',published_platforms:'instagram',distribution_hash:'h1'})]);asrt(s.length===0,'unchanged = no write (idempotent)');
s=sm([job({platform:'instagram',action:'SKIP',outcome:'DRY_RUN'})],c8({publish_mode:'DRY_RUN'}));asrt(s.length===0,'dry run writes nothing to Notion');
const forbid=['Content Status','Content Hash','Image Status','Image URL','Image Build Hash','Instagram Caption','TikTok Caption','WhatsApp Copy','Canonical Monthly Salary','QC Decision','Lifecycle Status','Recruitability','Priority Tier','Legal Review Status','Legal Reviewed Hash','Poster Copy'];
s=sm([job({platform:'instagram',action:'PUBLISH',outcome:'PUBLISHED',distribution_hash:'h1',external_post_id:'i1',published_at:'2026-10-06T06:01:00Z'})]);asrt(!Object.keys(s[0].notion_sent).some(k=>forbid.includes(k)),'WF08 writes only Distribution fields (never legal/content/image/job fields)');
console.log('summary fields:',Object.keys(s[0].notion_sent).join(', '));
// ---- verify/shape/errors/runlog
const vs=(mut)=>{const P2={};Object.keys(s[0].notion_sent).forEach(k=>{const v=s[0].notion_sent[k];P2[k]=k==='Distribution Status'?{type:'select',select:{name:v}}:k==='Last Published'?{type:'date',date:{start:v}}:{type:'rich_text',rich_text:v?[{plain_text:v}]:[]};});if(mut)mut(P2);return R('verify8.js',{input:[{json:{id:'a',properties:P2}}],nodes:{'Summarize Jobs':[{json:s[0]}],'Notion PATCH':[{json:{id:'a'}}]}})[0].json;};
console.log('verify ->',vs().write_status,'| ledger corrupted ->',vs(P2=>{P2['Distribution Ledger']={type:'rich_text',rich_text:[{plain_text:'????'}]};}).write_status);
const items=[job({platform:'instagram',action:'SKIP',outcome:'SKIP_PUBLISHED',distribution_hash:'h1',qc_status:'PUBLISHED'}),job({platform:'tiktok',action:'PUBLISH',outcome:'FAILED',attempt:1,error_code:'HTTP_503',error_message:'x',qc_status:'FAILED',errors:[{stage:'publish',type:'HTTP_503',msg:'x'}]}),job({platform:'',action:'JOB',outcome:'LEGAL_HOLD',reason:'r'}),{_kind:'meta',status:'OK'}];
const sh=R('shape8.js',{input:items.map(j=>({json:j})),nodes:{Config:[c8()]}});console.log('log cols:',Object.keys(sh[0].json).join(','));asrt(sh.length===3,'meta not logged');
const er=R('errors8.js',{input:items.map(j=>({json:j})),nodes:{Config:[c8()]}});console.log('error rows:',er.length,er[0]&&er[0].json.retry_status);
console.log(JSON.stringify(R('runlog8.js',{input:items.map(j=>({json:j})),nodes:{Config:[c8()]}})[0].json));
const ne=R('notion_errors8.js',{input:[{json:{_kind:'write_row',write_status:'VERIFY_FAILED',write_reason:'mismatch',job_number:'x'}},{json:{_kind:'write_row',write_status:'OK'}}],nodes:{Config:[c8()]}});asrt(ne.length===1,'notion error rows');
