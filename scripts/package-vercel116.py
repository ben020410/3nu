from pathlib import Path
import argparse, hashlib, json, re, tarfile
ROOT=Path(__file__).resolve().parent.parent

def digest(data):return hashlib.sha256(data).hexdigest()
def package(output):
 pkg=json.loads((ROOT/'package.json').read_text());build=int(pkg['version'].split('.')[-1]);assert build>=116
 output=output.resolve();assert not output.is_relative_to(ROOT),'Outputs must stay outside app'
 output.mkdir(parents=True,exist_ok=True)
 backend=output/'backend-source';frontend=output/'frontend-source'
 assert not backend.exists() and not frontend.exists(),'Immutable release already exists; choose a new output folder'
 files={'package.json','package-lock.json','source-data/multiplayer106-anchors.json','scripts/vercel-build116.cjs'}
 files.update(pkg['scripts']['test'].split()[2:])
 files.update('scripts/'+n+'.cjs' for n in ['setup-community107','backup-community107','scheduled-backup112','retention112'])
 files.update('docs/'+n for n in ['RESILIENCE113.md','OPERATIONS112_RUNBOOK.md','SECURITY_RETENTION112.md','RIGHTS_REVIEW.md','SMASH-LICENSE.txt','VERCEL_PREPUBLIC116.md'])
 for folder in ['dist','server']:
  for p in (ROOT/folder).rglob('*'):
   assert not p.is_symlink(),str(p)
   if p.is_file() and not any(x.startswith('.') for x in p.relative_to(ROOT).parts):files.add(str(p.relative_to(ROOT)))
 frontfiles={f for f in files if f.startswith('dist/')}|{'api/gateway.js','server/vercel-gateway116.cjs','scripts/vercel-build116.cjs','vercel.json'}
 pattern=re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|(?:AKIA|ASIA)[A-Z0-9]{16})\b')
 records={}
 for label,stage,selected in [('backend',backend,files),('frontend',frontend,frontfiles)]:
  entries=[]
  for name in sorted(selected):
   p=ROOT/name;assert p.is_file() and not p.is_symlink();assert not re.search(r'(^|/)(private\.json|ADMIN-PASSWORD\.txt|\.env.*|[^/]+\.(sqlite.*|db|pem|key))$',name,re.I)
   data=p.read_bytes()
   if b'\0' not in data[:8192]:assert not pattern.search(data),'Credential pattern: '+name
   dst=stage/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data);dst.chmod(0o644)
   entries.append({'path':name,'size':len(data),'sha256':digest(data)})
  if label=='frontend':
   base={'name':'3nu-vercel-frontend','version':pkg['version'],'private':True,'engines':{'node':'24.x'},'scripts':{'build':'node scripts/vercel-build116.cjs'}}
   lock={'name':base['name'],'version':base['version'],'lockfileVersion':3,'requires':True,'packages':{'':{'name':base['name'],'version':base['version'],'engines':base['engines']}}}
   for name,obj in [('package.json',base),('package-lock.json',lock)]:
    data=(json.dumps(obj,indent=2)+'\n').encode();(stage/name).write_bytes(data);entries.append({'path':name,'size':len(data),'sha256':digest(data)})
  record={'build':build,'kind':label,'publicDeployment':False,'targetOrigin':'https://3nu.vercel.app','targetNameReserved':True,'files':entries,'excluded':['private runtime','credentials','node_modules','Git metadata','reports']}
  (stage/'RELEASE-MANIFEST.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');(output/(label+'-manifest.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
  filename=f'3nu-build{build}.tar.gz' if label=='backend' else f'3nu-vercel{build}.tar.gz';archive=output/filename
  with tarfile.open(archive,'w:gz',format=tarfile.PAX_FORMAT) as tf:
   for p in sorted(stage.rglob('*')):
    if p.is_file():
     info=tf.gettarinfo(str(p),arcname=filename[:-7]+'/'+str(p.relative_to(stage)));info.uid=info.gid=0;info.uname=info.gname='';info.mode=0o644
     with p.open('rb') as handle:tf.addfile(info,handle)
  with tarfile.open(archive) as tf:
   assert len(tf.getmembers())==len(entries)+1
   for e in entries:assert digest(tf.extractfile(filename[:-7]+'/'+e['path']).read())==e['sha256']
  records[label]={'archive':filename,'sha256':digest(archive.read_bytes()),'files':len(entries),'compressedMiB':round(archive.stat().st_size/1048576,1)}
 (output/'SHA256SUMS').write_text(''.join(v['sha256']+'  '+v['archive']+'\n' for v in records.values()))
 (output/'PACKAGE-STATUS.json').write_text(json.dumps(records,indent=2)+'\n');print(json.dumps(records,indent=2))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);package(parser.parse_args().output)
