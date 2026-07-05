# rudraraj sakariya — portfolio

Personal portfolio site. Next.js 16 (App Router) · TypeScript · Tailwind CSS v4, deployed on Vercel.

## Development

```bash
npm install
npm run dev
```

## Contact form

The contact form sends email through [Resend](https://resend.com) via `app/api/contact/route.ts`. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` (also set it in Vercel project settings for production). Without a key the form degrades to a "email me directly" message.

## Content

All copy and data are centralized:

- `lib/site-config.ts` — routes, contact info, social links, résumé path
- `lib/content/home.ts` — hero, highlight cards, stack pills
- `lib/content/projects.ts` — project cards (set `demoUrl` to surface a Live Demo button)
- `lib/content/about.ts` — bio, education, experience, skills

## Theming

Light/dark palettes are CSS custom properties on `:root` / `[data-theme="dark"]` in `app/globals.css`, persisted to `localStorage` (`rs-portfolio-theme`) and applied before first paint by an inline script in `app/layout.tsx`.
