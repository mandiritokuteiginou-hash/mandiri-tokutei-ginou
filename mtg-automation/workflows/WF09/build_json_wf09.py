import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg09'+n).encode()).hexdigest()))
nodes=[];pos={}
def add(name,type_,ver,params,x,y,extra=None,creds=None,notes=None):
    n={'parameters':params,'id':uid(name),'name':name,'type':type_,'typeVersion':ver,'position':[x,y]}
    if extra: n.update(extra)
    if creds: n['credentials']=creds
    if notes: n['notes']=notes; n['notesInFlow']=False
    nodes.append(n); return n
def code(name,fn,x,y,notes=None):
    add(name,'n8n-nodes-base.code',2,{'mode':'runOnceForAllItems','language':'javaScript','jsCode':open(J+fn,encoding='utf-8').read().replace('//@LIB',open(J+'lib9.js',encoding='utf-8').read())},x,y,notes=notes)
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





def sw(name,field,rules,x,y,fallback=True,notes=None):
    vals=[{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict','version':2},'conditions':[{'id':uid(name+r),'leftValue':'={{ String(%s) }}'%field,'operator':{'type':'string','operation':'equals'},'rightValue':r}],'combinator':'and'},'renameOutput':True,'outputKey':r} for r in rules]
    opts={'fallbackOutput':'extra','renameFallbackOutput':'other'} if fallback else {}
    add(name,'n8n-nodes-base.switch',3.2,{'rules':{'values':vals},'options':opts},x,y,notes=notes)
def merge(name,n,x,y,notes=None):
    add(name,'n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':n},x,y,notes=notes)
def dt_get(name,table,x,y,notes=None):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'get','dataTableId':{'__rl':True,'mode':'name','value':table},'returnAll':True},x,y,{'alwaysOutputData':True,'onError':'continueRegularOutput'},notes=notes)
QCOLS=['distribution_hash','job_id','page_id','platform','content_hash','image_build_hash','status','attempt','external_post_id','published_at','error_code','error_message','updated_at']
def dt_upsert(name,x,y,notes=None):
    val={c:'={{ $json.row.%s }}'%c for c in QCOLS}
    sch=[{'id':c,'displayName':c,'required':False,'defaultMatch':False,'display':True,'type':'number' if c=='attempt' else 'string','canBeUsedToMatch':c=='distribution_hash'} for c in QCOLS]
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'upsert','dataTableId':{'__rl':True,'mode':'name','value':'mtg_distribution_queue'},'matchType':'allConditions','filters':{'conditions':[{'keyName':'distribution_hash','condition':'eq','keyValue':'={{ $json.row.distribution_hash }}'}]},'columns':{'mappingMode':'defineBelow','value':val,'schema':sch}},x,y,{'onError':'continueRegularOutput'},notes=notes)
def adapter(name,url,cred,x,y,notes=None):
    add(name,'n8n-nodes-base.httpRequest',4.3,{'method':'POST','url':url,'authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':'={{ JSON.stringify($json.request_body) }}','options':{'timeout':60000,'response':{'response':{'fullResponse':True,'neverError':True,'responseFormat':'json'}},'batching':{'batch':{'batchSize':1,'batchInterval':1500}}}},x,y,{'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':cred}},notes=notes)


BANNED='jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat'
REG='P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI'
cfg=[('run_id','={{ "LD-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Applicant Lead Management V1.0','string'),
('leads_ds_id','05a640fc-dff7-4975-9b85-e818008c642e','string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string'),
('hash_salt','CHANGE_ME','string'),('whatsapp_inbox_url','','string'),('inbox_since_hours',48,'number'),('use_ai','true','string'),('ai_model_intent','gpt-4o-mini','string'),
('max_writes_per_run',40,'number'),('dormant_after_days',21,'number'),('purge_no_consent_days',14,'number'),('withdrawn_purge_days',3,'number'),('purge_not_eligible_days',90,'number'),('purge_dormant_days',180,'number'),('handoff_review_days',365,'number'),('consent_window_days',7,'number'),
('consent_version','v1','string'),('require_ssw_baseline','false','string'),('brand_name','Mandiri Tokutei Ginou Indonesia (MTGI)','string'),
('docs_list','paspor (jika ada), sertifikat bahasa/keterampilan, CV','string'),('legal_disclosure_line','Informasi ini masih tahap awal dan bukan jaminan penempatan kerja.','string'),
('banned_phrases',BANNED,'string'),('regulatory_phrases',REG,'string')]
S='Schedule 16:00 and 04:00 JST'
def dt_get(name,table,x,y,notes=None):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'get','dataTableId':{'__rl':True,'mode':'name','value':table},'returnAll':True},x,y,{'alwaysOutputData':True,'onError':'continueRegularOutput'},notes=notes)
def merge(name,n,x,y,notes=None):
    add(name,'n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':n},x,y,notes=notes)
