(() => {
  const STREAM_URL = 'https://stream.untoz.com/untoz/index.m3u8';
  const channelPage = document.body.dataset.page === 'channel';

  if (!channelPage) {
    const status = document.getElementById('channel-status');
    if (status) {
      const updateStatus = async () => {
        try {
          const response = await fetch(STREAM_URL, { cache: 'no-store' });
          const playlist = response.ok ? await response.text() : '';
          const isLive = response.ok && playlist.trimStart().startsWith('#EXTM3U');
          const dot = status.querySelector('.status-dot');
          if (dot) dot.classList.toggle('off', !isLive);
          status.setAttribute('aria-label', isLive ? 'Untoz TV is live' : 'Untoz TV is off air');
          status.lastChild.textContent = isLive ? ' LIVE' : ' OFF AIR';
        } catch {
          const dot = status.querySelector('.status-dot');
          if (dot) dot.classList.add('off');
          status.setAttribute('aria-label', 'Untoz TV status unavailable');
          status.lastChild.textContent = ' OFF AIR';
        }
      };
      updateStatus();
      window.setInterval(updateStatus, 20000);
    }
    return;
  }

  const video = document.getElementById('live-video');
  const overlay = document.getElementById('player-overlay');
  const overlayTitle = document.getElementById('player-overlay-title');
  const overlayText = document.getElementById('player-overlay-text');
  const action = document.getElementById('player-action');
  const state = document.getElementById('player-state');
  const shell = document.querySelector('.player-shell');
  const play = document.getElementById('utp-play');
  const bigPlay = document.getElementById('utp-big-play');
  const center = document.getElementById('utp-center');
  const mute = document.getElementById('utp-mute');
  const volume = document.getElementById('utp-volume');
  const quality = document.getElementById('utp-quality');
  const fullscreen = document.getElementById('utp-fullscreen');
  if (!video || !overlay || !action || !shell) return;

  let hls = null;
  let started = false;
  const showOverlay = (title, message, buttonText = 'Tentar novamente') => {
    overlayTitle.textContent = title;
    overlayText.textContent = message;
    action.textContent = buttonText;
    overlay.hidden = false;
    action.disabled = false;
  };
  const syncPlay = () => {
    const playing = !video.paused;
    play.textContent = playing ? 'Ⅱ' : '▶';
    bigPlay.textContent = playing ? 'Ⅱ' : '▶';
    center.classList.toggle('visible', !playing);
  };
  const startPlayback = async () => {
    action.disabled = true;
    action.textContent = 'A ligar…';
    state.textContent = 'A ligar à emissão';
    state.classList.remove('player-error');
    if (window.Hls && Hls.isSupported()) {
      if (hls) hls.destroy();
      hls = new Hls({ lowLatencyMode:true, liveSyncDurationCount:2, maxLiveSyncPlaybackRate:1.15, backBufferLength:30 });
      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        quality.innerHTML = '<option value="-1">Automática</option>';
        hls.levels.forEach((level, index) => {
          const option = document.createElement('option');
          option.value = String(index);
          option.textContent = level.height ? level.height + 'p' : 'Qualidade ' + (index + 1);
          quality.appendChild(option);
        });
        try { await video.play(); } catch { showOverlay('A transmissão está pronta','Carrega no botão para começar a ver.','Ver em direto'); }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy(); hls = null;
          state.textContent = 'Não foi possível ligar';
          state.classList.add('player-error');
          showOverlay('Transmissão indisponível','A emissão pode ainda não ter começado. Tenta novamente dentro de momentos.');
        }
      });
      return;
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = STREAM_URL;
      try { await video.play(); } catch { showOverlay('A transmissão está pronta','Carrega no botão para começar a ver.','Ver em direto'); }
      return;
    }
    state.textContent = 'Navegador não compatível';
    showOverlay('Este navegador não suporta HLS','Experimenta abrir esta página no Safari, Chrome ou Edge atualizado.');
  };
  const toggle = () => { if (video.paused) video.play().catch(()=>{}); else video.pause(); };
  action.addEventListener('click', startPlayback);
  play.addEventListener('click', toggle);
  bigPlay.addEventListener('click', toggle);
  video.addEventListener('click', toggle);
  video.addEventListener('play', () => { started=true; overlay.hidden=true; state.textContent='Emissão em direto'; state.classList.remove('player-error'); syncPlay(); });
  video.addEventListener('pause', syncPlay);
  video.addEventListener('playing', syncPlay);
  video.addEventListener('waiting', () => { state.textContent='A carregar emissão…'; });
  video.addEventListener('volumechange', () => { mute.textContent = video.muted || video.volume===0 ? '🔇' : '🔊'; volume.value = String(video.muted ? 0 : video.volume); });
  mute.addEventListener('click', () => { video.muted=!video.muted; });
  volume.addEventListener('input', () => { video.volume=Number(volume.value); video.muted=video.volume===0; });
  quality.addEventListener('change', () => { if (hls) hls.currentLevel=Number(quality.value); });
  fullscreen.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else shell.requestFullscreen?.();
  });
  document.addEventListener('fullscreenchange', () => { fullscreen.textContent=document.fullscreenElement?'⤢':'⛶'; });
  video.addEventListener('error', () => { if (!started) { state.textContent='A aguardar emissão'; state.classList.add('player-error'); } });
  video.muted=true;
  startPlayback().then(() => { if (!started) action.disabled=false; });
})();