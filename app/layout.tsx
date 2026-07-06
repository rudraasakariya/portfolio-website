import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

import { Providers } from "@/components/providers";
import { CommandPalette } from "@/components/search/command-palette";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { SITE, THEME_STORAGE_KEY } from "@/lib/site-config";

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
};

const themeInitScript = `(function(){var t="light";try{var v=localStorage.getItem("${THEME_STORAGE_KEY}");if(v==="dark"||v==="light")t=v;}catch(e){}document.documentElement.setAttribute("data-theme",t);})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={plexMono.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* Plain parser-blocking script: next/script beforeInteractive runs
            after first paint in the App Router, which flashed the light theme
            before dark kicked in on reload. This runs before anything paints. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <SiteNav />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
