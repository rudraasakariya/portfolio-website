import { BIO, EDUCATION, EXPERIENCE, SKILL_GROUPS } from "@/lib/content/about";
import { CATEGORY_LABELS, PROJECTS } from "@/lib/content/projects";
import { ROUTES, SITE } from "@/lib/site-config";

export interface SearchChunk {
  id: string;
  /** Short heading shown above the matched text in results. */
  label: string;
  text: string;
  route: string;
  anchor: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Anchor ids are shared between the pages (scroll targets) and the search
   index (jump destinations) — always derive them from these helpers. */

export const BIO_ANCHOR = "bio";
export const CONTACT_DETAILS_ANCHOR = "contact-details";

export function educationAnchor(heading: string): string {
  return `edu-${slugify(heading)}`;
}

export function experienceAnchor(heading: string): string {
  return `exp-${slugify(heading)}`;
}

export function skillsAnchor(label: string): string {
  return `skills-${slugify(label)}`;
}

/** Every searchable statement on the site, with where to jump to find it. */
export function buildChunks(): SearchChunk[] {
  const chunks: SearchChunk[] = [];

  chunks.push({
    id: BIO_ANCHOR,
    label: "About",
    text: BIO,
    route: ROUTES.about,
    anchor: BIO_ANCHOR,
  });

  for (const entry of EDUCATION) {
    const anchor = educationAnchor(entry.heading);
    chunks.push({
      id: anchor,
      label: `Education — ${entry.heading}`,
      text: `${entry.heading}. ${entry.subheading} (${entry.period})`,
      route: ROUTES.about,
      anchor,
    });
  }

  for (const entry of EXPERIENCE) {
    const anchor = experienceAnchor(entry.heading);
    entry.bullets.forEach((bullet, index) => {
      chunks.push({
        id: `${anchor}-${index}`,
        label: entry.heading,
        text: bullet,
        route: ROUTES.about,
        anchor,
      });
    });
  }

  for (const group of SKILL_GROUPS) {
    const anchor = skillsAnchor(group.label);
    chunks.push({
      id: anchor,
      label: `Skills — ${group.label}`,
      text: `${group.label}: ${group.skills.join(", ")}`,
      route: ROUTES.about,
      anchor,
    });
  }

  for (const project of PROJECTS) {
    chunks.push({
      id: `proj-${project.id}`,
      label: `Project — ${project.title}`,
      text: `${project.title}: ${project.tagline}. Built with ${project.tags.join(", ")}. ${CATEGORY_LABELS[project.category]}, ${project.year}.`,
      route: ROUTES.projects,
      anchor: project.id,
    });
    project.impact.forEach((bullet, index) => {
      chunks.push({
        id: `proj-${project.id}-${index}`,
        label: project.title,
        text: bullet,
        route: ROUTES.projects,
        anchor: project.id,
      });
    });
  }

  chunks.push({
    id: CONTACT_DETAILS_ANCHOR,
    label: "Contact",
    text: `Open to full-time software engineering roles starting summer 2026. Based in ${SITE.location}. Reach me at ${SITE.email} or ${SITE.phone}, LinkedIn ${SITE.linkedinLabel}, GitHub ${SITE.githubLabel}.`,
    route: ROUTES.contact,
    anchor: CONTACT_DETAILS_ANCHOR,
  });

  return chunks;
}
