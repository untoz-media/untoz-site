import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('content');
const errors=[];
const warnings=[];
const fail=(msg)=>errors.push(msg);
const warn=(msg)=>warnings.push(msg);
const slugify=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const read=(file,fallback)=>{const p=path.join(root,file);try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){fail(`${file}: invalid or missing JSON (${e.message})`);return fallback}};
const duplicateValues=(values)=>{const seen=new Set(),dupes=new Set();for(const v of values){if(seen.has(v))dupes.add(v);seen.add(v)}return [...dupes]};
const validDate=v=>{const d=new Date(v);return !!v&&!Number.isNaN(d.getTime())};
const validColor=v=>/^#[0-9a-f]{6}$/i.test(String(v||''));
const validStatus=new Set(['Draft','Published','Scheduled']);

const posts=read('posts.json',[]);
const pages=read('pages/index.json',[]);
const categories=read('categories.json',[]);
const genres=read('genres.json',[]);
const homepage=read('homepage.json',{version:1,blocks:[]});
const brandsData=read('brands.json',{version:1,brands:[]});
const site=read('site.json',{});
const media=read('media.json',[]);

if(!Array.isArray(posts))fail('posts.json must be an array.');
if(!Array.isArray(pages))fail('pages/index.json must be an array.');
if(!Array.isArray(categories))fail('categories.json must be an array.');
if(!Array.isArray(genres))fail('genres.json must be an array.');
if(!Array.isArray(media))fail('media.json must be an array.');
if(!Array.isArray(homepage?.blocks))fail('homepage.json must contain a blocks array.');
if(!Array.isArray(brandsData?.brands))fail('brands.json must contain a brands array.');

const categoryNames=new Set((Array.isArray(categories)?categories:[]).map(String));
const categorySlugs=new Set((Array.isArray(categories)?categories:[]).map(slugify).filter(Boolean));
const categoryDupes=duplicateValues((Array.isArray(categories)?categories:[]).map(slugify).filter(Boolean));
if(categoryDupes.length)fail(`Duplicate category slugs: ${categoryDupes.join(', ')}`);
const genreDupes=duplicateValues((Array.isArray(genres)?genres:[]).map(x=>String(x).trim().toLowerCase()).filter(Boolean));
if(genreDupes.length)fail(`Duplicate genres: ${genreDupes.join(', ')}`);

const postRoutes=[];
for(const [i,p] of (Array.isArray(posts)?posts:[]).entries()){
  const at=`posts.json[${i}]`;
  if(!p||typeof p!=='object'){fail(`${at}: must be an object.`);continue}
  if(!String(p.title||'').trim())fail(`${at}: title is required.`);
  const slug=slugify(p.slug);
  if(!slug)fail(`${at}: slug is required.`);
  if(p.slug&&String(p.slug)!==slug)warn(`${at}: slug “${p.slug}” normalizes to “${slug}”.`);
  if(!validStatus.has(p.status))fail(`${at}: invalid status “${p.status}”.`);
  if(!categoryNames.has(String(p.category||'')))fail(`${at}: unknown category “${p.category||''}”.`);
  if(!String(p.author||'').trim())warn(`${at}: author is empty.`);
  if(p.date&&!validDate(p.date))fail(`${at}: invalid date “${p.date}”.`);
  if(p.status==='Scheduled'){
    if(!validDate(p.scheduled_at))fail(`${at}: Scheduled posts require a valid scheduled_at.`);
  }
  if(p.status==='Published'&&!p.date&&!p.published_at)warn(`${at}: Published post has no date/published_at.`);
  if(Array.isArray(p.related)&&p.related.some(x=>typeof x!=='string'))fail(`${at}: related must contain only post slugs.`);
  if(slug)postRoutes.push(`${slugify(p.category||'news')||'news'}/${slug}`);
}
const duplicatePostRoutes=duplicateValues(postRoutes);
if(duplicatePostRoutes.length)fail(`Duplicate article routes: ${duplicatePostRoutes.join(', ')}`);
const knownPostSlugs=new Set((Array.isArray(posts)?posts:[]).map(p=>String(p?.slug||'')).filter(Boolean));
for(const p of (Array.isArray(posts)?posts:[]))for(const related of Array.isArray(p?.related)?p.related:[])if(!knownPostSlugs.has(related))warn(`Post “${p.slug||p.title}” references missing related post “${related}”.`);

