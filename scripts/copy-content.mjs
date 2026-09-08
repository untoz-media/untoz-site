import fs from 'node:fs';
import path from 'node:path';

const source=path.resolve('content');
const target=path.resolve('dist/content');
if(!fs.existsSync(source))throw new Error('Missing content directory.');
fs.rmSync(target,{recursive:true,force:true});
fs.cpSync(source,target,{recursive:true});
console.log('Copied content/ to dist/content/');
