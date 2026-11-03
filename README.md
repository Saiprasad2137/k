# Live Web Typewriter 📜✨

An interactive webpage that reaches out to live web endpoints in the background, pulls random discoveries (Wikipedia summaries, intriguing facts, deep philosophical quotes, daily advice, and science lore), and continuously types them out slowly letter-by-letter on the screen with organic cadence and blinking cursor.

---

## 🚀 Quick Start

You can open the webpage directly:

1. **Direct Double-Click**:
   - Double-click `index.html` in your file explorer. It will open instantly in your default web browser (Chrome, Edge, Firefox, Brave, Safari, etc.).

2. **Or via Local Web Server** (Optional):
   - In PowerShell or Terminal in this folder:
     ```powershell
     python -m http.server 8080
     ```
   - Then open `http://localhost:8080` in your browser.

---

## 🌟 Key Features

1. **Background Live Web Fetcher with Pre-buffer Queue**:
   - Reaches out to open web APIs in the background.
   - Dual-buffer queue: pre-fetches the next 3 items ahead of time so there is zero latency or waiting between passages.
   - Real-time endpoints include:
     - **Wikipedia REST API**: Random featured encyclopedia summaries
     - **Useless Facts API**: Weird and wonderful real-world facts
     - **Advice Slip API**: Practical life advice and thoughts
     - **DummyJSON Quotes**: World literature, philosophy, and timeless thoughts
     - **CatFact & Joke APIs**: Nature and lighthearted trivia
   - **Offline & Fault-Tolerant Failover**: Built-in curated archive ensures uninterrupted typewriter flow even when offline or during network latency.

2. **Organic Typewriter Engine**:
   - Letter-by-letter typing with subtle natural human cadence.
   - Automatic pauses at punctuation marks (`.`, `!`, `?`, `,`, `—`) for pleasant reading.
   - Speed selection:
     - **SLOW** (~75ms/char) - Deliberate vintage teletype
     - **MED** (~32ms/char) - Ideal reading rhythm
     - **FAST** (~14ms/char) - Energetic ticker
     - **HYPER** (~4ms/char) - Instant matrix data dump
   - Smooth read-timer progress bar with automatic transition to the next incoming web snippet.

3. **Dual View Modes**:
   - **Spotlight Mode**: Centered, distraction-free reading card with category badge, timestamp, reading progress, and link to the original web source.
   - **Stream Log Mode**: Infinite hacker terminal / teleprompter feed that appends every transmission into a scrollable log.

4. **Procedural Web Audio Synthesizer**:
   - Self-contained mechanical typewriter sound effects built directly with the **Web Audio API** (no external audio files to download).
   - Frequency-jittered key clicks, deeper spacebar thuds, and classic end-of-line carriage bell ding.
   - Toggle on or off with the sound button or hotkey `M`.

5. **5 Aesthetic Themes**:
   - **Matrix Terminal**: Glowing emerald on deep carbon with subtle scanlines.
   - **Cyberpunk Amber**: Warm golden phosphor glow.
   - **Deep Space Neon**: Electric cyan and purple on obsidian.
   - **Vintage Typewriter**: Antique parchment and warm ink tones.
   - **Minimalist Editorial**: Clean modern gray and white typography.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Pause / Resume typing |
| <kbd>N</kbd> | Skip immediately to next item |
| <kbd>M</kbd> | Toggle mechanical sound effects |
| <kbd>1</kbd> - <kbd>4</kbd> | Change speed (Slow, Med, Fast, Hyper) |
| <kbd>V</kbd> | Switch View (Spotlight vs Stream Log) |
| <kbd>F</kbd> | Toggle Fullscreen ambient display |
| <kbd>?</kbd> | Show help cheat sheet |
