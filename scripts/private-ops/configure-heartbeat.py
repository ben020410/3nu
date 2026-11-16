#!/usr/bin/python3
import getpass,grp,json,os,pathlib,re,subprocess
if os.geteuid()!=0:raise SystemExit('Run as root')
u=getpass.getpass('Paste Healthchecks Ping URL (hidden): ').strip()
if not re.fullmatch(r'https://hc-ping\.com/[0-9a-f-]{36}',u):raise SystemExit('Expected https://hc-ping.com/<check UUID>')
p=pathlib.Path('/etc/3nu/heartbeat.json');temp=p.with_suffix('.new')
fd=os.open(temp,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o640)
with os.fdopen(fd,'w') as f:json.dump({'ping_url':u},f)
os.chown(temp,0,grp.getgrnam('3nu').gr_gid);os.chmod(temp,0o640);temp.replace(p)
subprocess.run(['systemctl','start','3nu-health.service'],check=True)
print('Heartbeat connected. Check the Healthchecks dashboard and test the Email integration.')
