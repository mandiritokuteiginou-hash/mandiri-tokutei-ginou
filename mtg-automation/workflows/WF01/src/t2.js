const h=require('./harness'),fs=require('fs');
const cfg=[{json:{run_id:'R1',allow_hourly_sectors:'農業,漁業',staleness_days:180,ai_model_extract:'m',max_ai_jobs:3}}];
const jobs=JSON.parse(fs.readFileSync('jobs.json'));
const pf=h.run('prefilter.js',{input:jobs,nodes:{Config:cfg}});
console.log(pf.map(x=>x.json.prefilter_status+':'+x.json.company.slice(0,10)).join(' / '));
const detail=fs.readFileSync('../detail.html','utf8');
const prep=h.run('prep_extract.js',{input:[{json:{data:detail}}],nodes:{Config:cfg,'Pre-Filter':[pf[3]]}});
const p=prep[0].json;console.log(p.detail_ok,p.hard,p.detail_text.length);
const ai={content:[{text:JSON.stringify({job_title_jp:'x',company_name_jp:'東商テクノ株式会社',company_type:'STAFFING_AGENCY',ssw_mention:'HR_LABEL',ssw_evidence_quote:'特定技能外国人支援',sector_jp:'食品製造',salary:{type:'HOURLY'},annual_holidays:123,working_hours:'x',prefecture:'岐阜県',city:'池田町',overseas_applicant:'UNKNOWN'})}]};
const g=h.run('gates.js',{input:[{json:ai}],nodes:{Config:cfg,'Prepare Extract':prep}});
console.log(JSON.stringify(g[0].json.gates),g[0].json.status);
// good case synthetic
const good=Object.assign({},p);
const ai2={content:[{text:JSON.stringify({job_title_jp:'製造',company_name_jp:'東商テクノ株式会社',company_type:'DIRECT_EMPLOYER',ssw_mention:'EXPLICIT_RECRUIT',ssw_evidence_quote:'特定技能外国人支援',sector_jp:'食品製造',salary:{type:'MONTHLY',min:225120},annual_holidays:123,working_hours:'8:30-17:30',prefecture:'岐阜県',city:'池田町',overseas_applicant:'UNKNOWN'})}]};
const g2=h.run('gates.js',{input:[{json:ai2}],nodes:{Config:cfg,'Prepare Extract':[Object.assign({},prep[0],{json:Object.assign({},p,{hard:Object.assign({},p.hard,{haken_field:'-'})})})]}});
console.log(JSON.stringify(g2[0].json.gates),g2[0].json.flags);
