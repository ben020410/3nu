#!/usr/bin/python3
"""Private local checks, optional outward heartbeat; never logs secret URLs."""
import runtime_mode
import datetime,json,pathlib,re,shutil,sys,time,urllib.request
CONFIG=pathlib.Path('/etc/3nu/heartbeat.json')
def assess(ready,status,disk,now):
    reasons=[]
    if ready.get('ok') is not True:reasons.append('service')
    try:
        age=(now-datetime.datetime.fromisoformat(status['completedAt'].replace('Z','+00:00'))).total_seconds()
        if status.get('ok') is not True or not 0<=age<=30*3600:reasons.append('backup')
    except Exception:reasons.append('backup')
    if disk.free/disk.total<0.15:reasons.append('disk')
    return reasons

def frontend_ready(origin):
    if origin!='https://3nu.vercel.app':raise ValueError('Unexpected frontend origin')
    cache=pathlib.Path('/var/lib/3nu/ops/frontend-health.json');now=time.time()
    try:
        old=json.loads(cache.read_text())
        if old.get('origin')==origin and 0<=now-old['checked']<300:return old.get('ok') is True
    except Exception:pass
    ok=False
    try:
        with urllib.request.urlopen(origin+'/',timeout=5) as response:
            html=response.read(128*1024)
            if response.status!=200 or b'title105.js' not in html:raise ValueError('Frontend unavailable')
        with urllib.request.urlopen(origin+'/api/session',timeout=5) as response:
            session=json.load(response)
            ok=response.status==200 and session.get('environment')=='production' and isinstance(session.get('csrf'),str) and len(session['csrf'])>=16
    except Exception:pass
    result={'origin':origin,'checked':now,'ok':ok}
    temporary=cache.with_suffix('.tmp');temporary.write_text(json.dumps(result)+'\n');temporary.chmod(0o600);temporary.replace(cache)
    return ok

def main():
    try:
        ready=runtime_mode.readiness()
    except Exception:ready={}
    try:status=json.loads(pathlib.Path('/var/lib/3nu/ops/backup-status.json').read_text())
    except Exception:status={}
    reasons=assess(ready,status,shutil.disk_usage('/var/lib/3nu'),datetime.datetime.now(datetime.timezone.utc))
    try:
        if not runtime_mode.tls_ready(runtime_mode.active()):reasons.append('https')
    except Exception:reasons.append('ingress')
    config=json.loads(CONFIG.read_text())
    frontend=config.get('public_frontend_origin')
    if frontend and not frontend_ready(frontend):reasons.append('frontend')
    url=config.get('ping_url','');sent=False
    if url:
        if not re.fullmatch(r'https://hc-ping\.com/[0-9a-f-]{36}',url):raise ValueError('Invalid heartbeat configuration')
        req=urllib.request.Request(url+('/fail' if reasons else ''),data=b'',method='POST')
        try:
            with urllib.request.urlopen(req,timeout=10) as r:
                if r.status!=200:raise ValueError()
            sent=True
        except Exception:reasons.append('alert_delivery')
    result={'healthy':not reasons,'reasons':reasons,'emailMonitoringConfigured':bool(url),'heartbeatSent':sent,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'backupScope':'offsite' if status.get('offsite') else 'server-local-only'}
    out=pathlib.Path('/var/lib/3nu/ops/health-status.json');tmp=out.with_suffix('.tmp')
    tmp.write_text(json.dumps(result,indent=2)+'\n');tmp.chmod(0o600);tmp.replace(out)
    print(json.dumps(result))
    return 1 if reasons else 0
if __name__=='__main__':
    try:sys.exit(main())
    except Exception:print('Health check failed; inspect private configuration',file=sys.stderr);sys.exit(1)
