import json, re
from pathlib import Path

p=Path('workflow.json')
data=json.loads(p.read_text(encoding='utf-8'))
changed=False

for node in data.get('nodes', []):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if not isinstance(code, str):
        continue
    # Dedupe blocks like: // Header ...\nheaderTemplate = `...`;
    blocks=list(re.finditer(r"headerTemplate = `[\s\S]*?`;", code))
    if len(blocks)>1:
        keep=blocks[0]
        head=code[:keep.end()]
        tail=code[blocks[-1].end():]
        code=head+tail
    if code != params.get('jsCode'):
        params['jsCode']=code
        node['parameters']=params
        changed=True

if changed:
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print('updated')
else:
    print('nochange')

