(()=>{
  const DEFAULT_API='https://untoz-command-api.lovable.app';
  const override=localStorage.getItem('untozCommandApiBase');
  window.UNTOZ_COMMAND_API_BASE=String(override||DEFAULT_API).replace(/\/$/,'');
  window.UntozCommandAPI={
    get base(){return window.UNTOZ_COMMAND_API_BASE},
    setBase(value){const next=String(value||'').trim().replace(/\/$/,'');if(!/^https:\/\//i.test(next))throw new Error('Untoz Command API must use HTTPS.');localStorage.setItem('untozCommandApiBase',next);window.UNTOZ_COMMAND_API_BASE=next;return next},
    reset(){localStorage.removeItem('untozCommandApiBase');window.UNTOZ_COMMAND_API_BASE=DEFAULT_API;return DEFAULT_API}
  };
})();
