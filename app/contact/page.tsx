import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/contact-form";
import { CONTACT_DETAILS_ANCHOR } from "@/lib/search/chunks";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Contact — ${SITE.name}`,
  description:
    "Open to full-time software engineering roles starting summer 2026. Fastest way to reach me is email.",
};

interface ContactRow {
  label: string;
  value: string;
  href: string | null;
  accent: boolean;
}

const CONTACT_ROWS: ReadonlyArray<ContactRow> = [
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}`, accent: false },
  { label: "Phone", value: SITE.phone, href: SITE.phoneHref, accent: false },
  { label: "LinkedIn", value: SITE.linkedinLabel, href: SITE.linkedinUrl, accent: true },
  { label: "GitHub", value: SITE.githubLabel, href: SITE.githubUrl, accent: true },
  { label: "Location", value: SITE.location, href: null, accent: false },
];

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-[7vw] py-[8vh]">
      <div className="mb-[14px] font-mono text-[12px] font-medium tracking-[0.06em] text-(--accent) uppercase">
        Contact
      </div>
      <h1 className="mb-4 text-[clamp(28px,4vw,42px)] leading-[1.15] font-semibold tracking-[-0.02em]">
        Let&apos;s talk
      </h1>
      <p className="mb-12 max-w-[600px] text-[17px] leading-[1.6] text-(--text-secondary)">
        Open to full-time software engineering roles starting summer 2026. Fastest way
        to reach me is email — I check it daily.
      </p>

      <div className="grid items-start gap-16 md:grid-cols-[0.85fr_1.15fr]">
        <div id={CONTACT_DETAILS_ANCHOR}>
          {CONTACT_ROWS.map((row, index) => {
            const valueClass = row.accent
              ? "text-[15px] font-medium text-(--accent)"
              : "text-[15px] font-medium text-(--text-primary)";
            return (
              <div
                key={row.label}
                className={`flex items-center gap-4 border-t border-(--border) py-5 ${
                  index === 0 ? "border-t-0" : ""
                }`}
              >
                <span className="w-[70px] flex-none font-mono text-[13px] font-medium text-(--text-muted)">
                  {row.label}
                </span>
                {row.href === null ? (
                  <span className={valueClass}>{row.value}</span>
                ) : (
                  <a
                    href={row.href}
                    className={valueClass}
                    {...(row.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {row.value}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <ContactForm />
      </div>
    </main>
  );
}