const reservedTop=new Set(['admin','search','media','assets','src','content']);
const pageSlugs=[];
for(const [i,p] of (Array.isArray(pages)?pages:[]).entries()){
  const at=`pages/index.json[${i}]`;
  if(!p||typeof p!=='object'){fail(`${at}: must be an object.`);continue}
  if(!String(p.title||'').trim())fail(`${at}: title is required.`);
  if(!validStatus.has(p.status))fail(`${at}: invalid status “${p.status}”.`);
  const s=slugify(p.slug);
  if(p.slug&&String(p.slug)!==s)warn(`${at}: slug “${p.slug}” normalizes to “${s}”.`);
  if(s){pageSlugs.push(s);if(reservedTop.has(s))fail(`${at}: page slug “${s}” is reserved.`);if(categorySlugs.has(s))fail(`${at}: page slug “${s}” collides with a category/brand route.`)}
  if(p.blocks!==undefined&&!Array.isArray(p.blocks))fail(`${at}: blocks must be an array.`);
  if(p.styles!==undefined&&(typeof p.styles!=='object'||Array.isArray(p.styles)||p.styles===null))fail(`${at}: styles must be an object.`);
}
const duplicatePageSlugs=duplicateValues(pageSlugs);
if(duplicatePageSlugs.length)fail(`Duplicate page slugs: ${duplicatePageSlugs.join(', ')}`);

const brands=Array.isArray(brandsData?.brands)?brandsData.brands:[];
const brandIds=[];
for(const [i,b] of brands.entries()){
  const at=`brands.json.brands[${i}]`;
  if(!b||typeof b!=='object'){fail(`${at}: must be an object.`);continue}
  const id=slugify(b.id||b.short||b.name);
  if(!id)fail(`${at}: id/name is required.`);else brandIds.push(id);
  if(String(b.id||'')!==id)warn(`${at}: id “${b.id||''}” normalizes to “${id}”.`);
  if(!String(b.name||'').trim())fail(`${at}: name is required.`);
  if(!String(b.short||'').trim())warn(`${at}: short name is empty.`);
  if(!validColor(b.accent))fail(`${at}: accent must be a six-digit hex colour.`);
  if(!Array.isArray(b.categories)||!b.categories.length)warn(`${at}: brand has no categories.`);
  else for(const c of b.categories)if(!categoryNames.has(String(c)))fail(`${at}: references unknown category “${c}”.`);
  if(b.navigation!==undefined&&!Array.isArray(b.navigation))fail(`${at}: navigation must be an array.`);
}
const duplicateBrands=duplicateValues(brandIds);
if(duplicateBrands.length)fail(`Duplicate brand IDs: ${duplicateBrands.join(', ')}`);
for(const id of brandIds)if(pageSlugs.includes(id))fail(`Brand route “/${id}/” collides with a custom page.`);

if(!site||typeof site!=='object'||Array.isArray(site))fail('site.json must be an object.');
else{
  if(!String(site.site?.title||'').trim())fail('site.json: site.title is required.');
  if(site.site?.language&&!['en','pt'].includes(site.site.language))warn(`site.json: unusual language “${site.site.language}”.`);
  if(site.site?.theme&&!['system','light','dark'].includes(site.site.theme))fail(`site.json: invalid theme “${site.site.theme}”.`);
  for(const key of ['primary','secondary','accent'])if(site.brand?.[key]&&!validColor(site.brand[key]))fail(`site.json: brand.${key} must be a six-digit hex colour.`);
  if(site.navigation?.main!==undefined&&!Array.isArray(site.navigation.main))fail('site.json: navigation.main must be an array.');
}

const mediaIds=[],mediaUrls=[];
for(const [i,a] of (Array.isArray(media)?media:[]).entries()){
  const at=`media.json[${i}]`;
  if(!a||typeof a!=='object'){fail(`${at}: must be an object.`);continue}
  if(!String(a.id||'').trim())fail(`${at}: id is required.`);else mediaIds.push(String(a.id));
  if(!String(a.url||'').trim())fail(`${at}: url is required.`);else mediaUrls.push(String(a.url));
  if(a.type&&!['Image','Video','Document'].includes(a.type))fail(`${at}: unsupported type “${a.type}”.`);
}
const duplicateMediaIds=duplicateValues(mediaIds);if(duplicateMediaIds.length)fail(`Duplicate media IDs: ${duplicateMediaIds.join(', ')}`);
const duplicateMediaUrls=duplicateValues(mediaUrls);if(duplicateMediaUrls.length)warn(`Duplicate media URLs: ${duplicateMediaUrls.join(', ')}`);

const blockIds=(Array.isArray(homepage?.blocks)?homepage.blocks:[]).map(b=>String(b?.id||'')).filter(Boolean);
const duplicateBlockIds=duplicateValues(blockIds);if(duplicateBlockIds.length)fail(`Duplicate homepage block IDs: ${duplicateBlockIds.join(', ')}`);

if(warnings.length){console.warn(`\nUntoz CMS validation warnings (${warnings.length}):`);for(const w of warnings)console.warn(`  ⚠ ${w}`)}
if(errors.length){console.error(`\nUntoz CMS validation failed (${errors.length} error${errors.length===1?'':'s'}):`);for(const e of errors)console.error(`  ✖ ${e}`);process.exit(1)}
console.log(`Untoz CMS validation passed: ${posts.length} posts, ${pages.length} pages, ${brands.length} brands, ${media.length} media assets.`);
