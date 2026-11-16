import datetime,hashlib,importlib.util,io,json,pathlib,tarfile,tempfile,unittest
from unittest.mock import patch
from collections import namedtuple
import deploy,heartbeat,runtime_mode
P=pathlib.Path
class Ops(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.root=P(self.t.name);self.dest=self.root/'out';self.dest.mkdir()
 def tearDown(self):self.t.cleanup()
 def archive(self,extra=None):
  data=b'hello';m={'build':112,'files':[{'path':'dist/test.txt','size':5,'sha256':hashlib.sha256(data).hexdigest()}]}
  arc=self.root/'a.tar.gz'
  with tarfile.open(arc,'w:gz') as t:
   for name,value in [('pkg/dist/test.txt',data),('pkg/RELEASE-MANIFEST.json',json.dumps(m).encode())]:
    info=tarfile.TarInfo(name);info.size=len(value);t.addfile(info,io.BytesIO(value))
   if extra:
    info,body=extra;t.addfile(info,io.BytesIO(body) if body is not None else None)
  return arc,deploy.sha(arc)
 def test_valid(self):
  a,h=self.archive();self.assertEqual(deploy.unpack(a,h,self.dest)['build'],112)
 def test_bad_hash(self):
  a,h=self.archive()
  with self.assertRaises(ValueError):deploy.unpack(a,'0'*64,self.dest)
 def test_traversal(self):
  a,h=self.archive((tarfile.TarInfo('pkg/../../escape'),b''))
  with self.assertRaises(ValueError):deploy.unpack(a,h,self.dest)
  self.assertFalse((self.root/'escape').exists())
 def test_link(self):
  x=tarfile.TarInfo('pkg/dist/link');x.type=tarfile.SYMTYPE;x.linkname='/etc/passwd';a,h=self.archive((x,None))
  with self.assertRaises(ValueError):deploy.unpack(a,h,self.dest)
 def test_unlisted(self):
  a,h=self.archive((tarfile.TarInfo('pkg/dist/unlisted'),b''))
  with self.assertRaises(ValueError):deploy.unpack(a,h,self.dest)
 def test_private_data(self):
  a,h=self.archive((tarfile.TarInfo('pkg/dist/private.json'),b''))
  with self.assertRaises(ValueError):deploy.unpack(a,h,self.dest)
 def test_rollback(self):
  old=self.root/'old';new=self.root/'new';old.mkdir();new.mkdir();current=self.root/'current';current.symlink_to(old)
  with patch.object(deploy,'ROOT',self.root),patch.object(deploy,'CURRENT',current),patch.object(deploy,'run'),patch.object(deploy.time,'sleep'),patch.object(deploy,'healthy',side_effect=[False]*20+[True]):
   with self.assertRaises(RuntimeError):deploy.activate(new,old,113,112)
  self.assertEqual(current.resolve(),old.resolve())
 def test_activation(self):
  old=self.root/'old';new=self.root/'new';old.mkdir();new.mkdir();current=self.root/'current';current.symlink_to(old)
  with patch.object(deploy,'ROOT',self.root),patch.object(deploy,'CURRENT',current),patch.object(deploy,'run'),patch.object(runtime_mode,'active',return_value={'mode':'development'}),patch.object(deploy,'healthy',return_value=True):deploy.activate(new,old,113,112)
  self.assertEqual(current.resolve(),new.resolve())
 def test_backup_stale_and_disk(self):
  now=datetime.datetime.now(datetime.timezone.utc);disk=namedtuple('Disk','total free')(100,10)
  s={'ok':True,'completedAt':(now-datetime.timedelta(hours=31)).isoformat()}
  self.assertEqual(heartbeat.assess({'ok':True},s,disk,now),['backup','disk'])
 def test_review_exact_match(self):
  r=[{'from':'old','to':'new','archiveSHA256':'archive'}]
  self.assertTrue(deploy.transition_allowed('old','new','archive',r))
  self.assertFalse(deploy.transition_allowed('old','new','different',r))
  self.assertFalse(deploy.transition_allowed('different','new','archive',r))
  self.assertFalse(deploy.transition_allowed('old','different','archive',r))
  self.assertFalse(deploy.transition_allowed('old','new','archive',[]))
 def test_production_ingress(self):
  cfg=runtime_mode.validate({'HOST':'127.0.0.1','PORT':'8766','NODE_ENV':'production','CAMPUS_PUBLIC_ORIGIN':'https://165.22.247.213','CAMPUS_TRUST_PROXY':'127.0.0.1'})
  self.assertEqual(cfg['headers']['Host'],'165.22.247.213')
  self.assertEqual(cfg['headers']['X-Forwarded-Proto'],'https')
 def test_bad_ingress(self):
  for origin in ['http://example.org','https://example.org/path','https://user@example.org','https://example.org:8443','https://example.org/']:
   with self.assertRaises(ValueError):runtime_mode.validate({'HOST':'127.0.0.1','PORT':'8766','NODE_ENV':'production','CAMPUS_PUBLIC_ORIGIN':origin,'CAMPUS_TRUST_PROXY':'127.0.0.1'})
  with self.assertRaises(ValueError):runtime_mode.validate({'HOST':'0.0.0.0','PORT':'8766','NODE_ENV':'development'})
 def test_unhealthy(self):
  disk=namedtuple('Disk','total free')(100,90)
  self.assertEqual(heartbeat.assess({}, {},disk,datetime.datetime.now(datetime.timezone.utc)),['service','backup'])
if __name__=='__main__':unittest.main()
