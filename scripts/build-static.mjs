import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Publish only browser assets. Collectors, audit files and documentation stay outside dist.
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'dist');
const files=['index.html','styles.css','recent-updates.js','weather-ui.js','regions-ui.js','media-ui.js',...['policies','weather','regions','media'].map(s=>'data/'+s+'.js')];
// Validate every input before touching the output.
for(const name of files)await fs.access(path.join(root,name));
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))if(!files.includes(m[1]))throw Error('未打包页面资源：'+m[1]);
for(const name of files){const dest=path.join(output,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(root,name),dest)}
console.log('Static site ready: '+output+' ('+files.length+' files)');
