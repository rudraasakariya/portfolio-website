"use client";

import { useState } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import {
  CATEGORY_LABELS,
  PROJECTS,
  ProjectCategory,
} from "@/lib/content/projects";

type Filter = "all" | ProjectCategory;

const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: ProjectCategory.FullStackWeb, label: CATEGORY_LABELS[ProjectCategory.FullStackWeb] },
  { value: ProjectCategory.SystemsNative, label: CATEGORY_LABELS[ProjectCategory.SystemsNative] },
];

const COMING_SOON_LABEL = "AI / ML — coming soon";

export function ProjectExplorer(): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = PROJECTS.filter(
    (project) => filter === "all" || project.category === filter,
  );

  return (
    <>
      <div className="mb-11 flex flex-wrap gap-[10px]">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`cat-pill ${filter === value ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
        <span className="cat-pill disabled">{COMING_SOON_LABEL}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}
