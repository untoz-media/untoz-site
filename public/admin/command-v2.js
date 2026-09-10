(()=>{
  const ICONS={dashboard:'⌂',posts:'✎',pages:'▤',media:'▧',categories:'◫',genres:'◇',menus:'☷',homepage:'◈',design:'◐',header:'▔',footer:'▁',settings:'⚙',publishing:'↑',production:'●',brands:'✦',shell:'⌘',team:'◎',analytics:'⌁'};
  const KICKERS={dashboard:'Workspace',posts:'Content',pages:'Content',media:'Content',categories:'Taxonomy',genres:'Taxonomy',menus:'Navigation',homepage:'Experience',design:'Experience',header:'Experience',footer:'Experience',settings:'System'};
  const GROUPS=[
    {label:'Workspace',views:['dashboard']},
    {label:'Content',views:['pages','posts','media','categories','genres']},
    {label:'Experience',views:['menus','homepage','design','header','footer']},
    {label:'Operations',views:['publishing','production','brands','shell','team','analytics','settings']}
  ];
  let scheduled=false;

  function viewId(button){return button?.dataset?.view||''}

  function annotateNav(){
    const nav=document.querySelector('.nav');
    if(!nav)return;
    const buttons=[...nav.querySelectorAll(':scope > button')];
    buttons.forEach(button=>{
      const id=viewId(button);
      button.dataset.commandIcon=ICONS[id]||'·';
    });

    nav.querySelectorAll(':scope > .command-v2-nav-label').forEach(label=>label.remove());
    GROUPS.forEach(group=>{
      const first=buttons.find(button=>group.views.includes(viewId(button)));
      if(!first)return;
      const label=document.createElement('div');
      label.className='command-v2-nav-label';
      label.textContent=group.label;
      first.before(label);
    });
  }

  function enhanceBrand(){
    const brand=document.querySelector('.sidebar .brand');
    if(!brand||brand.dataset.commandV2Brand==='ready')return;
    brand.dataset.commandV2Brand='ready';
    brand.setAttribute('aria-label','Untoz Command');
  }

  function enhanceSidebarStatus(){
    const footer=document.querySelector('.sidebar-footer');
    if(!footer||footer.querySelector('.command-v2-side-status'))return;
    const row=document.createElement('div');
    row.className='command-v2-side-status';
    row.innerHTML='<span><i></i> Production</span><b>Online</b>';
    footer.prepend(row);
  }

  function enhanceTopbar(){
    const title=document.querySelector('.topbar h1');
    if(!title)return;
    const active=document.querySelector('.nav button.active');
    const id=viewId(active);
    title.dataset.commandKicker=KICKERS[id]||'Untoz Command';
  }

  function enhanceDashboard(){
    const overview=document.querySelector('[data-command-overview]');
    if(!overview||overview.dataset.commandV2==='ready')return;
    overview.dataset.commandV2='ready';
    const welcome=overview.querySelector('.command-welcome');
    const h2=welcome?.querySelector('h2');
    const p=welcome?.querySelector('p');
    if(h2)h2.textContent='Control the whole Untoz universe.';
    if(p)p.textContent='Create, manage and publish content, pages, products and experiences from one operational workspace.';
  }

  function enhanceTables(){
    document.querySelectorAll('.table').forEach(table=>{
      if(table.dataset.commandV2==='ready')return;
      table.dataset.commandV2='ready';
      const wrapper=table.parentElement;
      if(wrapper)wrapper.classList.add('command-v2-table-host');
    });
  }

  function enhance(){
    scheduled=false;
    document.body.classList.add('command-v2');
    annotateNav();
    enhanceBrand();
    enhanceSidebarStatus();
    enhanceTopbar();
    enhanceDashboard();
    enhanceTables();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(enhance);
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',event=>{if(event.target.closest('[data-view]'))setTimeout(schedule,0)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();