add(S,'n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 16,4 * * *'}]}},0,400,notes='1h after WF08 (15:00/03:00 JST). Keep OFF until live test. WF09 has NO outbound-messaging node: replies are drafts only.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,400,notes='hash_salt MUST be changed from CHANGE_ME (plan refuses to run otherwise) and kept secret + stable (changing it breaks Lead Keys / dedup). whatsapp_inbox_url empty = manual Notion intake only. legal_disclosure_line: set with legal advice. Execution data retention for this workflow: see spec section 14.')
http_notion('Query Leads','POST','={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.leads_ds_id + "/query" }}',"={{ JSON.stringify({ sorts: [ { timestamp: 'last_edited_time', direction: 'descending' } ], page_size: 100 }) }}",448,400)
ife('Inbox Configured?','$("Config").first().json.whatsapp_inbox_url !== ""','true',672,400)
add('Fetch Inbox','n8n-nodes-base.httpRequest',4.3,{'method':'GET','url':'={{ $("Config").first().json.whatsapp_inbox_url }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendQuery':True,'queryParameters':{'parameters':[{'name':'since_hours','value':'={{ $("Config").first().json.inbox_since_hours }}'}]},'options':{'timeout':30000}},896,336,{'retryOnFail':True,'maxTries':2,'waitBetweenTries':3000,'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':'WhatsApp bridge API key'}},notes='Pull contract UNVERIFIED: {messages:[{message_id, from, text, timestamp, job_ref?}]}.')
merge('Inbox',2,1120,400,'0 = fetched, 1 = inbox not configured (manual intake only).')
code('Normalize Inbox','normalize9.js',1344,400,'Phones -> E.164, hashed message ids, deterministic scan (withdraw > legal > consent) BEFORE AI. Raw text exists only in memory.')
dt_get('Load Dedup','mtg_lead_message_dedup',1568,400,'Committed message hashes. Hashes are committed only after a verified Notion write.')
code('Dedup Messages','dedup9.js',1792,400)
ife('Needs AI?','$json.needs_ai','true',2016,400)
code('Prepare AI','prep_ai9.js',2240,336,'Only masked message text goes to the model (no phone, no name). Intent classification only.')
http_ai('AI Intent','ai_req',2464,336)
code('Parse Intent','parse_ai9.js',2688,336,'AI can only pick a benign intent or escalate (sensitive=true). Never decides facts, consent, eligibility or status.')
merge('Intents',2,2912,400,'0 = AI-classified, 1 = deterministic / meta.')
code('Prepare Job Lookups','prep_jobs9.js',3136,400,'One READ query per distinct Job ID. The Master Job DB is never written.')
ife('Any Job Lookups?','$json.dummy','false',3360,400)
http_notion('Job Lookup','POST','={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}','={{ JSON.stringify($json.lookup_body) }}',3584,336)
merge('Job Data',2,3808,400)
code('Plan Leads','plan9.js',4032,400,'The whole deterministic state machine (matrix in spec section 3), eligibility rules, consent, retention, template drafts, message resolution, write allow-list. No AI decision, no send.')
ife('Needs Write?','["CREATE","PATCH"].includes($json.action)','true',4256,400)
code('Prepare Write','prep_write9.js',4480,336,'Builds CREATE/PATCH for the Leads DB only; re-checks the allow-list and that the page came from the Leads DB.')
add('Write Lead','n8n-nodes-base.httpRequest',4.3,{'method':'={{ $json.write_method }}','url':'={{ $json.write_url }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'Notion-Version','value':'2025-09-03'}]},'sendBody':'={{ $json.write_method !== "GET" }}','contentType':'json','specifyBody':'json','jsonBody':'={{ JSON.stringify($json.write_body) }}','options':{'timeout':30000,'batching':{'batch':{'batchSize':1,'batchInterval':400}}}},4704,336,{'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':'Notion Bearer (Header Auth)'}},notes='No auto-retry (a retried CREATE could duplicate a page). A failed write is simply re-planned next run; message hashes are not committed.')
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,4928,336)
code('Verify Write','verify9.js',5152,336,'Read-back compare of every field sent (CJK-safe). commit_ok gates the dedup commit.')
merge('All Outcomes',2,5376,400,'0 = no write needed / deferred / meta, 1 = verified writes.')
code('Shape Lead Rows','shape9.js',5600,272,'Whitelisted columns only: no phone, no name, no message text, no fact values.')
dt_ins('Insert Lead Log','mtg_lead_log',[(c,'string') for c in ['run_id','ts','lead_id','lead_key','job_id','event','from_status','to_status','reason','consent_status','intent','eligibility','draft_kind','outcome']],5824,272)
code('Commit Dedup','commit9.js',5600,464)
dt_ins('Insert Dedup','mtg_lead_message_dedup',[(c,'string') for c in ['msg_hash','lead_key','first_seen']],5824,464)
code('Shape Error Rows','errors9.js',5600,656,'Messages sanitised (digit runs, emails masked).')
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],5824,656)
code('Run Log','runlog9.js',5600,848)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','inbox_status','summary_json']]+[(c,'number') for c in ['messages_seen','messages_new','leads_loaded','created','transitions','drafts','manual_review','withdrawn','purged','written_ok','write_errors']]
dt_ins('Insert Run Log','mtg_lead_run_log',rl,5824,848)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
link(S,'Config');link('Config','Query Leads');link('Query Leads','Inbox Configured?')
link('Inbox Configured?','Fetch Inbox',0);link('Inbox Configured?','Inbox',1,1);link('Fetch Inbox','Inbox',0,0)
link('Inbox','Normalize Inbox');link('Normalize Inbox','Load Dedup');link('Load Dedup','Dedup Messages');link('Dedup Messages','Needs AI?')
link('Needs AI?','Prepare AI',0);link('Needs AI?','Intents',1,1);link('Prepare AI','AI Intent');link('AI Intent','Parse Intent');link('Parse Intent','Intents',0,0)
link('Intents','Prepare Job Lookups');link('Prepare Job Lookups','Any Job Lookups?')
link('Any Job Lookups?','Job Lookup',0);link('Any Job Lookups?','Job Data',1,1);link('Job Lookup','Job Data',0,0)
link('Job Data','Plan Leads');link('Plan Leads','Needs Write?')
link('Needs Write?','Prepare Write',0);link('Needs Write?','All Outcomes',1,0)
link('Prepare Write','Write Lead');link('Write Lead','Read-back Page');link('Read-back Page','Verify Write');link('Verify Write','All Outcomes',0,1)
for t in ['Shape Lead Rows','Commit Dedup','Shape Error Rows','Run Log']: link('All Outcomes',t)
link('Shape Lead Rows','Insert Lead Log');link('Commit Dedup','Insert Dedup');link('Shape Error Rows','Insert Error Log');link('Run Log','Insert Run Log')
OUT=os.path.join(HERE,'MTG_WF09_Applicant_Lead_Management_V1.0.json')
wf={'name':'MTG #09 - Applicant Lead Management V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
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
import re,subprocess
cfgkeys={n for n,_,_ in cfg}
for n in nodes:
    if n['type']=='n8n-nodes-base.code':
        js=n['parameters']['jsCode']
        for k in set(re.findall(r"cfg\.([a-z_0-9]+)",js)):
            if k not in cfgkeys: print('MISSING CFG',n['name'],k)
        import tempfile
        with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _t: _t.write('(async()=>{'+js+'\n})')
        r=subprocess.run(['node','--check',_t.name],capture_output=True,text=True); os.unlink(_t.name)
        if r.returncode: print('SYNTAX',n['name'],r.stderr[:200])
        for ref in re.findall(r"\$\('([^']+)'\)",js):
            if ref not in names: print('BAD NODE REF',n['name'],ref)
        pass
