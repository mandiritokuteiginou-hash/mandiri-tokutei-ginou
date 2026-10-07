#!/usr/bin/env python3
"""Switch the AI nodes from Anthropic Messages API to an OpenAI-compatible chat/completions API (sumopod).
Idempotent. Patches: workflows/*/src parse_*.js (response parsing), workflows/*/build_json_*.py (http_ai helper, model ids),
and the workflow JSONs (AI HTTP nodes, parser Code nodes, Config model ids). Usage: switch_ai_provider.py [root]"""
import glob, json, os, re, sys

root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
URL = 'https://ai.sumopod.com/v1/chat/completions'
CRED = 'Sumopod AI API Key (Bearer)'
MODEL = 'gpt-4o-mini'
OLD_ACC = "it.json && it.json.content && it.json.content[0] && it.json.content[0].text"
NEW_ACC = ("it.json && ((it.json.choices && it.json.choices[0] && it.json.choices[0].message && it.json.choices[0].message.content)"
           " || (it.json.content && it.json.content[0] && it.json.content[0].text))")

def body_expr(field):
    return ('={{ JSON.stringify((() => { const r = $json.%s; '
            'const conv = (c) => Array.isArray(c) ? c.map((b) => b.type === "image" ? { type: "image_url", image_url: { url: b.source && b.source.url } } : b) : c; '
            'const body = { model: r.model, max_tokens: r.max_tokens, messages: [{ role: "system", content: r.system }].concat(r.messages.map((m) => ({ role: m.role, content: conv(m.content) }))) }; '
            'if (r.temperature !== undefined) body.temperature = r.temperature; return body; })()) }}') % field

def patch_ai_node(n):
    p = n['parameters']
    m = re.match(r'=\{\{ JSON\.stringify\(\$json\.(\w+)\) \}\}$', p.get('jsonBody', ''))
    field = m.group(1) if m else re.search(r'\$json\.(\w+);', p['jsonBody']).group(1)
    p['url'] = URL
    p['genericAuthType'] = 'httpHeaderAuth'
    p['headerParameters'] = {'parameters': [{'name': 'content-type', 'value': 'application/json'}]}
    p['jsonBody'] = body_expr(field)
    n['credentials'] = {'httpHeaderAuth': {'id': '', 'name': CRED}}

def patch_code(js):
    return js.replace(OLD_ACC, NEW_ACC)

changed = []
# 1. src parsers
for f in glob.glob(os.path.join(root, 'workflows/WF*/src/*.js')):
    s = open(f, encoding='utf-8').read()
    t = patch_code(s)
    if t != s: open(f, 'w', encoding='utf-8').write(t); changed.append(f)
# 2. builders
HTTP_AI = ("def http_ai(name,field,x,y):\n    add(name,'n8n-nodes-base.httpRequest',4.3,{'method':'POST','url':%r,'authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendHeaders':True,'headerParameters':{'parameters':[{'name':'content-type','value':'application/json'}]},'sendBody':True,'contentType':'json','specifyBody':'json','jsonBody':BODY%%field,'options':{'timeout':90000,'batching':{'batch':{'batchSize':3,'batchInterval':1500}}}},x,y,{'retryOnFail':True,'maxTries':3,'waitBetweenTries':5000,'onError':'continueRegularOutput'},creds={'httpHeaderAuth':{'id':'','name':%r}})\n") % (URL, CRED)
BODY_LINE = 'BODY=%r\n' % body_expr('%s')
for f in glob.glob(os.path.join(root, 'workflows/WF*/build_json_*.py')):
    s = open(f, encoding='utf-8').read()
    if 'api.anthropic.com' in s:
        s = re.sub(r"def http_ai\(name,field,x,y\):\n.*?\n(?=def )", lambda m: BODY_LINE + HTTP_AI, s, count=1, flags=re.S)
    s = re.sub(r"claude-[a-z0-9\-]+", MODEL, s)
    open(f, 'w', encoding='utf-8').write(s); changed.append(f)
# 3. workflow JSONs
for f in glob.glob(os.path.join(root, 'workflows/WF*/MTG_*.json')):
    d = json.load(open(f, encoding='utf-8')); dirty = False
    for n in d['nodes']:
        if n['type'].endswith('httpRequest') and 'api.anthropic.com' in n['parameters'].get('url', ''):
            patch_ai_node(n); dirty = True
        elif n['type'].endswith('.code'):
            js = patch_code(n['parameters']['jsCode'])
            if js != n['parameters']['jsCode']: n['parameters']['jsCode'] = js; dirty = True
        elif n['type'].endswith('.set'):
            for a in n['parameters'].get('assignments', {}).get('assignments', []):
                if a['name'].startswith('ai_model') and str(a['value']).startswith('claude-'): a['value'] = MODEL; dirty = True
    if dirty:
        json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); changed.append(f)
print('\n'.join(sorted(set(changed))))
