#!/usr/bin/python3
"""Final publication switch. Run only after the owner explicitly requests go-live."""
import datetime,fcntl,hashlib,json,os,pathlib,re,shutil,subprocess,sys,time,urllib.request,urllib.parse
sys.path.insert(0,'/usr/local/lib/3nu-ops')
import runtime_mode
P=pathlib.Path
def run(*args,**kw):return subprocess.run(args,check=True,**kw)
def split_config(expected):
    env=P('/etc/3nu/vercel116.env')
    if not env.exists():
        if expected>=116:raise RuntimeError('Missing reviewed split-hosting configuration')
        return None
    if env.is_symlink() or env.stat().st_uid!=0 or env.stat().st_mode & 0o027:raise RuntimeError('Unsafe split-hosting environment permissions')
    data=env.read_bytes();values={}
    for line in data.decode().splitlines():
        key,value=line.split('=',1)
        if key in values:raise RuntimeError('Duplicate configuration key')
        values[key]=value
    if set(values)!={'CAMPUS_BROWSER_ORIGIN','CAMPUS_EDGE_PROXY_SECRET'}:raise RuntimeError('Unexpected split-hosting keys')
    origin=values['CAMPUS_BROWSER_ORIGIN'];url=urllib.parse.urlsplit(origin)
    if url.scheme!='https' or not url.netloc or url.username or url.password or url.path or url.query or url.fragment or origin=='https://165.22.247.213':raise RuntimeError('Invalid browser origin')
    if not re.fullmatch('[a-f0-9]{64}',values['CAMPUS_EDGE_PROXY_SECRET']):raise RuntimeError('Invalid gateway key')
    proof=P('/root/3nu-prepublic')/('vercel'+str(expected)+'-tls-result.json')
    result=json.loads(proof.read_text())
    if not result.get('ok') or result.get('build')!=expected or result.get('browserOrigin')!=origin or result.get('configurationSha256')!=hashlib.sha256(data).hexdigest():raise RuntimeError('TLS verification does not match configuration')
    if time.time()-proof.stat().st_mtime>86400:raise RuntimeError('Repeat private TLS verification before launch')
    return values

def main():
    if os.geteuid()!=0 or len(sys.argv)!=3 or sys.argv[1] not in ('--publish','--check') or not sys.argv[2].isdigit():
        raise SystemExit('Usage: activate-public.py --check|--publish EXPECTED_BUILD (publish requires owner go-live instruction)')
    expected=int(sys.argv[2]);os.umask(0o077)
    with open('/run/lock/3nu-deploy.lock','w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        cfg=runtime_mode.active()
        if cfg['mode']!='development':raise RuntimeError('Already public or unexpected environment; do not repeat')
        if runtime_mode.readiness().get('build')!=expected:raise RuntimeError('Reviewed build mismatch')
        firewall=subprocess.check_output(['ufw','status'],text=True)
        if 'Status: active' not in firewall or '443' in firewall:raise RuntimeError('Unexpected firewall; review manually')
        run('openssl','x509','-checkend','172800','-noout','-in','/etc/letsencrypt/live/3nu-ip/fullchain.pem')
        run('systemctl','is-active','snap.certbot.renew.timer')
        split=split_config(expected)
        if sys.argv[1]=='--check':
            print(json.dumps({'readyToSwitch':True,'build':expected,'browserOrigin':split['CAMPUS_BROWSER_ORIGIN'] if split else None,'published':False}));return
        prepublic_active=subprocess.run(['systemctl','is-active','--quiet','3nu-prepublic.service']).returncode==0
        run('systemctl','start','3nu-db-backup.service',timeout=1200)
        stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        saved=P('/root/3nu-prepublic')/('activation-'+stamp);saved.mkdir(mode=0o700)
        nginx=P('/etc/nginx/sites-available/3nu-https');http=P('/etc/nginx/sites-available/3nu-challenge')
        for file in [nginx,http]:shutil.copy2(file,saved/file.name)
        override=P('/etc/systemd/system/3nu.service.d/public.conf')
        if override.exists():raise RuntimeError('Unreviewed public override exists')
        changed=False;opened=False
        try:
            env=P('/etc/3nu/production.env')
            env.write_text('NODE_ENV=production\nHOST=127.0.0.1\nPORT=8766\nCAMPUS_PUBLIC_ORIGIN=https://165.22.247.213\nCAMPUS_TRUST_PROXY=127.0.0.1\nCAMPUS_DATA_DIR=/var/lib/3nu/community\nCAMPUS_BACKUP_STATUS_FILE=/var/lib/3nu/ops/backup-status.json\nCAMPUS_BACKUP_MAX_AGE_HOURS=30\n')
            run('chown','root:3nu',str(env));env.chmod(0o640)
            changed=True
            override.write_text('[Service]\nEnvironmentFile=\nEnvironmentFile=/etc/3nu/production.env\n'+('EnvironmentFile=/etc/3nu/vercel116.env\n' if split else ''))
            nginx.write_text(nginx.read_text().replace('127.0.0.1:8876','127.0.0.1:8766'))
            http.write_text(http.read_text().replace('location / { return 404; }','location / { return 308 https://165.22.247.213$request_uri; }'))
            run('nginx','-t');run('systemctl','daemon-reload');run('systemctl','restart','3nu.service');run('systemctl','reload','nginx')
            for attempt in range(20):
                try:
                    cfg=runtime_mode.active();ready=runtime_mode.readiness(cfg)
                    if cfg['mode']=='production' and ready.get('build')==expected and ready.get('ok') and runtime_mode.tls_ready(cfg):break
                except Exception:pass
                time.sleep(1)
            else:raise RuntimeError('Production ingress check failed')
            if split:
                pid=subprocess.check_output(['systemctl','show','3nu.service','-p','MainPID','--value'],text=True).strip()
                live=dict(item.split(b'=',1) for item in P('/proc',pid,'environ').read_bytes().split(b'\0') if b'=' in item)
                if any(live.get(k.encode())!=v.encode() for k,v in split.items()):raise RuntimeError('Live split-hosting configuration mismatch')
            # The only step that makes the game externally accessible.
            opened=True
            run('ufw','allow','443/tcp','comment','3NU public HTTPS')
            run('systemctl','start','3nu-health.service')
            run('systemctl','stop','3nu-prepublic.service')
            receipt={'published':True,'build':expected,'url':split['CAMPUS_BROWSER_ORIGIN'] if split else 'https://165.22.247.213','backendUrl':'https://165.22.247.213','at':stamp,'configurationBackup':str(saved),'externalReachability':'must verify from another network','database':'preserved; never restored automatically'}
            P('/var/lib/3nu/ops/public-launch.json').write_text(json.dumps(receipt,indent=2)+'\n')
            print(json.dumps(receipt))
        except BaseException:
            if opened:subprocess.run(['ufw','--force','delete','allow','443/tcp'],check=False)
            if changed:
                override.unlink(missing_ok=True)
                for file in [nginx,http]:shutil.copy2(saved/file.name,file)
                run('systemctl','daemon-reload');run('systemctl','restart','3nu.service');run('nginx','-t');run('systemctl','reload','nginx')
            if prepublic_active:run('systemctl','start','3nu-prepublic.service')
            raise
if __name__=='__main__':main()
