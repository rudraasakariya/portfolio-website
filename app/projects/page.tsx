import type { Metadata } from "next";

import { ProjectExplorer } from "@/components/projects/project-explorer";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Projects — ${SITE.name}`,
  description:
    "Personal and independent projects, alongside the impact I've driven at Rutgers and in industry.",
};

export default function ProjectsPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1240px] flex-1 px-[7vw] py-[8vh]">
      <div className="mb-[14px] font-mono text-[12px] font-medium tracking-[0.06em] text-(--accent) uppercase">
        Projects
      </div>
      <h1 className="mb-4 text-[clamp(28px,4vw,42px)] leading-[1.15] font-semibold tracking-[-0.02em]">
        Things I&apos;ve built
      </h1>
      <p className="mb-9 max-w-[640px] text-[16px] leading-[1.6] text-(--text-secondary)">
        Personal and independent projects, alongside the impact I&apos;ve driven at
        Rutgers and in industry. More get added here as I ship them.
      </p>
      <ProjectExplorer />
    </main>
  );
}
