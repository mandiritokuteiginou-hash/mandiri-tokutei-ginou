import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg03'+n).encode()).hexdigest()))
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
def dt_rne(name,key,x,y):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'rowNotExists','dataTableId':{'__rl':True,'mode':'name','value':'mtg_job_scout_cache'},'matchType':'allConditions','filters':{'conditions':[{'keyName':'job_key','condition':'eq','keyValue':'={{ $json.%s }}'%key}]}},x,y)
def dt_ins(name,table,cols,x,y):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'insert','dataTableId':{'__rl':True,'mode':'name','value':table},'columns':{'mappingMode':'defineBelow','value':{c:'={{ $json.%s }}'%c for c,_ in cols},'schema':[{'id':c,'displayName':c,'required':False,'defaultMatch':False,'display':True,'type':t,'canBeUsedToMatch':False} for c,t in cols]}},x,y)


cfg=[('run_id','={{ "LC-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Canonicalization & Lifecycle V1.0','string'),('max_per_run',40,'number'),('lookback_hours',14,'number'),('tier_s_min_salary',300000,'number'),('tier_a_min_salary',270000,'number'),('tier_b_min_salary',240000,'number'),('tier_s_min_score',90,'number'),('tier_a_min_score',85,'number'),('tier_b_min_score',80,'number'),('tier_min_company',90,'number'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string')]
add('Schedule 10:00 and 22:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 10,22 * * *'}]}},0,336,notes='1h after WF02 (09:00/21:00 JST).')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='Tier thresholds, lookback window and caps. Tier rules live here, not in code.')
URL='={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}'
QA="={{ JSON.stringify({ filter: { and: [ { property: 'Ingestion Source', select: { equals: 'N8N' } }, { or: [ { property: 'Lifecycle Status', select: { is_empty: true } }, { timestamp: 'last_edited_time', last_edited_time: { on_or_after: $now.minus({ hours: $('Config').first().json.lookback_hours }).toISO() } } ] } ] }, sorts: [ { timestamp: 'last_edited_time', direction: 'ascending' } ], page_size: 25 }) }}"
QB="={{ JSON.stringify({ filter: { and: [ { property: 'Ingestion Source', select: { equals: 'N8N' } }, { property: 'Lifecycle Status', select: { equals: 'ACTIVE' } }, { or: [ { property: 'Lifecycle Checked', date: { is_empty: true } }, { property: 'Lifecycle Checked', date: { before: $('Config').first().json.run_date } } ] } ] }, sorts: [ { property: 'Lifecycle Checked', direction: 'ascending' } ], page_size: 20 }) }}"
http_notion('Query Recent and Unorganized','POST',URL,QA,448,208)
http_notion('Query Active Due For Check','POST',URL,QB,448,464)
add('Queues','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},672,336)
code('Flatten','flatten3.js',896,336,'Union of both queries, de-duplicated by page, capped at max_per_run.')
ife('Is Job?','$json._kind','job',1120,336)
ife('Needs Fetch?','!!$json.qc','true',1344,272)
http_fetch('Fetch Source','source_url',2000,1568,208)
code('Source Check','source_check.js',1792,208,'Still open? expiry date; salary/holiday drift since QC.')
code('No Fetch','no_fetch.js',1568,400,'Not yet through QC: no source check needed.')
add('Source Join','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},2016,304)
http_notion('Dedup Query','POST',URL,'={{ JSON.stringify($json.dedup_query) }}',2240,304)
code('Organize','organize.js',2464,304,'Canonical record + final dedup + lifecycle + tier + matching fields. Writes only changed properties.')
ife('Needs Write?','$json.needs_write','true',2688,304)
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',2912,240)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,3136,240)
code('Verify Write','verify3.js',3360,240,'CJK corruption / silent failure check on every changed property.')
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':3},3584,336,notes='Inputs: 0 queue meta, 1 unchanged, 2 written rows.')
code('Shape Lifecycle Rows','shape3.js',3808,240)
dt_ins('Insert Lifecycle Log','mtg_job_lifecycle_log',[(c,'string') for c in ['run_id','ts','job_number','page_id','mtg_job_id','company','prev_lifecycle','new_lifecycle','tier','qc_decision','changed_fields','reason','write_status']],4032,240)
code('Shape Error Rows','errors3.js',3808,432)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],4032,432)
code('Run Log','runlog3.js',3808,624)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','summary_json']]+[(c,'number') for c in ['processed','unchanged','changed','written_ok','write_errors','verify_failed','duplicates_archived','requeued_to_wf02','expired_or_closed','source_errors']]
dt_ins('Insert Run Log','mtg_job_organize_run_log',rl,4032,624)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 10:00 and 22:00 JST'
for a,b in [(S,'Config'),('Config','Query Recent and Unorganized'),('Config','Query Active Due For Check'),('Flatten','Is Job?'),('Fetch Source','Source Check'),('Source Join','Dedup Query'),('Dedup Query','Organize'),('Organize','Needs Write?'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('Verify Write','All Outcomes'),('All Outcomes','Shape Lifecycle Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape Lifecycle Rows','Insert Lifecycle Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]: link(a,b)
link('Query Recent and Unorganized','Queues',0,0); link('Query Active Due For Check','Queues',0,1); link('Queues','Flatten')
link('Is Job?','Needs Fetch?',0); link('Is Job?','All Outcomes',1,0)
link('Needs Fetch?','Fetch Source',0); link('Needs Fetch?','No Fetch',1)
link('Source Check','Source Join',0,0); link('No Fetch','Source Join',0,1)
link('Needs Write?','Notion PATCH',0); link('Needs Write?','All Outcomes',1,1)
# Verify Write -> All Outcomes idx 2 (fix: first link used idx 0)
conn['Verify Write']['main'][0]=[{'node':'All Outcomes','type':'main','index':2}]
wf={'name':'MTG #03 - Job Canonicalization & Lifecycle V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
json.dump(wf,open(os.path.join(HERE,'MTG_WF03_Canonicalization_Lifecycle_V1.0.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
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
