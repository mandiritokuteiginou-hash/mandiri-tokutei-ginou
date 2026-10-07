const h=require('./harness');const path=require('path');
const R=(f,o)=>h.run(path.join(__dirname,f),o);
const base5={run_id:'C1',run_started:'2026-10-06T03:00:00Z',run_date:'2026-10-06',max_per_run:15,use_ai:'true',allowed_tiers:'S-TIER,A-TIER,B-TIER,C-TIER',template_version:'v1',banned_phrases:'jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat|resmi MTGI|P3MI|penempatan resmi',hashtags:'#TokuteiGinou #SSW #KerjaDiJepang #InfoLowongan',disclaimer:'Informasi bersumber dari lowongan publik dan bisa berubah. Pastikan detail dan syarat resmi sebelum melamar.',brand_footer:'',ai_model_content:'m'};
const cfg5={json:base5};
const mkcfg=(o)=>({json:Object.assign({},base5,{run_id:'IM1',max_per_run:10,max_attempts:3,use_ai:'true',require_vision_pass:'true',ai_model_vision:'m',image_template_version:'v1',poster_size:'1080x1350',cta_text:'Info lengkap ada di caption',contact_line:'',poster_disclaimer:'Info bersumber dari lowongan publik; bisa berubah.',banned_phrases:'jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat',regulatory_phrases:'P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI',claim_phrases:'terbaik|tertinggi|terbesar|nomor 1|no\\.? ?1|#1|paling'},o||{})});
const cfg7=mkcfg();
const sel=n=>({type:'select',select:n?{name:n}:null});const rtx=s=>({type:'rich_text',rich_text:s?[{plain_text:s}]:[]});const num=n=>({type:'number',number:n});const dt=d=>({type:'date',date:d?{start:d}:null});const url=u=>({type:'url',url:u||null});
const pg=(id,o={})=>({id,url:'u/'+id,properties:Object.assign({'Job ID':{type:'unique_id',unique_id:{prefix:'MTG',number:1}},'Job Number':rtx('01010-3534a'),'Job Title':{type:'title',title:[{plain_text:'健康食品の製造オペレーター'}]},Company:rtx('株式会社テスト'),'Canonical Company':rtx('株式会社テスト'),'Canonical Key':rtx('HW:1'),'Canonical Of':rtx(''),'Source URL':{type:'url',url:'https://hellowork.careers/a'},'Lifecycle Status':sel('ACTIVE'),'QC Decision':sel('APPROVED'),Recruitability:sel('Overseas Confirmed'),'Priority Tier':sel(o.tier||'A-TIER'),Field:sel('食品製造'),Prefecture:rtx('岐阜県'),City:rtx('池田町'),'Canonical Location':rtx('岐阜県 池田町'),'Canonical Monthly Salary':num(285000),'Salary Basis':sel('MONTHLY'),'Annual Holidays':rtx('123日'),'Dormitory Available':sel('Yes'),'JLPT Required':sel('N3'),'License Required':sel('Unknown'),'Experience Required':sel('No'),'Overtime Hours Avg':num(20),'Expiry Date':dt('2026-10-25'),'Content Status':sel(o.cs===undefined?'Approved':o.cs),'Content Hash':rtx(o.hash||''),'Content QC Decision':sel(o.cqc===undefined?'APPROVED':o.cqc),'Image Status':sel(o.is||''),'Image URL':url(o.iurl),'Image Build Hash':rtx(o.ibh||''),'Image Attempt':num(o.ia===undefined?null:o.ia)},o.over||{})});
// WF05 fact hash (parity)
const f5=R('../js5/flatten5.js',{input:[{json:{results:[pg('a',{cs:'',cqc:''})]}},{json:{results:[]}}],nodes:{Config:[cfg5]}})[0].json;
const FH=f5.hash;
const fl=(gen,ready,c)=>R('flatten7.js',{input:[{json:{results:gen||[]}},{json:{results:ready||[]}}],nodes:{Config:[c||cfg7]}});
const asrt=(c,m)=>{if(!c){console.log('ASSERT FAIL:',m);process.exitCode=1;}};
const f0=fl([pg('a',{hash:FH})])[0].json;console.log('fact-hash parity WF05==WF07:',f0.fact_hash===FH,'| action',f0.action,'| tier',f0.tier,'| template',f0.template_id);asrt(f0.fact_hash===FH&&f0.action==='GENERATE','parity');
console.log('visual:',JSON.stringify(f0.visual).slice(0,420));
// ---- flatten gates
const rd=(o)=>fl([],[pg('r',Object.assign({hash:FH,is:'READY',ibh:f0.build_hash,iurl:'https://x/y.png'},o))])[0].json;
let r=rd({});console.log('READY same build ->',r.action);asrt(r.action==='SKIP_UNCHANGED','skip unchanged');
r=rd({over:{'Canonical Monthly Salary':num(300000)}});console.log('READY, salary changed ->',r.action,'|',r.reason);asrt(r.action==='STALE_MARK','salary change stales image');
r=rd({hash:'deadbeef00000000'});console.log('READY, content hash changed ->',r.action,'|',r.reason);asrt(r.action==='STALE_MARK','content hash change');
r=rd({cs:'Draft'});console.log('READY, content back to Draft ->',r.action);asrt(r.action==='STALE_MARK','content not approved');
r=rd({cs:'Not Started'});asrt(r.action==='STALE_MARK','content reset');
r=rd({over:{'Lifecycle Status':sel('EXPIRED')}});console.log('READY, job expired ->',r.action);asrt(r.action==='STALE_MARK','job expired stales');
r=rd({ibh:'oldoldold'});console.log('READY, build hash mismatch ->',r.action);asrt(r.action==='STALE_MARK','build hash mismatch');
const g1=(o)=>fl([pg('g',Object.assign({hash:FH},o))]);
console.log('legacy Image Status "Generated" ->',g1({is:'Generated'})[0].json._kind==='meta'?'not a candidate (untouched)':'??');asrt(g1({is:'Generated'})[0].json._kind==='meta','legacy status untouched');
asrt(g1({is:'MANUAL_REVIEW'})[0].json._kind==='meta','manual review not retried');
for(const s of ['','Not Started','REGENERATE','STALE','FAILED']){asrt(g1({is:s})[0].json.action==='GENERATE','candidate '+s);}
r=g1({hash:'deadbeef00000000'})[0].json;console.log('Approved but content stale (not READY) ->',r.action,'|',r.reason);asrt(r.action==='NOT_ELIGIBLE','wait for WF06/WF05');
r=g1({cqc:'MANUAL_REVIEW'})[0].json;asrt(r.action==='NOT_ELIGIBLE','content qc not approved');
r=g1({over:{'Canonical Of':rtx('u/zz')}})[0].json;asrt(r.action==='NOT_ELIGIBLE','duplicate job');
r=g1({over:{Recruitability:sel('Overseas Unverified')}})[0].json;asrt(r.action==='NOT_ELIGIBLE','not overseas confirmed');
// attempts continuity
r=g1({is:'REGENERATE',ibh:f0.build_hash,ia:1})[0].json;console.log('REGENERATE attempt carry ->',r.attempt_prev);asrt(r.attempt_prev===1,'attempt carries for same build');
r=g1({is:'STALE',ibh:'oldhash',ia:2})[0].json;asrt(r.attempt_prev===0,'attempt resets for new build');
// cap
const many=['a','b','c','d','e'].map(i=>pg(i,{hash:FH}));const capped=R('flatten7.js',{input:[{json:{results:many}},{json:{results:[]}}],nodes:{Config:[mkcfg({max_per_run:2})]}}).map(x=>x.json.action);console.log('cap 2 ->',capped.join(','));asrt(capped.filter(x=>x==='GENERATE').length===2&&capped.includes('DEFERRED_CAP'),'cap');
// meta / error
console.log('empty ->',fl([],[])[0].json.status,'| error ->',R('flatten7.js',{input:[{json:{object:'error',message:'x'}},{json:{results:[]}}],nodes:{Config:[cfg7]}})[0].json.status);
// ---- build hash sensitivity
const bh=(o,c)=>fl([pg('a',Object.assign({hash:FH},o))],[],c)[0].json.build_hash;
const b0=bh({});asrt(b0===bh({}),'stable');asrt(b0!==bh({tier:'S-TIER'}),'tier changes build');asrt(b0!==bh({},mkcfg({image_template_version:'v2'})),'template version changes build');asrt(b0!==bh({},mkcfg({cta_text:'Lihat caption'})),'visual data changes build');asrt(b0!==bh({},mkcfg({poster_size:'1080x1080'})),'size changes build');
// ---- poster build
const build=(o,c)=>R('poster7.js',{input:fl([pg('a',Object.assign({hash:FH},o))],[],c),nodes:{Config:[c||cfg7]}})[0].json;
const sizeOf=(html,id)=>{const m=html.match(new RegExp('top:\\d+px;width:\\d+px;height:\\d+px;font-size:(\\d+)px[^"]*">'+id));return m?Number(m[1]):null;};
const pa=build({tier:'A-TIER'});console.log('tier A: render?',pa.needs_render,'flags',pa.spec_flags.join(',')||'-','| layout',pa.layout_variant,'| label',pa.template_label,'| elements',pa.expected.map(e=>e.id).join(','));asrt(pa.needs_render==='true','A renders');
const sal=(t)=>{const b=build({tier:t});return Number((b.render_req.html.match(/font-size:(\d+)px;line-height:1.05/)||[])[1]);};
console.log('salary font S/A/B/C:',sal('S-TIER'),sal('A-TIER'),sal('B-TIER'),sal('C-TIER'));asrt(sal('S-TIER')>sal('A-TIER')&&sal('A-TIER')>sal('B-TIER')&&sal('B-TIER')>sal('C-TIER'),'hierarchy by tier');
const texts=(t)=>build({tier:t}).expected.map(e=>e.text).join('|');asrt(texts('S-TIER')===texts('C-TIER'),'tier changes visuals, never text');
console.log('poster texts:',texts('S-TIER'));
['S-TIER','A-TIER','B-TIER','C-TIER'].forEach(t=>asrt(build({tier:t}).needs_render==='true','render '+t));
asrt(!/terbaik|tertinggi/i.test(texts('S-TIER')),'no tier hype');
const pb=R('poster7.js',{input:fl([pg('a',{hash:FH,is:'REGENERATE',ibh:f0.build_hash,ia:1})]),nodes:{Config:[cfg7]}})[0].json;console.log('attempt1 -> variant',pb.layout_variant);asrt(pb.layout_variant==='B','variant B on 2nd try');
const pc=R('poster7.js',{input:fl([pg('a',{hash:FH,is:'REGENERATE',ibh:f0.build_hash,ia:2})]),nodes:{Config:[cfg7]}})[0].json;asrt(pc.layout_variant==='C','variant C on 3rd try');
const longTitle=build({over:{'Job Title':{type:'title',title:[{plain_text:'非常に長い職種名'.repeat(12)}]}}});
// content hash must be regenerated for new title: recompute
const flLong=fl([pg('a',{hash:'x',over:{'Job Title':{type:'title',title:[{plain_text:'非常に長い職種名'.repeat(12)}]}}})]);
console.log('long title ->',flLong[0].json.action,'(content stale because hash fixture is fake; expected NOT_ELIGIBLE)');
// get proper hash for long-title facts via WF05 flatten
const longPg=(hash)=>pg('a',{hash,over:{'Job Title':{type:'title',title:[{plain_text:'非常に長い職種名'.repeat(12)}]}}});
const longPg5=pg('a',{cs:'',cqc:'',over:{'Job Title':{type:'title',title:[{plain_text:'非常に長い職種名'.repeat(12)}]}}});const lh=R('../js5/flatten5.js',{input:[{json:{results:[longPg5]}},{json:{results:[]}}],nodes:{Config:[cfg5]}});
const lhash=lh[0].json.hash;const lb=R('poster7.js',{input:fl([longPg(lhash)]),nodes:{Config:[cfg7]}})[0].json;console.log('long title ->',lb.needs_render,lb.spec_flags.join(','));asrt(lb.needs_render==='false'&&lb.spec_flags.some(x=>/TEXT_TOO_LONG:title/.test(x)),'too long -> no render');
const pcnt=build({},mkcfg({contact_line:'WA +62 812 3456 7890'}));console.log('contact configured ->',pcnt.needs_render,pcnt.spec_flags.join(',')||'-');asrt(pcnt.needs_render==='true','configured contact allowed');
const pbad=build({},mkcfg({cta_text:'Gaji terbaik, pasti berangkat'}));console.log('hype CTA ->',pbad.spec_flags.join(','));asrt(pbad.needs_render==='false','claims blocked');
// ---- render + vision simulation
const decide=(o)=>{
  const c=o.cfg||cfg7;
  let b=R('poster7.js',{input:fl([pg('a',Object.assign({hash:FH},o.page||{}))],[],c),nodes:{Config:[c]}});
  const bj=b[0].json;
  let mid=b;
  if(bj.needs_render==='true'){
    const resp=[{json:o.render||{url:'https://hcti.example/img/1'}}];
    const pr=R('parse_render7.js',{input:resp,nodes:{'Build Poster':b}});
    if(pr[0].json.render_ok==='true'){
      const pv=R('prep_vision7.js',{input:pr,nodes:{Config:[c]}});
      const vtext=o.vision===undefined?JSON.stringify({lines:bj.expected.map(e=>e.text),layout:{clipped_text:false,overlapping_text:false,low_contrast:false,unreadable_small_text:false,cluttered:false,watermark_or_extra_logo:false},notes:''}):o.vision;
      const va=R('parse_vision7.js',{input:[{json:typeof vtext==='string'?{content:[{text:vtext}]}:vtext}],nodes:{'Prepare Vision':pv}});
      mid=va;
    } else mid=pr;
  }
  return R('decide7.js',{input:mid,nodes:{Config:[c]}})[0].json;
};
const show=(t,x)=>console.log(t.padEnd(36),'->',x.outcome,'|',x.image_status||'-','|',(x.flags||[]).join(',')||'-','|att',x.qc_attempt===undefined?'-':x.qc_attempt);
const lines0=pa.expected.map(e=>e.text);
r=decide({});show('perfect transcript',r);asrt(r.image_status==='READY'&&r.notion_sent['Image URL']==='https://hcti.example/img/1'&&r.notion_sent['Image Build Hash']===f0.build_hash,'ready');
console.log('  patch keys:',Object.keys(r.notion_sent).join(','));
const lay=(x)=>JSON.stringify({lines:lines0,layout:Object.assign({clipped_text:false,overlapping_text:false,low_contrast:false,unreadable_small_text:false,cluttered:false,watermark_or_extra_logo:false},x)});
r=decide({vision:lay({clipped_text:true})});show('clipped text',r);asrt(r.image_status==='REGENERATE'&&r.notion_sent['Image URL']==='','clipped -> regenerate, no url');
r=decide({vision:lay({cluttered:true,low_contrast:true})});show('cluttered + low contrast',r);asrt(r.image_status==='REGENERATE','regen');
r=decide({vision:lay({watermark_or_extra_logo:true})});show('watermark / extra logo',r);asrt(r.image_status==='MANUAL_REVIEW','watermark manual');
const noSalary=lines0.filter(x=>!/285,000/.test(x));
r=decide({vision:JSON.stringify({lines:noSalary,layout:{}})});show('salary missing in transcript',r);asrt(r.image_status==='REGENERATE'&&r.flags.includes('MISSING_TEXT:salary'),'missing salary regen');
const wrongSal=lines0.map(x=>x.replace('285,000','285,800'));
r=decide({vision:JSON.stringify({lines:wrongSal,layout:{}})});show('salary misread 285,800',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.some(x=>/UNEXPECTED_NUMBER/.test(x)),'unexpected number manual');
const ocrCo=lines0.map(x=>x==='株式会社テスト'?'株式会社テスヒ':x);
r=decide({vision:JSON.stringify({lines:ocrCo,layout:{}})});show('company OCR near-miss',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.includes('OCR_UNCERTAIN:company'),'ocr uncertain manual');
const otherCo=lines0.map(x=>x==='株式会社テスト'?'有限会社まったくべつ':x);
r=decide({vision:JSON.stringify({lines:otherCo,layout:{}})});show('different company shown',r);asrt(r.image_status!=='READY','wrong company never READY');
r=decide({vision:JSON.stringify({lines:lines0.concat(['Powered by ImageService Pro']),layout:{}})});show('extra text (watermark text)',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.includes('UNEXPECTED_TEXT'),'extra text manual');
r=decide({vision:JSON.stringify({lines:lines0.concat(['Hubungi 0812-3456-7890']),layout:{}})});show('phone number in image',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.includes('UNEXPECTED_CONTACT'),'contact manual');
r=decide({vision:JSON.stringify({lines:lines0.concat(['www.contoh.com']),layout:{}})});asrt(r.image_status==='MANUAL_REVIEW','url in image manual');
const wrapped=[];lines0.forEach(x=>{const w=x.split(' ');if(w.length>2){const m=Math.ceil(w.length/2);wrapped.push(w.slice(0,m).join(' '));wrapped.push(w.slice(m).join(' '));}else wrapped.push(x);});
r=decide({vision:JSON.stringify({lines:wrapped,layout:{}})});show('wrapped lines still match',r);asrt(r.image_status==='READY','wrapped lines ok');
const merged=[lines0.slice(0,2).join(' '),...lines0.slice(2)];
r=decide({vision:JSON.stringify({lines:merged,layout:{}})});asrt(r.image_status==='READY','merged lines ok');
r=decide({vision:'garbage'});show('vision garbage',r);asrt(r.outcome==='DEFERRED_NO_VISION'&&r.needs_write==='false','defer');
r=decide({vision:{error:{message:'overloaded'}}});asrt(r.outcome==='DEFERRED_NO_VISION','defer on http error');
r=decide({cfg:mkcfg({require_vision_pass:'false'}),vision:'garbage'});show('vision not required',r);asrt(r.image_status==='READY'&&r.flags.includes('NO_VISION_PASS'),'no-vision ready flagged');
r=decide({render:{error:{message:'quota exceeded'}}});show('render failed',r);asrt(r.image_status==='FAILED'&&r.qc_attempt===1,'failed');
r=decide({render:{url:'http://insecure/x.png'}});asrt(r.image_status==='FAILED','http url rejected');
r=decide({render:{foo:'bar'}});asrt(r.image_status==='FAILED','no url');
r=decide({page:{is:'FAILED',ibh:f0.build_hash,ia:2},render:{error:{message:'x'}}});show('render failed 3rd time',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.includes('ATTEMPTS_EXHAUSTED'),'exhausted');
r=decide({page:{is:'REGENERATE',ibh:f0.build_hash,ia:2},vision:lay({clipped_text:true})});show('regenerate 3rd time',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.includes('ATTEMPTS_EXHAUSTED'),'regen exhausted');
r=decide({page:{is:'REGENERATE',ibh:f0.build_hash,ia:1}});show('2nd attempt succeeds (variant B)',r);asrt(r.image_status==='READY'&&r.qc_attempt===2&&/variant B/.test(r.reason),'variant B ready');
r=decide({cfg:mkcfg({cta_text:'Gaji terbaik'})});show('spec failure (hype CTA)',r);asrt(r.image_status==='MANUAL_REVIEW'&&r.flags.includes('SPEC_FAILED'),'spec fail manual');
// stale + skip + not eligible through decide
const stl=R('decide7.js',{input:fl([],[pg('r',{hash:FH,is:'READY',ibh:'old',iurl:'https://x/y.png'})]),nodes:{Config:[cfg7]}})[0].json;show('stale mark',stl);asrt(stl.image_status==='STALE'&&stl.notion_sent['Image URL']===''&&!('Image Build Hash' in stl.notion_sent)&&!('Content Status' in stl.notion_sent),'stale clears url, never touches content');
const forbidden=['Content Status','Content Hash','Company','Canonical Monthly Salary','QC Decision','Lifecycle Status','Recruitability','Priority Tier','Poster Copy'];
const allKeys=Object.keys(r.notion_sent).concat(Object.keys(stl.notion_sent));asrt(!forbidden.some(k=>allKeys.includes(k)),'WF07 writes only Image fields');
const sk=R('decide7.js',{input:fl([],[pg('r',{hash:FH,is:'READY',ibh:f0.build_hash,iurl:'https://x/y.png'})]),nodes:{Config:[cfg7]}})[0].json;show('skip unchanged',sk);asrt(sk.needs_write==='false','no write');
const ne=R('decide7.js',{input:g1({hash:'bad'}),nodes:{Config:[cfg7]}})[0].json;show('not eligible',ne);asrt(ne.needs_write==='false','no write');
// verify / shape / runlog
const ok=decide({});
const props=(sent)=>{const P={};Object.keys(sent).forEach(k=>{const v=sent[k];P[k]=typeof v==='number'?{type:'number',number:v}:k==='Image URL'?{type:'url',url:v||null}:['Image Status','Image QC Result'].includes(k)?{type:'select',select:{name:v}}:k==='Image Generated'?{type:'date',date:{start:v}}:{type:'rich_text',rich_text:v?[{plain_text:v}]:[]};});return P;};
const vr=(mut)=>{const P=props(ok.notion_sent);if(mut)mut(P);return R('verify7.js',{input:[{json:{id:ok.page_id,properties:P}}],nodes:{Decide:[{json:ok}],'Notion PATCH':[{json:{id:ok.page_id}}]}})[0].json;};
console.log('verify ok ->',vr().write_status,'| url mismatch ->',vr(P=>{P['Image URL']={type:'url',url:'https://other/x.png'};}).write_status,'| hash corrupted ->',vr(P=>{P['Image Build Hash']={type:'rich_text',rich_text:[{plain_text:'zzz'}]};}).write_status);
const wr=Object.assign({},ok,{_kind:'write_row',write_status:'OK',action:'GENERATE'});
const sh=R('shape7.js',{input:[{json:wr}],nodes:{Config:[cfg7]}});console.log('log cols:',Object.keys(sh[0].json).join(','));
console.log(JSON.stringify(R('runlog7.js',{input:[{json:wr},{json:sk}],nodes:{Config:[cfg7]}})[0].json));
// render payload sanity
const rq=pa.render_req;console.log('render_req keys:',Object.keys(rq).join(','),'| html bytes',rq.html.length,'| viewport',rq.viewport_width+'x'+rq.viewport_height);
require('fs').writeFileSync('/tmp/claude-0/-home-claude/98f897cf-a4a3-5896-90a7-e0ad3cd6001b/scratchpad/poster_preview_A.html','<style>'+rq.css+'</style>'+rq.html);
const pS=build({tier:'S-TIER'}).render_req;require('fs').writeFileSync('/tmp/claude-0/-home-claude/98f897cf-a4a3-5896-90a7-e0ad3cd6001b/scratchpad/poster_preview_S.html','<style>'+pS.css+'</style>'+pS.html);
