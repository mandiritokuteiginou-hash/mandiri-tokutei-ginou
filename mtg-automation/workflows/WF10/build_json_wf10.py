import json,uuid,hashlib
import os
HERE=os.path.dirname(os.path.abspath(__file__))
J=os.path.join(HERE,'src')+os.sep
def uid(n): return str(uuid.UUID(hashlib.md5(('mtg10'+n).encode()).hexdigest()))
nodes=[]
def add(name,type_,ver,params,x,y,extra=None,creds=None,notes=None):
    n={'parameters':params,'id':uid(name),'name':name,'type':type_,'typeVersion':ver,'position':[x,y]}
    if extra: n.update(extra)
    if creds: n['credentials']=creds
    if notes: n['notes']=notes; n['notesInFlow']=False
    nodes.append(n); return n
def code(name,fn,x,y,notes=None):
    add(name,'n8n-nodes-base.code',2,{'mode':'runOnceForAllItems','language':'javaScript','jsCode':open(J+fn,encoding='utf-8').read()},x,y,notes=notes)
def ife(name,field,val,x,y,notes=None):
    add(name,'n8n-nodes-base.if',2.2,{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict','version':2},'conditions':[{'id':uid(name+'c'),'leftValue':'={{ String(%s) }}'%field,'operator':{'type':'string','operation':'equals'},'rightValue':val}],'combinator':'and'}},x,y,notes=notes)
def sw(name,field,rules,x,y,notes=None):
    vals=[{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict','version':2},'conditions':[{'id':uid(name+r),'leftValue':'={{ String(%s) }}'%field,'operator':{'type':'string','operation':'equals'},'rightValue':r}],'combinator':'and'},'renameOutput':True,'outputKey':r} for r in rules]
    add(name,'n8n-nodes-base.switch',3.2,{'rules':{'values':vals},'options':{}},x,y,notes=notes)
def merge(name,n,x,y,notes=None):
    add(name,'n8n-nodes-base.merge',3.2,{'mode':'append','numberInputs':n},x,y,notes=notes)
def dt_get(name,table,x,y,notes=None,limit=None,col=None):
    p={'resource':'row','operation':'get','dataTableId':{'__rl':True,'mode':'name','value':table}}
    if limit: p.update({'returnAll':False,'limit':limit,'orderBy':True,'orderByColumn':col,'orderByDirection':'DESC'})
    else: p['returnAll']=True
    add(name,'n8n-nodes-base.dataTable',1.1,p,x,y,{'alwaysOutputData':True,'executeOnce':True,'onError':'continueRegularOutput'},notes=notes)
def sch(cols,key=None): return [{'id':c,'displayName':c,'required':False,'defaultMatch':False,'display':True,'type':t,'canBeUsedToMatch':c==key} for c,t in cols]
def dt_row_write(name,table,cols,x,y,op,key=None,notes=None):
    p={'resource':'row','operation':op,'dataTableId':{'__rl':True,'mode':'name','value':table},'columns':{'mappingMode':'defineBelow','value':{c:'={{ $json.row.%s }}'%c for c,_ in cols},'schema':sch(cols,key)}}
    if op=='upsert': p.update({'matchType':'allConditions','filters':{'conditions':[{'keyName':key,'condition':'eq','keyValue':'={{ $json.row.%s }}'%key}]}})
    add(name,'n8n-nodes-base.dataTable',1.1,p,x,y,{'onError':'continueRegularOutput'},notes=notes)
def dt_delete(name,table,key,x,y,notes=None):
    add(name,'n8n-nodes-base.dataTable',1.1,{'resource':'row','operation':'deleteRows','dataTableId':{'__rl':True,'mode':'name','value':table},'matchType':'allConditions','filters':{'conditions':[{'keyName':key,'condition':'eq','keyValue':'={{ $json.%s }}'%key}]}},x,y,{'onError':'continueRegularOutput'},notes=notes)
QCOLS=[(c,'number' if c=='attempt' else 'string') for c in ['distribution_hash','job_id','page_id','platform','content_hash','image_build_hash','status','attempt','external_post_id','published_at','error_code','error_message','updated_at']]
SCOLS=[(c,'number' if c=='times_alerted' else 'string') for c in ['state_key','code','severity','subject','status','first_seen','last_seen','last_alerted','times_alerted','detail']]
LCOLS=[(c,'string') for c in ['run_id','ts','event','code','severity','subject','detail','outcome']]
RCOLS=[(c,'number' if c in ('findings_high','findings_warn','findings_info','new_findings','resolved','recoveries','prune_candidates','pruned','queue_rows','leads_scanned') else 'string') for c in ['run_id','started_at','finished_at','health','findings_high','findings_warn','findings_info','new_findings','resolved','recoveries','prune_candidates','pruned','alert_status','queue_rows','leads_scanned','exec_status','summary_json']]
cfg=[('run_id','={{ "MN-" + $now.setZone("Asia/Tokyo").toFormat("yyyyLLdd-HHmm") }}','string'),('run_started','={{ $now.toISO() }}','string'),('workflow_name','Monitoring & Recovery V1.0','string'),
('leads_ds_id','05a640fc-dff7-4975-9b85-e818008c642e','string'),
('expect_runs','false','string'),('stale_run_hours',26,'number'),('publishing_stuck_minutes',90,'number'),('failed_stale_hours',12,'number'),('manual_review_row_hours',24,'number'),
('auto_recover','true','string'),('recovery_max_per_run',10,'number'),
('prune_mode','DRY_RUN','string'),('prune_dry_run_days',7,'number'),('prune_failed_days',60,'number'),('prune_published_days',0,'number'),('prune_state_days',14,'number'),('prune_max_per_run',50,'number'),
('purge_grace_days',2,'number'),('dormant_after_days',21,'number'),('dormant_grace_days',3,'number'),('lead_review_days',3,'number'),
('n8n_api_base','','string'),('workflow_ids_json','{}','string'),('exec_pruning_confirmed','false','string'),('exec_max_age_hours',72,'number'),('exec_window_hours',24,'number'),('exec_fail_high',5,'number'),('errlog_spike',20,'number'),
('realert_high_hours',12,'number'),('realert_warn_hours',48,'number'),('heartbeat_hours',24,'number'),('alert_webhook_url','','string')]
S='Schedule 17:00 and 05:00 JST'
add(S,'n8n-nodes-base.scheduleTrigger',1.4,{'rule':{'interval':[{'field':'cronExpression','expression':'0 17,5 * * *'}]}},0,400,notes='1h after WF09 (16:00/04:00 JST). Keep OFF until the integration test passes. WF10 never writes to Notion.')
add('Config','n8n-nodes-base.set',3.4,{'mode':'manual','includeOtherFields':False,'assignments':{'assignments':[{'id':'cfg-'+n,'name':n,'value':v,'type':t} for n,v,t in cfg]}},224,400,notes='prune_mode DRY_RUN (candidates only) until you set LIVE. alert_webhook_url empty = log-only. n8n_api_base e.g. https://<host>/api/v1 enables failed-execution detection (needs an n8n API key credential). exec_pruning_confirmed: set true ONLY after the instance runs EXECUTIONS_DATA_PRUNE=true and EXECUTIONS_DATA_MAX_AGE=72 (execution data contains PII). workflow_ids_json maps n8n workflow ids to WFxx names.')
chain=[('Get Queue','mtg_distribution_queue',None,None,'Read-only. Full queue (needed for duplicate/prune checks).')]
for w,t in [('WF01','mtg_job_scout_run_log'),('WF02','mtg_job_qc_run_log'),('WF03','mtg_job_organize_run_log'),('WF04','mtg_job_enrichment_run_log'),('WF05','mtg_job_content_run_log'),('WF06','mtg_content_qc_run_log'),('WF07','mtg_image_generation_run_log'),('WF08','mtg_distribution_run_log'),('WF09','mtg_lead_run_log')]:
    chain.append(('Get RL '+w,t,6,'started_at','Latest 6 run-log rows (re-sorted in code).'))
chain.append(('Get Error Log','mtg_job_scout_error_log',300,'ts','Latest 300 error rows.'))
chain.append(('Get State','mtg_monitor_state',None,None,'Alert dedup state.'))
x=448
for name,t,lim,col,nt in chain:
    dt_get(name,t,x,400,nt if name in('Get Queue','Get State') else None,lim,col); x+=200
add('Lead Schema','n8n-nodes-base.httpRequest',4.3,{'method':'GET','url':'={{ "https://api.notion.com/v1/data_sources/" + $("Config").first().json.leads_ds_id }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'Notion-Version','value':'2025-09-03'}]},'options':{'timeout':30000}},x,400,{'executeOnce':True,'onError':'continueRegularOutput','retryOnFail':True,'maxTries':2,'waitBetweenTries':2000},creds={'httpHeaderAuth':{'id':'','name':'Notion Bearer (Header Auth)'}},notes='Schema only (property ids). No lead data.'); x+=200
code('Build Lead Query','lead_query10.js',x,400,'PII guard: only 8 non-PII columns via filter_properties; refuses (harmless users/me call) if any id is unresolved.'); x+=200
add('Lead Query','n8n-nodes-base.httpRequest',4.3,{'method':'={{ $json.method }}','url':'={{ $json.url }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'Notion-Version','value':'2025-09-03'}]},'sendBody':'={{ $json.method === "POST" }}','contentType':'json','specifyBody':'json','jsonBody':'={{ JSON.stringify($json.body) }}','options':{'timeout':30000}},x,400,{'onError':'continueRegularOutput','retryOnFail':True,'maxTries':2,'waitBetweenTries':2000},creds={'httpHeaderAuth':{'id':'','name':'Notion Bearer (Header Auth)'}},notes='READ only. Response is re-checked in Plan Monitor: any non-allow-listed column => data discarded + HIGH finding.'); x+=200
ife('Exec Configured?','$("Config").first().json.n8n_api_base !== ""','true',x,400); x+=200
add('Exec Fetch','n8n-nodes-base.httpRequest',4.3,{'method':'GET','url':'={{ $("Config").first().json.n8n_api_base.replace(/\\/+$/, "") + "/executions?limit=100&includeData=false" }}','authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','options':{'timeout':30000}},x,336,{'onError':'continueRegularOutput','retryOnFail':True,'maxTries':2,'waitBetweenTries':3000},creds={'httpHeaderAuth':{'id':'','name':'n8n API key (X-N8N-API-KEY)'}},notes='Execution list WITHOUT data (includeData=false): metadata only.'); x+=200
merge('Exec Merge',2,x,400,'0 = fetched, 1 = not configured (pass-through).'); x+=224
code('Plan Monitor','plan10.js',x,400,'READ-ONLY analysis. Emits only: fix (R1), prune_queue, prune_state, one digest.'); x+=224
sw('Route Plan','$json._kind',['fix','prune_queue','prune_state','digest'],x,400,'No fallback: any other kind is dropped.'); x+=224
dt_row_write('Queue Fix R1','mtg_distribution_queue',QCOLS,x,208,'upsert','distribution_hash','R1 only: stale PUBLISHING -> MANUAL_REVIEW (AMBIGUOUS_PUBLISH). Never a retry, never PUBLISHED.')
dt_delete('Prune Queue Row','mtg_distribution_queue','distribution_hash',x,336,'Only emitted in prune_mode=LIVE; whitelist: old DRY_RUN / old FAILED (+PUBLISHED only if explicitly enabled).')
dt_delete('Prune State Row','mtg_monitor_state','state_key',x,464,'Only emitted in prune_mode=LIVE; old RESOLVED rows only.')
ife('Send Digest?','$json.send','true',x,592)
add('Send Digest','n8n-nodes-base.httpRequest',4.3,{'method':'POST','url':'={{ $("Config").first().json.alert_webhook_url }}','sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':'={{ JSON.stringify($json.webhook_body) }}','options':{'timeout':15000,'response':{'response':{'fullResponse':True,'neverError':True,'responseFormat':'text'}}}},x+224,528,{'onError':'continueRegularOutput'},notes='PII-free text digest only. No retry here: a failed send is retried next run (last_alerted not advanced).')
merge('Digest Outcome',2,x+448,592,'0 = webhook response, 1 = nothing to send.')
code('Finalize','finalize10.js',x+672,592,'last_alerted advances only after a 2xx answer (or in log-only mode).')
sw('Route Final','$json._kind',['state','log','runlog'],x+896,592)
dt_row_write('State Upsert','mtg_monitor_state',SCOLS,x+1120,464,'upsert','state_key')
dt_row_write('Monitor Log','mtg_monitor_log',LCOLS,x+1120,592,'insert')
dt_row_write('Run Log','mtg_monitor_run_log',RCOLS,x+1120,720,'insert')
conn={}
def link(a,b,out=0,idx=0):
    conn.setdefault(a,{'main':[]}); m=conn[a]['main']
    while len(m)<=out: m.append([])
    m[out].append({'node':b,'type':'main','index':idx})
seq=[S,'Config']+[c[0] for c in chain]+['Lead Schema','Build Lead Query','Lead Query','Exec Configured?']
for a,b in zip(seq,seq[1:]): link(a,b)
link('Exec Configured?','Exec Fetch',0);link('Exec Configured?','Exec Merge',1,1);link('Exec Fetch','Exec Merge',0,0)
link('Exec Merge','Plan Monitor');link('Plan Monitor','Route Plan')
link('Route Plan','Queue Fix R1',0);link('Route Plan','Prune Queue Row',1);link('Route Plan','Prune State Row',2);link('Route Plan','Send Digest?',3)
link('Send Digest?','Send Digest',0);link('Send Digest?','Digest Outcome',1,1);link('Send Digest','Digest Outcome',0,0)
link('Digest Outcome','Finalize');link('Finalize','Route Final')
link('Route Final','State Upsert',0);link('Route Final','Monitor Log',1);link('Route Final','Run Log',2)
OUT=os.path.join(HERE,'MTG_WF10_Monitoring_Recovery_V1.0.json')
wf={'name':'MTG #10 - Monitoring & Recovery V1.0','nodes':nodes,'connections':conn,'pinData':{},'settings':{'executionOrder':'v1','timezone':'Asia/Tokyo','saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':True},'meta':{'templateCredsSetupCompleted':False},'tags':[]}
json.dump(wf,open(OUT,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
names={n['name'] for n in nodes}
print(len(nodes),'nodes; bad',[(a,t['node']) for a,v in conn.items() for o in v['main'] for t in o if a not in names or t['node'] not in names])
# reachability
seen=set([S]);st=[S]
while st:
    a=st.pop()
    for o in conn.get(a,{'main':[]})['main']:
        for t in o:
            if t['node'] not in seen: seen.add(t['node']);st.append(t['node'])
print('unreachable',sorted(names-seen))
# code refs vs node names
import re
for n in nodes:
    if n['type']=='n8n-nodes-base.code':
        for ref in set(re.findall(r"\$\('([^']+)'\)",n['parameters']['jsCode'])):
            if ref not in names: print('BAD REF',n['name'],ref)
for n in nodes:
    for ref in set(re.findall(r'\$\("([^"]+)"\)',json.dumps(n['parameters']))):
        if ref not in names: print('BAD EXPR REF',n['name'],ref)
# cfg keys used by code exist
keys={c[0] for c in cfg}
for fn in ['plan10.js','finalize10.js','lead_query10.js']:
    used=set(re.findall(r'cfg\.([a-z_0-9]+)',open(J+fn).read()))
    print(fn,'cfg keys missing:',sorted(used-keys))
