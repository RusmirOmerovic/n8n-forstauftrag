import json, re
p='workflow.json'
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)
changed=False
for node in data.get('nodes',[]):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if isinstance(code,str) and 'Header/Footer (Chromium)' in code:
        if 'const html = `<!doctype html>`' in code:
            header_assign = '''headerTemplate = `
  <style>
    *{box-sizing:border-box} body{margin:0;font-family:Arial,Helvetica,sans-serif}
    .h-wrap{background:#B8E6F1; padding:10px 24px; display:flex; align-items:center; justify-content:space-between; font-size:11px}
    .h-logos{display:flex; align-items:center; gap:12px}
    .h-logos img{width:auto; max-height:22px; object-fit:contain}
    .h-title{font-size:14px;font-weight:700}
    .h-meta{font-size:11px;opacity:.85}
  </style>
  <div class="h-wrap">
    <div class="h-logos">
      <img src="${LOGO_RYZEUP}" alt="Ryzeup" />
      <img src="${LOGO_BG}" alt="BG" />
      <img src="${LOGO_AUFTRAG}" alt="Auftrag" />
    </div>
    <div>
      <div class="h-title">Arbeitsauftrag Forstwirtschaft</div>
      <div class="h-meta">Einsatzort: ${esc(meta.einsatzort || '—')} • Datum: ${esc(meta.datum || '—')} • Erstellt: ${esc(now)}</div>
    </div>
  </div>
`;
'''
            code = re.sub(r"const headerTemplate = `.*?`;\n","let headerTemplate;\n", code, flags=re.S)
            code = code.replace('const html = `<!doctype html>`', header_assign + 'const html = `<!doctype html>`')
            code = re.sub(r"\s*<!-- Logos -->\s*<div class=\\\"logos\\\">.*?</div>\s*\n","\n", code, flags=re.S)
            params['jsCode']=code
            node['parameters']=params
            changed=True
if changed:
    with open(p,'w',encoding='utf-8') as f:
        json.dump(data,f,ensure_ascii=False,indent=2)
    print('updated')
else:
    print('nochange')
