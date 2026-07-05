import Link from "next/link";

import { HERO, HIGHLIGHTS, STACK_PILLS } from "@/lib/content/home";
import { ROUTES, SITE } from "@/lib/site-config";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="relative z-[1] flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-[120px] -right-[160px] h-[520px] w-[520px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent-soft), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1360px] items-center gap-[56px] px-[7vw] pt-[8vh] pb-[7vh] lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-[22px] inline-flex items-center gap-2 rounded-[20px] bg-(--accent-soft) py-[6px] pr-3 pl-2">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-(--accent)" />
            <span className="font-mono text-[12px] font-medium tracking-[0.03em] text-(--accent)">
              {HERO.availability}
            </span>
          </div>
          <h1 className="mb-[22px] text-[clamp(38px,5.6vw,64px)] leading-[1.04] font-semibold tracking-[-0.025em] text-(--text-primary)">
            Rudraraj
            <br />
            Sakariya
          </h1>
          <p className="mb-2 text-[20px] font-semibold text-(--accent)">{HERO.role}</p>
          <p className="mb-9 max-w-[480px] text-[18px] leading-[1.6] text-(--text-secondary)">
            {HERO.valueProp}
          </p>
          <div className="flex flex-wrap gap-[14px]">
            <Link
              href={ROUTES.contact}
              className="rounded-[8px] bg-(--text-primary) px-6 py-[13px] text-[14px] font-medium text-(--bg-page)"
            >
              Get in touch
            </Link>
            <a
              href={SITE.resumePath}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[8px] border border-(--border-strong) px-6 py-[13px] text-[14px] font-medium text-(--text-primary)"
            >
              Download résumé
            </a>
            <a
              href={SITE.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-[6px] py-[13px] text-[14px] font-medium text-(--text-secondary)"
            >
              LinkedIn
            </a>
            <a
              href={SITE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-[6px] py-[13px] text-[14px] font-medium text-(--text-secondary)"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute rounded-[16px] bg-(--accent) opacity-90 inset-[18px_-18px_-18px_18px]" />
          <div className="stripes relative flex aspect-[1/1.05] items-center justify-center rounded-[16px] border border-(--border)">
            <span className="font-mono text-[12px] font-medium text-(--text-muted)">
              headshot
            </span>
          </div>
        </div>
      </div>

      <div className="mt-[2vh] bg-(--band-bg) px-[7vw] py-[6vh]">
        <div className="mx-auto grid max-w-[1360px] gap-px overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.08)] md:grid-cols-3">
          {HIGHLIGHTS.map((card) => (
            <div key={card.index} className="bg-(--band-bg) px-[30px] py-[34px]">
              <div className="mb-[14px] font-mono text-[34px] font-semibold text-[#5b9bf0]">
                {card.index}
              </div>
              <div className="mb-2 text-[16px] font-semibold text-white">{card.title}</div>
              <div className="text-[14px] leading-[1.6] text-[rgba(255,255,255,0.6)]">
                {card.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-[7vw] py-[7vh]">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="m-0 text-[22px] font-semibold text-(--text-primary)">
            What I work with
          </h2>
          <Link
            href={ROUTES.projects}
            className="font-mono text-[13px] font-medium text-(--accent)"
          >
            See it in projects →
          </Link>
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {STACK_PILLS.map((pill) => (
            <span
              key={pill.label}
              className={
                pill.highlighted
                  ? "rounded-[20px] border border-(--accent) bg-(--accent) px-[18px] py-[9px] font-mono text-[13px] font-medium text-white"
                  : "rounded-[20px] border border-(--border-strong) bg-(--card-bg) px-[18px] py-[9px] font-mono text-[13px] font-medium text-(--text-secondary)"
              }
            >
              {pill.label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
