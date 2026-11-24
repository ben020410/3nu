"use strict";
const {createCampusServer}=require('./local106.cjs'),{createCommunityHTTP}=require('./http107.cjs'),{createRequestPolicy}=require('./request-policy111.cjs');
const {backupHealthy}=require('./backup-ops112.cjs');
function createLocal107(options={}){
 const requestPolicy=createRequestPolicy(options),api=createCommunityHTTP({...options,requestPolicy});
 const campus=createCampusServer({capacity:300,channels:['01'],legacyChannels:['02','03'],...options,requestPolicy,requestHandler:api.handle,social:api.social,socialIdentity:api.socialIdentity,verifySocialToken:api.verifySocialToken,ready:()=>api.store.db.prepare('SELECT 1 AS ok').get().ok===1&&backupHealthy(options.backupStatusFile,options.backupMaxAgeMs),build:127});let closing;
 return{...campus,api,close:()=>closing||=(async()=>{await campus.close();api.close()})()};
}
module.exports={createLocal107};
if(require.main===module){
 const environment=process.env.NODE_ENV==='production'?'production':'development';
 if(environment==='production'&&!process.env.CAMPUS_DATA_DIR)throw Error('Production requires a persistent CAMPUS_DATA_DIR outside main');
 const c=createLocal107({directory:process.env.CAMPUS_DATA_DIR,environment,backupStatusFile:process.env.CAMPUS_BACKUP_STATUS_FILE,backupMaxAgeMs:Number(process.env.CAMPUS_BACKUP_MAX_AGE_HOURS||30)*3600000,publicOrigin:process.env.CAMPUS_PUBLIC_ORIGIN,browserOrigin:process.env.CAMPUS_BROWSER_ORIGIN,edgeProxySecret:process.env.CAMPUS_EDGE_PROXY_SECRET,trustProxy:(process.env.CAMPUS_TRUST_PROXY||'').split(',').filter(Boolean)});
 c.server.requestTimeout=10000;c.server.headersTimeout=10000;
 c.listen(Number(process.env.PORT||8766),process.env.HOST||'127.0.0.1').then(a=>console.log('3NU BUILD127 '+environment+' http://'+a.address+':'+a.port));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>c.close().then(()=>process.exit(0)));
}
