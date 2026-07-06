export const ROUTES = {
  home: "/",
  projects: "/projects",
  about: "/about",
  contact: "/contact",
  vision: "/vision",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export const NAV_LINKS: ReadonlyArray<{ label: string; href: Route }> = [
  { label: "Home", href: ROUTES.home },
  { label: "Projects", href: ROUTES.projects },
  { label: "About", href: ROUTES.about },
  { label: "Contact", href: ROUTES.contact },
];

export const SITE = {
  name: "Rudraraj Sakariya",
  title: "Rudraraj Sakariya — Full-Stack Software Engineer",
  description:
    "Full-stack software engineer (Rutgers CS, May 2026). I build production web platforms end-to-end — auth, APIs, and UI.",
  email: "rudrasakariya16@gmail.com",
  phone: "+1 (856) 619-5239",
  phoneHref: "tel:+18566195239",
  location: "Camden, NJ",
  copyrightYear: 2026,
  linkedinUrl: "https://www.linkedin.com/in/rudrasakariya",
  linkedinLabel: "linkedin.com/in/rudrasakariya",
  githubUrl: "https://github.com/rudraasakariya",
  githubLabel: "github.com/rudraasakariya",
  resumePath: "/assets/Rudraraj-Sakariya-Resume.pdf",
} as const;

export const THEME_STORAGE_KEY = "rs-portfolio-theme";

export const API_ROUTES = {
  contact: "/api/contact",
} as const;
