import json, re
p='workflow.json'
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)
for i,node in enumerate(data.get('nodes',[])):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if isinstance(code,str):
        has_header='Header/Footer (Chromium)' in code
        has_const_html='const html = `<!doctype html>`' in code
        has_header_const=bool(re.search(r"const headerTemplate = `.*?`;\n", code, flags=re.S))
        print(i, has_header, has_const_html, has_header_const)
