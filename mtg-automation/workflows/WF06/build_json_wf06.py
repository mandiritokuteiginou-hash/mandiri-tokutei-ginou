import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg06'+n).encode()).hexdigest()))
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




BANNED='jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat'
REG='P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI'
cfg=[('run_id','={{ "CQ-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Content QC and Approval V1.0','string'),('max_per_run',25,'number'),('max_attempts',3,'number'),('use_ai','true','string'),('require_ai_second_pass','true','string'),('ai_model_qc','gpt-4o-mini','string'),('template_version','v1','string'),('banned_phrases',BANNED,'string'),('regulatory_phrases',REG,'string'),('disclaimer','Informasi bersumber dari lowongan publik dan bisa berubah. Pastikan detail dan syarat resmi sebelum melamar.','string'),('brand_footer','','string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string')]
add('Schedule 13:00 and 01:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 13,1 * * *'}]}},0,336,notes='1h after WF05 (12:00/00:00 JST). Keep OFF until WF01-05 live tests pass. WF06 never publishes.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='template_version, disclaimer and brand_footer MUST equal WF05 Config, otherwise every draft looks stale / lacks the disclaimer. require_ai_second_pass=false allows deterministic-only approval (test mode).')
URL='={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}'
BASE="{ property: 'Ingestion Source', select: { equals: 'N8N' } }"
QD="={{ JSON.stringify({ filter: { and: [ "+BASE+", { property: 'Content Status', select: { equals: 'Draft' } } ] }, page_size: 100 }) }}"
QA="={{ JSON.stringify({ filter: { and: [ "+BASE+", { property: 'Content Status', select: { equals: 'Approved' } } ] }, page_size: 100 }) }}"
http_notion('Query Drafts','POST',URL,QD,448,240)
http_notion('Query Approved','POST',URL,QA,448,432)
add('Queues','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},672,336,notes='Input 0 = Draft, 1 = Approved (re-check for stale / ineligible jobs).')
code('Flatten','flatten6.js',896,336,'Rebuilds the CURRENT fact sheet + fact hash (same logic as WF05) and re-checks the job gate. Parity with WF05 is tested.')
code('Fact QC','det6.js',1120,336,'Deterministic. Hash mismatch = STALE. Wrong amounts / company / position / location / job number / URL / JLPT / license / housing / experience = REJECT. AI never overrides this.')
ife('Needs AI?','$json.needs_ai','true',1344,336)
code('Prepare AI','prep_ai6.js',1568,272)
http_ai('AI QC','ai_req',1792,272)
code('Parse AI','parse_ai6.js',2016,272,'AI issues count only with a verbatim quote from the stored copy. AI judges only, never rewrites.')
add('QC Inputs','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},2240,336,notes='Inputs: 0 = no AI needed, 1 = AI result.')
code('Decide','decide6.js',2464,336,'One decision: APPROVED / REVISION_REQUIRED / REJECTED / MANUAL_REVIEW (+ stale reset, attempts max 3, stale-loop guard). Writes only Content QC fields + Content Status.')
ife('Needs Write?','$json.needs_write','true',2688,336)
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',2912,272)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,3136,272)
code('Verify Write','verify6.js',3360,272,'CJK corruption / silent failure check on every written property.')
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},3584,336,notes='Inputs: 0 = no write (still valid / awaiting regen / deferred / meta), 1 = written rows.')
code('Shape QC Rows','shape6.js',3808,272)
dt_ins('Insert QC Log','mtg_content_qc_log',[(c,'string') for c in ['run_id','ts','job_number','job_id','page_id','content_hash','fact_hash','deterministic_result','ai_result','qc_decision','risk_flags','qc_attempt','manual_review','risk_level','outcome','reason','write_status']],4032,272)
code('Shape Error Rows','errors6.js',3808,464)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],4032,464)
code('Run Log','runlog6.js',3808,656)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','summary_json']]+[(c,'number') for c in ['seen','awaiting_regen','deferred','still_valid','approved','revision_required','rejected','stale','manual_review','written_ok','write_errors','verify_failed','ai_errors']]
dt_ins('Insert Run Log','mtg_content_qc_run_log',rl,4032,656)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 13:00 and 01:00 JST'
for a,b in [(S,'Config'),('Config','Query Drafts'),('Config','Query Approved'),('Queues','Flatten'),('Flatten','Fact QC'),('Fact QC','Needs AI?'),('Prepare AI','AI QC'),('AI QC','Parse AI'),('QC Inputs','Decide'),('Decide','Needs Write?'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('All Outcomes','Shape QC Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape QC Rows','Insert QC Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]: link(a,b)
link('Query Drafts','Queues',0,0); link('Query Approved','Queues',0,1)
link('Needs AI?','Prepare AI',0); link('Needs AI?','QC Inputs',1,0)
link('Parse AI','QC Inputs',0,1)
link('Needs Write?','Notion PATCH',0); link('Needs Write?','All Outcomes',1,0)
link('Verify Write','All Outcomes',0,1)
OUT=os.path.join(HERE,'MTG_WF06_Content_QC_Approval_V1.0.json')
wf={'name':'MTG #06 - Content QC and Approval V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
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
