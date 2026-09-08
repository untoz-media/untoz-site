import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve('dist');
if(!fs.existsSync(dist))throw new Error('Missing dist directory.');

const htmlFiles=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(entry.isFile()&&entry.name.endsWith('.html'))htmlFiles.push(full);
  }
}
walk(dist);

let injected=0,skipped=0;
for(const file of htmlFiles){
  const rel=path.relative(dist,file).split(path.sep).join('/');
  if(rel==='admin/index.html'||rel.startsWith('admin/')){skipped++;continue}
  let html=fs.readFileSync(file,'utf8');
  if(html.includes('data-untoz-analytics')){skipped++;continue}
  const src=path.relative(path.dirname(file),path.join(dist,'analytics-runtime.js')).split(path.sep).join('/')||'./analytics-runtime.js';
  const tag=`<script data-untoz-analytics src="${src.startsWith('.')?src:'./'+src}"></script>`;
  if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,`${tag}</body>`);
  else html+=tag;
  fs.writeFileSync(file,html);
  injected++;
}
console.log(`Analytics runtime injected into ${injected} public HTML file(s); skipped ${skipped}.`);
