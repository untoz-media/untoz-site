import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve('dist');
const contentDir=path.resolve('content');
if(!fs.existsSync(dist))throw new Error('Missing dist directory. Run the Vite build first.');

const readJson=(name,fallback)=>{try{return JSON.parse(fs.readFileSync(path.join(contentDir,name),'utf8'))}catch{return fallback}};
const slugify=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const pages=readJson('pages/index.json',[]);
const posts=readJson('posts.json',[]);
const brandsData=readJson('brands.json',{brands:[]});
const categories=readJson('categories.json',[]);

const validPages=new Set((Array.isArray(pages)?pages:[]).map(p=>slugify(p?.slug)).filter(Boolean));
const validBrands=new Set((Array.isArray(brandsData?.brands)?brandsData.brands:[]).filter(b=>b?.enabled!==false).map(b=>slugify(b?.id||b?.short||b?.name)).filter(Boolean));
const validCategories=new Set((Array.isArray(categories)?categories:[]).map(slugify).filter(Boolean));
const validArticles=new Set((Array.isArray(posts)?posts:[]).filter(p=>['Published','Scheduled'].includes(p?.status)&&slugify(p?.slug)).map(p=>`${slugify(p?.category||'news')||'news'}/${slugify(p.slug)}`));

const attr=(html,name)=>html.match(new RegExp(`${name}=["']([^"']+)["']`,'i'))?.[1]||'';
const indexFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&entry.name==='index.html'&&full!==path.join(dist,'index.html'))indexFiles.push(full)}}
walk(dist);

let removed=0;
for(const file of indexFiles){
  const html=fs.readFileSync(file,'utf8');
  const relDir=path.relative(dist,path.dirname(file)).split(path.sep).join('/');
  let managed=false,valid=true,label='';

  const pageSlug=slugify(attr(html,'data-untoz-page'));
  const brandSlug=slugify(attr(html,'data-subsidiary'));
  const categoryName=attr(html,'data-category');
  const articleCategory=slugify(attr(html,'data-article-category'));
  const articleSlug=slugify(attr(html,'data-article-slug'));

  if(pageSlug){managed=true;valid=validPages.has(pageSlug)&&relDir===pageSlug;label=`page ${relDir}`}
  else if(brandSlug){managed=true;valid=validBrands.has(brandSlug)&&relDir===brandSlug;label=`brand ${relDir}`}
  else if(categoryName){const categorySlug=slugify(categoryName);managed=true;valid=validCategories.has(categorySlug)&&relDir===categorySlug;label=`category ${relDir}`}
  else if(articleCategory&&articleSlug){managed=true;valid=validArticles.has(`${articleCategory}/${articleSlug}`)&&relDir===`${articleCategory}/${articleSlug}`;label=`article ${relDir}`}

  if(managed&&!valid){
    fs.rmSync(file,{force:true});removed++;
    console.log(`Pruned stale ${label}`);
    let dir=path.dirname(file);
    while(dir!==dist&&fs.existsSync(dir)&&fs.readdirSync(dir).length===0){fs.rmdirSync(dir);dir=path.dirname(dir)}
  }
}

console.log(`Route pruning complete: ${removed} stale route${removed===1?'':'s'} removed from dist.`);
