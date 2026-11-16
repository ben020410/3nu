#!/usr/bin/python3
"""Deploy a reviewed archive to the loopback-only 3NU service. Never restores live DB."""
import runtime_mode
import contextlib,fcntl,hashlib,json,os,pathlib,re,shutil,subprocess,sys,tarfile,tempfile,time,urllib.request
P=pathlib.Path
ROOT=P('/srv/3nu'); CURRENT=ROOT/'current'
def run(*args,**kw):
    return subprocess.run(args,check=True,**kw)
def sha(p):
    with open(p,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def unpack(archive,expected,dest):
    if not re.fullmatch('[a-f0-9]{64}',expected) or sha(archive)!=expected:raise ValueError('Archive SHA256 mismatch')
    with tarfile.open(archive,'r:gz') as t:
        members=t.getmembers(); names=set(); top=None; total=0
        if len(members)>10000:raise ValueError('Too many archive entries')
        for m in members:
            p=pathlib.PurePosixPath(m.name)
            if p.is_absolute() or '..' in p.parts or not p.parts or any(x.startswith('.') for x in p.parts):raise ValueError('Unsafe archive path')
            if top is None:top=p.parts[0]
            if p.parts[0]!=top or m.name in names or not (m.isfile() or m.isdir()):raise ValueError('Duplicate, indirect or mixed archive entry')
            names.add(m.name);total+=m.size
            if total>2*1024**3:raise ValueError('Archive too large')
            if m.isfile():
                rel=P(*p.parts[1:])
                if len(p.parts)<2 or rel.parts[0] not in ('dist','server','scripts','source-data','docs','package.json','package-lock.json','RELEASE-MANIFEST.json'):raise ValueError('Unexpected payload')
                if rel.name in ('private.json','ADMIN-PASSWORD.txt') or rel.suffix in ('.sqlite','.db') or 'node_modules' in rel.parts:raise ValueError('Runtime data must not be packaged')
        for m in members:
            rel=P(*pathlib.PurePosixPath(m.name).parts[1:]);out=dest/rel
            if m.isdir():out.mkdir(parents=True,exist_ok=True);continue
            out.parent.mkdir(parents=True,exist_ok=True)
            with t.extractfile(m) as src,open(out,'xb') as dst:shutil.copyfileobj(src,dst)
            out.chmod(0o644)
    manifest=json.loads((dest/'RELEASE-MANIFEST.json').read_text())
    if type(manifest.get('build')) is not int:raise ValueError('Missing build number')
    listed=set()
    for entry in manifest['files']:
        name=entry['path'];p=pathlib.PurePosixPath(name)
        if p.is_absolute() or '..' in p.parts or name in listed:raise ValueError('Invalid manifest path')
        listed.add(name);f=dest/name
        if not f.is_file() or f.stat().st_size!=entry['size'] or sha(f)!=entry['sha256']:raise ValueError('Payload manifest mismatch')
    actual={str(p.relative_to(dest)) for p in dest.rglob('*') if p.is_file()}-{'RELEASE-MANIFEST.json'}
    if listed!=actual:raise ValueError('Manifest does not cover payload')
    return manifest

def switch(target):
    temp=ROOT/('.current-'+str(os.getpid()))
    temp.symlink_to(target);os.replace(temp,CURRENT)
def healthy(build):
    try:
        d=runtime_mode.readiness()
        return d.get('ok') is True and d.get('build')==build
    except Exception:return False
def activate(target,old,build,old_build):
    switched=False
    try:
        switch(target);switched=True
        run('systemctl','restart','3nu.service')
        for _ in range(20):
            if healthy(build) and runtime_mode.tls_ready(runtime_mode.active()):return
            time.sleep(1)
        raise RuntimeError('New release readiness failed')
    except BaseException:
        if switched:
            switch(old);run('systemctl','restart','3nu.service')
            recovered=False
            for _ in range(20):
                if healthy(old_build):recovered=True;break
                time.sleep(1)
            print('Code rollback: '+('healthy' if recovered else 'FAILED; manual recovery required'),flush=True)
        raise

def transition_allowed(old_hash,new_hash,archive_hash,reviews):
    if old_hash==new_hash:return True
    return any(r.get('from')==old_hash and r.get('to')==new_hash and r.get('archiveSHA256')==archive_hash for r in reviews)

def main():
    if len(sys.argv)!=3 or os.geteuid()!=0:raise SystemExit('Usage (root): deploy.py ARCHIVE SHA256')
    os.umask(0o077)
    with open('/run/lock/3nu-deploy.lock','w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        # Updates preserve the active mode; they never open the firewall or publish.
        mode=runtime_mode.active()
        if not runtime_mode.tls_ready(mode):raise RuntimeError('Existing HTTPS ingress is unhealthy')
        old=CURRENT.resolve(strict=True)
        state=runtime_mode.readiness(mode)
        if state.get('ok') is not True:raise RuntimeError('Existing service not healthy')
        stage=P(tempfile.mkdtemp(prefix='candidate-',dir=ROOT/'releases'));stage.chmod(0o755)
        m=unpack(P(sys.argv[1]),sys.argv[2],stage)
        # Automatic rollback requires an unchanged persistence implementation.
        old_hash=sha(old/'server/community107.cjs');new_hash=sha(stage/'server/community107.cjs')
        reviews=[];review_file=P('/etc/3nu/reviewed-transitions.json')
        if review_file.exists():
            metadata=review_file.stat()
            if metadata.st_uid!=0 or metadata.st_mode & 0o022:
                raise RuntimeError('Review record must be root-owned and not group/world writable')
            reviews=json.loads(review_file.read_text())
        if not transition_allowed(old_hash,new_hash,sys.argv[2],reviews):
            raise RuntimeError('Persistence code changed: migration review required before automatic deploy')
        run('chown','-R','3nu-build:3nu-build',str(stage))
        run('runuser','-u','3nu-build','--','env','HOME=/var/cache/3nu-build','npm_config_cache=/var/cache/3nu-build/npm','npm','ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund',cwd=stage,timeout=300)
        run('runuser','-u','3nu-build','--','env','HOME=/var/cache/3nu-build','npm','test',cwd=stage,timeout=300)
        run('chown','-R','root:root',str(stage))
        run('chmod','-R','a+rX,go-w',str(stage))
        target=ROOT/'releases'/('build'+str(m['build'])+'-'+sys.argv[2][:12]+'-'+str(time.time_ns()))
        stage.rename(target)
        # Backup is completed before changing the active release. No database rollback.
        run('systemctl','start','3nu-db-backup.service',timeout=1200)
        activate(target,old,m['build'],state['build'])
        receipt={'ok':True,'build':m['build'],'archiveSHA256':sys.argv[2],'previous':str(old),'current':str(target),'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
        P('/var/lib/3nu/ops/last-deploy.json').write_text(json.dumps(receipt,indent=2)+'\n')
        print(json.dumps(receipt))
if __name__=='__main__':
    try:main()
    except Exception as e:print('DEPLOY STOPPED: '+str(e),file=sys.stderr);sys.exit(1)
