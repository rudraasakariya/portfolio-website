"use client";

import { useEffect, useRef, useState } from "react";

import { soundManager } from "@/lib/sound-manager";

const MODEL_ID = "Xenova/yolos-tiny";
const SCORE_THRESHOLD = 0.5;
/** Frames are downscaled to this width before inference — speed over pixels. */
const WORK_WIDTH = 480;

type DetectorStatus = "off" | "loading" | "live" | "error";

const STATUS_LABELS: Record<DetectorStatus, string> = {
  off: "camera off",
  loading: "loading model…",
  live: "detecting live",
  error: "stopped",
};

const ERROR_CAMERA = "Camera unavailable — check permissions and try again.";
const ERROR_MODEL = "Model failed to load — check your connection and try again.";

class CameraUnavailableError extends Error {
  constructor() {
    super(ERROR_CAMERA);
    this.name = "CameraUnavailableError";
  }
}

interface DetectionBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface Detection {
  score: number;
  label: string;
  box: DetectionBox;
}

type Detector = (frame: ImageData) => Promise<ReadonlyArray<Detection>>;

/* Module-level singleton so the model survives route changes and repeated
   start/stop cycles — same pattern as the search palette's embedder. */
let detectorPromise: Promise<Detector> | null = null;

function loadDetector(): Promise<Detector> {
  detectorPromise ??= (async (): Promise<Detector> => {
    try {
      const { env, pipeline, RawImage } = await import(
        "@huggingface/transformers"
      );
      env.allowLocalModels = false;
      let detect;
      try {
        // WebGPU runs off the main thread and is an order of magnitude faster.
        detect = await pipeline("object-detection", MODEL_ID, {
          device: "webgpu",
          dtype: "fp16",
        });
      } catch {
        // WASM fallback MUST proxy to a worker — on-thread inference freezes
        // the whole page for seconds per frame (verified in headless runs).
        if (env.backends.onnx.wasm !== undefined) {
          env.backends.onnx.wasm.proxy = true;
        }
        detect = await pipeline("object-detection", MODEL_ID, {
          dtype: "q8",
        });
      }
      return async (frame: ImageData): Promise<ReadonlyArray<Detection>> => {
        const image = new RawImage(frame.data, frame.width, frame.height, 4);
        const output = await detect(image, {
          threshold: SCORE_THRESHOLD,
          percentage: false,
        });
        return output as unknown as ReadonlyArray<Detection>;
      };
    } catch (error) {
      detectorPromise = null;
      throw error;
    }
  })();
  return detectorPromise;
}

function accentColor(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
}

/**
 * Draw boxes in video-native coordinates. The video preview is CSS-mirrored
 * (selfie view), so box x-coordinates are flipped here instead of mirroring
 * the canvas — that keeps the label text readable.
 */
function drawDetections(
  canvas: HTMLCanvasElement,
  detections: ReadonlyArray<Detection>,
  scale: number,
): void {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return;
  }
  const accent = accentColor();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "600 13px var(--font-plex-mono), monospace";
  ctx.textBaseline = "middle";
  for (const detection of detections) {
    const xmin = canvas.width - detection.box.xmax * scale;
    const xmax = canvas.width - detection.box.xmin * scale;
    const ymin = detection.box.ymin * scale;
    const ymax = detection.box.ymax * scale;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

    const text = `${detection.label} ${Math.round(detection.score * 100)}%`;
    const textWidth = ctx.measureText(text).width;
    const chipHeight = 22;
    const chipY = Math.max(0, ymin - chipHeight);
    ctx.fillStyle = accent;
    ctx.fillRect(xmin, chipY, textWidth + 16, chipHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, xmin + 8, chipY + chipHeight / 2 + 1);
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function ObjectDetector(): React.JSX.Element {
  const [status, setStatus] = useState<DetectorStatus>("off");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inferMs, setInferMs] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);

  const stopStream = (): void => {
    runningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video !== null) {
      video.srcObject = null;
    }
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    if (overlay !== undefined && overlay !== null && ctx != null) {
      ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
  };

  useEffect(() => {
    // Imperative teardown only — no state updates on unmount.
    return () => {
      runningRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const runLoop = async (detect: Detector): Promise<void> => {
    while (runningRef.current) {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (video === null || overlay === null || video.readyState < 2) {
        await nextFrame();
        continue;
      }
      const scale = WORK_WIDTH / video.videoWidth;
      const workWidth = WORK_WIDTH;
      const workHeight = Math.round(video.videoHeight * scale);
      workCanvasRef.current ??= document.createElement("canvas");
      const work = workCanvasRef.current;
      work.width = workWidth;
      work.height = workHeight;
      const workCtx = work.getContext("2d", { willReadFrequently: true });
      if (workCtx === null) {
        return;
      }
      workCtx.drawImage(video, 0, 0, workWidth, workHeight);
      const frame = workCtx.getImageData(0, 0, workWidth, workHeight);

      const startedAt = performance.now();
      const detections = await detect(frame);
      if (!runningRef.current) {
        return;
      }
      setInferMs(Math.round(performance.now() - startedAt));

      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
      drawDetections(overlay, detections, 1 / scale);
      await nextFrame();
    }
  };

  const handleStart = async (): Promise<void> => {
    soundManager.play("tick");
    setErrorMessage(null);
    setStatus("loading");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
    } catch {
      setStatus("error");
      setErrorMessage(ERROR_CAMERA);
      return;
    }
    try {
      streamRef.current = stream;
      const video = videoRef.current;
      if (video === null) {
        throw new CameraUnavailableError();
      }
      video.srcObject = stream;
      await video.play();
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
      const detect = await loadDetector();
      soundManager.play("success");
      setStatus("live");
      runningRef.current = true;
      void runLoop(detect);
    } catch (error) {
      stopStream();
      setStatus("error");
      setErrorMessage(
        error instanceof CameraUnavailableError ? ERROR_CAMERA : ERROR_MODEL,
      );
    }
  };

  const handleStop = (): void => {
    soundManager.play("tick");
    stopStream();
    setStatus("off");
    setInferMs(null);
  };

  const live = status === "live";

  return (
    <div>
      <div className="lab-frame">
        <div className="vision-chrome">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
        <div
          className="vision-stage"
          // Idle frame matches its Lab siblings; live camera keeps its real ratio.
          style={{ aspectRatio: aspectRatio ?? "16 / 10" }}
        >
          {/* Mirrored for a natural selfie view; boxes are flipped in draw. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="vision-video"
            data-active={live}
          />
          <canvas ref={overlayRef} className="vision-overlay" />
          {!live && (
            <div className="vision-placeholder">
              {errorMessage ??
                (status === "loading"
                  ? "warming up the model…"
                  : "camera is off")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {live || status === "loading" ? (
          <button
            type="button"
            onClick={handleStop}
            className="cursor-pointer rounded-[8px] border border-(--border-strong) bg-(--card-bg) px-5 py-[10px] text-[14px] font-medium text-(--text-primary)"
          >
            Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStart()}
            className="cursor-pointer rounded-[8px] border-none bg-(--text-primary) px-5 py-[10px] text-[14px] font-medium text-(--bg-page)"
          >
            Start camera
          </button>
        )}
        <span className="vision-status" data-mode={status}>
          {STATUS_LABELS[status]}
        </span>
        {inferMs !== null && live && (
          <span className="font-mono text-[12px] text-(--text-muted)">
            ~{inferMs}ms / frame on your device
          </span>
        )}
      </div>
    </div>
  );
}
