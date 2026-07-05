export enum ProjectCategory {
  FullStackWeb = "fullstack-web",
  SystemsNative = "systems-native",
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  [ProjectCategory.FullStackWeb]: "Full-Stack / Web",
  [ProjectCategory.SystemsNative]: "Systems & Native",
};

export type ProjectLayout = "featured-side" | "featured-wide" | "standard";

export interface Project {
  id: string;
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
    title: "Rutgers Tutoring Ops Platform",
    tagline: "Department-wide platform for 1,500 students & 60 tutors",
    eyebrow: "Full-Stack / Web · Rutgers",
    eyebrowAccent: false,
    category: ProjectCategory.FullStackWeb,
    layout: "standard",
    previewCaption: "private — university system",
    tags: ["Next.js", "NestJS", "PostgreSQL", "Google Apps Script"],
    impact: [
      "Designed and built solo, now live department-wide — scheduling, auth, dashboards, KPI reporting — under consideration for licensing to partner schools.",
      "Eliminated infra costs entirely (cut to $0) by re-hosting on Google Apps Script within Rutgers' Workspace.",
    ],
    demoUrl: null,
    githubUrl: null,
    privateLabel: "Private — access-gated",
  },
  {
    id: "channelseal-portal",
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
