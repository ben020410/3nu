"use strict";
const fs=require('node:fs'),path=require('node:path');
function configure(root,env){
 const origin=new URL(env.CAMPUS_BROWSER_ORIGIN),upstream=new URL(env.CAMPUS_UPSTREAM_ORIGIN);
 if(origin.protocol!=='https:'||origin.origin!==env.CAMPUS_BROWSER_ORIGIN||upstream.protocol!=='https:'||upstream.origin!==env.CAMPUS_UPSTREAM_ORIGIN||origin.username||upstream.username||origin.origin===upstream.origin)throw Error('Use distinct HTTPS origins without trailing slashes');
 if(!/^[a-f0-9]{64}$/.test(env.CAMPUS_EDGE_PROXY_SECRET||''))throw Error('Missing server-only gateway key');
 const packageFile=path.join(root,'package.json'),build=fs.existsSync(packageFile)?String(JSON.parse(fs.readFileSync(packageFile,'utf8')).version).split('.').at(-1):'116';
 if(!/^\d+$/.test(build)||Number(build)<116||env.CAMPUS_RELEASE_APPROVED!==build)throw Error('Publication is not enabled. Complete private checks and get owner go-live instruction first.');
 const site=path.join(root,'dist'),file=path.join(site,'index.html');let html=fs.readFileSync(file,'utf8');
 html=html.replaceAll('https://165.22.247.213/',origin.origin+'/');
 const tag='<script defer src="hosting116.js?v='+build+'"></script>';
 html=html.replace(/<script defer src="hosting116\.js[^"]*"><\/script>/g,'');
 if(!html.includes('src="hosting116.js'))html=html.replace('<script defer src="multiplayer106.js',tag+'<script defer src="multiplayer106.js');
 if(!html.includes(tag))throw Error('Multiplayer script anchor missing');
 fs.writeFileSync(file,html);
 fs.writeFileSync(path.join(site,'hosting116.js'),'"use strict";\nif(location.origin==='+JSON.stringify(origin.origin)+')window.CAMPUS_MULTIPLAYER_URL='+JSON.stringify(upstream.origin.replace(/^https:/,'wss:')+'/multiplayer')+';\n');
 // The secret is deliberately read for validation only, never emitted into public files.
 console.log('3NU frontend prepared for '+origin.origin+'; publication is performed separately by Vercel.');
}
module.exports={configure};
if(require.main===module)configure(path.resolve(__dirname,'..'),process.env);
