import { SITE } from "@/lib/site-config";

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="flex items-center justify-between border-t border-(--border) px-[7vw] py-[28px] text-[13px] text-(--text-muted)">
      <span>
        © {SITE.copyrightYear} {SITE.name}
      </span>
      <span>
        {SITE.location} · {SITE.email}
      </span>
    </footer>
  );
}
