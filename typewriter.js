/**
 * Typewriter Engine
 * Precision character-by-character typist with organic cadence,
 * punctuation pauses, audio synthesis hooks, and dual-mode rendering.
 */

class TypewriterEngine {
  constructor() {
    this.speedProfiles = {
      slow: { base: 75, jitter: 20 },
      medium: { base: 32, jitter: 10 },
      fast: { base: 14, jitter: 5 },
      hyper: { base: 4, jitter: 2 }
    };

    this.currentSpeed = 'medium';
    this.isPaused = false;
    this.isTyping = false;
    this.timerId = null;
    this.readTimerId = null;

    // View mode: 'spotlight' or 'stream'
    this.viewMode = 'spotlight';

    // Callbacks
    this.onCharTyped = null;
    this.onItemComplete = null;
    this.onProgress = null;

    // State
    this.currentItem = null;
    this.currentIndex = 0;
    this.targetText = '';
  }

  setSpeed(speedName) {
    if (this.speedProfiles[speedName]) {
      this.currentSpeed = speedName;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.isTyping && !this.timerId) {
      this.stepType();
    }
    return this.isPaused;
  }

  setViewMode(mode) {
    this.viewMode = mode;
  }

  /**
   * Start typing a new item
   */
  startTyping(item, elements) {
    this.abort();
    this.currentItem = item;
    this.elements = elements;

    const timeStr = new Date().toLocaleTimeString();

    if (this.viewMode === 'spotlight') {
      this.setupSpotlight(item, timeStr);
    } else {
      this.setupStream(item, timeStr);
    }

    this.targetText = item.text || '';
    this.currentIndex = 0;
    this.isTyping = true;
    this.isPaused = false;

    this.stepType();
  }

  setupSpotlight(item, timeStr) {
    if (!this.elements) return;
    const { categoryEl, timestampEl, titleEl, textEl, authorEl, sourceLinkEl, progressEl } = this.elements;

    if (categoryEl) categoryEl.textContent = item.category || 'INCOMING';
    if (timestampEl) timestampEl.textContent = timeStr;
    if (titleEl) titleEl.textContent = item.title || '';
    if (textEl) textEl.textContent = '';
    if (authorEl) authorEl.textContent = item.author || '';
    if (sourceLinkEl) {
      sourceLinkEl.href = item.url || '#';
      sourceLinkEl.textContent = item.source ? `Source: ${item.source} →` : 'View Source →';
    }
    if (progressEl) {
      progressEl.style.width = '0%';
      progressEl.style.transition = 'none';
    }
  }

  setupStream(item, timeStr) {
    if (!this.elements) return;
    const { streamTextEl } = this.elements;
    if (streamTextEl) {
      streamTextEl.textContent = '';
    }
  }

  /**
   * Core typewriter loop
   */
  stepType() {
    if (this.isPaused || !this.isTyping) return;

    if (this.currentIndex >= this.targetText.length) {
      this.finishTyping();
      return;
    }

    const char = this.targetText[this.currentIndex];
    this.currentIndex++;

    // Update DOM
    if (this.viewMode === 'spotlight' && this.elements.textEl) {
      this.elements.textEl.textContent = this.targetText.substring(0, this.currentIndex);
    } else if (this.viewMode === 'stream' && this.elements.streamTextEl) {
      this.elements.streamTextEl.textContent = this.targetText.substring(0, this.currentIndex);
    }

    // Sound effect
    if (window.typewriterAudio) {
      window.typewriterAudio.playKeyClick(char);
    }

    if (typeof this.onCharTyped === 'function') {
      this.onCharTyped(this.currentIndex, this.targetText.length);
    }

    // Calculate delay with organic cadence
    const delay = this.calculateDelay(char);
    this.timerId = setTimeout(() => this.stepType(), delay);
  }

  /**
   * Micro-cadence delay calculator: adds natural human hesitations at punctuation
   */
  calculateDelay(char) {
    const profile = this.speedProfiles[this.currentSpeed] || this.speedProfiles.medium;
    let baseDelay = profile.base + (Math.random() * profile.jitter * 2 - profile.jitter);

    if (baseDelay < 2) baseDelay = 2;

    // Sentence endings get a dramatic pause
    if (['.', '!', '?'].includes(char)) {
      return baseDelay + (this.currentSpeed === 'hyper' ? 20 : 320);
    }
    // Mid-sentence punctuation gets a brief breath
    if ([',', ';', ':', '—', '-'].includes(char)) {
      return baseDelay + (this.currentSpeed === 'hyper' ? 10 : 160);
    }
    // Paragraph break
    if (char === '\n') {
      return baseDelay + (this.currentSpeed === 'hyper' ? 25 : 280);
    }

    return baseDelay;
  }

  /**
   * Called when all characters are done typing
   */
  finishTyping() {
    this.isTyping = false;
    this.timerId = null;

    // Play carriage bell
    if (window.typewriterAudio) {
      window.typewriterAudio.playBell();
    }

    // In Stream mode: commit the line to the persistent log
    if (this.viewMode === 'stream' && this.elements.streamLogEl && this.currentItem) {
      this.commitStreamEntry();
    }

    // Dynamic reading pause before fetching next item (3 - 5 seconds based on text length)
    const readDurationMs = Math.max(2800, Math.min(6500, this.targetText.length * 35));

    // Animate progress bar in spotlight mode
    if (this.viewMode === 'spotlight' && this.elements.progressEl) {
      this.elements.progressEl.style.transition = `width ${readDurationMs}ms linear`;
      this.elements.progressEl.style.width = '100%';
    }

    this.readTimerId = setTimeout(() => {
      if (typeof this.onItemComplete === 'function') {
        this.onItemComplete();
      }
    }, readDurationMs);
  }

  commitStreamEntry() {
    const entry = document.createElement('div');
    entry.className = 'stream-entry';
    const timeStr = new Date().toLocaleTimeString();

    let titleHtml = this.currentItem.title ? `<div class="entry-title">${this.escapeHtml(this.currentItem.title)}</div>` : '';
    let authorHtml = this.currentItem.author ? ` • ${this.escapeHtml(this.currentItem.author)}` : '';

    entry.innerHTML = `
      <div class="entry-meta">
        <span>[${timeStr}]</span>
        <span>${this.escapeHtml(this.currentItem.category || 'SIGNAL')}</span>
        <span>${authorHtml}</span>
      </div>
      ${titleHtml}
      <div class="entry-body">${this.escapeHtml(this.targetText)}</div>
    `;

    this.elements.streamLogEl.appendChild(entry);
    this.elements.streamLogEl.scrollTop = this.elements.streamLogEl.scrollHeight;

    if (this.elements.streamTextEl) {
      this.elements.streamTextEl.textContent = '';
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Immediately abort current action
   */
  abort() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.readTimerId) {
      clearTimeout(this.readTimerId);
      this.readTimerId = null;
    }
    this.isTyping = false;
  }

  /**
   * Skip directly to next item immediately
   */
  skip() {
    this.abort();
    if (typeof this.onItemComplete === 'function') {
      this.onItemComplete();
    }
  }
}

window.typewriterEngine = new TypewriterEngine();
