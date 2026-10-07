const h=require('./harness'),fs=require('fs');
const cfg=[{json:{run_id:'R1',pages_per_query:1}}];
const tasks=h.run('build_tasks.js',{input:[],nodes:{Config:cfg}});
console.log(tasks.length,tasks[0].json.url);
const html=fs.readFileSync('../hw.html','utf8');
const out=h.run('parse_listing.js',{input:[{json:{data:html},pairedItem:{item:0}},{json:{error:{message:'boom',code:'ETIMEDOUT'}},pairedItem:{item:1}}],nodes:{Config:cfg,'Build Search Tasks':tasks}});
console.log(out.length);console.log(JSON.stringify(out[0].json,null,1));console.log(out[3].json.company,out[3].json.listing_salary);console.log(out[20].json,out[21].json);
fs.writeFileSync('jobs.json',JSON.stringify(out.filter(o=>o.json._kind==='job')));
