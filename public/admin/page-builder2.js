(()=>{
  const CMS_KEY='untozCommandCMS';
  let selectedBlockId=null;
  let previewDevice='desktop';
  let mediaTarget=null;
  let mediaSearch='';
  let dragId=null;

  function readCMS(){try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}}
  function writeCMS(state){localStorage.setItem(CMS_KEY,JSON.stringify(state))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function safeUrl(v){const s=String(v||'').trim();return /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(s)?s:''}
  function slugify(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function nl(v){return esc(v).replace(/\n/g,'<br>')}
  function currentPanel(){const panel=document.querySelector('.view.active .editor-panel');return panel&&panel.querySelector('#page-title')?panel:null}
  function pageId(panel=currentPanel()){return panel?.querySelector('[data-action="save-page"]')?.dataset.id||null}
  function pageFromState(state,id){return (state.pages||[]).find(x=>String(x.id)===String(id))}
  function currentPage(){const state=readCMS();return pageFromState(state,pageId())||{}}
  function toast(msg){let el=document.getElementById('command-page2-toast');if(!el){el=document.createElement('div');el.id='command-page2-toast';el.style.cssText='position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);opacity:0;z-index:12000;background:#171a22;color:#fff;padding:11px 16px;border-radius:10px;font:700 12px system-ui;transition:.2s;pointer-events:none';document.body.appendChild(el)}el.textContent=msg;el.style.opacity='1';el.style.transform='translate(-50%,0)';setTimeout(()=>{el.style.opacity='0';el.style.transform='translate(-50%,16px)'},2200)}

  const defaultStyles=()=>({backgroundMode:'solid',background:'#ffffff',gradientFrom:'#ffffff',gradientTo:'#eef3ff',backgroundImage:'',textColor:'#111111',accentColor:'#1f6ffa',surfaceColor:'#ffffff',maxWidth:'1100',font:'inherit',paddingTop:64,paddingBottom:64,gap:18,radius:14,showHeader:true,showFooter:true});
  function blockDefaults(type){
    const id=`page-block-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const common={id,type,props:{},style:{background:'#ffffff00',color:'',padding:24,radius:0,align:'left'}};
    const map={
      Hero:{eyebrow:'UNTOZ',title:'Build something remarkable.',text:'Use this hero to introduce the page with a strong headline and a clear call to action.',buttonText:'Learn more',buttonUrl:'#',image:''},
      Heading:{text:'Section heading',level:'h2'},
      Text:{text:'Add your page content here. You can create multiple text blocks and combine them with images, buttons and other elements.'},
      Image:{image:'',alt:'',caption:'',fit:'cover'},
      Button:{text:'Explore',url:'#',variant:'solid'},
      Quote:{text:'A strong quote can give this page more personality.',author:'Untoz'},
      Divider:{},
      Spacer:{height:72},
      Columns:{leftTitle:'Column one',leftText:'Add content to the first column.',rightTitle:'Column two',rightText:'Add content to the second column.'},
      Video:{url:'',title:'Video'}
    };
    common.props=map[type]||{};return common;
  }
  function ensureDesign(page){
    page.styles={...defaultStyles(),...(page.styles||{})};
    if(!Array.isArray(page.blocks)){
      page.blocks=[];
      if(String(page.content||'').trim())page.blocks.push({...blockDefaults('Text'),props:{text:page.content}});
    }
    if(!page.blocks.length)page.blocks.push(blockDefaults('Hero'));
    if(!selectedBlockId||!page.blocks.some(b=>b.id===selectedBlockId))selectedBlockId=page.blocks[0]?.id||null;
    return page;
  }

  function persist(mutator){const state=readCMS();const page=pageFromState(state,pageId());if(!page)return;ensureDesign(page);mutator(page,state);writeCMS(state);syncLegacy(page);updateSaveState();}
  function syncLegacy(page){const map={title:'page-title',slug:'page-slug',status:'page-status',seo:'page-seo'};Object.entries(map).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&page[k]!=null)el.value=page[k]});}
  function updateSaveState(){const el=document.getElementById('command-page2-save');if(!el)return;el.textContent='Autosaved';clearTimeout(updateSaveState.t);updateSaveState.t=setTimeout(()=>el.textContent='Saved locally',900)}

  function templates(){return {
    blank:[blockDefaults('Heading'),blockDefaults('Text')],
    landing:[blockDefaults('Hero'),blockDefaults('Heading'),blockDefaults('Columns'),blockDefaults('Button')],
    about:[{...blockDefaults('Hero'),props:{eyebrow:'ABOUT UNTOZ',title:'Media, entertainment and technology.',text:'Tell the story of Untoz, the mission and the ideas behind the company.',buttonText:'Explore Untoz',buttonUrl:'#'}},blockDefaults('Text'),blockDefaults('Columns'),blockDefaults('Quote')],
    contact:[{...blockDefaults('Hero'),props:{eyebrow:'CONTACT',title:'Let’s talk.',text:'Use this page for general enquiries, partnerships and media opportunities.',buttonText:'Contact Untoz',buttonUrl:'mailto:'}},blockDefaults('Heading'),blockDefaults('Text')],
    event:[{...blockDefaults('Hero'),props:{eyebrow:'LIVE EVENT',title:'Untoz Event',text:'Build a dedicated event page with information, visuals and calls to action.',buttonText:'Watch live',buttonUrl:'#'}},blockDefaults('Image'),blockDefaults('Text'),blockDefaults('Button')]
  }}

  function build(panel){
    const state=readCMS();const page=ensureDesign(pageFromState(state,pageId(panel))||{});writeCMS(state);
    const s=page.styles;
    return `<div class="command-page2" data-page-builder2>
      <aside class="command-page2-side left">
        <section class="command-page2-card"><span class="command-page2-kicker">ELEMENTS</span><h3>Add block</h3><div class="command-page2-blocks">${['Hero','Heading','Text','Image','Button','Quote','Divider','Spacer','Columns','Video'].map(t=>`<button type="button" data-page-add="${t}">${t}</button>`).join('')}</div></section>
        <section class="command-page2-card"><span class="command-page2-kicker">STARTER LAYOUTS</span><h3>Templates</h3><div class="command-page2-template-grid"><button data-page-template="landing">Landing page<small>Hero + content + columns + CTA</small></button><button data-page-template="about">About page<small>Story-focused company layout</small></button><button data-page-template="contact">Contact page<small>Simple contact-oriented layout</small></button><button data-page-template="event">Event page<small>Hero + media + event information</small></button><button data-page-template="blank">Blank canvas<small>Heading + text only</small></button></div></section>
        <section class="command-page2-card"><span class="command-page2-kicker">PAGE</span><h3>Essentials</h3>
          <div class="command-page2-field"><label>Title</label><input id="pg2-title" value="${esc(page.title||'')}"></div>
          <div class="command-page2-field"><label>Slug</label><div class="command-page2-slug"><input id="pg2-slug" value="${esc(page.slug||'')}"><button id="pg2-auto-slug" type="button">Auto</button></div></div>
          <div class="command-page2-status"><div class="command-page2-field"><label>Status</label><select id="pg2-status"><option ${page.status==='Draft'?'selected':''}>Draft</option><option ${page.status==='Published'?'selected':''}>Published</option></select></div><div class="command-page2-field"><label>Max width</label><select id="pg2-max-width">${['880','1100','1280','1440'].map(x=>`<option value="${x}" ${String(s.maxWidth)===x?'selected':''}>${x}px</option>`).join('')}</select></div></div>
          <div class="command-page2-save" id="command-page2-save">Saved locally</div>
        </section>
      </aside>

      <main class="command-page2-canvas">
        <div class="command-page2-toolbar"><div><span class="command-page2-kicker">LIVE PREVIEW</span><h3>${esc(page.title||'Untitled page')}</h3></div><div class="command-page2-device"><button class="${previewDevice==='desktop'?'active':''}" data-page-device="desktop">Desktop</button><button class="${previewDevice==='mobile'?'active':''}" data-page-device="mobile">Mobile</button></div></div>
        <div class="command-page2-stage ${previewDevice==='mobile'?'mobile':''}" id="pg2-stage"><div class="command-page2-preview"><div class="command-page2-preview-inner" id="pg2-preview-root"><div class="command-page2-preview-content" id="pg2-preview-content">${renderBlocks(page)}</div></div></div></div>
      </main>

      <aside class="command-page2-side right">
        <section class="command-page2-card"><span class="command-page2-kicker">PAGE STYLE</span><h3>Background & theme</h3>
          <div class="command-page2-field"><label>Background type</label><select id="pg2-bg-mode"><option value="solid" ${s.backgroundMode==='solid'?'selected':''}>Solid</option><option value="gradient" ${s.backgroundMode==='gradient'?'selected':''}>Gradient</option><option value="image" ${s.backgroundMode==='image'?'selected':''}>Image</option></select></div>
          <div class="command-page2-style-grid"><div class="command-page2-field"><label>Background</label><input type="color" id="pg2-bg" value="${esc(s.background)}"></div><div class="command-page2-field"><label>Text</label><input type="color" id="pg2-text-color" value="${esc(s.textColor)}"></div><div class="command-page2-field"><label>Gradient A</label><input type="color" id="pg2-grad-a" value="${esc(s.gradientFrom)}"></div><div class="command-page2-field"><label>Gradient B</label><input type="color" id="pg2-grad-b" value="${esc(s.gradientTo)}"></div><div class="command-page2-field"><label>Accent</label><input type="color" id="pg2-accent" value="${esc(s.accentColor)}"></div><div class="command-page2-field"><label>Surface</label><input type="color" id="pg2-surface" value="${esc(s.surfaceColor)}"></div></div>
          <div class="command-page2-field"><label>Background image</label><div class="command-page2-media-line"><input id="pg2-bg-image" value="${esc(s.backgroundImage||'')}" placeholder="https://…"><button type="button" data-page-media-target="pg2-bg-image">Media</button></div></div>
          <div class="command-page2-field"><label>Font</label><select id="pg2-font"><option value="inherit" ${s.font==='inherit'?'selected':''}>Untoz / Default</option><option value="Arial, sans-serif" ${s.font==='Arial, sans-serif'?'selected':''}>Arial</option><option value="Georgia, serif" ${s.font==='Georgia, serif'?'selected':''}>Georgia</option><option value="ui-monospace, monospace" ${s.font==='ui-monospace, monospace'?'selected':''}>Monospace</option></select></div>
          <div class="command-page2-row"><div class="command-page2-field"><label>Top padding</label><input type="number" min="0" max="300" id="pg2-pad-top" value="${Number(s.paddingTop)||0}"></div><div class="command-page2-field"><label>Bottom padding</label><input type="number" min="0" max="300" id="pg2-pad-bottom" value="${Number(s.paddingBottom)||0}"></div></div>
          <div class="command-page2-row"><div class="command-page2-field"><label>Block gap</label><input type="number" min="0" max="100" id="pg2-gap" value="${Number(s.gap)||0}"></div><div class="command-page2-field"><label>Radius</label><input type="number" min="0" max="60" id="pg2-radius" value="${Number(s.radius)||0}"></div></div>
        </section>
        <section class="command-page2-card" id="pg2-inspector">${renderInspector(page)}</section>
        <section class="command-page2-card"><span class="command-page2-kicker">SEO</span><h3>Search appearance</h3><div class="command-page2-field"><label>SEO description</label><textarea id="pg2-seo" maxlength="180">${esc(page.seo||'')}</textarea></div><p class="command-page2-help">Page Builder settings are saved continuously. Use the normal <b>Save page</b> button above when you want to return to Pages.</p></section>
      </aside>
    </div>`;
  }

  function renderBlocks(page){
    if(!page.blocks?.length)return '<div class="command-page2-empty"><b>This page is empty.</b><br>Add an element from the left.</div>';
    return page.blocks.map((b,i)=>`<div class="command-page2-preview-block ${b.id===selectedBlockId?'selected':''}" draggable="true" data-page-block="${esc(b.id)}" data-index="${i}"><div class="command-page2-block-controls"><button data-page-up="${esc(b.id)}" title="Move up">↑</button><button data-page-down="${esc(b.id)}" title="Move down">↓</button><button data-page-duplicate="${esc(b.id)}">⧉</button><button class="danger" data-page-delete="${esc(b.id)}">×</button></div>${renderBlock(b)}</div>`).join('')
  }
  function renderBlock(b){const p=b.props||{};const st=b.style||{};const style=`background:${esc(st.background||'#ffffff00')};${st.color?`color:${esc(st.color)};`:''}padding:${Number(st.padding)||0}px;border-radius:${Number(st.radius)||0}px;text-align:${esc(st.align||'left')}`;
    if(b.type==='Hero'){const bg=safeUrl(p.image);return `<section class="p2-block hero" style="${style}${bg?`;background-image:linear-gradient(#0007,#0007),url('${esc(bg)}');color:#fff`:''}"><div class="p2-hero-overlay"><span class="p2-eyebrow">${esc(p.eyebrow||'')}</span><h1 class="p2-hero-title">${esc(p.title||'')}</h1><div class="p2-text">${nl(p.text||'')}</div>${p.buttonText?`<div class="p2-button-wrap" style="margin-top:20px"><a href="${esc(p.buttonUrl||'#')}" onclick="return false">${esc(p.buttonText)}</a></div>`:''}</div></section>`}
    if(b.type==='Heading'){const tag=['h2','h3','h4'].includes(p.level)?p.level:'h2';return `<section class="p2-block" style="${style}"><${tag} class="p2-heading">${esc(p.text||'Heading')}</${tag}></section>`}
    if(b.type==='Text')return `<section class="p2-block" style="${style}"><div class="p2-text">${nl(p.text||'')}</div></section>`;
    if(b.type==='Image'){const u=safeUrl(p.image);return `<section class="p2-block p2-image" style="${style}">${u?`<figure style="margin:0"><img src="${esc(u)}" alt="${esc(p.alt||'')}" style="object-fit:${esc(p.fit||'cover')}">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`:'<div class="command-page2-empty">Choose an image from the inspector.</div>'}</section>`}
    if(b.type==='Button')return `<section class="p2-block" style="${style}"><div class="p2-button-wrap ${p.variant==='outline'?'outline':''}"><a href="${esc(p.url||'#')}" onclick="return false">${esc(p.text||'Button')}</a></div></section>`;
    if(b.type==='Quote')return `<section class="p2-block" style="${style}"><div class="p2-quote">“${esc(p.text||'')}”${p.author?`<small>— ${esc(p.author)}</small>`:''}</div></section>`;
    if(b.type==='Divider')return `<section class="p2-block" style="${style}"><div class="p2-divider"></div></section>`;
    if(b.type==='Spacer')return `<section class="p2-spacer" style="${style};height:${Number(p.height)||60}px"></section>`;
    if(b.type==='Columns')return `<section class="p2-block" style="${style}"><div class="p2-columns"><div><h3>${esc(p.leftTitle||'')}</h3><div class="p2-text">${nl(p.leftText||'')}</div></div><div><h3>${esc(p.rightTitle||'')}</h3><div class="p2-text">${nl(p.rightText||'')}</div></div></div></section>`;
    if(b.type==='Video'){const u=safeUrl(p.url);return `<section class="p2-block" style="${style}"><div class="p2-video">${u?`<video src="${esc(u)}" controls></video>`:'<div class="command-page2-empty" style="color:#fff">Add a video URL.</div>'}</div></section>`}
    return `<section class="p2-block" style="${style}">${esc(b.type)}</section>`
  }

  function field(label,key,value,type='text',options=[]){if(type==='textarea')return `<div class="command-page2-field"><label>${label}</label><textarea data-page-prop="${key}">${esc(value||'')}</textarea></div>`;if(type==='select')return `<div class="command-page2-field"><label>${label}</label><select data-page-prop="${key}">${options.map(x=>`<option ${String(value)===String(x)?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`;if(type==='media')return `<div class="command-page2-field"><label>${label}</label><div class="command-page2-media-line"><input data-page-prop="${key}" id="pg2-prop-${key}" value="${esc(value||'')}"><button type="button" data-page-media-target="pg2-prop-${key}">Media</button></div></div>`;return `<div class="command-page2-field"><label>${label}</label><input type="${type}" data-page-prop="${key}" value="${esc(value??'')}"></div>`}
  function renderInspector(page){const b=page.blocks?.find(x=>x.id===selectedBlockId);if(!b)return `<span class="command-page2-kicker">INSPECTOR</span><h3>No block selected</h3><p class="command-page2-help">Click a block in the preview to edit it.</p>`;const p=b.props||{};let fields='';
    if(b.type==='Hero')fields=field('Eyebrow','eyebrow',p.eyebrow)+field('Title','title',p.title)+field('Text','text',p.text,'textarea')+field('Background image','image',p.image,'media')+field('Button text','buttonText',p.buttonText)+field('Button URL','buttonUrl',p.buttonUrl);
    if(b.type==='Heading')fields=field('Heading','text',p.text)+field('Level','level',p.level,'select',['h2','h3','h4']);
    if(b.type==='Text')fields=field('Text','text',p.text,'textarea');
    if(b.type==='Image')fields=field('Image','image',p.image,'media')+field('Alt text','alt',p.alt)+field('Caption','caption',p.caption)+field('Fit','fit',p.fit,'select',['cover','contain']);
    if(b.type==='Button')fields=field('Button text','text',p.text)+field('URL','url',p.url)+field('Style','variant',p.variant,'select',['solid','outline']);
    if(b.type==='Quote')fields=field('Quote','text',p.text,'textarea')+field('Author','author',p.author);
    if(b.type==='Spacer')fields=field('Height','height',p.height,'number');
    if(b.type==='Columns')fields=field('Left title','leftTitle',p.leftTitle)+field('Left text','leftText',p.leftText,'textarea')+field('Right title','rightTitle',p.rightTitle)+field('Right text','rightText',p.rightText,'textarea');
    if(b.type==='Video')fields=field('Video URL','url',p.url)+field('Title','title',p.title);
    return `<div class="command-page2-inspector-head"><div><span class="command-page2-kicker">INSPECTOR</span><h3>${esc(b.type)}</h3></div><span>${esc(b.type)}</span></div>${fields}<div class="command-page2-style-grid"><div class="command-page2-field"><label>Block background</label><input type="color" data-page-style="background" value="${/^#[0-9a-f]{6}$/i.test(b.style?.background||'')?b.style.background:'#ffffff'}"></div><div class="command-page2-field"><label>Text color</label><input type="color" data-page-style="color" value="${/^#[0-9a-f]{6}$/i.test(b.style?.color||'')?b.style.color:'#111111'}"></div><div class="command-page2-field"><label>Padding</label><input type="number" min="0" max="160" data-page-style="padding" value="${Number(b.style?.padding)||0}"></div><div class="command-page2-field"><label>Radius</label><input type="number" min="0" max="60" data-page-style="radius" value="${Number(b.style?.radius)||0}"></div></div><div class="command-page2-field"><label>Alignment</label><select data-page-style="align">${['left','center','right'].map(x=>`<option ${b.style?.align===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="command-page2-actions"><button data-page-duplicate="${esc(b.id)}">Duplicate</button><button class="danger" data-page-delete="${esc(b.id)}">Delete block</button></div>`}

  function applyPreviewStyle(page){const root=document.getElementById('pg2-preview-root');const content=document.getElementById('pg2-preview-content');if(!root||!content)return;const s=page.styles;root.style.color=s.textColor;root.style.fontFamily=s.font;root.style.paddingTop=`${Number(s.paddingTop)||0}px`;root.style.paddingBottom=`${Number(s.paddingBottom)||0}px`;root.style.setProperty('--page-accent',s.accentColor);root.style.setProperty('--page-surface',s.surfaceColor);root.style.backgroundImage='';root.style.backgroundColor='';if(s.backgroundMode==='gradient')root.style.background=`linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;else if(s.backgroundMode==='image'&&safeUrl(s.backgroundImage)){root.style.backgroundColor=s.background;root.style.backgroundImage=`linear-gradient(#00000018,#00000018),url("${safeUrl(s.backgroundImage)}")`;root.style.backgroundSize='cover';root.style.backgroundPosition='center'}else root.style.background=s.background;content.style.maxWidth=`${Number(s.maxWidth)||1100}px`;content.style.gap=`${Number(s.gap)||0}px`;content.style.borderRadius=`${Number(s.radius)||0}px`}

  function renderPage(){const panel=currentPanel();if(!panel)return;const state=readCMS();const page=ensureDesign(pageFromState(state,pageId(panel))||{});const content=document.getElementById('pg2-preview-content');const inspector=document.getElementById('pg2-inspector');if(content)content.innerHTML=renderBlocks(page);if(inspector)inspector.innerHTML=renderInspector(page);applyPreviewStyle(page);bindDynamic()}

  function bind(panel){
    const meta={
      'pg2-title':'title','pg2-slug':'slug','pg2-status':'status','pg2-seo':'seo'
    };
    Object.entries(meta).forEach(([id,key])=>document.getElementById(id)?.addEventListener('input',e=>persist(p=>{p[key]=e.target.value;if(key==='title'&&!p.slug)document.getElementById('pg2-slug').placeholder=slugify(e.target.value)})));
    document.getElementById('pg2-status')?.addEventListener('change',e=>persist(p=>p.status=e.target.value));
    document.getElementById('pg2-auto-slug')?.addEventListener('click',()=>{const title=document.getElementById('pg2-title')?.value||'';const slug=slugify(title);document.getElementById('pg2-slug').value=slug;persist(p=>p.slug=slug)});
    const styleMap={'pg2-bg-mode':'backgroundMode','pg2-bg':'background','pg2-text-color':'textColor','pg2-grad-a':'gradientFrom','pg2-grad-b':'gradientTo','pg2-accent':'accentColor','pg2-surface':'surfaceColor','pg2-bg-image':'backgroundImage','pg2-font':'font','pg2-pad-top':'paddingTop','pg2-pad-bottom':'paddingBottom','pg2-gap':'gap','pg2-radius':'radius','pg2-max-width':'maxWidth'};
    Object.entries(styleMap).forEach(([id,key])=>{const el=document.getElementById(id);if(!el)return;const event=el.tagName==='SELECT'?'change':'input';el.addEventListener(event,e=>persist(p=>{p.styles[key]=['paddingTop','paddingBottom','gap','radius'].includes(key)?Number(e.target.value):e.target.value;renderPage()}))});
    panel.querySelectorAll('[data-page-add]').forEach(b=>b.onclick=()=>addBlock(b.dataset.pageAdd));
    panel.querySelectorAll('[data-page-template]').forEach(b=>b.onclick=()=>applyTemplate(b.dataset.pageTemplate));
    panel.querySelectorAll('[data-page-device]').forEach(b=>b.onclick=()=>{previewDevice=b.dataset.pageDevice;panel.querySelectorAll('[data-page-device]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('pg2-stage')?.classList.toggle('mobile',previewDevice==='mobile')});
    bindDynamic();
  }

  function bindDynamic(){const root=document.querySelector('[data-page-builder2]');if(!root)return;
    root.querySelectorAll('[data-page-block]').forEach(el=>{el.onclick=e=>{if(e.target.closest('button'))return;selectedBlockId=el.dataset.pageBlock;renderPage()};el.ondragstart=()=>{dragId=el.dataset.pageBlock;el.classList.add('dragging')};el.ondragend=()=>{dragId=null;el.classList.remove('dragging')};el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();if(!dragId||dragId===el.dataset.pageBlock)return;reorderBlocks(dragId,el.dataset.pageBlock)}});
    root.querySelectorAll('[data-page-up]').forEach(b=>b.onclick=e=>{e.stopPropagation();moveBlock(b.dataset.pageUp,-1)});root.querySelectorAll('[data-page-down]').forEach(b=>b.onclick=e=>{e.stopPropagation();moveBlock(b.dataset.pageDown,1)});root.querySelectorAll('[data-page-duplicate]').forEach(b=>b.onclick=e=>{e.stopPropagation();duplicateBlock(b.dataset.pageDuplicate)});root.querySelectorAll('[data-page-delete]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteBlock(b.dataset.pageDelete)});
    root.querySelectorAll('[data-page-prop]').forEach(el=>{const event=el.tagName==='SELECT'?'change':'input';el.addEventListener(event,e=>persist(p=>{const b=p.blocks.find(x=>x.id===selectedBlockId);if(!b)return;b.props[e.target.dataset.pageProp]=e.target.type==='number'?Number(e.target.value):e.target.value;renderPage()}))});
    root.querySelectorAll('[data-page-style]').forEach(el=>{const event=el.tagName==='SELECT'?'change':'input';el.addEventListener(event,e=>persist(p=>{const b=p.blocks.find(x=>x.id===selectedBlockId);if(!b)return;b.style=b.style||{};b.style[e.target.dataset.pageStyle]=e.target.type==='number'?Number(e.target.value):e.target.value;renderPage()}))});
    root.querySelectorAll('[data-page-media-target]').forEach(b=>b.onclick=()=>openMediaPicker(b.dataset.pageMediaTarget));
  }

  function addBlock(type){const block=blockDefaults(type);persist(p=>{p.blocks.push(block);selectedBlockId=block.id});renderPage();toast(`${type} block added.`)}
  function moveBlock(id,delta){persist(p=>{const i=p.blocks.findIndex(x=>x.id===id);const j=i+delta;if(i<0||j<0||j>=p.blocks.length)return;[p.blocks[i],p.blocks[j]]=[p.blocks[j],p.blocks[i]]});renderPage()}
  function reorderBlocks(from,to){persist(p=>{const a=p.blocks.findIndex(x=>x.id===from),b=p.blocks.findIndex(x=>x.id===to);if(a<0||b<0)return;const [item]=p.blocks.splice(a,1);p.blocks.splice(b,0,item)});renderPage()}
  function duplicateBlock(id){persist(p=>{const i=p.blocks.findIndex(x=>x.id===id);if(i<0)return;const copy=JSON.parse(JSON.stringify(p.blocks[i]));copy.id=`page-block-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;p.blocks.splice(i+1,0,copy);selectedBlockId=copy.id});renderPage();toast('Block duplicated.')}
  function deleteBlock(id){persist(p=>{p.blocks=p.blocks.filter(x=>x.id!==id);selectedBlockId=p.blocks[0]?.id||null});renderPage();toast('Block deleted.')}
  function applyTemplate(name){if(!confirm('Apply this template? Current page blocks will be replaced.'))return;const t=templates()[name]||[];persist(p=>{p.blocks=t;selectedBlockId=t[0]?.id||null});renderPage();toast('Template applied.')}

  function installMediaPicker(){if(document.getElementById('command-page2-picker'))return;const modal=document.createElement('div');modal.id='command-page2-picker';modal.className='command-page2-picker';modal.hidden=true;modal.innerHTML='<div class="command-page2-picker-backdrop"></div><div class="command-page2-picker-card"><div class="command-page2-picker-head"><input id="command-page2-picker-search" placeholder="Search Media Library…"><button type="button">×</button></div><div class="command-page2-picker-grid" id="command-page2-picker-grid"></div></div>';document.body.appendChild(modal);modal.querySelector('.command-page2-picker-backdrop').onclick=closeMediaPicker;modal.querySelector('.command-page2-picker-head button').onclick=closeMediaPicker;modal.querySelector('#command-page2-picker-search').oninput=e=>{mediaSearch=e.target.value;renderMediaPicker()}}
  function openMediaPicker(target){installMediaPicker();mediaTarget=target;mediaSearch='';const m=document.getElementById('command-page2-picker');m.hidden=false;const input=document.getElementById('command-page2-picker-search');input.value='';renderMediaPicker();setTimeout(()=>input.focus(),20)}
  function closeMediaPicker(){const m=document.getElementById('command-page2-picker');if(m)m.hidden=true;mediaTarget=null}
  function renderMediaPicker(){const out=document.getElementById('command-page2-picker-grid');if(!out)return;const q=mediaSearch.toLowerCase();const items=(readCMS().media||[]).filter(x=>(x.type||'Image')==='Image'&&safeUrl(x.url)&&(!q||`${x.title||''} ${x.alt||''} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(q)));out.innerHTML=items.length?items.map(x=>`<button class="command-page2-picker-item" data-pick-url="${esc(x.url)}"><img src="${esc(x.url)}" alt="${esc(x.alt||'')}"><span>${esc(x.title||'Untitled')}</span></button>`).join(''):'<div class="command-page2-picker-empty">No image assets found. Add images in Media Library first.</div>';out.querySelectorAll('[data-pick-url]').forEach(b=>b.onclick=()=>{const target=document.getElementById(mediaTarget);if(target){target.value=b.dataset.pickUrl;target.dispatchEvent(new Event('input',{bubbles:true}))}closeMediaPicker()})}

  function enhance(){const panel=currentPanel();if(!panel||panel.classList.contains('command-page-editor2'))return;panel.classList.add('command-page-editor2');const form=panel.querySelector('.form-grid');if(!form)return;const state=readCMS();const page=pageFromState(state,pageId(panel));if(!page)return;ensureDesign(page);writeCMS(state);const wrap=document.createElement('div');wrap.innerHTML=build(panel);form.before(wrap.firstElementChild);bind(panel);renderPage()}
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});
  function install(){installMediaPicker();enhance()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
