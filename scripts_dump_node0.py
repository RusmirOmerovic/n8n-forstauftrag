import json
p='workflow.json'
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)
code=data['nodes'][0]['parameters']['jsCode']
with open('.js_node0.txt','w',encoding='utf-8') as f:
    f.write(code)
print('ok', len(code))
