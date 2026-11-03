/**
 * Main Application Orchestrator
 * Connects WebFetcher, TypewriterEngine, and UI Controls.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const networkBadge = document.getElementById('networkBadge');
  const currentSourceTag = document.getElementById('currentSourceTag');
  const queueCounter = document.getElementById('queueCounter');
  const charCounter = document.getElementById('charCounter');

  // Spotlight Stage
  const spotlightStage = document.getElementById('spotlightStage');
  const cardCategory = document.getElementById('cardCategory');
  const cardTimestamp = document.getElementById('cardTimestamp');
  const titleDisplay = document.getElementById('titleDisplay');
  const textDisplay = document.getElementById('textDisplay');
  const authorDisplay = document.getElementById('authorDisplay');
  const sourceLink = document.getElementById('sourceLink');
  const readProgress = document.getElementById('readProgress');

  // Stream Stage
  const streamStage = document.getElementById('streamStage');
  const streamLog = document.getElementById('streamLog');
  const streamText = document.getElementById('streamText');

  // Control Deck
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const playPauseLabel = document.getElementById('playPauseLabel');
  const skipBtn = document.getElementById('skipBtn');
  const speedButtons = document.querySelectorAll('.speed-btn');
  const viewModeBtn = document.getElementById('viewModeBtn');
  const viewModeLabel = document.getElementById('viewModeLabel');
  const soundBtn = document.getElementById('soundBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');
  const themeBtn = document.getElementById('themeBtn');
  const themeMenu = document.getElementById('themeMenu');
  const categoryBtn = document.getElementById('categoryBtn');
  const categoryMenu = document.getElementById('categoryMenu');
  const categoryLabel = document.getElementById('categoryLabel');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');

  // Pack UI elements for the typewriter
  const stageElements = {
    categoryEl: cardCategory,
    timestampEl: cardTimestamp,
    titleEl: titleDisplay,
    textEl: textDisplay,
    authorEl: authorDisplay,
    sourceLinkEl: sourceLink,
    progressEl: readProgress,
    streamLogEl: streamLog,
    streamTextEl: streamText
  };

  // State
  let currentTheme = 'terminal';
  let isStreamView = false;

  // 1. Hook up WebFetcher events
  window.webFetcher.onStatusChange = (statusText, isLive) => {
    networkBadge.textContent = statusText;
    networkBadge.style.color = isLive ? 'var(--primary-color)' : 'var(--text-dim)';
  };

  window.webFetcher.onQueueUpdate = (length) => {
    queueCounter.textContent = `BUFFER: ${length}`;
  };

  // 2. Hook up Typewriter events
  window.typewriterEngine.onCharTyped = (current, total) => {
    charCounter.textContent = `${current} / ${total} CHARS`;
  };

  window.typewriterEngine.onItemComplete = () => {
    runCycle();
  };

  // 3. Execution Cycle Loop
  async function runCycle() {
    currentSourceTag.textContent = "SOURCE: BUFFERING...";
    try {
      const item = await window.webFetcher.getNext();
      if (item) {
        currentSourceTag.textContent = `SOURCE: ${item.source || 'WEB API'}`.toUpperCase();
        window.typewriterEngine.startTyping(item, stageElements);
      }
    } catch (err) {
      console.error("Cycle run error:", err);
      setTimeout(runCycle, 2000);
    }
  }

  // 4. Play / Pause Control
  function togglePlayPause() {
    const isPaused = window.typewriterEngine.togglePause();
    if (isPaused) {
      playPauseIcon.textContent = '▶';
      playPauseLabel.textContent = 'RESUME';
      playPauseBtn.classList.add('paused');
    } else {
      playPauseIcon.textContent = '⏸';
      playPauseLabel.textContent = 'PAUSE';
      playPauseBtn.classList.remove('paused');
    }
  }
  playPauseBtn.addEventListener('click', togglePlayPause);

  // 5. Skip Control
  skipBtn.addEventListener('click', () => {
    window.typewriterEngine.skip();
  });

  // 6. Speed Controls
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = btn.getAttribute('data-speed');
      window.typewriterEngine.setSpeed(speed);
    });
  });

  // 7. View Mode Toggle (Spotlight vs Endless Log)
  function toggleViewMode() {
    isStreamView = !isStreamView;
    if (isStreamView) {
      spotlightStage.classList.add('hidden');
      streamStage.classList.remove('hidden');
      viewModeLabel.textContent = 'STREAM LOG';
      window.typewriterEngine.setViewMode('stream');
    } else {
      streamStage.classList.add('hidden');
      spotlightStage.classList.remove('hidden');
      viewModeLabel.textContent = 'SPOTLIGHT';
      window.typewriterEngine.setViewMode('spotlight');
    }
    // Re-type current item in new view
    if (window.typewriterEngine.currentItem) {
      window.typewriterEngine.startTyping(window.typewriterEngine.currentItem, stageElements);
    }
  }
  viewModeBtn.addEventListener('click', toggleViewMode);

  // 8. Sound Toggle
  function toggleSound() {
    const enabled = window.typewriterAudio.toggle();
    if (enabled) {
      soundIcon.textContent = '🔊';
      soundLabel.textContent = 'SOUND ON';
      soundBtn.classList.add('active');
    } else {
      soundIcon.textContent = '🔇';
      soundLabel.textContent = 'SOUND OFF';
      soundBtn.classList.remove('active');
    }
  }
  soundBtn.addEventListener('click', toggleSound);

  // 9. Dropdowns: Theme & Category
  function closeAllMenus() {
    themeMenu.classList.remove('show');
    categoryMenu.classList.remove('show');
  }

  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    categoryMenu.classList.remove('show');
    themeMenu.classList.toggle('show');
  });

  categoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeMenu.classList.remove('show');
    categoryMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => closeAllMenus());

  // Theme selection
  themeMenu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const theme = item.getAttribute('data-theme');
      document.body.setAttribute('data-theme', theme);
      themeMenu.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      item.classList.add('active');
      closeAllMenus();
    });
  });

  // Category selection
  categoryMenu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const source = item.getAttribute('data-source');
      categoryLabel.textContent = item.textContent.toUpperCase();
      categoryMenu.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      item.classList.add('active');
      window.webFetcher.setSource(source);
      closeAllMenus();
      window.typewriterEngine.skip();
    });
  });

  // 10. Fullscreen Mode
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // 11. Help Modal
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelpBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });

  // 12. Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Avoid interfering if user is in an input or modal
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === 'KeyN') {
      window.typewriterEngine.skip();
    } else if (e.code === 'KeyM') {
      toggleSound();
    } else if (e.code === 'KeyV') {
      toggleViewMode();
    } else if (e.code === 'KeyF') {
      fullscreenBtn.click();
    } else if (e.key === '?') {
      helpModal.classList.toggle('hidden');
    } else if (e.key === 'Escape') {
      helpModal.classList.add('hidden');
      closeAllMenus();
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      const speedMap = { '1': 'slow', '2': 'medium', '3': 'fast', '4': 'hyper' };
      const speedName = speedMap[e.key];
      const targetBtn = document.querySelector(`.speed-btn[data-speed="${speedName}"]`);
      if (targetBtn) targetBtn.click();
    }
  });

  // Initial user interaction triggers Web Audio unlock
  const unlockAudio = () => {
    window.typewriterAudio.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // START CYCLE
  runCycle();
});
