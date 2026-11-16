'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const {defaultDirectory}=require('../server/http107.cjs');
const directory=path.resolve(process.argv[2]||defaultDirectory),main=path.resolve(__dirname,'..');if(directory===main||directory.startsWith(main+path.sep))throw Error('Private runtime must be outside main');
fs.mkdirSync(directory,{recursive:true,mode:0o700});fs.chmodSync(directory,0o700);const file=path.join(directory,'private.json');if(fs.existsSync(file))throw Error('Already configured; existing credential is preserved');
const password=crypto.randomBytes(24).toString('base64url'),salt=crypto.randomBytes(32).toString('hex'),config={salt,passwordHash:crypto.scryptSync(password,salt,64).toString('hex'),secret:crypto.randomBytes(32).toString('hex')};
fs.writeFileSync(file,JSON.stringify(config),{flag:'wx',mode:0o600});fs.writeFileSync(path.join(directory,'ADMIN-PASSWORD.txt'),password+'\n',{flag:'wx',mode:0o600});console.log('Private local setup complete. Read ADMIN-PASSWORD.txt in: '+directory);
