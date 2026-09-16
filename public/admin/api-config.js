(()=>{
  const DEFAULT_API=window.location.origin;
  const override=localStorage.getItem('untozCommandApiBase');
  window.UNTOZ_COMMAND_API_BASE=String(override||DEFAULT_API).replace(/\/$/,'');
  window.UntozCommandAPI={
    get base(){return window.UNTOZ_COMMAND_API_BASE},
    setBase(value){const next=String(value||'').trim().replace(/\/$/,'');if(!/^https:\/\//i.test(next)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(next))throw new Error('Untoz Command API must use HTTPS.');localStorage.setItem('untozCommandApiBase',next);window.UNTOZ_COMMAND_API_BASE=next;return next},
    reset(){localStorage.removeItem('untozCommandApiBase');window.UNTOZ_COMMAND_API_BASE=DEFAULT_API;return DEFAULT_API}
  };
})();
