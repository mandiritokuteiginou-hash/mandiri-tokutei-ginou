const h=require('./harness');
const cfg={json:{run_id:'R3',run_date:'2026-10-05',run_started:'2026-10-05T00:00:00Z',workflow_name:'x',company_threshold:90,job_threshold:80,min_days_left:3,staleness_days:180,min_monthly:150000,min_hourly:1000,max_monthly:1000000,require_overseas_verified:'true'}};
const base=(o)=>Object.assign({page_id:'p1',job_number:'1-1',company:'株式会社テスト',title:'t',quality_score:85,wf01_notes:'',prefecture:'岐阜県',city:'池田町',human_employer_verified:false,dup:{state:'Unique'},
 rc:{source_state:'OK',host_ok:true,source_job_match:true,days_left:30,posted_age_days:5,ssw_in_text:true,ssw_quote_ok:true,haken:'派遣・請負ではない',page_company:'株式会社テスト',page_address:'岐阜県池田町',wage_min:250000,hourly:null,conflicts:[],overseas_hit:'海外在住可',domestic_hit:''},gbiz:{mode:'BY_NAME'}},o);
const err={error:{message:'401 Unauthorized'}};
const cases=[['no_tick',base({}),err],['tick_unavail',base({human_employer_verified:true}),err],['tick_bad_shape',base({human_employer_verified:true}),{foo:1}],
 ['tick_overseas_missing',base({human_employer_verified:true,rc:Object.assign({},base({}).rc,{overseas_hit:''})}),err],
 ['tick_dispatch',base({human_employer_verified:true,rc:Object.assign({},base({}).rc,{haken:'派遣'})}),err]];
for(const [k,j,r] of cases){
  const cm=h.run('company_match.js',{input:[{json:r}],nodes:{Config:[cfg],'Build Registry Request':[{json:j}]}})[0].json;
  const fq=h.run('final_qc.js',{input:[{json:Object.assign({},cm,{ai:{ok:true,employer:'TRUE',employer_quote_ok:true,ssw_explicit:true,management:false,overseas:'UNVERIFIED',salary_basis:'TRUE'}})}],nodes:{Config:[cfg]}})[0].json;
  const P=fq.notion_patch_body.properties;
  console.log(k.padEnd(22),cm.co.verdict.padEnd(20),'regStatus='+cm.co.registry_status,'=>',fq.decision,'| method='+P['Company Verification Method'].select.name,'| regprop='+P['Registry Status'].select.name,'| date='+JSON.stringify(P['Company Verification Date'].date),'| EmpVer='+P['Employer Verified'].checkbox);
}
