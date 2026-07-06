import { ROUTES } from "@/lib/site-config";

export enum ProjectCategory {
  FullStackWeb = "fullstack-web",
  SystemsNative = "systems-native",
  AiMl = "ai-ml",
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  [ProjectCategory.FullStackWeb]: "Full-Stack / Web",
  [ProjectCategory.SystemsNative]: "Systems & Native",
  [ProjectCategory.AiMl]: "AI / ML",
};

export type ProjectLayout = "featured-side" | "featured-wide" | "standard";

export interface Project {
  id: string;
  year: string;
  title: string;
  tagline: string;
  eyebrow: string;
  eyebrowAccent: boolean;
  category: ProjectCategory;
  layout: ProjectLayout;
  previewCaption: string;
  tags: ReadonlyArray<string>;
  impact: ReadonlyArray<string>;
  /** Null = no hosted demo yet (button hidden until one exists). */
  demoUrl: string | null;
  /** Null = no public repo (private / internal work). */
  githubUrl: string | null;
  /** Shown instead of action buttons when the work is private. */
  privateLabel: string | null;
}

export const PROJECTS: ReadonlyArray<Project> = [
  {
    id: "sparsh",
    year: "2025",
    title: "Sparsh",
    tagline: "Cross-platform clipboard & file sharing",
    eyebrow: "Featured · Full-Stack / Web",
    eyebrowAccent: true,
    category: ProjectCategory.FullStackWeb,
    layout: "featured-side",
    previewCaption: "live demo preview",
    tags: ["Electron", "Next.js / Nextron", "Express", "Socket.IO", "Firebase", "OAuth2"],
    impact: [
      "Enabled real-time clipboard and file sync across devices with Socket.IO and Firebase, with Drive-backed 3-slot LRU storage and OAuth2 auth.",
      "Delivered a native-feeling cross-platform experience — OS notifications, background clipboard listeners, global shortcuts, Electron main/renderer IPC.",
      "Packaged for distribution via electron-builder.",
    ],
    demoUrl: null,
    githubUrl: "https://github.com/rudraasakariya/sparsh-nextron",
    privateLabel: null,
  },
  {
    id: "wikipedia-crawler",
    year: "2026",
    title: "Multithreaded Wikipedia Crawler",
    tagline: "BFS shortest-path finder between Wikipedia articles",
    eyebrow: "Systems & Native",
    eyebrowAccent: false,
    category: ProjectCategory.SystemsNative,
    layout: "standard",
    previewCaption: "CLI tool — no UI",
    tags: ["C", "pthreads", "libcurl", "gumbo-parser"],
    impact: [
      "Built a BFS path-finder using 4 concurrent worker threads, libcurl for fetching, and gumbo-parser for link extraction.",
      "Implemented from scratch: thread-safe BFS queue, custom visited-URL hash table, priority-scored ordering, disk-based HTML cache.",
    ],
    demoUrl: null,
    githubUrl: "https://github.com/rudraasakariya/multithreaded-wikipedia-crawler",
    privateLabel: null,
  },
  {
    id: "rutgers-tutoring-platform",
    year: "2025–26",
    title: "Rutgers Tutoring Ops Platform",
    tagline: "Department-wide platform for 1,500 students & 60 tutors",
    eyebrow: "Full-Stack / Web · Rutgers",
    eyebrowAccent: false,
    category: ProjectCategory.FullStackWeb,
    layout: "standard",
    previewCaption: "private — university system",
    tags: ["Next.js", "PostgreSQL", "Prisma", "NextAuth"],
    impact: [
      "Designed and built solo, now live department-wide — scheduling, auth, dashboards, KPI reporting — under consideration for licensing to partner schools.",
      "Re-platformed hosting twice to fit university constraints — a cost-free run on Google Apps Script inside Rutgers' Workspace, then back to Next.js + PostgreSQL.",
    ],
    demoUrl: "https://rara-nextjs-platform.vercel.app",
    githubUrl: null,
    privateLabel: "Private — access-gated",
  },
  {
    id: "on-device-ai",
    year: "2026",
    title: "On-Device AI Playground",
    tagline: "Transformer models running in your browser — zero servers",
    eyebrow: "AI / ML · this site",
    eyebrowAccent: true,
    category: ProjectCategory.AiMl,
    layout: "standard",
    previewCaption: "live in-browser demo",
    tags: ["transformers.js", "ONNX", "MiniLM embeddings", "YOLOS detection"],
    impact: [
      "Built the ⌘K semantic search on this site: MiniLM sentence embeddings computed at build time, cosine matching in the browser with an instant keyword fallback while the model warms up.",
      "Added live webcam object detection — a YOLOS transformer runs on-device over the video feed and draws labeled boxes on a canvas overlay in real time.",
      "Everything is fully client-side: models load once from a CDN, inference runs on the visitor's hardware, and no data ever leaves the device.",
    ],
    demoUrl: ROUTES.lab,
    githubUrl: null,
    privateLabel: null,
  },
  {
    id: "channelseal-portal",
    year: "2025",
    title: "ChannelSeal Governance Portal",
    tagline: "Multi-tenant governance portal, weekly release cadence",
    eyebrow: "Full-Stack / Web · ChannelSeal",
    eyebrowAccent: false,
    category: ProjectCategory.FullStackWeb,
    layout: "featured-wide",
    previewCaption: "internal — SaaS startup portal",
    tags: ["React", "NestJS", "PostgreSQL", "Auth0", "Docker", "Jest / Playwright"],
    impact: [
      "Delivered 15 production endpoints and UI workflows end-to-end, owning UI, API, and DB layers with no handoffs.",
      "Prevented cross-tenant data leakage via Auth0 JWT/JWKS validation with custom NestJS guards and interceptors.",
      "Eliminated duplicated frontend table logic with a server-driven, paginated data table used across the app.",
    ],
    demoUrl: null,
    githubUrl: null,
    privateLabel: null,
  },
];
