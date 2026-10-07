const h=require('./harness'),fs=require('fs');
const cfg={json:{run_id:'E1',run_date:'2026-10-05',run_started:'2026-10-05T02:00:00Z',max_per_run:20,use_ai:'true',ai_model_enrich:'claude-sonnet-5-5'}};
const sel=n=>({type:'select',select:n?{name:n}:null});const rtx=s=>({type:'rich_text',rich_text:s?[{plain_text:s}]:[]});const num=n=>({type:'number',number:n});const dt=d=>({type:'date',date:d?{start:d}:null});
const pg=(id,o={})=>({id,url:'u/'+id,properties:{'Job ID':{type:'unique_id',unique_id:{prefix:'MTG',number:1}},'Job Number':rtx('1-'+id),'Job Title':{type:'title',title:[{plain_text:'t'}]},Company:rtx('株式会社テスト'),'Source URL':{type:'url',url:'https://hellowork.careers/'+id},'Lifecycle Status':sel(o.life||'ACTIVE'),'QC Decision':sel(o.qc||'APPROVED'),Recruitability:sel('Overseas Unverified'),'JLPT Required':sel(o.jlpt??'Unknown'),'License Required':sel(o.lic??'Unknown'),'Experience Required':sel(o.exp??'Unknown'),'Salary Basis':sel(o.basis||''),'Effective Hourly Wage':num(o.hourly??null),'Monthly Salary Min':num(null),'Monthly Salary Max':num(null),'Enrichment Checked':dt(o.checked||''),'Enrichment Evidence':rtx(o.ev||'')}});
// 1 flatten: only ACTIVE+APPROVED, priority sort
const fl=h.run('flatten4.js',{input:[{json:{results:[pg('a',{jlpt:'N3',lic:'No',exp:'No',basis:'MONTHLY'}),pg('b',{}),pg('c',{life:'QC_REVIEW'}),pg('d',{qc:'REVIEW'}),pg('e',{jlpt:'N4'})]}}],nodes:{Config:[cfg]}});
console.log('flatten',fl.map(x=>x.json.page_id+':p'+x.json.priority).join(' '),'(expect b:p1 e:p2.. a:p5; c,d excluded)');
// 2 extract on the real HelloWork page
const html=fs.readFileSync('../detail.html','utf8');
const job=fl.find(x=>x.json.page_id==='b').json;
const ex=h.run('extract4.js',{input:[{json:{data:html}}],nodes:{Config:[cfg],'Is Candidate?':[{json:job}]}})[0].json;
console.log('REAL PAGE det:',JSON.stringify({state:ex.det.state,jlpt:ex.det.jlpt,lic:ex.det.lic,exp:ex.det.exp,exp_ev:ex.det.exp_ev,basis:ex.det.basis,hourly:ex.det.hourly,notes:ex.det.notes,needs_ai:ex.needs_ai}));
// 3 synthetic pages for each rule
const mkPage=(extra)=>'<html><body>'+'x'.repeat(3200)+'<p>の募集内容、仕事概要</p>'+extra+'</body></html>';
const cases={
 n3:'<p>日本語能力：N3程度</p><p>必要な経験等</p><p>3年以上</p><p>必要な免許・資格</p><p>普通自動車免許（AT限定可）必須</p><p>賃金</p><p>250,000円〜280,000円</p><p>賃金形態</p><p>月給</p>',
 vague:'<p>日本語でコミュニケーションが取れる方</p><p>必要な経験等</p><p>未経験歓迎</p><p>必要な免許・資格</p><p>免許があれば尚可</p>',
 conflict:'<p>日本語能力試験N3以上</p><p>日本語能力試験N2以上の方は優遇</p>',
 fullwidth:'<p>日本語能力試験Ｎ４以上</p><p>必要な免許・資格</p><p>不問</p>',
 nolic:'<p>特別な資格やスキルは不要です</p>',
 jlptnone:'<p>日本語能力は不問</p>'
};
const res={};
for(const k in cases){ res[k]=h.run('extract4.js',{input:[{json:{data:mkPage(cases[k])}}],nodes:{Config:[cfg],'Is Candidate?':[{json:job}]}})[0].json; const d=res[k].det; console.log(k.padEnd(9),JSON.stringify({jlpt:d.jlpt,lic:d.lic,type:d.lic_type,exp:d.exp,min:d.exp_min,basis:d.basis,mmin:d.mmin,mmax:d.mmax,notes:d.notes}),'ai:',res[k].needs_ai); }
// 4 enrich diff: fill only Unknown, never overwrite, idempotent
const E=(j)=>h.run('enrich4.js',{input:[{json:j}],nodes:{Config:[cfg]}})[0].json;
const e1=E(res.n3.det.state?Object.assign({},job,{det:res.n3.det,errors:[]}):{});
console.log('n3 enrich:',e1.outcome,e1.changed.join(','),'|',JSON.stringify(e1.notion_sent));
// second run: cur reflects what was written
const cur2=Object.assign({},job.cur,{jlpt:'N3',lic:'Yes',lic_type:'普通自動車免許(AT限定可)',exp:'Yes',exp_min:3,basis:'MONTHLY',mmin:250000,mmax:280000,checked:'2026-10-05',evidence:e1.notion_sent['Enrichment Evidence']});
const e2=E(Object.assign({},job,{cur:cur2,det:res.n3.det,errors:[]}));
console.log('second run same day:',e2.outcome,e2.changed.length,'changes (expect NO_CHANGE 0)');
// next week same data: only the stamp
const e3=E(Object.assign({},job,{cur:Object.assign({},cur2,{checked:'2026-09-25'}),det:res.n3.det,errors:[]}));
console.log('re-check later:',e3.outcome,e3.changed.join(','),'(expect CHECKED_NO_NEW_DATA, only stamp)');
// known value is NEVER overwritten (conflict logged), Unknown never written
const e4=E(Object.assign({},job,{cur:Object.assign({},job.cur,{jlpt:'N4'}),det:res.n3.det,errors:[]}));
console.log('conflict:',e4.conflicts.join('; '),'| JLPT written?',!!e4.notion_sent['JLPT Required'],'(expect false)');
const e5=E(Object.assign({},job,{det:res.vague.det,errors:[]}));
console.log('vague:',JSON.stringify(e5.notion_sent),'| jlpt written?',!!e5.notion_sent['JLPT Required'],'(expect false: Unknown stays Unknown)');
// source gone -> no write
const e6=E(Object.assign({},job,{det:{state:'GONE'},errors:[]}));
console.log('source gone:',e6.outcome,e6.needs_write);
// 5 AI parse validator
const prep=h.run('prep_ai4.js',{input:[{json:Object.assign({},job,{det:res.vague.det,detail_text:'日本語能力試験N3以上 ご応募ください。 免許があれば尚可 普通自動車免許'})}],nodes:{Config:[cfg]}});
const aiOut=(o)=>({json:{content:[{text:JSON.stringify(o)}]}});
const run=(o)=>h.run('parse_ai4.js',{input:[aiOut(o)],nodes:{'Prepare AI':[prep[0]]}})[0].json.ai;
const good=run({jlpt:'N3',jlpt_quote:'日本語能力試験N3以上',license:'Preferred',license_type:'普通自動車免許',license_quote:'免許があれば尚可',experience:'Unknown',experience_quote:''});
console.log('AI good:',good.jlpt,good.lic,good.lic_type,good.rejected);
const fake=run({jlpt:'N2',jlpt_quote:'日本語能力試験N2以上',license:'Yes',license_quote:'免許があれば尚可',experience:'No',experience_quote:'未経験歓迎'});
console.log('AI fabricated:',fake.jlpt,fake.lic,fake.exp,fake.rejected);
const loose=run({jlpt:'N3',jlpt_quote:'ご応募ください。',license:'Unknown'});
console.log('AI quote w/o evidence:',loose.jlpt,loose.rejected);
// 6 verify, CJK corruption
const e7=E(Object.assign({},job,{det:res.n3.det,errors:[]}));
const rb=(body,corrupt)=>{const P={};for(const k in body.properties){const v=body.properties[k];if(v.select)P[k]={type:'select',select:{name:v.select.name}};else if('number'in v)P[k]={type:'number',number:v.number};else if(v.date)P[k]={type:'date',date:{start:v.date.start}};else if(v.rich_text)P[k]={type:'rich_text',rich_text:[{plain_text:corrupt?v.rich_text[0].text.content.replace('日','曰'):v.rich_text[0].text.content}]};}return {id:job.page_id,properties:P};};
const ver=h.run('verify4.js',{input:[{json:rb(e7.notion_patch_body)},{json:rb(e7.notion_patch_body,true)}],nodes:{'Enrich Diff':[{json:e7},{json:e7}],'Notion PATCH':[{json:{id:job.page_id}},{json:{id:job.page_id}}]}});
console.log('verify:',ver.map(x=>x.json.write_status+' '+x.json.write_reason.slice(0,60)).join(' || '));
const sh=h.run('shape4.js',{input:ver.concat([{json:e6}]),nodes:{Config:[cfg]}});console.log('log rows',sh.length,sh[0].json.field,sh[0].json.confidence);
console.log(JSON.stringify(h.run('runlog4.js',{input:ver.concat([{json:e6},{json:e5}]),nodes:{Config:[cfg]}})[0].json));
