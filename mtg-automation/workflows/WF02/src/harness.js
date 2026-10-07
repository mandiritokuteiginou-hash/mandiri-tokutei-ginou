const fs=require('fs');
exports.run=function(file,{input,nodes}){
  const code=fs.readFileSync(file,'utf8');
  const $=(name)=>{const v=nodes[name];return {first:()=>v[0],all:()=>v,item:v[0],itemMatching:(i)=>v[i]}};
  const fn=new Function('$','$input','$json','$now',code.replace(/^/,'return (function(){')+'\n})()');
  return fn($,{all:()=>input,first:()=>input[0]},input[0]&&input[0].json,{toISO:()=>new Date().toISOString(),toFormat:()=>'x'});
};
