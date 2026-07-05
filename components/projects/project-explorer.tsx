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
];

const COMING_SOON_LABEL = "AI / ML — coming soon";

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
        <span className="cat-pill disabled">{COMING_SOON_LABEL}</span>
      </div>

      <motion.div layout className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
