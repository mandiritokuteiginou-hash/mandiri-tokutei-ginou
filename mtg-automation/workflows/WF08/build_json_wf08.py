import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg08'+n).encode()).hexdigest()))
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
cfg=[('run_id','={{ "DS-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Distribution Engine V1.0','string'),
('publish_mode','DRY_RUN','string'),('platforms_enabled','instagram,tiktok,whatsapp','string'),('ig_account_id','','string'),('tiktok_account_id','','string'),('whatsapp_channel_id','','string'),('whatsapp_endpoint','','string'),
('blotato_post_url','https://backend.blotato.com/v2/posts','string'),('blotato_status_url','https://backend.blotato.com/v2/posts/','string'),('tiktok_privacy','SELF_ONLY','string'),
('max_attempts',3,'number'),('max_posts_per_run',6,'number'),('retry_after_hours',6,'number'),('verify_wait_seconds',25,'number'),
('template_version','v1','string'),('image_template_version','v1','string'),('poster_size','1080x1350','string'),('cta_text','Info lengkap ada di caption','string'),('contact_line','','string'),('poster_disclaimer','Info bersumber dari lowongan publik; bisa berubah.','string'),
('disclaimer','Informasi bersumber dari lowongan publik dan bisa berubah. Pastikan detail dan syarat resmi sebelum melamar.','string'),('brand_footer','','string'),
('banned_phrases',BANNED,'string'),('regulatory_phrases',REG,'string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string')]
S='Schedule 15:00 and 03:00 JST'
add(S,'n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 15,3 * * *'}]}},0,400,notes='1h after WF07 (14:00/02:00 JST). Keep OFF. publish_mode defaults to DRY_RUN: nothing is sent until Config.publish_mode = LIVE (this is NOT a gate bypass; every gate still applies).')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,400,notes='template_version / disclaimer / brand_footer MUST equal WF05-WF07. A platform is active only if enabled in platforms_enabled AND its account/endpoint is filled. There is NO skip_legal_gate or similar flag by design: only per-record Legal Review Status = APPROVED (bound to the current Image Build Hash) opens the gate.')
URL='={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}'
Q="={{ JSON.stringify({ filter: { and: [ { property: 'Ingestion Source', select: { equals: 'N8N' } }, { property: 'Content Status', select: { equals: 'Approved' } }, { property: 'Image Status', select: { equals: 'READY' } } ] }, page_size: 100 }) }}"
http_notion('Query Candidates','POST',URL,Q,448,400)
dt_get('Load Queue State','mtg_distribution_queue',672,400,'Idempotency ledger #1 (Distribution Hash rows). Empty table is normal on first run.')
code('Plan Distribution','plan8.js',896,400,'Final Publish Gate (all gates + hash-bound Legal approval), freshness check, per-platform idempotency/retry planning, post cap. WF07 READY alone never permits publishing.')
sw('Route','$json.action',['PUBLISH','ROW_UPDATE'],1120,400,True,'0 = send, 1 = queue row change only (stale / manual / exhausted), other = skipped/held/dry-run/meta (log only).')
code('Format Payload','format8.js',1344,208,'Platform formatter. Sends the approved caption verbatim; last-line content checks (empty/too long/banned/regulatory) -> MANUAL_REVIEW, never retried.')
ife('Payload OK?','$json.payload_ok','true',1568,208)
dt_upsert('Lock Row',1792,144,'Writes status PUBLISHING BEFORE sending (at-most-once). Upsert keyed on distribution_hash.')
code('Confirm Lock','confirm_lock8.js',2016,144,'If the lock row was not stored, nothing is published.')
ife('Lock OK?','$json.lock_ok','true',2240,144)
sw('Platform Router','$json.platform',['instagram','tiktok','whatsapp'],2464,80,False,'Core never contains platform logic; each adapter owns its endpoint/body.')
adapter('Instagram Adapter','={{ $json.request_url }}','Blotato API Key (header)',2688,-48,'Blotato REST (shape inferred from the Blotato tool schema, UNVERIFIED). No retryOnFail: retries only through the attempt counter across runs, to avoid duplicate posts.')
adapter('TikTok Adapter','={{ $json.request_url }}','Blotato API Key (header)',2688,80,'Defaults to privacyLevel SELF_ONLY (private) until you change tiktok_privacy.')
adapter('WhatsApp Adapter','={{ $json.request_url }}','WhatsApp bridge API key',2688,208,'Generic webhook bridge (contract UNVERIFIED); sends idempotency_key = Distribution Hash.')
merge('Adapter Results',3,2912,80,'Inputs 0/1/2 = Instagram / TikTok / WhatsApp.')
code('Parse Result','parse_result8.js',3136,80,'401/429 retry; 408/5xx retry flagged AMBIGUOUS_RETRY (possible duplicate); 400/403/422 -> MANUAL_REVIEW, never retried. Blotato 2xx = ACCEPTED only, needs verify.')
ife('Needs Verify?','$json.needs_verify','true',3360,80)
add('Wait Before Verify','n8n-nodes-base.wait',1.1,{'resume':'timeInterval','amount':25,'unit':'seconds'},3584,16,notes='Blotato acceptance is not publication.')
add('Verify Delivery','n8n-nodes-base.httpRequest',4.3,{'method':'GET','url':'={{ $json.verify_url }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','options':{'timeout':30000,'response':{'response':{'fullResponse':True,'neverError':True,'responseFormat':'json'}}}},3808,16,{'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':'Blotato API Key (header)'}})
code('Parse Verify','parse_verify8.js',4032,16,'published -> PUBLISHED; failed -> MANUAL_REVIEW; unresolved -> VERIFY_PENDING (row stays PUBLISHING; next run -> MANUAL_REVIEW, never re-posts).')
merge('Settled',2,4256,80,'0 = no verify needed (webhook), 1 = verified result.')
dt_upsert('Update Queue Row',4480,208,'Final status of the row.')
merge('All Outcomes',2,4704,400,'0 = no queue write needed, 1 = after queue write.')
code('Shape Distribution Rows','shape8.js',4928,336)
dt_ins('Insert Distribution Log','mtg_distribution_log',[(c,'number' if c=='attempt' else 'string') for c in ['run_id','ts','job_number','job_id','page_id','platform','distribution_hash','content_hash','image_build_hash','status','outcome','attempt','external_post_id','published_at','error_code','error_message','publish_mode','reason']],5152,336)
code('Summarize Jobs','summarize8.js',4928,528,'ONE Notion write per job; writes ONLY Distribution Status / Published Platforms / Distribution Ledger / Distribution Notes / Last Published. Nothing in DRY_RUN or when unchanged.')
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',5152,528)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,5376,528)
code('Verify Write','verify8.js',5600,528)
code('Shape Notion Errors','notion_errors8.js',5824,528)
code('Shape Error Rows','errors8.js',4928,720)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],6048,624)
code('Run Log','runlog8.js',4928,912)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','publish_mode','summary_json']]+[(c,'number') for c in ['seen','not_eligible','stale','legal_hold','skipped_published','dry_run','published','failed','manual_review','deferred','waiting_retry']]
dt_ins('Insert Run Log','mtg_distribution_run_log',rl,5152,912)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
for a,b in [(S,'Config'),('Config','Query Candidates'),('Query Candidates','Load Queue State'),('Load Queue State','Plan Distribution'),('Plan Distribution','Route'),
 ('Format Payload','Payload OK?'),('Lock Row','Confirm Lock'),('Confirm Lock','Lock OK?'),('Lock OK?','Platform Router'),('Payload OK?','Lock Row'),
 ('Adapter Results','Parse Result'),('Parse Result','Needs Verify?'),('Needs Verify?','Wait Before Verify'),('Wait Before Verify','Verify Delivery'),('Verify Delivery','Parse Verify'),
 ('All Outcomes','Shape Distribution Rows'),('Shape Distribution Rows','Insert Distribution Log'),('All Outcomes','Shape Error Rows'),('Shape Error Rows','Insert Error Log'),('All Outcomes','Run Log'),('Run Log','Insert Run Log'),
 ('All Outcomes','Summarize Jobs'),('Summarize Jobs','Notion PATCH'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('Verify Write','Shape Notion Errors'),('Shape Notion Errors','Insert Error Log'),
 ('Route','Format Payload'),('Route','Update Queue Row'),('Route','All Outcomes')]:
    pass
link(S,'Config'); link('Config','Query Candidates'); link('Query Candidates','Load Queue State'); link('Load Queue State','Plan Distribution'); link('Plan Distribution','Route')
link('Route','Format Payload',0); link('Route','Update Queue Row',1); link('Route','All Outcomes',1,0); link('Route','All Outcomes',2,0)
link('Format Payload','Payload OK?'); link('Payload OK?','Lock Row',0); link('Payload OK?','Update Queue Row',1); link('Payload OK?','All Outcomes',1,0)
link('Lock Row','Confirm Lock'); link('Confirm Lock','Lock OK?'); link('Lock OK?','Platform Router',0); link('Lock OK?','All Outcomes',1,0)
link('Platform Router','Instagram Adapter',0); link('Platform Router','TikTok Adapter',1); link('Platform Router','WhatsApp Adapter',2)
link('Instagram Adapter','Adapter Results',0,0); link('TikTok Adapter','Adapter Results',0,1); link('WhatsApp Adapter','Adapter Results',0,2)
link('Adapter Results','Parse Result'); link('Parse Result','Needs Verify?'); link('Needs Verify?','Wait Before Verify',0); link('Needs Verify?','Settled',1,0)
link('Wait Before Verify','Verify Delivery'); link('Verify Delivery','Parse Verify'); link('Parse Verify','Settled',0,1)
link('Settled','Update Queue Row'); link('Settled','All Outcomes',0,1)
link('All Outcomes','Shape Distribution Rows'); link('Shape Distribution Rows','Insert Distribution Log')
link('All Outcomes','Shape Error Rows'); link('Shape Error Rows','Insert Error Log')
link('All Outcomes','Run Log'); link('Run Log','Insert Run Log')
link('All Outcomes','Summarize Jobs'); link('Summarize Jobs','Notion PATCH'); link('Notion PATCH','Read-back Page'); link('Read-back Page','Verify Write'); link('Verify Write','Shape Notion Errors'); link('Shape Notion Errors','Insert Error Log')
OUT=os.path.join(HERE,'MTG_WF08_Distribution_Engine_V1.0.json')
wf={'name':'MTG #08 - Distribution Engine V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
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
import re
cfgkeys={n for n,_,_ in cfg}
for n in nodes:
    if n['type']=='n8n-nodes-base.code':
        for k in re.findall(r"cfg\.([a-z_0-9]+)",n['parameters']['jsCode']):
            if k not in cfgkeys: print('MISSING CFG',n['name'],k)
