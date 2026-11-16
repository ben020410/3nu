"use strict";
const {runBackup}=require('../server/backup-ops112.cjs');
runBackup({source:process.env.CAMPUS_DATA_DIR,root:process.env.CAMPUS_BACKUP_ROOT,statusFile:process.env.CAMPUS_BACKUP_STATUS_FILE,requireOffsite:process.env.CAMPUS_BACKUP_REQUIRE_OFFSITE!=='false'}).then(r=>console.log(JSON.stringify({ok:r.ok,completedAt:r.completedAt,offsite:r.offsite}))).catch(e=>{console.error(e.message);process.exitCode=1});
