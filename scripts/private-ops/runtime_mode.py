"""Read only the active service's non-secret ingress settings; never dump environment."""
import json,pathlib,subprocess,urllib.parse,urllib.request,ssl,socket,time

def validate(values):
    if values.get('HOST')!='127.0.0.1' or values.get('PORT')!='8766':
        raise ValueError('Service must remain on loopback port 8766')
    mode=values.get('NODE_ENV')
    if mode=='development':return {'mode':mode,'headers':{}}
    if mode!='production':raise ValueError('Unknown active service mode')
    origin=values.get('CAMPUS_PUBLIC_ORIGIN','');u=urllib.parse.urlsplit(origin)
    if u.scheme!='https' or not u.hostname or u.username or u.password or u.path or u.query or u.fragment or u.port not in (None,443):
        raise ValueError('Invalid HTTPS origin')
    if values.get('CAMPUS_TRUST_PROXY')!='127.0.0.1':raise ValueError('Unexpected trusted proxy')
    return {'mode':mode,'origin':origin,'host':u.hostname,'headers':{'Host':u.netloc,'X-Forwarded-Proto':'https','X-Forwarded-For':'127.0.0.1'}}

def active():
    pid=subprocess.check_output(['systemctl','show','3nu.service','--property=MainPID','--value'],text=True).strip()
    if not pid.isdecimal() or int(pid)<2:raise ValueError('Service is not running')
    names={'HOST','PORT','NODE_ENV','CAMPUS_PUBLIC_ORIGIN','CAMPUS_TRUST_PROXY'}
    values={}
    for item in pathlib.Path('/proc',pid,'environ').read_bytes().split(b'\0'):
        key,sep,value=item.partition(b'=')
        if key.decode(errors='replace') in names:values[key.decode()]=value.decode()
    return validate(values)

def readiness(config=None):
    config=config or active()
    req=urllib.request.Request('http://127.0.0.1:8766/ready',headers=config['headers'])
    with urllib.request.urlopen(req,timeout=5) as response:return json.load(response)

def tls_ready(config):
    if config['mode']!='production':return True
    # Check the real hostname and certificate through local Nginx, without depending
    # on self-routing via the public firewall. This is not an external reachability test.
    try:
        with socket.create_connection(('127.0.0.1',443),timeout=5) as sock:
            with ssl.create_default_context().wrap_socket(sock,server_hostname=config['host']) as tls:
                if ssl.cert_time_to_seconds(tls.getpeercert()['notAfter'])-time.time()<86400:return False
    except Exception:return False
    command=['curl','--silent','--show-error','--fail','--max-time','8','--connect-to',
             config['host']+':443:127.0.0.1:443',config['origin']+'/ready']
    result=subprocess.run(command,capture_output=True,text=True,timeout=10)
    if result.returncode:return False
    try:return json.loads(result.stdout).get('ok') is True
    except Exception:return False
