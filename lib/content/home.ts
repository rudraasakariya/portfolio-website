export const HERO = {
  availability: "Open to full-time roles · Summer 2026",
  role: "Full-Stack Software Engineer",
  valueProp:
    "I build production web platforms end-to-end — auth, APIs, and UI — with a focus on clean systems that hold up at scale.",
} as const;

export interface HighlightCard {
  index: string;
  title: string;
  body: string;
}

export const HIGHLIGHTS: ReadonlyArray<HighlightCard> = [
  {
    index: "01",
    title: "Built a platform serving 1,500 students",
    body: "Designed and shipped a tutoring ops platform solo at Rutgers — now department-wide, under consideration for licensing to partner schools.",
  },
  {
    index: "02",
    title: "Shipped 15 endpoints at ChannelSeal",
    body: "Owned UI, API, and DB layers end-to-end for a multi-tenant governance portal, on a weekly release cadence.",
  },
  {
    index: "03",
    title: "Rutgers CS, 3.7 GPA — May 2026",
    body: "Transferred in with a 4.0 from Vidyalankar School of Information Technology, Mumbai.",
  },
];

export interface StackPill {
  label: string;
  highlighted: boolean;
}

export const STACK_PILLS: ReadonlyArray<StackPill> = [
  { label: "TypeScript", highlighted: false },
  { label: "React", highlighted: false },
  { label: "Next.js", highlighted: true },
  { label: "NestJS", highlighted: false },
  { label: "Node / Express", highlighted: false },
  { label: "PostgreSQL", highlighted: true },
  { label: "MongoDB", highlighted: false },
  { label: "MySQL", highlighted: false },
  { label: "Firebase", highlighted: false },
];
