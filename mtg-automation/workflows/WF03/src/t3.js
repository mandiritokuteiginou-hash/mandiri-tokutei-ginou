const h=require('./harness'),fs=require('fs');
const cfg={json:{run_id:'L1',run_date:'2026-10-05',run_started:'x',max_per_run:40}};
const rtx=s=>({type:'rich_text',rich_text:[{plain_text:s}]});const sel=n=>({type:'select',select:n?{name:n}:null});const num=n=>({type:'number',number:n});
const pg=(id,o)=>({id,url:'u/'+id,created_time:o.created||'2026-10-01T00:00:00Z',properties:{'Job ID':{type:'unique_id',unique_id:{prefix:'MTG',number:o.n||1}},Status:sel(o.status||'VERIFIED'),'Job Number':rtx(o.jn||'1-1'),'Job Title':{type:'title',title:[{plain_text:o.title||'t'}]},Company:rtx('株式会社テスト'),Prefecture:rtx('岐阜県'),City:rtx('池田町'),Field:sel('製造'),'Source URL':{type:'url',url:'https://hellowork.careers/x?utm=1'},'Monthly Salary Min':num(o.sal||310000),'Quality Score':num(92),'Data Confidence':num(100),'QC Decision':sel(o.qc===undefined?'APPROVED':o.qc),Recruitability:sel('Overseas Confirmed'),'Audit Notes':rtx('MTG#02 → APPROVED | 法人番号 5200001003646 (株式会社テスト) | x'),Housing:rtx('寮あり（社宅）'),'Japanese Level':rtx('N4程度'),Requirements:rtx('普通自動車免許必須'),Experience:rtx('未経験可'),Overtime:rtx('月平均残業２０時間'),'Lifecycle Status':sel(o.life||''),'Annual Holidays':rtx('120日')}});
const fl=h.run('flatten3.js',{input:[{json:{results:[pg('a',{}),pg('b',{qc:'',status:'EXTRACTED'})]}},{json:{results:[pg('a',{}),pg('c',{life:'ACTIVE'})]}}],nodes:{Config:[cfg]}});
console.log('flatten',fl.length,fl.map(x=>x.json.page_id+(x.json.maintenance?'*':'')).join(','));
const src=fl.map(x=>x.json);
const htm=fs.readFileSync('../detail.html','utf8');
const mk=(j,sc,extra)=>({json:Object.assign({},j,{sc,errors:[],dedup_query:{}},extra||{})});
const joined=[mk(src[0],{state:'OK',days_left:20,expiry:'2026-10-25',conflicts:[]}),mk(src[1],{state:'SKIPPED',conflicts:[]}),mk(src[2],{state:'OK',days_left:20,expiry:'2026-10-25',conflicts:['salary 310000→250000']}),mk(src[0],{state:'OK',days_left:-2,expiry:'2026-10-03',conflicts:[]}),mk(src[0],{state:'GONE',conflicts:[]}),mk(src[0],{state:'OK',days_left:9,expiry:'x',conflicts:[]})];
const dups=[{json:{results:[]}},{json:{results:[]}},{json:{results:[]}},{json:{results:[]}},{json:{results:[]}},{json:{results:[pg('zz',{created:'2026-09-01T00:00:00Z',n:7})]}}];
// tweak item2 prev lifecycle ACTIVE already (c has life ACTIVE)
const o=h.run('organize.js',{input:dups,nodes:{Config:[cfg],'Source Join':joined}});
o.forEach((x,i)=>console.log(i,x.json.lifecycle,x.json.tier,x.json.outcome,'|',x.json.changed.join(',').slice(0,90),'|',x.json.reason.slice(0,60),x.json.requeue?'REQUEUE':''));
const p=o[0].json;console.log(JSON.stringify(p.canonical),p.notion_sent['Dormitory Available'],p.notion_sent['JLPT Required'],p.notion_sent['License Required'],p.notion_sent['Experience Required'],p.notion_sent['Overtime Hours Avg'],p.notion_sent['Matching Ready'],p.notion_sent['Priority Tier']);
// second pass idempotence: feed written values back as current
const cur2=Object.assign({},joined[0].json,{cur:Object.assign({},joined[0].json.cur,{lifecycle:'ACTIVE',tier:'S-TIER',tier_reason:p.notion_sent['Tier Reason'],reason:p.notion_sent['Lifecycle Reason'],checked:'2026-10-05',expiry:'2026-10-25',ckey:'HW:1-1',curl:'https://hellowork.careers/x',ccompany:'株式会社テスト',corp:'5200001003646',cloc:'岐阜県 池田町',csal:310000,canon_of:'',dorm:'Yes',jlpt:'N4',lic:'Yes',exp:'No',ot:20,ready:true,mrr:'READY',dupcheck:''})});
const o2=h.run('organize.js',{input:[{json:{results:[]}}],nodes:{Config:[cfg],'Source Join':[{json:cur2}]}});console.log('idempotent',o2[0].json.outcome,o2[0].json.changed);
// verify
const rb=(body)=>{const P={};for(const k in body.properties){const v=body.properties[k];if('select'in v)P[k]={type:'select',select:v.select};else if('checkbox'in v)P[k]={type:'checkbox',checkbox:v.checkbox};else if('number'in v)P[k]={type:'number',number:v.number};else if('date'in v)P[k]={type:'date',date:v.date};else if('url'in v)P[k]={type:'url',url:v.url};else if(v.rich_text)P[k]={type:'rich_text',rich_text:v.rich_text.map(x=>({plain_text:x.text.content}))};}return{id:'a',properties:P}};
const v=h.run('verify3.js',{input:[{json:rb(p.notion_patch_body)}],nodes:{Organize:[o[0]],'Notion PATCH':[{json:{id:'a'}}]}});console.log(v[0].json.write_status,v[0].json.write_reason);
console.log(JSON.stringify(h.run('runlog3.js',{input:[...o,...v,{json:{_kind:'meta',status:'OK'}}],nodes:{Config:[cfg]}})[0].json).slice(0,400));
console.log(h.run('shape3.js',{input:v,nodes:{Config:[cfg]}}).length,h.run('errors3.js',{input:v,nodes:{Config:[cfg]}}).length);
// ---- V1.1 checks: readiness reasons, A/B tiers, reject stays archived
const base=()=>Object.assign({},joined[0].json,{cur:{}});
const run1=(mut)=>{const j=mut(base());return h.run('organize.js',{input:[{json:{results:[]}}],nodes:{Config:[cfg],'Source Join':[{json:j}]}})[0].json;};
const r=(m)=>{const x=run1(m);return x.lifecycle+'|'+x.tier+'|'+x.notion_sent['Matching Readiness Reason']+'|'+x.notion_sent['Matching Ready'];};
console.log('ready      ',r(j=>j));
console.log('no jlpt    ',r(j=>{j.jp_level='';return j}));
console.log('no jlpt+sal',r(j=>{j.jp_level='';j.monthly_min=null;return j}));
console.log('no req     ',r(j=>{j.requirements='';j.experience='';return j}));
console.log('unknown!=no',run1(j=>{j.requirements='';j.experience='';return j}).notion_sent['License Required'],run1(j=>{j.housing='';j.benefits='';return j}).notion_sent['Dormitory Available']);
console.log('A tier     ',r(j=>{j.monthly_min=275000;j.quality_score=86;return j}));
console.log('B tier     ',r(j=>{j.monthly_min=245000;j.quality_score=81;return j}));
console.log('C (salary) ',r(j=>{j.monthly_min=200000;return j}));
console.log('C (no ovs) ',r(j=>{j.recruitability='Overseas Unverified';return j}));
console.log('review     ',r(j=>{j.qc='REVIEW';return j}));
const rj=run1(j=>{j.qc='REJECT';j.qc_reject_reason='domestic-only';return j});console.log('reject     ',rj.lifecycle,rj.tier,rj.notion_sent['Matching Readiness Reason'],Object.keys(rj.notion_sent).filter(k=>/QC/.test(k)));
// V1.2: WF04-enriched values must survive a WF03 pass over text that says nothing
{
  const base=Object.assign({},cur2,{jp_level:'',requirements:'',experience:'',cur:Object.assign({},cur2.cur,{jlpt:'N3',lic:'Preferred',exp:'No',mrr:'READY'})});
  const r=h.run('organize.js',{input:[{json:{results:[]}}],nodes:{Config:[cfg],'Source Join':[{json:base}]}})[0].json;
  console.log('V1.2 keep WF04 values:',r.outcome,r.changed.join(',')||'-','| JLPT/License/Experience overwritten?',['JLPT Required','License Required','Experience Required'].some(k=>k in r.notion_sent),'| mrr',r.mrr);
}
