/** Scroll targets shared by the Lab sections and the search index. */
export const EMBEDDING_MAP_ANCHOR = "embedding-map";
export const RATE_LIMITER_ANCHOR = "rate-limiter";
export const SYNTH_ANCHOR = "synth";

export const VISION = {
  eyebrow: "Vision · on-device ML",
  lead: "A YOLOS transformer compiled to ONNX labels what your camera sees, frame by frame — the same stack that powers the ⌘K search here.",
  privacy: "Runs entirely in your browser — no video ever leaves your device.",
} as const;

export const EMBEDDING_MAP = {
  eyebrow: "Search · embeddings",
  lead: "Every chunk of this site lives as a 384-dimensional vector — this is that space, flattened to two. Type and watch your words land near their meaning.",
  placeholder: "Try “auth systems” or “realtime messaging”…",
  warmingLabel: "warming up…",
  readyLabel: "semantic ready",
  offlineNote:
    "Model unavailable right now — the map still shows every indexed chunk.",
  queryLabel: "your query",
} as const;

export const SYNTH = {
  eyebrow: "Sound · Web Audio",
  lead: "No audio files anywhere on this site — every click and chime is synthesized the moment you hear it. This is the actual instrument: play it, bend it.",
  knobs: {
    pitch: "Pitch",
    decay: "Decay",
  },
  mutedNote: "Interface sounds are muted right now.",
  unmuteLabel: "Unmute",
} as const;

export const RATE_LIMITER = {
  eyebrow: "Systems · backpressure",
  lead: "At SoftScribble I cut failed message sends 38% with rate limiting and queueing. This is that idea, live — tune the traffic and watch the bucket cope.",
  sliders: {
    arrival: "Traffic",
    capacity: "Bucket size",
    refill: "Refill rate",
  },
  startLabel: "Start traffic",
  stopLabel: "Stop",
  counters: {
    delivered: "delivered / s",
    queued: "in queue",
    dropped: "dropped",
  },
  laneLabels: {
    requests: "requests",
    delivered: "delivered",
    dropped: "dropped",
  },
} as const;
