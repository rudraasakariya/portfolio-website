"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SYNTH } from "@/lib/content/lab";
import { soundManager } from "@/lib/sound-manager";
import type { SoundName } from "@/lib/sound-manager";

/** Every real UI sound, in the order they live in the manager. */
const PADS: ReadonlyArray<SoundName> = [
  "theme-light",
  "theme-dark",
  "tick",
  "hover",
  "mute",
  "unmute",
  "pluck",
  "success",
];

const PITCH_RANGE = { min: -12, max: 12, step: 1 } as const;
const DECAY_RANGE = { min: 0.5, max: 2.5, step: 0.1 } as const;
const PITCH_DEFAULT = 0;
const DECAY_DEFAULT = 1;

/** RMS (0-centered) below this counts as silence. */
const SILENCE_RMS = 0.0015;
/** The scope keeps drawing this long after the last audible sample. */
const IDLE_AFTER_MS = 1000;
/** Reduced motion: one snapshot this far into the sound, mid-envelope. */
const SNAPSHOT_DELAY_MS = 70;

const SCOPE_HEIGHT_PX = 96;

function padLabel(name: SoundName): string {
  return name.replace("-", " ");
}

function themeColor(variable: "--accent" | "--border-strong"): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

function drawBaselineOn(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = themeColor("--border-strong");
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

function drawWaveOn(canvas: HTMLCanvasElement, samples: Float32Array): void {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = themeColor("--accent");
  ctx.lineWidth = 2;
  ctx.beginPath();
  const mid = canvas.height / 2;
  const amp = canvas.height * 0.46;
  for (let i = 0; i < samples.length; i += 1) {
    const x = (i / (samples.length - 1)) * canvas.width;
    const y = mid - samples[i] * amp;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

export function SynthPanel(): React.JSX.Element {
  const muted = useSyncExternalStore(
    soundManager.subscribe,
    soundManager.getMuted,
    soundManager.getServerMuted,
  );
  const [pitch, setPitch] = useState<number>(PITCH_DEFAULT);
  const [decay, setDecay] = useState<number>(DECAY_DEFAULT);

  const scopeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const loopingRef = useRef(false);
  const lastAudibleRef = useRef(0);
  /* Pad hits set this; the rAF step converts it to a timestamp (the compiler
     forbids performance.now() outside effect/frame callbacks). */
  const retriggerRef = useRef(false);
  const visibleRef = useRef(true);

  const stopLoop = useCallback((): void => {
    loopingRef.current = false;
    cancelAnimationFrame(frameRef.current);
  }, []);

  /* Size the canvas to its rendered width and keep the idle baseline drawn. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(SCOPE_HEIGHT_PX * dpr);
      if (!loopingRef.current) {
        drawBaselineOn(canvas);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          stopLoop();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    const onVisibility = (): void => {
      if (document.hidden) {
        stopLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopLoop();
      window.removeEventListener("resize", resize);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stopLoop]);

  const setActive = (active: boolean): void => {
    scopeRef.current?.setAttribute("data-active", active ? "true" : "false");
  };

  const ensureLoop = (): void => {
    retriggerRef.current = true;
    if (loopingRef.current || !visibleRef.current) {
      return;
    }
    const analyser = soundManager.getAnalyser();
    const canvas = canvasRef.current;
    if (analyser === null || canvas === null) {
      return;
    }
    loopingRef.current = true;
    const samples = new Float32Array(analyser.fftSize);
    const step = (now: number): void => {
      if (!loopingRef.current) {
        return;
      }
      if (retriggerRef.current) {
        retriggerRef.current = false;
        lastAudibleRef.current = now;
      }
      analyser.getFloatTimeDomainData(samples);
      if (rms(samples) > SILENCE_RMS) {
        lastAudibleRef.current = now;
      }
      if (now - lastAudibleRef.current > IDLE_AFTER_MS) {
        stopLoop();
        setActive(false);
        drawBaselineOn(canvas);
        return;
      }
      drawWaveOn(canvas, samples);
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  };

  const drawSnapshot = (): void => {
    window.setTimeout(() => {
      const analyser = soundManager.getAnalyser();
      const canvas = canvasRef.current;
      if (analyser !== null && canvas !== null) {
        const samples = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(samples);
        drawWaveOn(canvas, samples);
      }
    }, SNAPSHOT_DELAY_MS);
  };

  const handlePad = (name: SoundName): void => {
    soundManager.play(name, { pitchShift: pitch, decayScale: decay });
    setActive(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawSnapshot();
    } else {
      ensureLoop();
    }
  };

  const handleUnmute = (): void => {
    soundManager.toggleMuted();
    soundManager.play("unmute");
  };

  return (
    <div className="lab-frame">
      <div ref={scopeRef} className="sy-scope" data-active="false">
        <canvas
          ref={canvasRef}
          className="sy-canvas"
          aria-label="Live waveform of the interface sounds"
          role="img"
        />
      </div>

      <div className="sy-pads">
        {PADS.map((name) => (
          <button
            key={name}
            type="button"
            className="sy-pad"
            disabled={muted}
            onClick={() => handlePad(name)}
          >
            {padLabel(name)}
          </button>
        ))}
      </div>

      <div className="sy-meta">
        <div className="sy-controls">
          <label className="sy-control">
            <span>
              {SYNTH.knobs.pitch} · {pitch > 0 ? `+${pitch}` : pitch} st
            </span>
            <input
              type="range"
              min={PITCH_RANGE.min}
              max={PITCH_RANGE.max}
              step={PITCH_RANGE.step}
              value={pitch}
              onChange={(event) => setPitch(Number(event.target.value))}
              onPointerUp={() =>
                soundManager.play("tick", { pitchShift: pitch, decayScale: decay })
              }
            />
          </label>
          <label className="sy-control">
            <span>
              {SYNTH.knobs.decay} · {decay.toFixed(1)}×
            </span>
            <input
              type="range"
              min={DECAY_RANGE.min}
              max={DECAY_RANGE.max}
              step={DECAY_RANGE.step}
              value={decay}
              onChange={(event) => setDecay(Number(event.target.value))}
              onPointerUp={() =>
                soundManager.play("tick", { pitchShift: pitch, decayScale: decay })
              }
            />
          </label>
        </div>

        {muted && (
          <div className="sy-muted-note">
            {SYNTH.mutedNote}{" "}
            <button type="button" className="sy-unmute" onClick={handleUnmute}>
              {SYNTH.unmuteLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
