import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg07'+n).encode()).hexdigest()))
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




def http_render(name,x,y):
    add(name,'n8n-nodes-base.httpRequest',4.3,{'method':'POST','url':'={{ $("Config").first().json.render_url }}','authentication':'genericCredentialType','genericAuthType':'httpBasicAuth','sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':'={{ JSON.stringify($json.render_req) }}','options':{'timeout':60000,'batching':{'batch':{'batchSize':2,'batchInterval':1500}}}},x,y,{'retryOnFail':True,'maxTries':2,'waitBetweenTries':4000,'onError':'continueRegularOutput'},creds={'httpBasicAuth':{'id':'','name':'HTML-to-Image Render API (Basic Auth)'}},notes='Provider contract: POST {html, css, viewport_width, viewport_height, device_scale, ms_delay} -> JSON {url}. Written for htmlcsstoimage-style APIs; any renderer with the same contract works (set render_url). Not verified live.')

BANNED='jaminan|dijamin|garansi|pasti|100%|gratis|tanpa biaya|gaji besar|gaji tinggi|gaji fantastis|cepat berangkat'
REG='P3MI|berizin|izin resmi|penempatan resmi|resmi MTGI|terdaftar resmi|agen resmi|penyalur resmi|lembaga resmi|SIP2MI|BP2MI|KP2MI'
CLAIM='terbaik|tertinggi|terbesar|nomor 1|no\\.? ?1|#1|paling'
cfg=[('run_id','={{ "IM-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_date','={{ $now.setZone("Asia/Tokyo").toFormat("yyyy-MM-dd") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Image Poster Engine V1.0','string'),('max_per_run',10,'number'),('max_attempts',3,'number'),('use_ai','true','string'),('require_vision_pass','true','string'),('ai_model_vision','gpt-4o-mini','string'),('template_version','v1','string'),('image_template_version','v1','string'),('poster_size','1080x1350','string'),('render_url','https://hcti.io/v1/image','string'),('cta_text','Info lengkap ada di caption','string'),('contact_line','','string'),('poster_disclaimer','Info bersumber dari lowongan publik; bisa berubah.','string'),('banned_phrases',BANNED,'string'),('regulatory_phrases',REG,'string'),('claim_phrases',CLAIM,'string'),('notion_job_ds_id','a5cfe2a2-de3f-426c-8449-77f0de1c24c9','string')]
add('Schedule 14:00 and 02:00 JST','n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 14,2 * * *'}]}},0,336,notes='1h after WF06 (13:00/01:00 JST). Keep OFF until WF01-06 live tests pass. WF07 never publishes.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,336,notes='template_version = CONTENT/fact-hash version and MUST equal WF05/WF06 Config. image_template_version is WF07 own. contact_line stays empty unless a human sets a real contact; WF07 never invents one. require_vision_pass=false allows READY on the code-built spec alone (test only).')
URL='={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.notion_job_ds_id + "/query" }}'
BASE="{ property: 'Ingestion Source', select: { equals: 'N8N' } }"
QG="={{ JSON.stringify({ filter: { and: [ "+BASE+", { property: 'Content Status', select: { equals: 'Approved' } }, { or: [ { property: 'Image Status', select: { is_empty: true } }, { property: 'Image Status', select: { equals: 'Not Started' } }, { property: 'Image Status', select: { equals: 'REGENERATE' } }, { property: 'Image Status', select: { equals: 'STALE' } }, { property: 'Image Status', select: { equals: 'FAILED' } } ] } ] }, page_size: 50 }) }}"
QR="={{ JSON.stringify({ filter: { and: [ "+BASE+", { property: 'Image Status', select: { equals: 'READY' } } ] }, page_size: 100 }) }}"
http_notion('Query Generate','POST',URL,QG,448,240)
http_notion('Query Ready','POST',URL,QR,448,432)
add('Queues','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},672,336,notes='Input 0 = Approved content needing an image, 1 = READY images re-checked for staleness.')
code('Flatten','flatten7.js',896,336,'Rebuilds current fact hash (same logic as WF05/06), re-checks job + content gates, builds the VISUAL fact sheet and Image Build Hash. READY image whose hash no longer matches -> STALE_MARK. Legacy Image Status values (Prompt Ready / Generated / Approved) are never touched.')
code('Build Poster','poster7.js',1120,336,'Deterministic HTML poster per tier template (S/A/B/C change hierarchy only). Text-fit is computed; spec self-check blocks wrong amounts / numbers / contacts / claims BEFORE rendering.')
ife('Needs Render?','$json.needs_render','true',1344,336)
http_render('Render Poster',1568,272)
code('Parse Render','parse_render7.js',1792,272,'Requires an https image URL; anything else = FAILED render.')
ife('Needs Vision?','$json.needs_vision','true',2016,272)
code('Prepare Vision','prep_vision7.js',2240,208,'Vision model = OCR transcriber + layout inspector only. It never decides which facts are right.')
http_ai('AI Vision','ai_req',2464,208)
code('Parse Vision','parse_vision7.js',2688,208)
add('Decision Inputs','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':3},2912,336,notes='Inputs: 0 = no render (skip / stale / spec fail / not eligible), 1 = render failed, 2 = vision result.')
code('Decide','decide7.js',3136,336,'READY only if spec + render + transcript comparison pass. REGENERATE (next layout variant) / FAILED / MANUAL_REVIEW / STALE. Max 3 attempts. Writes only Image fields.')
ife('Needs Write?','$json.needs_write','true',3360,336)
http_notion('Notion PATCH','PATCH','={{ "https://api.notion.com/v1/pages/" + $json.page_id }}','={{ JSON.stringify($json.notion_patch_body) }}',3584,272)
http_notion('Read-back Page','GET','={{ $json.id ? "https://api.notion.com/v1/pages/" + $json.id : "https://api.notion.com/v1/users/me" }}',None,3808,272)
code('Verify Write','verify7.js',4032,272,'CJK / URL / hash / number read-back check on every written Image field.')
add('All Outcomes','n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':2},4256,336,notes='Inputs: 0 = no write, 1 = written rows.')
code('Shape Image Rows','shape7.js',4480,272)
dt_ins('Insert Image Log','mtg_image_generation_log',[(c,'string') for c in ['run_id','ts','job_number','job_id','page_id','content_hash','fact_hash','visual_hash','image_build_hash','template_version','generation_method','image_status','qc_result','qc_flags','attempt','image_url','outcome','reason','write_status']],4704,272)
code('Shape Error Rows','errors7.js',4480,464)
dt_ins('Insert Error Log','mtg_job_scout_error_log',[(c,'string') for c in ['run_id','ts','source','stage','error_type','error_message','retry_status','job_key']],4704,464)
code('Run Log','runlog7.js',4480,656)
rl=[(c,'string') for c in ['run_id','started_at','finished_at','queue_status','summary_json']]+[(c,'number') for c in ['seen','not_eligible','skipped_unchanged','deferred','rendered','ready','regenerate','manual_review','failed','stale','written_ok','write_errors','verify_failed','render_errors','ai_errors']]
dt_ins('Insert Run Log','mtg_image_generation_run_log',rl,4704,656)
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]})
    m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
