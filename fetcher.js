/**
 * Background Live Web Fetcher
 * Manages dual-buffer queue, multi-endpoint rotation, and fallback mechanisms.
 */

class WebFetcher {
  constructor() {
    this.queue = [];
    this.bufferTarget = 3;
    this.isFetching = false;
    this.selectedSource = 'all'; // 'all', 'wikipedia', 'facts', 'quotes', 'advice'
    this.onStatusChange = null;
    this.onQueueUpdate = null;

    // Curated offline fallback corpus (ensures zero downtime even offline)
    this.fallbackCorpus = [
      {
        category: "Cosmic Science",
        title: "The Hum of the Universe",
        text: "The Cosmic Microwave Background radiation is the cooled remnant of the first light that could ever travel freely through the universe, created roughly 380,000 years after the Big Bang.",
        author: "Astrophysics Lore",
        source: "Cosmic Archive",
        url: "https://en.wikipedia.org/wiki/Cosmic_microwave_background"
      },
      {
        category: "Deep Wisdom",
        title: "The Art of Living",
        text: "We suffer more often in imagination than in reality. To be everywhere is to be nowhere. Time discovers truth.",
        author: "Seneca",
        source: "Letters from a Stoic",
        url: "https://en.wikipedia.org/wiki/Seneca_the_Younger"
      },
      {
        category: "Nature & Biology",
        title: "The Forest Network",
        text: "Underneath every mature forest lies a mycorrhizal fungal network—often called the 'Wood Wide Web'—through which trees share nutrients, water, and warning signals of impending drought or insect attacks.",
        author: "Ecology Dispatch",
        source: "Nature Records",
        url: "https://en.wikipedia.org/wiki/Mycorrhizal_network"
      },
      {
        category: "Philosophy of Mind",
        title: "The Ship of Theseus",
        text: "If a ship has all of its wooden planks replaced one by one over decades of voyages, does it remain the very same vessel, or does it become an entirely new creation?",
        author: "Plutarch",
        source: "Greek Thought",
        url: "https://en.wikipedia.org/wiki/Ship_of_Theseus"
      },
      {
        category: "Computation & Logic",
        title: "Ada Lovelace's Vision",
        text: "In 1843, Ada Lovelace observed that Charles Babbage's Analytical Engine could weave algebraical patterns just as the Jacquard loom weaves flowers and leaves, making her the world's first computer programmer.",
        author: "Computing Pioneers",
        source: "Science History",
        url: "https://en.wikipedia.org/wiki/Ada_Lovelace"
      },
      {
        category: "Fascinating Fact",
        title: "Honey & Deep Time",
        text: "Archaeologists excavating ancient Egyptian tombs have uncovered pots of raw honey over 3,000 years old that are still completely edible, preserved indefinitely by honey's natural acidity and low moisture.",
        author: "Archaeology Today",
        source: "Ancient Studies",
        url: "https://en.wikipedia.org/wiki/Honey"
      },
      {
        category: "Quantum Physics",
        title: "Wave-Particle Duality",
        text: "A single particle fired at two slits simultaneously creates an interference pattern on the screen behind, behaving as a probability wave until an observer attempts to measure which slit it passed through.",
        author: "Quantum Mechanics",
        source: "Physics Annals",
        url: "https://en.wikipedia.org/wiki/Double-slit_experiment"
      },
      {
        category: "Human Ingenuity",
        title: "The Golden Record",
        text: "Aboard Voyager 1 and 2 hurtling into interstellar space are phonograph records containing sounds of Earth, 115 images, mathematical equations, and music by Bach, Mozart, and Chuck Berry.",
        author: "NASA Mission Archives",
        source: "Interstellar Program",
        url: "https://en.wikipedia.org/wiki/Voyager_Golden_Record"
      }
    ];
  }

  setSource(source) {
    this.selectedSource = source;
    // Clear buffer so new selections take effect immediately
    this.queue = [];
    this.notifyQueue();
    this.fillBuffer();
  }

