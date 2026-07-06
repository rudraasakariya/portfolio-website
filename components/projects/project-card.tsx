import { ProjectPreview } from "@/components/projects/project-preview";
import { SpotlightCard } from "@/components/projects/spotlight-card";
import { TiltPreview } from "@/components/projects/tilt-preview";
import type { Project } from "@/lib/content/projects";

interface ProjectCardProps {
  project: Project;
}

interface ProjectCardRootProps extends ProjectCardProps {
  /** Stagger position for the enter animation after a filter change. */
  index?: number;
  /** Forwarded through to the motion card for AnimatePresence popLayout. */
  ref?: React.Ref<HTMLDivElement>;
}

function Eyebrow({ project }: ProjectCardProps): React.JSX.Element {
  return (
    <span
      className={`font-mono text-[11px] font-medium tracking-[0.05em] uppercase ${
        project.eyebrowAccent ? "text-(--accent)" : "text-(--text-tertiary)"
      }`}
    >
      {project.eyebrow}
    </span>
  );
}

function Title({ project }: ProjectCardProps): React.JSX.Element {
  const size = project.layout === "featured-side" ? "text-[22px]" : "text-[20px]";
  return (
    <h3 className={`mt-2 mb-1 ${size} font-semibold text-(--text-primary)`}>
      {project.title}
    </h3>
  );
}

function Tags({ project }: ProjectCardProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {project.tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

function ImpactList({
  project,
  className = "",
}: ProjectCardProps & { className?: string }): React.JSX.Element {
  return (
    <ul
      className={`m-0 flex list-disc flex-col gap-[10px] pl-[18px] text-[14px] leading-[1.55] text-(--text-secondary) ${className}`}
    >
      {project.impact.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

function ActionRow({ project }: ProjectCardProps): React.JSX.Element | null {
  if (project.privateLabel !== null) {
    return (
      <div className="mt-auto flex gap-[10px] pt-[6px]">
        <span className="font-mono text-[13px] font-medium text-(--text-muted)">
          {project.privateLabel}
        </span>
      </div>
    );
  }
  if (project.demoUrl === null && project.githubUrl === null) {
    return null;
  }
  return (
    <div className="mt-auto flex gap-[10px] pt-[6px]">
      {project.demoUrl !== null && (
        <a className="demo-btn" href={project.demoUrl} target="_blank" rel="noopener noreferrer">
          Live demo ↗
        </a>
      )}
      {project.githubUrl !== null && (
        <a className="gh-btn" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      )}
    </div>
  );
}

export function ProjectCard({ project, index, ref }: ProjectCardRootProps): React.JSX.Element {
  if (project.layout === "featured-side") {
    return (
      <SpotlightCard ref={ref} id={project.id} index={index} className="proj-card md:col-span-2 md:grid md:grid-cols-2">
        <TiltPreview className="preview-frame md:h-auto md:border-r md:border-b-0 md:border-r-(--border)">
          <div className="chrome">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="frame-stripes stripes md:static md:h-[calc(100%-26px)]">
            <span className="font-mono text-[12px] font-medium text-(--text-muted)">
              {project.previewCaption}
            </span>
          </div>
        </TiltPreview>
        <div className="proj-body">
          <div>
            <Eyebrow project={project} />
            <Title project={project} />
            <div className="text-[14px] text-(--text-tertiary)">{project.tagline}</div>
          </div>
          <Tags project={project} />
          <ImpactList project={project} />
          <ActionRow project={project} />
        </div>
      </SpotlightCard>
    );
  }

  if (project.layout === "featured-wide") {
    return (
      <SpotlightCard ref={ref} id={project.id} index={index} className="proj-card md:col-span-2">
        <TiltPreview className="preview-frame h-[140px]">
          <ProjectPreview caption={project.previewCaption} />
        </TiltPreview>
        <div className="proj-body md:grid md:grid-cols-2 md:gap-6">
          <div>
            <Eyebrow project={project} />
            <Title project={project} />
            <div className="mb-3 text-[14px] text-(--text-tertiary)">{project.tagline}</div>
            <Tags project={project} />
          </div>
          <ImpactList project={project} className="md:self-center" />
        </div>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard ref={ref} id={project.id} index={index} className="proj-card">
      <TiltPreview className="preview-frame">
        <ProjectPreview caption={project.previewCaption} />
      </TiltPreview>
      <div className="proj-body">
        <div>
          <Eyebrow project={project} />
          <Title project={project} />
          <div className="text-[14px] text-(--text-tertiary)">{project.tagline}</div>
        </div>
        <Tags project={project} />
        <ImpactList project={project} />
        <ActionRow project={project} />
      </div>
    </SpotlightCard>
  );
}
