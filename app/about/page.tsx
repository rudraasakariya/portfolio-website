import type { Metadata } from "next";

import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { BIO, EDUCATION, EXPERIENCE, SKILL_GROUPS } from "@/lib/content/about";
import type { TimelineEntry } from "@/lib/content/about";
import {
  BIO_ANCHOR,
  educationAnchor,
  experienceAnchor,
  skillsAnchor,
} from "@/lib/search/chunks";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `About — ${SITE.name}`,
  description: BIO,
};

function TimelineRow({
  entry,
  first,
  anchor,
}: {
  entry: TimelineEntry;
  first: boolean;
  /** Scroll target for search results and hash links. */
  anchor: string;
}): React.JSX.Element {
  return (
    <div id={anchor} className={`tl-item ${first ? "border-t-0" : ""}`}>
      <div className="font-mono text-[13px] font-medium text-(--text-muted)">
        {entry.period}
      </div>
      <div>
        <div className="text-[16px] font-semibold text-(--text-primary)">
          {entry.heading}
        </div>
        {entry.bullets.length === 0 ? (
          <div className="mt-1 text-[14px] text-(--text-secondary)">
            {entry.subheading}
          </div>
        ) : (
          <>
            <div className="mt-[2px] mb-3 text-[14px] text-(--text-tertiary)">
              {entry.subheading}
            </div>
            <ul className="m-0 flex list-disc flex-col gap-2 pl-[18px] text-[14px] leading-[1.6] text-(--text-secondary)">
              {entry.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function AboutPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-[7vw] py-[8vh]">
      <div className="mb-[14px] font-mono text-[12px] font-medium tracking-[0.06em] text-(--accent) uppercase">
        About
      </div>
      <h1 className="mb-6 text-[clamp(28px,4vw,42px)] leading-[1.15] font-semibold tracking-[-0.02em]">
        {SITE.name}
      </h1>
      <p
        id={BIO_ANCHOR}
        className="mb-[60px] max-w-[680px] text-[17px] leading-[1.7] text-(--text-secondary)"
      >
        {BIO}
      </p>

      <h2 className="mb-5 text-[22px] font-semibold text-(--text-primary)">Education</h2>
      <StaggerGroup className="mb-14 flex flex-col">
        {EDUCATION.map((entry, index) => (
          <StaggerItem key={entry.heading}>
            <TimelineRow entry={entry} first={index === 0} anchor={educationAnchor(entry.heading)} />
          </StaggerItem>
        ))}
      </StaggerGroup>

      <h2 className="mb-5 text-[22px] font-semibold text-(--text-primary)">Experience</h2>
      <StaggerGroup className="mb-14 flex flex-col">
        {EXPERIENCE.map((entry, index) => (
          <StaggerItem key={entry.heading}>
            <TimelineRow entry={entry} first={index === 0} anchor={experienceAnchor(entry.heading)} />
          </StaggerItem>
        ))}
      </StaggerGroup>

      <h2 className="mb-5 text-[22px] font-semibold text-(--text-primary)">Skills</h2>
      <StaggerGroup className="flex flex-col gap-[22px]">
        {SKILL_GROUPS.map((group) => (
          <StaggerItem key={group.label} id={skillsAnchor(group.label)}>
            <div className="mb-[10px] font-mono text-[12px] font-medium tracking-[0.05em] text-(--text-muted) uppercase">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-[20px] border border-(--border-strong) bg-(--card-bg) px-[14px] py-[7px] font-mono text-[13px] font-medium text-(--text-secondary)"
                >
                  {skill}
                </span>
              ))}
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </main>
  );
}
