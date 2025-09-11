import json, re
p='workflow.json'
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)
changed=False
for node in data.get('nodes',[]):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if isinstance(code,str) and 'headerTemplate = `' in code:
        before=code
        code=re.sub(r"headerTemplate = `[\s\S]*?`;\s*headerTemplate = `","headerTemplate = `", code)
        if code!=before:
            params['jsCode']=code
            node['parameters']=params
            changed=True
if changed:
    with open(p,'w',encoding='utf-8') as f:
        json.dump(data,f,ensure_ascii=False,indent=2)
    print('updated')
else:
    print('nochange')

