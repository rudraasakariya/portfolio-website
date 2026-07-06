import Link from "next/link";

import { MagneticField } from "@/components/home/magnetic-field";
import { ProjectPreview } from "@/components/projects/project-preview";
import { TiltPreview } from "@/components/projects/tilt-preview";
import { Reveal } from "@/components/motion/reveal";
import { CATEGORY_LABELS, PROJECTS } from "@/lib/content/projects";
import { ROUTES } from "@/lib/site-config";

const SHOWCASE_IDS = ["rutgers-tutoring-platform", "sparsh", "channelseal-portal"] as const;

/** Olivier-style soft showcase cards for the featured work, plus the field. */
export function Showcase(): React.JSX.Element {
  const featured = SHOWCASE_IDS.map(
    (id) => PROJECTS.find((project) => project.id === id),
  ).filter((project) => project !== undefined);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-[7vw] py-[8vh]">
      <Reveal className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-[22px] font-semibold text-(--text-primary)">Selected work</h2>
        <Link
          href={ROUTES.projects}
          className="link-slide font-mono text-[13px] font-medium text-(--accent)"
        >
          All projects →
        </Link>
      </Reveal>

      {featured.map((project) => (
        <Reveal key={project.id} className="showcase-card md:grid md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-10">
          <div className="mb-6 md:mb-0">
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
              {CATEGORY_LABELS[project.category]} · {project.year}
            </div>
            <h3 className="mb-2 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-(--text-primary)">
              {project.title}
            </h3>
            <p className="mb-5 max-w-[400px] text-[15px] leading-[1.6] text-(--text-secondary)">
              {project.tagline}
            </p>
            <Link
              href={`${ROUTES.projects}#${project.id}`}
              className="link-slide font-mono text-[13px] font-medium text-(--accent)"
            >
              View project →
            </Link>
          </div>
          <TiltPreview className="preview-frame h-[240px] overflow-hidden rounded-[14px] border border-(--border) md:h-[280px]">
            <ProjectPreview caption={project.previewCaption} />
          </TiltPreview>
        </Reveal>
      ))}

      <Reveal className="showcase-card md:grid md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-10">
        <div className="mb-6 md:mb-0">
          <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
            Playground · interactive
          </div>
          <h3 className="mb-2 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-(--text-primary)">
            Magnetic field
          </h3>
          <p className="max-w-[400px] text-[15px] leading-[1.6] text-(--text-secondary)">
            A little generative toy — the dashes align to your cursor like iron
            filings. Click for a ripple, or open the gear to tune density,
            magnetism, and flow. Your settings stick around.
          </p>
        </div>
        <div className="relative h-[280px] overflow-hidden rounded-[14px] border border-(--border) bg-(--card-bg) md:h-[300px]">
          <MagneticField />
        </div>
      </Reveal>
    </div>
  );
}
