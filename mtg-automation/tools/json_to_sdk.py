#!/usr/bin/env python3
"""Convert an n8n workflow JSON into n8n Workflow SDK code (for mcp__n8n__create_workflow_from_code).
Usage: json_to_sdk.py workflow.json > workflow.sdk.js"""
import json, re, sys

TYPE_FACTORY = {'n8n-nodes-base.if': 'ifElse', 'n8n-nodes-base.merge': 'merge', 'n8n-nodes-base.switch': 'switchCase'}
KEEP = ['retryOnFail', 'maxTries', 'waitBetweenTries', 'onError', 'executeOnce', 'alwaysOutputData', 'notes']

def lit(v):
    if isinstance(v, str):
        if v.startswith('='):
            return 'expr(%s)' % json.dumps(v[1:], ensure_ascii=False)
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, bool): return 'true' if v else 'false'
    if v is None: return 'null'
    if isinstance(v, (int, float)): return json.dumps(v)
    if isinstance(v, list): return '[' + ', '.join(lit(x) for x in v) + ']'
    if isinstance(v, dict):
        return '{' + ', '.join('%s: %s' % (json.dumps(k, ensure_ascii=False), lit(x)) for k, x in v.items()) + '}'
    raise TypeError(type(v))

def convert(wf):
    nodes, conns = wf['nodes'], wf['connections']
    var, out = {}, []
    for i, n in enumerate(nodes):
        var[n['name']] = 'n%d' % i
    out.append("import { workflow, node, trigger, newCredential, ifElse, merge, switchCase, expr } from '@n8n/workflow-sdk';\n")
    for n in nodes:
        t = n['type']; v = var[n['name']]
        cfg = {'name': n['name'], 'position': n['position'], 'parameters': n['parameters']}
        for k in KEEP:
            if k in n: cfg[k] = n[k]
        parts = ['%s: %s' % (k, lit(x)) for k, x in cfg.items()]
        if n.get('credentials'):
            parts.append('credentials: {%s}' % ', '.join('%s: newCredential(%s)' % (k, json.dumps(c['name'])) for k, c in n['credentials'].items()))
        fac = 'trigger' if 'Trigger' in t.split('.')[-1] else TYPE_FACTORY.get(t, 'node')
        head = '' if fac in ('ifElse', 'merge', 'switchCase') else 'type: %s, ' % json.dumps(t)
        out.append('const %s = %s({%sversion: %s, config: {%s}, output: [{}]});' % (v, fac, head, n['typeVersion'], ', '.join(parts)))
    out.append('')
    # wiring: every edge is its own chain
    edges = []
    for a, d in conns.items():
        for oi, targets in enumerate(d.get('main', [])):
            for t in targets:
                edges.append((a, oi, t['node'], t['index']))
    first = [n for n in nodes if 'Trigger' in n['type'].split('.')[-1]][0]
    chain = ["export default workflow(%s, %s)" % (json.dumps(wf['name'][:20]), json.dumps(wf['name'])), "  .add(%s)" % var[first['name']]]
    for a, oi, b, ii in edges:
        src = var[a] + ('.output(%d)' % oi if oi else '')
        dst = var[b] + ('.input(%d)' % ii if ii else '')
        chain.append('  .add(%s.to(%s))' % (src, dst))
    out.append('\n'.join(chain) + ';')
    return '\n'.join(out)

if __name__ == '__main__':
    print(convert(json.load(open(sys.argv[1], encoding='utf-8'))))
