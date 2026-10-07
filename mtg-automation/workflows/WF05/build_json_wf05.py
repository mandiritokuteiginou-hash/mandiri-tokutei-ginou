import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg05'+n).encode()).hexdigest()))
nodes=[];pos={}
def add(name,type_,ver,params,x,y,extra=None,creds=None,notes=None):
    n={'parameters':params,'id':uid(name),'name':name,'type':type_,'typeVersion':ver,'position':[x,y]}
    if extra: n.update(extra)
    if creds: n['credentials']=creds
    if notes: n['notes']=notes; n['notesInFlow']=False
    nodes.append(n); return n
def code(name,fn,x,y,notes=None):
    add(name,'n8n-nodes-base.code',2,{'mode':'runOnceForAllItems','language':'javaScript','jsCode':open(J+fn,encoding='utf-8').read()},x,y,notes=notes)
def ife(name,field,val,x,y):
    add(name,'n8n-nodes-base.if',2.2,{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict','version':2},'conditions':[{'id':uid(name+'c'),'leftValue':'={{ String(%s) }}'%field,'operator':{'type':'string','operation':'equals'},'rightValue':val}],'combinator':'and'}},x,y)
def http_fetch(name,field,interval,x,y,notes=None):
    add(name,'n8n-nodes-base.httpRequest',4.3,{'method':'GET','url':'={{ $json.%s }}'%field,'sendHeaders':True,'headerParameters':{'parameters':[{'name':'User-Agent','value':UA},{'name':'Accept-Language','value':'ja,en;q=0.8'}]},'options':{'timeout':30000,'response':{'response':{'responseFormat':'text'}},'batching':{'batch':{'batchSize':1,'batchInterval':interval}}}},x,y,{'retryOnFail':True,'maxTries':3,'waitBetweenTries':4000,'onError':'continueRegularOutput'},notes=notes)
BODY='={{ JSON.stringify((() => { const r = $json.%s; const conv = (c) => Array.isArray(c) ? c.map((b) => b.type === "image" ? { type: "image_url", image_url: { url: b.source && b.source.url } } : b) : c; const body = { model: r.model, max_tokens: r.max_tokens, messages: [{ role: "system", content: r.system }].concat(r.messages.map((m) => ({ role: m.role, content: conv(m.content) }))) }; if (r.temperature !== undefined) body.temperature = r.temperature; return body; })()) }}'
def http_ai(name,field,x,y):
    add(name,'n8n-nodes-base.httpRequest',4.3,{'method':'POST','url':'https://ai.sumopod.com/v1/chat/completions','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'content-type','value':'application/json'}]},'sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':BODY%field,'options':{'timeout':90000,'batching':{'batch':{'batchSize':3,'batchInterval':1500}}}},x,y,{'retryOnFail':True,'maxTries':3,'waitBetweenTries':5000,'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':'Sumopod AI API Key (Bearer)'}})
def http_notion(name,method,url,body,x,y):
    p={'method':method,'url':url,'authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'Notion-Version','value':'2025-09-03'}]}}
    if body: p.update({'sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':body})
    p['options']={'timeout':30000,'batching':{'batch':{'batchSize':1,'batchInterval':400}}}
    # creates (POST /v1/pages) must never auto-retry: a retried create can duplicate a page
    retry={'onError':'continueRegularOutput'} if (method=='POST' and url.endswith('/v1/pages')) else {'retryOnFail':True,'maxTries':3,'waitBetweenTries':2000,'onError':'continueRegularOutput'}
    add(name,'n8n-nodes-base.httpRequest',4.3,p,x,y,retry,creds={'httpHeaderAuth':{'id':'','name':'Notion Bearer (Header Auth)'}})
def _unused(name,key,x,y):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'rowNotExists','dataTableId':{'__rl':True,'mode':'name','value':'mtg_job_scout_cache'},'matchType':'allConditions','filters':{'conditions':[{'keyName':'job_key','condition':'eq','keyValue':'={{ $json.%s }}'%key}]}},x,y)
def dt_ins(name,table,cols,x,y):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'insert','dataTableId':{'__rl':True,'mode':'name','value':table},'columns':{'mappingMode':'defineBelow','value':{c:'={{ $json.%s }}'%c for c,_ in cols},'schema':[{'id':c,'displayName':c,'required':False,'defaultMatch':False,'display':True,'type':t,'canBeUsedToMatch':False} for c,t in cols]}},x,y)




BANNED='jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat|resmi MTGI|P3MI|penempatan resmi'
cfg=[('run_id','={{ "CT-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Job Content Engine V1.0','string'),('max_per_run',15,'number'),('lookback_hours',14,'number'),('use_ai','true','string'),('ai_model_content','gpt-4o-mini','string'),('allowed_tiers','S-TIER,A-TIER,B-TIER,C-TIER','string'),('template_version','v1','string'),('banned_phrases',BANNED,'string'),('hashtags','#TokuteiGinou #SSW #KerjaDiJepang #InfoLowongan','string'),('disclaimer','Informasi bersumber dari lowongan publik dan bisa berubah. Pastikan detail dan syarat resmi sebelum melamar.','string'),('brand_footer','','string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string')]
add('Schedule 12:00 and 00:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 12,0 * * *'}]}},0,336,notes='1h after WF04 (11:00/23:00 JST). Keep OFF until WF01-04 live tests pass. WF05 only writes Draft copy; it never publishes.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='use_ai=false runs deterministic templates only. brand_footer is empty until the legal position of MTGI is settled.')
URL='={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}'
BASE="{ property: 'Ingestion Source', select: { equals: 'N8N' } }, { property: 'Lifecycle Status', select: { equals: 'ACTIVE' } }, { property: 'QC Decision', select: { equals: 'APPROVED' } }, { property: 'Recruitability', select: { equals: 'Overseas Confirmed' } }"
QN="={{ JSON.stringify({ filter: { and: [ "+BASE+", { or: [ { property: 'Content Status', select: { is_empty: true } }, { property: 'Content Status', select: { equals: 'Not Started' } } ] } ] }, page_size: 50 }) }}"
QD="={{ JSON.stringify({ filter: { and: [ "+BASE+", { property: 'Content Status', select: { equals: 'Draft' } }, { timestamp: 'last_edited_time', last_edited_time: { on_or_after: $now.minus({ hours: $('Config').first().json.lookback_hours }).toUTC().toISO() } } ] }, page_size: 50 }) }}"
http_notion('Query New','POST',URL,QN,448,240)
http_notion('Query Drafts','POST',URL,QD,448,432)
add('Queues','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},672,336,notes='Input 0 = new, 1 = drafts re-check. Flatten treats a failed query as QUEUE_ERROR, not as empty.')
code('Flatten','flatten5.js',896,336,'Gates: ACTIVE + QC APPROVED + Overseas Confirmed + canonical + allowed tier. Fact sheet from stored fields only; Unknown is dropped, never turned into No.')
ife('Needs Content?','$json.action','GENERATE',1120,336)
ife('Needs AI?','$json.needs_ai','true',1344,272)
code('Prepare AI','prep_ai5.js',1568,208)
http_ai('AI Write','ai_req',1792,208)
code('Parse AI','parse_ai5.js',2016,208,'Parses JSON only. Nothing is trusted until Compose validates it against the fact sheet.')
add('Content Inputs','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},2240,272,notes='Inputs: 0 = no AI, 1 = AI result.')
code('Compose','compose5.js',2464,272,'Validator: banned words, numbers/N-levels not in facts, URLs, unsupported claims, wrong prefecture. Any issue -> deterministic template from the same facts. Footer added by code. Status = Draft only.')
ife('Needs Write?','$json.needs_write','true',2688,272)
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',2912,208)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,3136,208)
code('Verify Write','verify5.js',3360,208,'CJK corruption / silent failure check on every written property.')
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':3},3584,304,notes='Inputs: 0 skip/meta, 1 unchanged, 2 written rows.')
code('Shape Content Rows','shape5.js',3808,208)
dt_ins('Insert Content Log','mtg_job_content_log',[(c,'string') for c in ['run_id','ts','job_number','page_id','mtg_job_id','action','method','content_hash','channel_lengths','issues','reason','write_status']],4032,208)
code('Shape Error Rows','errors5.js',3808,400)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],4032,400)
code('Run Log','runlog5.js',3808,592)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','summary_json']]+[(c,'number') for c in ['seen','not_eligible','insufficient_facts','skipped_unchanged','drafted','drafted_ai','drafted_template','written_ok','write_errors','verify_failed','ai_errors']]
dt_ins('Insert Run Log','mtg_job_content_run_log',rl,4032,592)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 12:00 and 00:00 JST'
for a,b in [(S,'Config'),('Config','Query New'),('Config','Query Drafts'),('Query Drafts','Queues',0,1),('Queues','Flatten'),('Flatten','Needs Content?'),('Prepare AI','AI Write'),('AI Write','Parse AI'),('Content Inputs','Compose'),('Compose','Needs Write?'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('All Outcomes','Shape Content Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape Content Rows','Insert Content Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')] if False else []: pass
pairs=[(S,'Config'),('Config','Query New'),('Config','Query Drafts'),('Queues','Flatten'),('Flatten','Needs Content?'),('Prepare AI','AI Write'),('AI Write','Parse AI'),('Content Inputs','Compose'),('Compose','Needs Write?'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('All Outcomes','Shape Content Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape Content Rows','Insert Content Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]
for a,b in pairs: link(a,b)
link('Query New','Queues',0,0); link('Query Drafts','Queues',0,1)
link('Needs Content?','Needs AI?',0); link('Needs Content?','All Outcomes',1,0)
link('Needs AI?','Prepare AI',0); link('Needs AI?','Content Inputs',1,0)
link('Parse AI','Content Inputs',0,1)
link('Needs Write?','Notion PATCH',0); link('Needs Write?','All Outcomes',1,1)
link('Verify Write','All Outcomes',0,2)
OUT=os.path.join(HERE,'MTG_WF05_Job_Content_Engine_V1.0.json')
wf={'name':'MTG #05 - Job Content Engine V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
json.dump(wf,open(OUT,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
names={n['name'] for n in nodes}
print(len(nodes),'nodes; bad',[(a,t['node']) for a,v in conn.items() for o in v['main'] for t in o if a not in names or t['node'] not in names])
reach=set([S]);ch=True
while ch:
    ch=False
    for a,v in conn.items():
        if a in reach:
            for o in v['main']:
                for t in o:
                    if t['node'] not in reach: reach.add(t['node']);ch=True
print('unreachable',names-reach)