S='Schedule 14:00 and 02:00 JST'
for a,b in [(S,'Config'),('Config','Query Generate'),('Config','Query Ready'),('Queues','Flatten'),('Flatten','Build Poster'),('Build Poster','Needs Render?'),('Render Poster','Parse Render'),('Parse Render','Needs Vision?'),('Prepare Vision','AI Vision'),('AI Vision','Parse Vision'),('Decision Inputs','Decide'),('Decide','Needs Write?'),('Notion PATCH','Read-back Page'),('Read-back Page','Verify Write'),('All Outcomes','Shape Image Rows'),('All Outcomes','Shape Error Rows'),('All Outcomes','Run Log'),('Shape Image Rows','Insert Image Log'),('Shape Error Rows','Insert Error Log'),('Run Log','Insert Run Log')]: link(a,b)
link('Query Generate','Queues',0,0); link('Query Ready','Queues',0,1)
link('Needs Render?','Render Poster',0); link('Needs Render?','Decision Inputs',1,0)
link('Needs Vision?','Prepare Vision',0); link('Needs Vision?','Decision Inputs',1,1)
link('Parse Vision','Decision Inputs',0,2)
link('Needs Write?','Notion PATCH',0); link('Needs Write?','All Outcomes',1,0)
link('Verify Write','All Outcomes',0,1)
OUT=os.path.join(HERE,'MTG_WF07_Image_Poster_Engine_V1.0.json')
wf={'name':'MTG #07 - Image Poster Engine V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
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
