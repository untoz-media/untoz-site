(()=>{
  const CMS_KEY='untozCommandCMS';
  let saveTimer=null;
  let pickerQuery='';
  let previewMode='article';

  function readCMS(){try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}}
  function writeCMS(state){localStorage.setItem(CMS_KEY,JSON.stringify(state))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function slugify(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function currentEditor(){const panel=document.querySelector('.view.active .editor-panel');return panel&&panel.querySelector('#post-title')?panel:null}
  function postId(panel=currentEditor()){const save=panel?.querySelector('[data-action="save-post"]');return save?String(save.dataset.id):null}
  function currentPost(panel=currentEditor()){const id=postId(panel);const state=readCMS();return (state.posts||[]).find(x=>String(x.id)===id)||{}}
  function value(id,fallback=''){const el=document.getElementById(id);return el?el.value:fallback}
  function checked(id){return !!document.getElementById(id)?.checked}
  function textOnly(html){const d=document.createElement('div');d.innerHTML=html||'';return (d.textContent||'').trim()}
  function asEditorHTML(content){const s=String(content||'');if(/<\/?[a-z][\s\S]*>/i.test(s))return sanitize(s);return s.split(/\n{2,}/).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}
  function sanitize(html){
    const t=document.createElement('template');t.innerHTML=String(html||'');
    t.content.querySelectorAll('script,style,iframe,object,embed,form,input,button').forEach(x=>x.remove());
    t.content.querySelectorAll('*').forEach(el=>{[...el.attributes].forEach(a=>{const n=a.name.toLowerCase();if(n.startsWith('on')||n==='style'||n==='srcdoc')el.removeAttribute(a.name);if(n==='href'&&!/^(https?:|mailto:|\/|#)/i.test(a.value))el.removeAttribute(a.name)});});
    return t.innerHTML;
  }
  function toLocalDateTime(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
  function fromLocalDateTime(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString()}

  function build(panel){
    const p=currentPost(panel);
    const title=value('post-title',p.title||'');
    const slug=value('post-slug',p.slug||'');
    const status=value('post-status',p.status||'Draft');
    const category=value('post-category',p.category||'News');
    const genre=value('post-genre',p.genre||'');
    const author=value('post-author',p.author||'Untoz');
    const date=value('post-date',p.date||'');
    const image=value('post-image',p.image||'');
    const excerpt=value('post-excerpt',p.excerpt||'');
    const content=value('post-content',p.content||'');
    const seo=value('post-seo',p.seo||'');
    const state=readCMS();
    const related=new Set(Array.isArray(p.related)?p.related:[]);
    const others=(state.posts||[]).filter(x=>String(x.id)!==postId(panel));
    if(!document.querySelector('#post-status option[value="Scheduled"]')){const opt=document.createElement('option');opt.value='Scheduled';opt.textContent='Scheduled';document.getElementById('post-status')?.appendChild(opt)}
    return `<div class="command-post2" data-post-editor2>
      <div class="command-post2-main">
        <section class="command-post2-card">
          <div class="command-post2-field"><label>Headline</label><input class="command-post2-title" id="p2-title" value="${esc(title)}" placeholder="Write a strong headline…"></div>
          <div class="command-post2-row" style="margin-top:12px">
            <div class="command-post2-field"><label>Slug</label><div class="command-post2-slug"><input id="p2-slug" value="${esc(slug)}"><button type="button" id="p2-slug-auto">Auto</button></div></div>
            <div class="command-post2-field"><label>Author</label><input id="p2-author" value="${esc(author)}"></div>
          </div>
          <div class="command-post2-row" style="margin-top:12px">
            <div class="command-post2-field"><label>Category</label><select id="p2-category">${(state.categories||[]).map(x=>`<option ${x===category?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
            <div class="command-post2-field"><label>Genre</label><select id="p2-genre"><option value="">None</option>${(state.genres||[]).map(x=>`<option ${x===genre?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
          </div>
        </section>

        <section class="command-post2-card">
          <h3>Story</h3>
          <div class="command-post2-toolbar" id="p2-toolbar">
            <button type="button" data-cmd="formatBlock" data-value="p">P</button><button type="button" data-cmd="formatBlock" data-value="h2">H2</button><button type="button" data-cmd="formatBlock" data-value="h3">H3</button><button type="button" data-cmd="bold"><b>B</b></button><button type="button" data-cmd="italic"><i>I</i></button><button type="button" data-cmd="insertUnorderedList">• List</button><button type="button" data-cmd="formatBlock" data-value="blockquote">❝</button><button type="button" data-link>Link</button><button type="button" data-clear>Clear</button>
          </div>
          <div class="command-post2-editor" id="p2-content" contenteditable="true">${asEditorHTML(content)}</div>
          <div class="command-post2-counter"><span id="p2-word-count">0 words</span><span>Rich text · autosave enabled</span></div>
        </section>

        <section class="command-post2-card">
          <h3>Excerpt & SEO</h3>
          <div class="command-post2-field"><label>Excerpt</label><textarea id="p2-excerpt" rows="4" maxlength="300">${esc(excerpt)}</textarea><div class="command-post2-counter"><span>Used on cards and previews</span><span id="p2-excerpt-count">${excerpt.length}/300</span></div></div>
          <div class="command-post2-row" style="margin-top:12px"><div class="command-post2-field full"><label>SEO title</label><input id="p2-seo-title" value="${esc(p.seo_title||'')}" maxlength="70" placeholder="Defaults to headline"><div class="command-post2-counter"><span>Recommended: 30–60 characters</span><span id="p2-seo-title-count">0/70</span></div></div></div>
          <div class="command-post2-field" style="margin-top:12px"><label>SEO description</label><textarea id="p2-seo" rows="3" maxlength="180">${esc(seo)}</textarea><div class="command-post2-counter"><span>Recommended: 120–160 characters</span><span id="p2-seo-count">${seo.length}/180</span></div></div>
        </section>

        <section class="command-post2-card">
          <h3>Social sharing</h3>
          <div class="command-post2-field"><label>Social title</label><input id="p2-social-title" value="${esc(p.social_title||'')}" placeholder="Defaults to SEO title / headline"></div>
          <div class="command-post2-field" style="margin-top:12px"><label>Social description</label><textarea id="p2-social-description" rows="3" placeholder="Defaults to excerpt / SEO description">${esc(p.social_description||'')}</textarea></div>
        </section>

        <section class="command-post2-card">
          <div class="command-post2-preview-tabs"><button type="button" data-preview="article" class="${previewMode==='article'?'active':''}">Article</button><button type="button" data-preview="google" class="${previewMode==='google'?'active':''}">Google</button><button type="button" data-preview="social" class="${previewMode==='social'?'active':''}">Social</button></div>
          <div id="p2-preview"></div>
        </section>
      </div>

      <aside class="command-post2-side">
        <section class="command-post2-card">
          <h3>Publish</h3>
          <div class="command-post2-field"><label>Status</label><select id="p2-status"><option ${status==='Draft'?'selected':''}>Draft</option><option ${status==='Published'?'selected':''}>Published</option><option ${status==='Scheduled'?'selected':''}>Scheduled</option></select></div>
          <div class="command-post2-field command-post2-schedule-row ${status==='Scheduled'?'show':''}" id="p2-schedule-row" style="margin-top:10px"><label>Publish date & time</label><input id="p2-scheduled" type="datetime-local" value="${esc(toLocalDateTime(p.scheduled_at))}"></div>
          <div class="command-post2-field" style="margin-top:10px"><label>Original date</label><input id="p2-date" type="date" value="${esc(date)}"></div>
          <div class="command-post2-status-note" id="p2-status-note" style="margin-top:10px"></div>
          <span class="command-post2-save-state saved" id="p2-save-state">Autosaved</span>
        </section>

        <section class="command-post2-card">
          <h3>Featured image</h3>
          <div class="command-post2-image" id="p2-image-preview">${image?`<img src="${esc(image)}" alt="Featured image">`:'<span>No featured image selected</span>'}</div>
          <div class="command-post2-field"><label>Image URL</label><input id="p2-image" value="${esc(image)}" placeholder="https://…"></div>
          <div class="command-post2-media-actions" style="margin-top:9px"><button type="button" id="p2-media-pick">Choose from Media</button><button type="button" id="p2-image-clear">Clear</button></div>
        </section>

        <section class="command-post2-card">
          <h3>Story placement</h3>
          <div class="command-post2-switches">
            ${switchRow('p2-featured','Featured','Eligible for featured sections',!!p.featured)}
            ${switchRow('p2-breaking','Breaking','Mark as breaking news',!!p.breaking)}
            ${switchRow('p2-pinned','Pinned','Keep above normal stories',!!p.pinned)}
            ${switchRow('p2-top-story','Top Story','Prioritise as a lead story',!!p.top_story)}
          </div>
        </section>

        <section class="command-post2-card">
          <h3>SEO score</h3>
          <div class="command-post2-seo-score"><div class="command-post2-score-ring" id="p2-score-ring"><strong id="p2-score">0</strong></div><div class="command-post2-seo-copy"><b id="p2-score-label">Needs work</b><small>Editorial readiness score</small></div></div>
          <div class="command-post2-checklist" id="p2-checklist"></div>
        </section>

        <section class="command-post2-card">
          <h3>Related posts</h3>
          <div class="command-post2-related">${others.length?others.map(x=>`<label><input type="checkbox" data-related value="${esc(x.slug||'')}" ${related.has(x.slug)?'checked':''}><span>${esc(x.title||'Untitled')}</span></label>`).join(''):'<label><span>No other posts yet.</span></label>'}</div>
        </section>
      </aside>
    </div>`;
  }

  function switchRow(id,title,desc,on){return `<label class="command-post2-switch"><div><b>${title}</b><small>${desc}</small></div><input id="${id}" type="checkbox" ${on?'checked':''}></label>`}

  function enhance(){
    const panel=currentEditor();if(!panel||panel.classList.contains('command-post-editor2'))return;
    panel.classList.add('command-post-editor2');
    const form=panel.querySelector('.form-grid');if(!form)return;
    const wrap=document.createElement('div');wrap.innerHTML=build(panel);form.before(wrap.firstElementChild);
    bind(panel);syncAll(false);renderPreview();updateSEO();updateSchedule();
  }

  function bind(panel){
    const watch=['p2-title','p2-slug','p2-author','p2-category','p2-genre','p2-excerpt','p2-seo-title','p2-seo','p2-social-title','p2-social-description','p2-status','p2-scheduled','p2-date','p2-image','p2-featured','p2-breaking','p2-pinned','p2-top-story'];
    watch.forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener(el.type==='checkbox'?'change':'input',()=>{if(id==='p2-status')updateSchedule();if(id==='p2-image')updateImage();syncAll(true);renderPreview();updateSEO();updateCounters()})});
    document.getElementById('p2-category')?.addEventListener('change',()=>{syncAll(true);renderPreview();updateSEO()});
    document.getElementById('p2-genre')?.addEventListener('change',()=>syncAll(true));
    document.querySelectorAll('[data-related]').forEach(x=>x.addEventListener('change',()=>syncAll(true)));
    const editor=document.getElementById('p2-content');if(editor)editor.addEventListener('input',()=>{syncAll(true);renderPreview();updateSEO();updateCounters()});
    document.getElementById('p2-slug-auto')?.addEventListener('click',()=>{document.getElementById('p2-slug').value=slugify(document.getElementById('p2-title').value);syncAll(true);renderPreview();updateSEO()});
    document.getElementById('p2-title')?.addEventListener('blur',()=>{const slug=document.getElementById('p2-slug');if(slug&&!slug.value.trim()){slug.value=slugify(document.getElementById('p2-title').value);syncAll(true);renderPreview();updateSEO()}});
    document.getElementById('p2-toolbar')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();document.getElementById('p2-content')?.focus();if(b.dataset.link!==undefined){const url=prompt('Link URL:','https://');if(url&&/^(https?:|mailto:|\/|#)/i.test(url))document.execCommand('createLink',false,url)}else if(b.dataset.clear!==undefined){document.execCommand('removeFormat',false,null)}else if(b.dataset.cmd){document.execCommand(b.dataset.cmd,false,b.dataset.value||null)}syncAll(true);renderPreview();updateSEO()});
    document.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>{previewMode=b.dataset.preview;document.querySelectorAll('[data-preview]').forEach(x=>x.classList.toggle('active',x===b));renderPreview()}));
    document.getElementById('p2-media-pick')?.addEventListener('click',openPicker);
    document.getElementById('p2-image-clear')?.addEventListener('click',()=>{document.getElementById('p2-image').value='';updateImage();syncAll(true);renderPreview();updateSEO()});
    updateCounters();
  }

  function collect(){
    const content=sanitize(document.getElementById('p2-content')?.innerHTML||'');
    return {
      title:value('p2-title'),slug:value('p2-slug'),author:value('p2-author'),category:value('p2-category'),genre:value('p2-genre'),excerpt:value('p2-excerpt'),content,
      seo_title:value('p2-seo-title'),seo:value('p2-seo'),social_title:value('p2-social-title'),social_description:value('p2-social-description'),status:value('p2-status'),scheduled_at:value('p2-status')==='Scheduled'?fromLocalDateTime(value('p2-scheduled')):'',date:value('p2-date'),image:value('p2-image'),featured:checked('p2-featured'),breaking:checked('p2-breaking'),pinned:checked('p2-pinned'),top_story:checked('p2-top-story'),related:[...document.querySelectorAll('[data-related]:checked')].map(x=>x.value).filter(Boolean),updated_at:new Date().toISOString()
    }
  }

  function syncHidden(data){
    const map={title:'post-title',slug:'post-slug',author:'post-author',category:'post-category',genre:'post-genre',excerpt:'post-excerpt',content:'post-content',seo:'post-seo',status:'post-status',date:'post-date',image:'post-image'};
    Object.entries(map).forEach(([k,id])=>{const el=document.getElementById(id);if(!el)return;if(k==='status'&&data.status==='Scheduled'&&!el.querySelector('option[value="Scheduled"]')){const o=document.createElement('option');o.value='Scheduled';o.textContent='Scheduled';el.appendChild(o)}el.value=data[k]??''});
  }

  function mergePost(data){const id=postId();if(!id)return;const state=readCMS();const post=(state.posts||[]).find(x=>String(x.id)===id);if(!post)return;Object.assign(post,data,{type:data.category||post.type});writeCMS(state)}
  function syncAll(autosave=true){const data=collect();syncHidden(data);if(!autosave)return;const badge=document.getElementById('p2-save-state');if(badge){badge.textContent='Saving…';badge.classList.remove('saved')}clearTimeout(saveTimer);saveTimer=setTimeout(()=>{mergePost(data);if(badge){badge.textContent='Autosaved';badge.classList.add('saved')}},450)}

  function updateCounters(){const excerpt=value('p2-excerpt');const seo=value('p2-seo');const seoTitle=value('p2-seo-title');const words=textOnly(document.getElementById('p2-content')?.innerHTML||'').split(/\s+/).filter(Boolean).length;const wc=document.getElementById('p2-word-count');if(wc)wc.textContent=`${words} word${words===1?'':'s'}`;const ec=document.getElementById('p2-excerpt-count');if(ec)ec.textContent=`${excerpt.length}/300`;const sc=document.getElementById('p2-seo-count');if(sc)sc.textContent=`${seo.length}/180`;const st=document.getElementById('p2-seo-title-count');if(st)st.textContent=`${seoTitle.length}/70`}
  function updateSchedule(){const scheduled=value('p2-status')==='Scheduled';document.getElementById('p2-schedule-row')?.classList.toggle('show',scheduled);const note=document.getElementById('p2-status-note');if(!note)return;if(scheduled){const d=value('p2-scheduled');note.textContent=d?'Scheduled metadata will be published with this story. Automatic release depends on the public site scheduler.':'Choose a date and time for this scheduled story.'}else if(value('p2-status')==='Published')note.textContent='This story is marked as published and can be shown by the public site.';else note.textContent='Drafts remain stored in the CMS but should not be shown publicly.'}
  function updateImage(){const box=document.getElementById('p2-image-preview');if(!box)return;const url=value('p2-image').trim();box.innerHTML=url?`<img src="${esc(url)}" alt="Featured image" onerror="this.parentElement.innerHTML='<span>Could not load this image</span>'">`:'<span>No featured image selected</span>'}

  function seoState(){
    const d=collect();const body=textOnly(d.content);const title=(d.seo_title||d.title).trim();const checks=[
      ['Headline is present',d.title.trim().length>=10,15],['Slug is clean',d.slug.length>=3&&d.slug===slugify(d.slug),10],['Featured image selected',!!d.image.trim(),15],['Excerpt is useful',d.excerpt.trim().length>=60,10],['SEO title length',title.length>=30&&title.length<=60,15],['SEO description length',d.seo.length>=120&&d.seo.length<=160,15],['Story has enough content',body.length>=300,15],['Category selected',!!d.category,5]
    ];const score=checks.reduce((n,x)=>n+(x[1]?x[2]:0),0);return{score,checks}
  }
  function updateSEO(){const {score,checks}=seoState();const ring=document.getElementById('p2-score-ring');if(ring)ring.style.setProperty('--score',`${score}%`);const val=document.getElementById('p2-score');if(val)val.textContent=score;const label=document.getElementById('p2-score-label');if(label)label.textContent=score>=85?'Ready to publish':score>=65?'Almost ready':score>=40?'Needs improvement':'Needs work';const list=document.getElementById('p2-checklist');if(list)list.innerHTML=checks.map(x=>`<div class="command-post2-check ${x[1]?'ok':''}"><i></i><span>${esc(x[0])}</span></div>`).join('')}

  function renderPreview(){
    const out=document.getElementById('p2-preview');if(!out)return;const d=collect();const title=d.title||'Untitled story';const seoTitle=d.seo_title||title;const desc=d.seo||d.excerpt||'Add an SEO description or excerpt.';const socialTitle=d.social_title||seoTitle;const socialDesc=d.social_description||d.excerpt||d.seo||'Add a social description.';const image=d.image.trim();
    if(previewMode==='google'){out.innerHTML=`<div class="command-post2-preview-browser"><div class="command-post2-google"><small>untoz.site › ${esc(d.category.toLowerCase())} › ${esc(d.slug||'story')}</small><h4>${esc(seoTitle)}</h4><p>${esc(desc.slice(0,170))}</p></div></div>`;return}
    if(previewMode==='social'){out.innerHTML=`<div class="command-post2-social"><div class="command-post2-social-image">${image?`<img src="${esc(image)}" alt="">`:'<span>No social image</span>'}</div><div class="command-post2-social-copy"><small>UNTOZ.SITE</small><b>${esc(socialTitle)}</b><p>${esc(socialDesc.slice(0,180))}</p></div></div>`;return}
    out.innerHTML=`<div class="command-post2-preview-browser"><div class="command-post2-preview-hero">${image?`<img src="${esc(image)}" alt="">`:'<span>Featured image</span>'}</div><div class="command-post2-preview-body"><span class="command-post2-preview-meta">${esc(d.breaking?'BREAKING · ':'')}${esc(d.category||'UNTOZ')}</span><h1>${esc(title)}</h1><p>${esc(d.excerpt||'Add an excerpt to preview the story introduction.')}</p><div class="command-post2-preview-article">${sanitize(d.content)||'<p>Your story preview will appear here.</p>'}</div></div></div>`
  }

  function installPicker(){if(document.getElementById('command-media-picker'))return;const m=document.createElement('div');m.id='command-media-picker';m.className='command-media-picker';m.hidden=true;m.innerHTML=`<div class="command-media-picker-backdrop"></div><div class="command-media-picker-card"><div class="command-media-picker-head"><h3>Choose featured image</h3><button type="button">×</button></div><div class="command-media-picker-search"><input type="search" id="command-media-picker-search" placeholder="Search Media Library…"></div><div class="command-media-picker-grid" id="command-media-picker-grid"></div></div>`;document.body.appendChild(m);m.querySelector('.command-media-picker-backdrop').onclick=closePicker;m.querySelector('.command-media-picker-head button').onclick=closePicker;m.querySelector('#command-media-picker-search').oninput=e=>{pickerQuery=e.target.value;renderPicker()}}
  function openPicker(){installPicker();pickerQuery='';const m=document.getElementById('command-media-picker');m.hidden=false;document.getElementById('command-media-picker-search').value='';renderPicker();setTimeout(()=>document.getElementById('command-media-picker-search')?.focus(),20)}
  function closePicker(){const m=document.getElementById('command-media-picker');if(m)m.hidden=true}
  function renderPicker(){const state=readCMS();const q=pickerQuery.toLowerCase();const media=(state.media||[]).filter(x=>(x.type||'Image')==='Image').filter(x=>!q||`${x.title||''} ${(x.tags||[]).join(' ')} ${x.alt||''}`.toLowerCase().includes(q));const grid=document.getElementById('command-media-picker-grid');if(!grid)return;grid.innerHTML=media.length?media.map(x=>`<button type="button" class="command-media-picker-item" data-pick-url="${esc(x.url||'')}"><img src="${esc(x.url||'')}" alt="${esc(x.alt||x.title||'')}" loading="lazy"><span>${esc(x.title||'Untitled image')}</span></button>`).join(''):'<div class="command-media-picker-empty">No images found in the Media Library.</div>';grid.querySelectorAll('[data-pick-url]').forEach(b=>b.onclick=()=>{document.getElementById('p2-image').value=b.dataset.pickUrl;updateImage();closePicker();syncAll(true);renderPreview();updateSEO()})}

  let capturedSave=null;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action="save-post"]');if(!b||!currentEditor())return;const data=collect();syncHidden(data);capturedSave={id:String(b.dataset.id),data}},true);
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action="save-post"]');if(!b||!capturedSave)return;const payload=capturedSave;capturedSave=null;setTimeout(()=>{const state=readCMS();const p=(state.posts||[]).find(x=>String(x.id)===payload.id);if(p){Object.assign(p,payload.data,{type:payload.data.category||p.type});writeCMS(state)}},30)},false);

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('command-media-picker')?.hidden)closePicker()});
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
