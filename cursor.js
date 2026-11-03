/**
 * Autonomous Virtual Cursor Simulation Engine
 * Generates organic, spring-damped, human-like mouse pointer movements,
 * text-tracking, reading motions, UI hovering, and click ripples
 * to maintain visible activity for screen recording and live capture.
 */

class VirtualCursorSimulator {
  constructor() {
    this.enabled = true;
    this.cursorEl = null;
    this.clickRingEl = null;

    // Physical position & Target position
    this.x = window.innerWidth * 0.5;
    this.y = window.innerHeight * 0.5;
    this.targetX = this.x;
    this.targetY = this.y;

    // Movement physics (damping)
    this.speed = 0.08;
    this.animId = null;

    // Behaviors
    this.state = 'TRACK_TEXT'; // 'TRACK_TEXT', 'HOVER_UI', 'READING', 'IDLE_JITTER'
    this.lastStateChange = Date.now();
    this.nextTargetTime = 0;

    // Cache of UI elements to occasionally visit
    this.interactiveTargets = [];
  }

  init() {
    if (document.getElementById('virtualCursor')) return;

    // Create virtual cursor element
    const container = document.createElement('div');
    container.id = 'virtualCursor';
    container.className = 'virtual-cursor';
    container.innerHTML = `
      <svg class="cursor-pointer" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 3L11.5 21L14.5 13.5L22 10.5L4 3Z" fill="#00b4ff" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      <div class="cursor-ripple" id="cursorRipple"></div>
      <div class="cursor-halo"></div>
    `;

    document.body.appendChild(container);
    this.cursorEl = container;
    this.clickRingEl = document.getElementById('cursorRipple');

    // Collect interactive buttons for autonomous browsing
    this.updateInteractiveTargets();

    // Start render loop
    this.startLoop();

    // Schedule autonomous actions
    this.scheduleNextAction();
  }

  updateInteractiveTargets() {
    this.interactiveTargets = Array.from(
      document.querySelectorAll('.btn, .speed-btn, .source-link, .category-pill, .brand')
    );
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.cursorEl) {
      this.cursorEl.style.display = this.enabled ? 'block' : 'none';
    }
    return this.enabled;
  }

  /**
   * Smooth physics rendering loop
   */
  startLoop() {
    const loop = () => {
      if (this.enabled && this.cursorEl) {
        // Organic spring interpolation (LERP)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Apply slight breathing micro-jitter
        const microJitterX = Math.sin(Date.now() * 0.003) * 1.2;
        const microJitterY = Math.cos(Date.now() * 0.0025) * 1.2;

        this.cursorEl.style.transform = `translate3d(${this.x + microJitterX}px, ${this.y + microJitterY}px, 0)`;

        // Check if reached target
        if (Date.now() > this.nextTargetTime) {
          this.pickNewTarget();
        }
      }
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  /**
   * Follow the typewriter blinking cursor
   */
  trackTypingCursor() {
    if (!this.enabled) return;

    // Prefer tracking the actual DOM cursor
    const activeCursor = document.querySelector('.cursor:not(.hidden)');
    if (activeCursor) {
      const rect = activeCursor.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        // Natural reading offset: slightly to the right & below the typing head
        this.targetX = rect.right + 18 + (Math.random() * 12 - 6);
        this.targetY = rect.bottom + 6 + (Math.random() * 8 - 4);
        this.speed = 0.12; // Snappier while tracking typing
        return;
      }
    }

    // Fallback: stay within main stage area
    const stage = document.querySelector('.stage-card') || document.querySelector('.stream-stage');
    if (stage) {
      const rect = stage.getBoundingClientRect();
      this.targetX = rect.left + rect.width * 0.5 + (Math.random() * 80 - 40);
      this.targetY = rect.top + rect.height * 0.5 + (Math.random() * 40 - 20);
    }
  }

  /**
   * Autonomous behaviors: tracks text, moves to UI elements, scrolls, lingers
   */
  pickNewTarget() {
    const now = Date.now();
    const dice = Math.random();

    // 65% of the time: follow typing text
    if (dice < 0.65) {
      this.state = 'TRACK_TEXT';
      this.trackTypingCursor();
      this.nextTargetTime = now + 400 + Math.random() * 600;
    }
    // 20% of the time: wander over to inspect a control button
    else if (dice < 0.85 && this.interactiveTargets.length > 0) {
      this.state = 'HOVER_UI';
      const randomTarget = this.interactiveTargets[Math.floor(Math.random() * this.interactiveTargets.length)];
      if (randomTarget) {
        const rect = randomTarget.getBoundingClientRect();
        this.targetX = rect.left + rect.width * 0.5 + (Math.random() * 10 - 5);
        this.targetY = rect.top + rect.height * 0.5 + (Math.random() * 8 - 4);
        this.speed = 0.06; // Smooth graceful glide

        // Trigger hover effect & click simulation after arrival
        setTimeout(() => {
          if (this.enabled && this.state === 'HOVER_UI') {
            this.simulateClick();
          }
        }, 800);
      }
      this.nextTargetTime = now + 1800 + Math.random() * 1200;
    }
    // 15% of the time: slow reading scan across the text
    else {
      this.state = 'READING';
      const textContainer = document.querySelector('.text-display') || document.querySelector('.stage-card');
      if (textContainer) {
        const rect = textContainer.getBoundingClientRect();
        this.targetX = rect.left + Math.random() * (rect.width * 0.8);
        this.targetY = rect.top + Math.random() * (rect.height * 0.8);
        this.speed = 0.04; // Deliberate slow reading glide
      }
      this.nextTargetTime = now + 2000 + Math.random() * 1500;
    }
  }

  scheduleNextAction() {
    this.nextTargetTime = Date.now() + 1000;
  }

  /**
   * Visual click pulse ripple on the virtual cursor
   */
  simulateClick() {
    if (!this.clickRingEl) return;
    this.clickRingEl.classList.remove('active');
    void this.clickRingEl.offsetWidth; // Force reflow
    this.clickRingEl.classList.add('active');
  }

  /**
   * Adapt cursor color to the active theme
   */
  updateThemeColor(color) {
    if (!this.cursorEl) return;
    const path = this.cursorEl.querySelector('path');
    if (path) {
      path.setAttribute('fill', color);
    }
  }
}

window.virtualCursor = new VirtualCursorSimulator();