  notifyStatus(statusText, isLive = true) {
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange(statusText, isLive);
    }
  }

  notifyQueue() {
    if (typeof this.onQueueUpdate === 'function') {
      this.onQueueUpdate(this.queue.length);
    }
  }

  /**
   * Keep queue filled to bufferTarget
   */
  async fillBuffer() {
    if (this.isFetching) return;
    if (this.queue.length >= this.bufferTarget) return;

    this.isFetching = true;
    try {
      while (this.queue.length < this.bufferTarget) {
        this.notifyStatus("FETCHING LIVE WEB DATA...", true);
        const item = await this.fetchRandomItem();
        if (item) {
          this.queue.push(item);
          this.notifyQueue();
          this.notifyStatus("LIVE WEB STREAM CONNECTED", true);
        } else {
          // Fallback if network blocked
          const fallback = this.getRandomFallback();
          this.queue.push(fallback);
          this.notifyQueue();
          this.notifyStatus("LOCAL CACHE ACTIVE", false);
        }
      }
    } catch (err) {
      console.warn("Background fetcher error:", err);
      if (this.queue.length === 0) {
        this.queue.push(this.getRandomFallback());
        this.notifyQueue();
      }
      this.notifyStatus("OFFLINE / CACHED FEED", false);
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get next ready item immediately, and background-fill the queue
   */
  async getNext() {
    if (this.queue.length === 0) {
      await this.fillBuffer();
    }
    const nextItem = this.queue.shift() || this.getRandomFallback();
    this.notifyQueue();
    // Fire-and-forget background replenishment
    setTimeout(() => this.fillBuffer(), 50);
    return nextItem;
  }

  /**
   * Router to fetch from selected or random web endpoint
   */
  async fetchRandomItem() {
    let endpointType = this.selectedSource;
    if (endpointType === 'all') {
      const endpoints = ['wikipedia', 'facts', 'quotes', 'advice', 'jokes'];
      endpointType = endpoints[Math.floor(Math.random() * endpoints.length)];
    }

    try {
      switch (endpointType) {
        case 'wikipedia':
          return await this.fetchWikipedia();
        case 'facts':
          return (Math.random() > 0.5) ? await this.fetchUselessFact() : await this.fetchCatFact();
        case 'quotes':
          return await this.fetchQuote();
        case 'advice':
          return await this.fetchAdvice();
        case 'jokes':
          return await this.fetchJoke();
        default:
          return await this.fetchWikipedia();
      }
    } catch (err) {
      console.warn(`Fetch from ${endpointType} failed, trying secondary endpoint:`, err);
      // Secondary attempt with a different source
      try {
        return await this.fetchUselessFact();
      } catch (e2) {
        return null;
      }
    }
  }

  /**
   * 1. Wikipedia Random Summary API
   */
  async fetchWikipedia() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
    const data = await res.json();

    if (!data.extract || data.extract.trim().length < 40) {
      throw new Error("Extract too brief");
    }

    return {
      category: data.description ? `Wikipedia • ${data.description}` : "Wikipedia Discovery",
      title: data.title || "Random Article",
      text: data.extract,
      author: "Wikipedia Contributors",
      source: "Wikipedia REST API",
      url: data.content_urls?.desktop?.page || "https://en.wikipedia.org"
    };
  }

  /**
   * 2. Useless Facts API
   */
  async fetchUselessFact() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://uselessfacts.jsph.pl/api/v2/facts/random?language=en&_cb=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`UselessFacts HTTP ${res.status}`);
    const data = await res.json();

    return {
      category: "Random Fact",
      title: "Did You Know?",
      text: data.text,
      author: "Curious World",
      source: "Useless Facts API",
      url: data.source_url || "https://uselessfacts.jsph.pl"
    };
  }

  /**
   * 3. Cat Facts API
   */
  async fetchCatFact() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://catfact.ninja/fact?_cb=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`CatFact HTTP ${res.status}`);
    const data = await res.json();

    return {
      category: "Animal Kingdom",
      title: "Feline Chronicles",
      text: data.fact,
      author: "Nature Dispatch",
      source: "CatFact API",
      url: "https://catfact.ninja"
    };
  }

  /**
   * 4. DummyJSON Random Quote
   */
  async fetchQuote() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://dummyjson.com/quotes/random?_cb=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`DummyJSON HTTP ${res.status}`);
    const data = await res.json();

    return {
      category: "Wisdom & Quotes",
      title: "",
      text: `"${data.quote}"`,
      author: data.author ? `— ${data.author}` : "",
      source: "DummyJSON Quotes",
      url: "https://dummyjson.com"
    };
  }

  /**
   * 5. Advice Slip API
   */
  async fetchAdvice() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://api.adviceslip.com/advice?_cb=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`AdviceSlip HTTP ${res.status}`);
    const data = await res.json();

    return {
      category: "Daily Advice",
      title: "Words to Ponder",
      text: data.slip.advice,
      author: "Life Compass",
      source: "Advice Slip API",
      url: "https://adviceslip.com"
    };
  }

  /**
   * 6. Official Joke API
   */
  async fetchJoke() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://official-joke-api.appspot.com/random_joke?_cb=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Joke HTTP ${res.status}`);
    const data = await res.json();

    return {
      category: `Humor • ${data.type || 'Random'}`,
      title: "Quick Laugh",
      text: `${data.setup}\n\n... ${data.punchline}`,
      author: "Comedy Archives",
      source: "Official Joke API",
      url: "https://official-joke-api.appspot.com"
    };
  }

  getRandomFallback() {
    const idx = Math.floor(Math.random() * this.fallbackCorpus.length);
    return { ...this.fallbackCorpus[idx] };
  }
}

window.webFetcher = new WebFetcher();
