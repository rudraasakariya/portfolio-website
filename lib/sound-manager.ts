export type SoundName =
  | "theme-light"
  | "theme-dark"
  | "tick"
  | "hover"
  | "mute"
  | "unmute"
  | "pluck"
  | "success";

export const SOUND_STORAGE_KEY = "rs-portfolio-sound";

type OscType = OscillatorType;

interface ToneOptions {
  /** Seconds after "now" to start. */
  at?: number;
  duration?: number;
  type?: OscType;
  peakGain?: number;
  /** Exponential pitch glide target, in Hz. */
  glideTo?: number;
}

/** Optional per-play tweaks — the Lab's synth panel bends sounds with these. */
export interface PlayModifier {
  /** Semitones up or down; 0 = the sound as designed. */
  pitchShift?: number;
  /** Stretches note lengths and their offsets; 1 = as designed. */
  decayScale?: number;
}

/**
 * All sounds are synthesized with the Web Audio API — no audio files.
 * Mute preference persists to localStorage and is exposed through a
 * subscribe/snapshot pair so components can bind via useSyncExternalStore.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private muted = false;
  private hydrated = false;
  private readonly listeners = new Set<() => void>();
  /* Set per play() call; every tone() within that call reads them. */
  private pitchFactor = 1;
  private decayScale = 1;

  private hydrate(): void {
    if (this.hydrated || typeof window === "undefined") {
      return;
    }
    this.hydrated = true;
    try {
      this.muted = localStorage.getItem(SOUND_STORAGE_KEY) === "muted";
    } catch {
      // Storage unavailable — default to audible.
    }
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getMuted = (): boolean => {
    this.hydrate();
    return this.muted;
  };

  /** Server snapshot for useSyncExternalStore — always audible pre-hydration. */
  readonly getServerMuted = (): boolean => false;

  toggleMuted(): void {
    this.hydrate();
    this.muted = !this.muted;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, this.muted ? "muted" : "on");
    } catch {
      // Preference just won't persist.
    }
    this.listeners.forEach((listener) => listener());
  }

  private audioContext(): AudioContext | null {
    if (typeof window === "undefined") {
      return null;
    }
    if (this.ctx === null) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Master gain with an analyser tap — unity gain, so nothing sounds different. */
  private ensureMaster(ctx: AudioContext): GainNode {
    if (this.master === null || this.analyserNode === null) {
      this.master = ctx.createGain();
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.master.connect(this.analyserNode).connect(ctx.destination);
    }
    return this.master;
  }

  /** Live waveform tap for visualizers (the Lab's synth panel). */
  getAnalyser(): AnalyserNode | null {
    const ctx = this.audioContext();
    if (ctx === null) {
      return null;
    }
    this.ensureMaster(ctx);
    return this.analyserNode;
  }

  private tone(frequency: number, options: ToneOptions = {}): void {
    const ctx = this.audioContext();
    if (ctx === null) {
      return;
    }
    const {
      at = 0,
      duration: baseDuration = 0.15,
      type = "sine",
      peakGain = 0.06,
      glideTo,
    } = options;
    const duration = baseDuration * this.decayScale;
    const start = ctx.currentTime + at * this.decayScale;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency * this.pitchFactor, start);
    if (glideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        glideTo * this.pitchFactor,
        start + duration,
      );
    }
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(this.ensureMaster(ctx));
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  play(name: SoundName, modifier: PlayModifier = {}): void {
    this.hydrate();
    if (this.muted) {
      return;
    }
    this.pitchFactor = 2 ** ((modifier.pitchShift ?? 0) / 12);
    this.decayScale = modifier.decayScale ?? 1;
    switch (name) {
      case "theme-light":
        // Rising two-note plink, like a light warming up.
        this.tone(392, { duration: 0.12, peakGain: 0.11 });
        this.tone(587.33, { at: 0.075, duration: 0.2, peakGain: 0.13 });
        this.tone(1174.66, { at: 0.075, duration: 0.18, peakGain: 0.035 });
        break;
      case "theme-dark":
        // Falling, softer — the same motif inverted.
        this.tone(587.33, { duration: 0.12, type: "triangle", peakGain: 0.11 });
        this.tone(392, { at: 0.075, duration: 0.22, type: "triangle", peakGain: 0.11 });
        break;
      case "tick":
        this.tone(1800, { duration: 0.045, type: "square", peakGain: 0.05, glideTo: 1200 });
        break;
      case "hover":
        this.tone(2400, { duration: 0.03, type: "sine", peakGain: 0.025, glideTo: 2000 });
        break;
      case "mute":
        // Descending "off" thud.
        this.tone(520, { duration: 0.09, type: "triangle", peakGain: 0.1, glideTo: 260 });
        break;
      case "unmute":
        // Ascending "on" pop.
        this.tone(330, { duration: 0.07, type: "triangle", peakGain: 0.09, glideTo: 660 });
        this.tone(990, { at: 0.06, duration: 0.1, peakGain: 0.05 });
        break;
      case "pluck":
        this.tone(640, { duration: 0.09, type: "triangle", peakGain: 0.07, glideTo: 480 });
        break;
      case "success":
        this.tone(523.25, { duration: 0.16, peakGain: 0.11 });
        this.tone(659.25, { at: 0.09, duration: 0.16, peakGain: 0.11 });
        this.tone(783.99, { at: 0.18, duration: 0.28, peakGain: 0.12 });
        this.tone(1567.98, { at: 0.18, duration: 0.24, peakGain: 0.035 });
        break;
    }
  }
}

export const soundManager = new SoundManager();
