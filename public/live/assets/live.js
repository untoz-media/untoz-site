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
  if (!video || !overlay || !action) return;

  let hls;
  let started = false;

  const showOverlay = (title, message, buttonText = 'Tentar novamente') => {
    overlayTitle.textContent = title;
    overlayText.textContent = message;
    action.textContent = buttonText;
    overlay.hidden = false;
  };

  const startPlayback = async () => {
    action.disabled = true;
    action.textContent = 'A ligar…';
    state.textContent = 'A ligar à emissão';
    state.classList.remove('player-error');

    if (window.Hls && Hls.isSupported()) {
      if (hls) hls.destroy();
      hls = new Hls({
        lowLatencyMode: true,
        liveSyncDurationCount: 1,
        maxLiveSyncPlaybackRate: 1.5,
        backBufferLength: 30
      });
      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        try {
          await video.play();
          started = true;
          overlay.hidden = true;
          state.textContent = 'Emissão em direto';
        } catch {
          showOverlay('A transmissão está pronta', 'Carrega no botão para começar a ver.', 'Ver em direto');
          action.disabled = false;
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy();
          hls = null;
          state.textContent = 'Não foi possível ligar';
          state.classList.add('player-error');
          showOverlay('Transmissão indisponível', 'A emissão pode ainda não ter começado. Tenta novamente dentro de momentos.');
          action.disabled = false;
        }
      });
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = STREAM_URL;
      try {
        await video.play();
        started = true;
        overlay.hidden = true;
        state.textContent = 'Emissão em direto';
      } catch {
        showOverlay('A transmissão está pronta', 'Carrega no botão para começar a ver.', 'Ver em direto');
        action.disabled = false;
      }
      return;
    }

    state.textContent = 'Navegador não compatível';
    state.classList.add('player-error');
    showOverlay('Este navegador não suporta HLS', 'Experimenta abrir esta página no Safari, Chrome ou Edge atualizado.', 'Tentar novamente');
    action.disabled = false;
  };

  action.addEventListener('click', () => {
    action.disabled = false;
    startPlayback();
  });

  video.addEventListener('playing', () => {
    started = true;
    overlay.hidden = true;
    state.textContent = 'Emissão em direto';
    state.classList.remove('player-error');
  });

  video.addEventListener('error', () => {
    if (!started) {
      state.textContent = 'A aguardar emissão';
      state.classList.add('player-error');
    }
  });

  // Muted autoplay is attempted for browsers that permit it. Sound can be enabled
  // with the native player controls after playback begins.
  video.muted = true;
  startPlayback().then(() => {
    if (!started) action.disabled = false;
  });
})();