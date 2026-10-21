import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let running=false;
function sync(){if(running)return;running=true;const child=spawn(process.execPath,[fileURLToPath(new URL('./update-all.mjs',import.meta.url))],{stdio:'inherit'});child.once('error',e=>{running=false;console.error(e)});child.once('exit',code=>{running=false;console.log(new Date().toISOString(),'sync exit',code)})}
sync();setInterval(sync,60*60*1000);
