#!/usr/bin/env python3
"""Static audit of the MTG n8n workflow JSONs. Usage: audit_workflows.py [root]  (exit 1 on errors)."""
import glob, json, os, re, subprocess, sys, tempfile, collections

root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..')
errs, warns = [], []
EXPECT_SETTINGS = {'executionOrder': 'v1', 'timezone': 'Asia/Tokyo', 'saveDataSuccessExecution': 'none',
                   'saveDataErrorExecution': 'all', 'saveManualExecutions': True}

def js_ok(code):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
        t.write('(async()=>{' + code + '\n})'); p = t.name
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True); os.unlink(p)
    return r.returncode == 0, r.stderr.strip().splitlines()[:3]

for f in sorted(glob.glob(os.path.join(root, 'workflows/WF*/MTG_*.json'))):
    tag = os.path.basename(f).split('_')[1]
    E = lambda m: errs.append(f'{tag}: {m}'); W = lambda m: warns.append(f'{tag}: {m}')
    d = json.load(open(f, encoding='utf-8')); nodes = d['nodes']; names = [n['name'] for n in nodes]
    if len(set(names)) != len(names): E('duplicate node names')
    if len({n['id'] for n in nodes}) != len(nodes): E('duplicate node ids')
    for a, v in d['connections'].items():
        if a not in names: E(f'connection from unknown node {a}')
        for o in v.get('main', []):
            for t in o:
                if t['node'] not in names: E(f'{a} -> unknown {t["node"]}')
    tgt = {t['node'] for v in d['connections'].values() for o in v.get('main', []) for t in o}
    for n in nodes:
        if 'trigger' not in n['type'].lower() and n['name'] not in tgt: E(f'orphan node {n["name"]}')
        p = n['parameters']
        if p.get('nodeCredentialType') == 'notionApi' or 'notionApi' in n.get('credentials', {}):
            E(f'{n["name"]}: built-in notionApi credential (overrides Notion-Version, breaks /data_sources)')
        if n['type'].endswith('httpRequest') and 'api.notion.com' in json.dumps(p):
            hdr = {h['name']: h['value'] for h in p.get('headerParameters', {}).get('parameters', [])}
            if hdr.get('Notion-Version') != '2025-09-03': E(f'{n["name"]}: missing Notion-Version 2025-09-03')
            if 'httpHeaderAuth' not in n.get('credentials', {}): E(f'{n["name"]}: Notion node without Header Auth credential')
        if n['type'].endswith('.code'):
            ok, msg = js_ok(p['jsCode'])
            if not ok: E(f'{n["name"]}: JS syntax error {msg}')
        if n['type'].endswith('httpRequest') and n.get('credentials') and p.get('options', {}).get('timeout') is None:
            W(f'{n["name"]}: no timeout')
    for k, v in EXPECT_SETTINGS.items():
        if d.get('settings', {}).get(k) != v: W(f'settings.{k} = {d.get("settings", {}).get(k)!r} (expected {v!r})')
    sched = [n for n in nodes if n['type'].endswith('scheduleTrigger')]
    if d.get('active'): E('workflow marked active')
    print(f'{tag}: {len(nodes)} nodes, {len(sched)} schedule trigger(s)')
for w in warns: print('WARN ', w)
for e in errs: print('ERROR', e)
print(f'\n{len(errs)} errors, {len(warns)} warnings')
sys.exit(1 if errs else 0)
