import { SITE } from "@/lib/site-config";

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="flex flex-col items-center gap-2 border-t border-(--border) px-[7vw] py-[28px] text-center text-[13px] text-(--text-muted) sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
      <span>
        © {SITE.copyrightYear} {SITE.name}
      </span>
      <span>
        {SITE.location} · {SITE.email}
      </span>
    </footer>
  );
}
