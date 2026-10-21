import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let failed=false;
for(const file of ['collect.mjs','collect-weather.mjs','collect-regions.mjs','collect-media.mjs']){const code=await new Promise(resolve=>{const p=spawn(process.execPath,[fileURLToPath(new URL(file,import.meta.url))],{stdio:'inherit'});p.once('error',e=>{console.error(e);resolve(1)});p.once('exit',resolve)});if(code!==0)failed=true}
if(failed)process.exitCode=1;
