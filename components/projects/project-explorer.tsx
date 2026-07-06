"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import {
  CATEGORY_LABELS,
  PROJECTS,
  ProjectCategory,
} from "@/lib/content/projects";
import { soundManager } from "@/lib/sound-manager";

type Filter = "all" | ProjectCategory;

const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: ProjectCategory.FullStackWeb, label: CATEGORY_LABELS[ProjectCategory.FullStackWeb] },
  { value: ProjectCategory.SystemsNative, label: CATEGORY_LABELS[ProjectCategory.SystemsNative] },
  { value: ProjectCategory.AiMl, label: CATEGORY_LABELS[ProjectCategory.AiMl] },
];

const PILL_SPRING = { type: "spring", stiffness: 450, damping: 35 } as const;

export function ProjectExplorer(): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = PROJECTS.filter(
    (project) => filter === "all" || project.category === filter,
  );

  const handleFilter = (value: Filter): void => {
    if (value !== filter) {
      soundManager.play("tick");
      setFilter(value);
    }
  };

  return (
    <>
      <div className="mb-11 flex flex-wrap gap-[10px]">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleFilter(value)}
            className={`cat-pill ${filter === value ? "active" : ""}`}
          >
            {filter === value && (
              <motion.span
                layoutId="cat-pill-bg"
                className="cat-pill-bg"
                transition={PILL_SPRING}
              />
            )}
            <span className="cat-pill-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project, index) => (
            // Re-keying by filter makes the whole set exit and re-enter with
            // one uniform staggered pattern instead of mixed FLIP motions.
            <ProjectCard key={`${filter}-${project.id}`} project={project} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
