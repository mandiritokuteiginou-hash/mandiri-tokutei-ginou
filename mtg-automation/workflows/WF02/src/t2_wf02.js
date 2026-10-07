const h=require('./harness');
const cfg={json:{run_id:'R2',run_date:'2026-10-05',run_started:'2026-10-05T00:00:00Z',workflow_name:'Job Verification & QC V1.0',job_threshold:80,company_threshold:90,min_days_left:3,staleness_days:180,min_monthly:150000,min_hourly:1000,max_monthly:1000000,require_overseas_verified:'true',notion_company_ds_id:'ds'}};
const good=()=>({page_id:'p1',job_number:'1-1',company:'株式会社テスト',title:'t',status:'EXTRACTED',quality_score:85,wf01_notes:'MTG#01 x',prefecture:'岐阜県',city:'池田町',sector:'製造',source_url:'https://hellowork.careers/x',
 rc:{source_state:'OK',host_ok:true,source_job_match:true,days_left:30,posted_age_days:5,ssw_in_text:true,ssw_quote_ok:true,haken:'派遣・請負ではない',wage_min:250000,hourly:null,conflicts:[],overseas_hit:'',domestic_hit:''},
 co:{verdict:'VERIFIED',score:100,number:'5200001003646',number_confirmed:true,registry_name:'株式会社テスト',notes:[],conflict:''},dup:{state:'Unique'},ai:{ok:true,employer:'TRUE',employer_quote_ok:true,ssw_explicit:true,management:false,overseas:'UNVERIFIED',salary_basis:'TRUE'},errors:[]});
const cases={};
cases.default_unverified_overseas=good();
const a=good();a.rc.overseas_hit='海外在住の方から応募可';cases.approved=a;
const b=good();b.rc.domestic_hit='国内在住者のみ';cases.domestic=b;
const c=good();c.rc.overseas_hit='来日前面接可 応募';c.ai.overseas='DOMESTIC_ONLY';cases.ai_downgrades=c;
const d=good();d.rc.overseas_hit='海外から応募可';d.rc.wage_min=120000;cases.low_salary=d;
const e=good();e.rc.overseas_hit='海外から応募可';e.rc.source_state='CLOSED_ON_SOURCE';cases.closed=e;
const f=good();f.rc.overseas_hit='海外から応募可';f.ai={ok:false};cases.ai_down=f;
const g=good();g.rc.overseas_hit='海外から応募可';g.dup={state:'Possible Duplicate',note:'x'};cases.dup=g;
const keys=Object.keys(cases);
const out=h.run('final_qc.js',{input:keys.map(k=>({json:cases[k]})),nodes:{Config:[cfg]}});
keys.forEach((k,i)=>console.log(k,'=>',out[i].json.decision,'|',JSON.stringify(out[i].json.checks).replace(/"/g,''),'|',out[i].json.reasons.slice(0,160)));
const ap=out[1].json;console.log(JSON.stringify(ap.notion_patch_body.properties['Status']),ap.company_upsert);
// verify_qc: simulate notion read-back (good) and corrupted (社->也)
const rb=(body,corrupt)=>{const P={};for(const k in body.properties){const v=body.properties[k];if(v.select)P[k]={type:'select',select:{name:v.select.name}};else if('checkbox'in v)P[k]={type:'checkbox',checkbox:v.checkbox};else if('number'in v)P[k]={type:'number',number:v.number};else if(v.date)P[k]={type:'date',date:{start:v.date.start}};else if(v.rich_text)P[k]={type:'rich_text',rich_text:v.rich_text.map(x=>({plain_text:corrupt?x.text.content.replace('社','也'):x.text.content}))};}return{id:'p1',properties:P}};
const v=h.run('verify_qc.js',{input:[{json:rb(ap.notion_patch_body)},{json:rb(ap.notion_patch_body,true)},{json:{message:'x',object:'error'}}],nodes:{'Final QC':[out[1],out[1],out[1]],'Notion PATCH':[{json:{id:'p1'}},{json:{id:'p1'}},{json:{object:'error',message:'boom'}}]}});
v.forEach(x=>console.log(x.json.write_status,x.json.write_reason.slice(0,120),x.json.company_upsert_needed));
// company plan/verify
const q=h.run('company_query_body.js',{input:[v[0]],nodes:{}});console.log(JSON.stringify(q[0].json.company_query).slice(0,200));
const pl=h.run('company_plan.js',{input:[{json:{results:[]}},{json:{results:[{id:'c1',properties:{Notes:{rich_text:[{plain_text:'old'}]}}}]}},{json:{error:{message:'x'}}}],nodes:{Config:[cfg],'Company Query Body':[q[0],q[0],q[0]]}});
pl.forEach(x=>console.log(x.json._kind,x.json.op||x.json.status,x.json.method));
const cv=h.run('company_verify.js',{input:[{json:{id:'c9',properties:{'Company Name':{type:'title',title:[{plain_text:'株式会社テスト'}]},Notes:{type:'rich_text',rich_text:[{plain_text:pl[0].json.sent.Notes}]},'Last Checked':{type:'date',date:{start:'2026-10-05'}},'Contact Status':{type:'select',select:{name:'Not Contacted'}}}}}],nodes:{'Company Plan Filter':[pl[0]]}});
console.log(cv[0].json.status,cv[0].json.reason);
const all=[...v,...cv,{json:{_kind:'meta',status:'OK',errors:[]}}];
console.log(h.run('shape_qc.js',{input:v,nodes:{Config:[cfg]}}).length,h.run('shape_errors2.js',{input:all,nodes:{Config:[cfg]}}).map(x=>x.json.error_type));
console.log(JSON.stringify(h.run('run_log2.js',{input:all,nodes:{Config:[cfg]}})[0].json));
