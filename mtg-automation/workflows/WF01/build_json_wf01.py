import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg01'+n).encode()).hexdigest()))
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
def http_ai(name,field,x,y):
    add(name,'n8n-nodes-base.httpRequest',4.3,{'method':'POST','url':'https://api.anthropic.com/v1/messages','authentication':'genericCredentialType','genericAuthType':'httpTemplatedCustomAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'anthropic-version','value':'2023-06-01'},{'name':'content-type','value':'application/json'}]},'sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':'={{ JSON.stringify($json.%s) }}'%field,'options':{'timeout':90000,'batching':{'batch':{'batchSize':3,'batchInterval':1500}}}},x,y,{'retryOnFail':True,'maxTries':3,'waitBetweenTries':5000,'onError':'continueRegularOutput'},creds={'httpTemplatedCustomAuth':{'id':'','name':'Anthropic API Key (x-api-key)'}})
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
cfg=[('run_id','={{ "RUN-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_time','={{ $now.setZone("Asia/Tokyo").toFormat("HH:mm") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Daily Job Scout V1.0','string'),('job_threshold',80,'number'),('company_threshold',90,'number'),('pages_per_query',2,'number'),('max_ai_jobs',40,'number'),('staleness_days',180,'number'),('allow_hourly_sectors','農業,漁業','string'),('ai_model_extract','claude-haiku-4-5-20251001','string'),('ai_model_score','claude-sonnet-5-5','string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string'),('notion_company_ds_id','a72e12ca-f829-407f-945e-4b87e9195cd2','string')]
add('Schedule 08:00 and 20:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 8,20 * * *'}]}},0,336,notes='Cron 0 8,20 * * * ; workflow timezone = Asia/Tokyo (Settings).')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='All tunables live here: thresholds, AI models, caps, Notion data source ids.')
code('Build Search Tasks','build_tasks.js',448,336,'Source registry. Only hellowork is enabled; engage/jobmedley/indeed/mintoku are disabled placeholders.')
http_fetch('Fetch Listing','url',2500,672,336,'Per-item errors continue (onError=continueRegularOutput) -> logged by Parse Listing -> Error Log.')
code('Parse Listing','parse_listing.js',896,336)
ife('Is Job Row?','$json._kind','job',1120,336)
dt_rne('Cache Dedup','job_key',1344,272)
code('Pre-Filter','prefilter.js',1568,272,'Deterministic trap filter + in-run dedup + per-run AI cap. No AI.')
ife('Is Candidate?','$json.is_candidate','true',1792,272)
http_fetch('Fetch Detail','detail_url',2000,2016,192)
code('Prepare Extract','prep_extract.js',2240,192,'HTML->text, hard facts (dispatch field, wage form, dates, 法人番号), extract prompt.')
http_ai('AI Extract','ai_extract_req',2464,192)
code('Gates M1-M8','gates.js',2688,192,'DETERMINISTIC gates M1-M8. AI output is data only.')
ife('Gates Passed?','$json.gate_pass','true',2912,192)
code('Prepare Score','prep_score.js',3136,128)
http_ai('AI Screen and Score','ai_score_req',3360,128)
code('Parse Score','score.js',3584,128,'Salary/company/source parts deterministic; AI parts clamped; penalties; threshold decision.')
ife('Quality Gate Passed?','$json.quality_pass','true',3808,128)
code('Build Notion Payload','build_notion.js',4032,48)
http_notion('Notion Dup Check','POST','={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}','={{ JSON.stringify($json.notion_query_body) }}',4256,48)
code('Decide Dup','decide_dup.js',4480,48)
ife('Is New In Notion?','$json._kind','to_create',4704,48)
http_notion('Create Job Page','POST','https://api.notion.com/v1/pages','={{ JSON.stringify($json.notion_create_body) }}',4928,48)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,5152,48)
code('Verify Read-back','verify.js',5376,48,'CJK corruption check: every sent value must equal read-back value.')
ife('Verified?','$json._kind','verified',5600,48)
http_notion('Commit Status EXTRACTED','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.notion_page_id }}','={{ JSON.stringify({ properties: { Status: { select: { name: "EXTRACTED" } } } }) }}',5824,0)
code('Mark Written','mark_written.js',6048,0)
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':7},6272,160,notes='Inputs: 0 prefilter/deferred, 1 gate reject, 2 quality/AI reject, 3 notion dup, 4 verify fail, 5 written, 6 errors+meta.')
code('Company Gate','company.js',6272,720)
dt_rne('Company Not Cached','company_key',6496,720)
http_notion('Create Company Page','POST','https://api.notion.com/v1/pages','={{ JSON.stringify($json.notion_company_body) }}',6720,720)
code('Company Cache Row','company_cache.js',6944,720)
cache=[('job_key','string'),('source','string'),('status','string'),('reason','string'),('company','string'),('title','string'),('job_score','number'),('run_id','string'),('notion_page_id','string'),('first_seen','string')]
dt_ins('Insert Company Cache','mtg_job_scout_cache',cache,7168,720)
code('Shape Cache Rows','shape_cache.js',6496,144)
dt_ins('Insert Cache','mtg_job_scout_cache',cache,6720,144)
code('Shape Error Rows','shape_errors.js',6496,336)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],6720,336)
code('Run Log','run_log.js',6496,528)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','sources_enabled','sources_disabled','final_candidates_json']]+[(c,'number') for c in ['tasks','fetch_errors','listings_found','duplicates_skipped_by_cache','new_after_dedup','prefilter_rejected','deferred','ai_errors','detail_fetch_errors','gate_rejected','ai_screen_rejected','below_threshold','notion_duplicates','notion_errors','verify_failed','written_verified','high_priority']]
dt_ins('Insert Run Log','mtg_job_scout_run_log',rl,6720,528)
# connections (identical to the validated/created workflow)
def c(a,*targets,out=0):
    pass
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 08:00 and 20:00 JST'
for a,b in [(S,'Config'),('Config','Build Search Tasks'),('Build Search Tasks','Fetch Listing'),('Fetch Listing','Parse Listing'),('Parse Listing','Is Job Row?'),('Cache Dedup','Pre-Filter'),('Pre-Filter','Is Candidate?'),('Fetch Detail','Prepare Extract'),('Prepare Extract','AI Extract'),('AI Extract','Gates M1-M8'),('Gates M1-M8','Gates Passed?'),('Prepare Score','AI Screen and Score'),('AI Screen and Score','Parse Score'),('Parse Score','Quality Gate Passed?'),('Build Notion Payload','Notion Dup Check'),('Notion Dup Check','Decide Dup'),('Decide Dup','Is New In Notion?'),('Create Job Page','Read-back Page'),('Read-back Page','Verify Read-back'),('Verify Read-back','Verified?'),('Commit Status EXTRACTED','Mark Written'),('Company Gate','Company Not Cached'),('Company Not Cached','Create Company Page'),('Create Company Page','Company Cache Row'),('Company Cache Row','Insert Company Cache'),('Shape Cache Rows','Insert Cache'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]: link(a,b)
for ifname,t,f in [('Is Job Row?','Cache Dedup',6),('Is Candidate?','Fetch Detail',0),('Gates Passed?','Prepare Score',1),('Quality Gate Passed?','Build Notion Payload',2),('Is New In Notion?','Create Job Page',3),('Verified?','Commit Status EXTRACTED',4)]:
    link(ifname,t,0); link(ifname,'All Outcomes',1,f)
link('Mark Written','All Outcomes',0,5); link('Mark Written','Company Gate',0)
for t in ['Shape Cache Rows','Shape Error Rows','Run Log']: link('All Outcomes',t)
wf={'name':'MTG #01 - Daily Tokutei Ginou Job Scout V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
json.dump(wf,open(os.path.join(HERE,'MTG_WF01_Daily_Job_Scout_V1.0.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(nodes),'nodes')
# sanity: every connection endpoint exists
names={n['name'] for n in nodes}
bad=[(a,t['node']) for a,v in conn.items() for o in v['main'] for t in o if a not in names or t['node'] not in names]
print('bad',bad)
# check IF output wiring vs created workflow: Is Job Row? main[0]->Cache Dedup, main[1]->All Outcomes idx6
print(conn['Is Job Row?'],conn['Verified?'])
