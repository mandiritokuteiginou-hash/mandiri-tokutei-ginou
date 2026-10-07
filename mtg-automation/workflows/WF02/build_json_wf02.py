import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg02'+n).encode()).hexdigest()))
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

cfg=[('run_id','={{ "QC-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Job Verification & QC V1.0','string'),('job_threshold',80,'number'),('company_threshold',90,'number'),('max_per_run',30,'number'),('min_days_left',3,'number'),('staleness_days',180,'number'),('min_monthly',150000,'number'),('max_monthly',1000000,'number'),('min_hourly',1000,'number'),('require_overseas_verified','true','string'),('gbiz_base','https://info.gbiz.go.jp/hojin','string'),('ai_model_verify','gpt-4o-mini','string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string'),('notion_company_ds_id','a72e12ca-f829-407f-945e-4b87e9195cd2','string')]
add('Schedule 09:00 and 21:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 9,21 * * *'}]}},0,336,notes='1h after WF01 (08:00/20:00 JST) so fresh candidates are verified the same morning/evening. Workflow timezone = Asia/Tokyo.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='Thresholds, wage floors, overseas gate, gBizINFO base URL, AI model, Notion ids.')
QB="={{ JSON.stringify({ filter: { and: [ { property: 'Ingestion Source', select: { equals: 'N8N' } }, { or: [ { property: 'Status', select: { equals: 'EXTRACTED' } }, { and: [ { property: 'Status', select: { equals: 'VERIFICATION_REQUIRED' } }, { property: 'Recheck Required', checkbox: { equals: true } } ] } ] } ] }, sorts: [ { timestamp: 'created_time', direction: 'ascending' } ], page_size: $('Config').first().json.max_per_run }) }}"
http_notion('Query Queue','POST','={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}',QB,448,336)
code('Flatten Queue','flatten_queue.js',672,336,'Queue = N8N-ingested jobs with Status EXTRACTED, or VERIFICATION_REQUIRED + Recheck Required (human re-queue).')
ife('Is Queue Job?','$json._kind','job',896,336)
http_fetch('Fetch Source','source_url',2000,1120,272)
code('Re-check Source','recheck.js',1344,272,'Re-fetch HelloWork page: freshness, source/job match, SSW quote, wage/holiday conflicts, dispatch field, overseas wording.')
http_notion('Dup Query','POST','={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}','={{ JSON.stringify($json.dup_query_body) }}',1568,272)
code('Duplicate Check','dup_check.js',1792,272)
code('Build Registry Request','gbiz_request.js',2016,272,'Company verification is independent of the posting: by 法人番号 if known, else by company name.')
add('Registry Lookup','n8n-nodes-base.httpRequest',4.3,{'method':'GET','url':'={{ $json.gbiz.url }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'Accept','value':'application/json'}]},'options':{'timeout':30000,'batching':{'batch':{'batchSize':1,'batchInterval':1100}}}},2240,272,{'retryOnFail':True,'maxTries':3,'waitBetweenTries':3000,'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':'gBizINFO API Token'}},notes='gBizINFO REST API. Credential: Header Auth, name X-hojinInfo-api-token, value = your token.')
code('Company Score','company_match.js',2464,272,'法人番号 35 + name 25 + address 20 + active 10 + direct employer 10. >= company_threshold and no conflict => VERIFIED.')
ife('Needs AI?','$json.needs_ai','true',2688,272)
code('Prepare Verify','prep_verify.js',2912,208)
http_ai('AI Verify','ai_verify_req',3136,208)
code('Parse Verify','parse_verify.js',3360,208,'Quotes verified verbatim; AI can only downgrade.')
add('QC Inputs','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},3584,272)
code('Final QC','final_qc.js',3808,272,'LAST GATE. APPROVED only if all 10 checks PASS; any REJECT -> REJECT; otherwise REVIEW.')
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',4032,272)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,4256,272)
code('Verify QC Write','verify_qc.js',4480,272,'CJK corruption check on every written property.')
ife('Needs Company Write?','$json.company_upsert_needed','true',4704,208)
code('Company Query Body','company_query_body.js',4928,144)
http_notion('Company Query','POST','={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_company_ds_id + "/query" }}','={{ JSON.stringify($json.company_query) }}',5152,144)
code('Company Plan','company_plan.js',5376,144)
ife('Company Plan Filter','$json._kind','company_plan',5600,144)
http_notion('Company Write','POST','={{ $json.url }}','={{ JSON.stringify($json.body) }}',5824,80)
conn_fix=[n for n in nodes if n['name']=='Company Write'][0]; conn_fix['parameters']['method']='={{ $json.method }}'
code('Company Verify','company_verify.js',6048,80)
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':3},6272,336,notes='Inputs: 0 queue meta (empty/error), 1 job QC rows, 2 company write outcomes.')
code('Shape QC Rows','shape_qc.js',6496,240)
dt_ins('Insert QC Log','mtg_job_qc_log',[(c,t) for c,t in [('run_id','string'),('ts','string'),('job_number','string'),('page_id','string'),('company','string'),('decision','string'),('company_score','number'),('corp_number','string'),('checks_json','string'),('reasons','string'),('prev_status','string'),('write_status','string'),('write_reason','string')]],6720,240)
code('Shape Error Rows','shape_errors2.js',6496,432)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],6720,432)
code('Run Log','run_log2.js',6496,624)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','summary_json']]+[(c,'number') for c in ['queued','approved','review','rejected','written_ok','write_errors','verify_failed','source_errors','registry_errors','ai_errors','company_written','company_errors']]
dt_ins('Insert Run Log','mtg_job_qc_run_log',rl,6720,624)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 09:00 and 21:00 JST'
for a,b in [(S,'Config'),('Config','Query Queue'),('Query Queue','Flatten Queue'),('Flatten Queue','Is Queue Job?'),('Fetch Source','Re-check Source'),('Re-check Source','Dup Query'),('Dup Query','Duplicate Check'),('Duplicate Check','Build Registry Request'),('Build Registry Request','Registry Lookup'),('Registry Lookup','Company Score'),('Company Score','Needs AI?'),('Prepare Verify','AI Verify'),('AI Verify','Parse Verify'),('QC Inputs','Final QC'),('Final QC','Notion PATCH'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify QC Write'),('Company Query Body','Company Query'),('Company Query','Company Plan'),('Company Plan','Company Plan Filter'),('Company Write','Company Verify'),('All Outcomes','Shape QC Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape QC Rows','Insert QC Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]: link(a,b)
link('Is Queue Job?','Fetch Source',0); link('Is Queue Job?','All Outcomes',1,0)
link('Needs AI?','Prepare Verify',0); link('Needs AI?','QC Inputs',1,0)
link('Parse Verify','QC Inputs',0,1)
link('Verify QC Write','All Outcomes',0,1); link('Verify QC Write','Needs Company Write?',0)
link('Needs Company Write?','Company Query Body',0)
link('Company Plan Filter','Company Write',0); link('Company Plan Filter','All Outcomes',1,2)
link('Company Verify','All Outcomes',0,2)
wf={'name':'MTG #02 - Job Verification & QC V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
json.dump(wf,open(os.path.join(HERE,'MTG_WF02_Job_Verification_QC_V1.0.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
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
