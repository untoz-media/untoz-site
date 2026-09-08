(()=>{
  const ACTIVITY_KEY='untozCommandActivity';

  function addActivity(action,detail,icon='⏱'){
    let list=[];try{list=JSON.parse(localStorage.getItem(ACTIVITY_KEY)||'[]')}catch{}
    if(!Array.isArray(list))list=[];
    list.unshift({id:`act-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,at:new Date().toISOString(),action,detail,icon});
    localStorage.setItem(ACTIVITY_KEY,JSON.stringify(list.slice(0,80)));
  }

  function fmt(value){const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}

  function enhanceEditor(){
    const status=document.getElementById('p2-status');const date=document.getElementById('p2-scheduled');const note=document.getElementById('p2-status-note');
    if(!status||!note)return;
    const update=()=>{
      if(status.value!=='Scheduled')return;
      if(!date?.value){note.textContent='Choose a publish date and time. Then Publish changes once to arm automatic scheduling.';return}
      note.innerHTML=`<b>Automatic scheduler armed after Publish.</b><br>Target: ${fmt(date.value)}. GitHub checks the queue every 5 minutes, so release normally happens within the next scheduler run.`;
    };
    if(!status.dataset.schedulerUi){status.dataset.schedulerUi='1';status.addEventListener('change',()=>setTimeout(update,0));date?.addEventListener('input',update)}
    update();
  }

  function enhancePublishing(){
    const center=document.querySelector('[data-publishing-center]');if(!center)return;
    const cards=[...center.querySelectorAll('.command-pub-card')];
    const system=cards.find(card=>card.querySelector('h3')?.textContent.trim()==='System status');
    const list=system?.querySelector('.command-pub-status-list');
    if(list&&!list.querySelector('[data-scheduler-status]')){
      const row=document.createElement('div');row.className='command-pub-status-row';row.dataset.schedulerStatus='1';row.innerHTML='<span>Scheduled publishing</span><b>Automatic · every 5 min</b>';list.appendChild(row);
    }
    const queue=cards.find(card=>card.querySelector('h3')?.textContent.trim()==='Scheduled queue');
    if(queue&&!queue.querySelector('[data-scheduler-help]')){
      const help=document.createElement('div');help.dataset.schedulerHelp='1';help.style.cssText='margin-top:10px;padding:10px;border-radius:9px;background:#f4f7ff;color:#596274;font-size:10px;line-height:1.5';help.innerHTML='<b style="color:#1f6ffa">AUTO PUBLISHING</b><br>Scheduled posts must be published to the CMS once first. The GitHub scheduler then changes them to Published automatically when their time arrives.';queue.appendChild(help);
    }
  }

  function install(){
    const observer=new MutationObserver(()=>requestAnimationFrame(()=>{enhanceEditor();enhancePublishing()}));
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('untoz:scheduler-reconciled',e=>addActivity('Scheduled post published',`${e.detail?.count||1} post${e.detail?.count===1?'':'s'} reconciled from the live scheduler`));
    enhanceEditor();enhancePublishing();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
