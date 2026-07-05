import Link from "next/link";

import { Hero } from "@/components/home/hero";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { HIGHLIGHTS, STACK_PILLS } from "@/lib/content/home";
import { ROUTES } from "@/lib/site-config";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="relative z-[1] flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-[120px] -right-[160px] h-[520px] w-[520px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent-soft), transparent 70%)",
        }}
      />

      <Hero />

      <div className="mt-[2vh] bg-(--band-bg) px-[7vw] py-[6vh]">
        <StaggerGroup className="mx-auto grid max-w-[1360px] gap-px overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.08)] md:grid-cols-3">
          {HIGHLIGHTS.map((card) => (
            <StaggerItem key={card.index} className="bg-(--band-bg) px-[30px] py-[34px]">
              <div className="mb-[14px] font-mono text-[34px] font-semibold text-[#5b9bf0]">
                {card.index}
              </div>
              <div className="mb-2 text-[16px] font-semibold text-white">{card.title}</div>
              <div className="text-[14px] leading-[1.6] text-[rgba(255,255,255,0.6)]">
                {card.body}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      <div className="mx-auto max-w-[1360px] px-[7vw] py-[7vh]">
        <Reveal className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="m-0 text-[22px] font-semibold text-(--text-primary)">
            What I work with
          </h2>
          <Link
            href={ROUTES.projects}
            className="link-slide font-mono text-[13px] font-medium text-(--accent)"
          >
            See it in projects →
          </Link>
        </Reveal>
        <StaggerGroup className="flex flex-wrap gap-[10px]">
          {STACK_PILLS.map((pill) => (
            <StaggerItem key={pill.label}>
              <span
                className={
                  pill.highlighted
                    ? "inline-block rounded-[20px] border border-(--accent) bg-(--accent) px-[18px] py-[9px] font-mono text-[13px] font-medium text-white"
                    : "inline-block rounded-[20px] border border-(--border-strong) bg-(--card-bg) px-[18px] py-[9px] font-mono text-[13px] font-medium text-(--text-secondary)"
                }
              >
                {pill.label}
              </span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </main>
  );
}
