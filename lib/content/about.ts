export interface TimelineEntry {
  period: string;
  heading: string;
  subheading: string;
  bullets: ReadonlyArray<string>;
}

export const BIO =
  "Full-stack software engineer and Rutgers CS graduate (May 2026). I've built and shipped production systems solo — from a department-wide tutoring platform used by 1,500 students, to multi-tenant governance features at a California SaaS startup. I care most about clean API design, auth systems that actually hold under real users, and shipping code I'd be comfortable maintaining a year later.";

export const EDUCATION: ReadonlyArray<TimelineEntry> = [
  {
    period: "Aug 2024 – May 2026",
    heading: "Rutgers University, Camden, NJ",
    subheading: "Bachelor of Science, Computer Science — GPA 3.4",
    bullets: [],
  },
  {
    period: "Jun 2022 – May 2024",
    heading: "Vidyalankar School of Information Technology, Mumbai",
    subheading:
      "Bachelor of Science, Information Technology — GPA 4.0 · Transferred to Rutgers",
    bullets: [],
  },
];

export const EXPERIENCE: ReadonlyArray<TimelineEntry> = [
  {
    period: "Mar 2025 – May 2026",
    heading: "Lead Full-Stack Developer — Rutgers Accelerate and Renew Academy",
    subheading: "Camden, NJ · On-campus",
    bullets: [
      "Launched a tutoring operations platform now live department-wide for 1,500 K–12 students and 60 tutors, designed and built solo (Next.js, PostgreSQL, Prisma) — scheduling, auth, dashboards, KPI reporting.",
      "Re-platformed the system twice to fit the university's constraints — including a cost-free period on Google Apps Script inside Rutgers' Workspace — before returning it to Next.js + PostgreSQL.",
      "Prevented cross-tutor data access by enforcing isolation at the middleware layer.",
    ],
  },
  {
    period: "Sep 2025 – Dec 2025",
    heading: "Software Engineer Intern — ChannelSeal",
    subheading: "Remote, California, USA",
    bullets: [
      "Delivered 15 production endpoints and UI workflows end-to-end (React, NestJS, PostgreSQL) for a multi-tenant governance portal, on a weekly release cadence.",
      "Prevented cross-tenant data leakage via Auth0 JWT/JWKS validation with custom NestJS guards and interceptors.",
      "Reduced regressions reaching production by wiring Docker Compose, TypeORM migrations, and Jest/Playwright suites into CI.",
    ],
  },
  {
    period: "May 2022 – Dec 2022",
    heading: "Software Development Intern — SoftScribble Pvt Ltd",
    subheading: "India",
    bullets: [
      "Shipped bulk messaging, chatbot workflows, and real-time support features for a SaaS WhatsApp platform, designing REST APIs and schemas for high-throughput messaging.",
      "Replaced manual spreadsheet tracking by building React ERP modules for task tracking, document sharing, and financial reporting.",
      "Cut failed message sends by 38% by designing a rate-limiting and queuing system for outbound traffic.",
    ],
  },
];

export interface SkillGroup {
  label: string;
  skills: ReadonlyArray<string>;
}

export const SKILL_GROUPS: ReadonlyArray<SkillGroup> = [
  {
    label: "Languages",
    skills: ["TypeScript", "JavaScript", "Python", "Java", "C", "SQL"],
  },
  {
    label: "Frameworks / Tools",
    skills: ["React", "Next.js", "Node.js", "Express", "NestJS", "Docker", "Jest", "Playwright"],
  },
  {
    label: "Data",
    skills: ["PostgreSQL", "MySQL", "MongoDB", "Firebase / Firestore"],
  },
];
