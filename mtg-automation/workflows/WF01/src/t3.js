// smoke-test the later nodes with synthetic data
const h=require('./harness');
const cfg=[{json:{run_id:'R1',run_date:'2026-10-05',run_time:'08:00',job_threshold:80,company_threshold:90,workflow_name:'Daily Job Scout V1.0',notion_job_ds_id:'a',notion_company_ds_id:'b',ai_model_score:'m',run_started:'x'}}];
const gated=[{json:{job_key:'HW-1',job_number:'01010-35349561',source:'hellowork',title:'製造',company:'東商',detail_url:'https://x/',detail_text:'本文'.repeat(100),hard:{wage_monthly_text:'225,120円〜225,120円',wage_form:'月給225,120円',workhours1:'8時30分〜17時30分'},flags:['overseas_applicability_unverified'],extract:{job_title_jp:'製造オペレーター',company_name_final:'東商テクノ株式会社',company_type:'DIRECT_EMPLOYER',sector_notion:'食品製造',monthly_min:310000,hourly:false,annual_holidays_n:123,corporate_number_n:'5200001003646',prefecture:'岐阜県',city:'池田町',address:'岐阜県揖斐郡池田町',ssw_evidence_quote:'特定技能歓迎',salary:{}}}}];
const ps=h.run('prep_score.js',{input:gated,nodes:{Config:cfg}});
const aiOut={content:[{text:'{"ssw_clarity":18,"detail_completeness":13,"benefits_conditions":8,"japanese_clarity":3,"q1_is_ssw_job":true,"q2_sector_valid_for_ssw":true,"q3_salary_matches_source":true,"q4_salary_basis":"FIXED","q5_posting_active":true,"rationale_jp":"ok"}'}]};
const sc=h.run('score.js',{input:[{json:aiOut}],nodes:{Config:cfg,'Prepare Score':ps}});
console.log(JSON.stringify(sc[0].json.score.parts),sc[0].json.score.total,sc[0].json.score.company_score,sc[0].json.status);
const bn=h.run('build_notion.js',{input:sc,nodes:{Config:cfg}});
console.log(Object.keys(bn[0].json.notion_create_body.properties).length, JSON.stringify(bn[0].json.notion_create_body.properties['Visa Status']), bn[0].json.notion_sent['Missing Data']);
// verify with echo of what we sent
const P=bn[0].json.notion_create_body.properties;
const ret={id:'pg1',properties:{}};for(const k in P){const v=P[k];const t=v.title?'title':v.rich_text?'rich_text':v.number!==undefined?'number':v.select?'select':v.url!==undefined?'url':v.checkbox!==undefined?'checkbox':'date';ret.properties[k]=Object.assign({type:t},t==='title'?{title:v.title.map(x=>({plain_text:x.text.content}))}:t==='rich_text'?{rich_text:v.rich_text.map(x=>({plain_text:x.text.content}))}:v);}
const vf=h.run('verify.js',{input:[{json:ret}],nodes:{Config:cfg,'Build Notion Payload':bn,'Create Job Page':[{json:{id:'pg1',url:'u'}}]}});
console.log(vf[0].json.status,vf[0].json.reason);
ret.properties['Company'].rich_text=[{plain_text:'東商テクノ株式会也'}];
const vf2=h.run('verify.js',{input:[{json:ret}],nodes:{Config:cfg,'Build Notion Payload':bn,'Create Job Page':[{json:{id:'pg1',url:'u'}}]}});
console.log(vf2[0].json.status,vf2[0].json.reason);
const co=h.run('company.js',{input:sc,nodes:{Config:cfg}});console.log(co.length, co[0]&&co[0].json.company_key);
const rl=h.run('run_log.js',{input:[{json:{_kind:'meta',rows_found:20}},{json:{_kind:'outcome',status:'WRITTEN_VERIFIED',job_key:'a',score:{total:91},title:'t'}}],nodes:{Config:cfg,'Build Search Tasks':[{json:{sources_disabled:'a,b'}}]}});
console.log(rl[0].json);
