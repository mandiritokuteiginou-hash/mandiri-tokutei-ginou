import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg04'+n).encode()).hexdigest()))
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



cfg=[('run_id','={{ "EN-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Job Enrichment V1.0','string'),('max_per_run',20,'number'),('recheck_days',7,'number'),('use_ai','true','string'),('ai_model_enrich','gpt-4o-mini','string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string')]
add('Schedule 11:00 and 23:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 11,23 * * *'}]}},0,336,notes='1h after WF03 (10:00/22:00 JST). Keep OFF until the first live test passes.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='recheck_days throttles re-fetching; use_ai=false runs deterministic extraction only.')
URL='={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}'
unk=lambda p: "{ property: '%s', select: { equals: 'Unknown' } }, { property: '%s', select: { is_empty: true } }"%(p,p)
QC="={{ JSON.stringify({ filter: { and: [ { property: 'Ingestion Source', select: { equals: 'N8N' } }, { property: 'Lifecycle Status', select: { equals: 'ACTIVE' } }, { property: 'QC Decision', select: { equals: 'APPROVED' } }, { or: [ "+unk('JLPT Required')+", "+unk('License Required')+", "+unk('Experience Required')+", { property: 'Salary Basis', select: { is_empty: true } } ] }, { or: [ { property: 'Enrichment Checked', date: { is_empty: true } }, { property: 'Enrichment Checked', date: { before: $now.setZone('Asia/Tokyo').minus({ days: $('Config').first().json.recheck_days }).toFormat('yyyy-MM-dd') } } ] } ] }, sorts: [ { property: 'Enrichment Checked', direction: 'ascending' } ], page_size: 25 }) }}"
http_notion('Query Candidates','POST',URL,QC,224+224,336)
code('Flatten Candidates','flatten4.js',896,336,'Only ACTIVE + QC APPROVED. Priority: JLPT, salary basis, license, experience.')
ife('Is Candidate?','$json._kind','job',1120,336)
http_fetch('Fetch Source','source_url',2000,1344,272)
code('Extract','extract4.js',1568,272,'Deterministic extraction with verbatim evidence. Not stated = Unknown (never No).')
ife('Needs AI?','$json.needs_ai','true',1792,272)
code('Prepare AI','prep_ai4.js',2016,208)
http_ai('AI Extract','ai_req',2240,208)
code('Parse AI','parse_ai4.js',2464,208,'Quote must exist verbatim in the page AND support the value; otherwise Unknown.')
add('Enrich Inputs','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},2688,272,notes='Inputs: 0 = no AI needed, 1 = AI result.')
code('Enrich Diff','enrich4.js',2912,272,'Fills ONLY Unknown fields; never overwrites a known value; never writes Unknown; diff-only PATCH.')
ife('Needs Write?','$json.needs_write','true',3136,272)
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',3360,208)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,3584,208)
code('Verify Write','verify4.js',3808,208,'CJK corruption / silent failure check on every changed property.')
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':3},4032,304,notes='Inputs: 0 queue meta, 1 unchanged, 2 written rows.')
code('Shape Enrichment Rows','shape4.js',4256,208)
dt_ins('Insert Enrichment Log','mtg_job_enrichment_log',[(c,'string') for c in ['run_id','ts','job_number','page_id','mtg_job_id','field','old_value','new_value','source_url','evidence','confidence','changed','write_status']],4480,208)
code('Shape Error Rows','errors4.js',4256,400)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],4480,400)
code('Run Log','runlog4.js',4256,592)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','summary_json']]+[(c,'number') for c in ['processed','unchanged','checked_no_new_data','enriched','fields_filled','ai_calls','ai_rejected','conflicts','written_ok','write_errors','verify_failed','source_errors']]
dt_ins('Insert Run Log','mtg_job_enrichment_run_log',rl,4480,592)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 11:00 and 23:00 JST'
for a,b in [(S,'Config'),('Config','Query Candidates'),('Query Candidates','Flatten Candidates'),('Flatten Candidates','Is Candidate?'),('Fetch Source','Extract'),('Extract','Needs AI?'),('Prepare AI','AI Extract'),('AI Extract','Parse AI'),('Enrich Inputs','Enrich Diff'),('Enrich Diff','Needs Write?'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('All Outcomes','Shape Enrichment Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape Enrichment Rows','Insert Enrichment Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]: link(a,b)
link('Is Candidate?','Fetch Source',0); link('Is Candidate?','All Outcomes',1,0)
link('Needs AI?','Prepare AI',0); link('Needs AI?','Enrich Inputs',1,0)
link('Parse AI','Enrich Inputs',0,1)
link('Needs Write?','Notion PATCH',0); link('Needs Write?','All Outcomes',1,1)
link('Verify Write','All Outcomes',0,2)
wf={'name':'MTG #04 - Job Enrichment V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
json.dump(wf,open(os.path.join(HERE,'MTG_WF04_Job_Enrichment_V1.0.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
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
