# Personal website

- Keep all website content and repository documentation in English.
- GitHub Pages is the deployment target. Push changes to `main` to trigger
  `.github/workflows/deploy.yml`. Do not watch the Actions run or check the
  live site after pushing; Jeff checks deploys.
- Do not publish changes through OpenAI Sites. The existing `.openai/hosting.json`
  identifies the previous host and is retained until the old setup is removed.
- Always pull the latest `main` before editing; other assistants also update this
  repository. Preserve their changes.
- Validate changes with `npm run build` before pushing.
- Production domain: `https://jinfanli.com`. Cloudflare manages DNS (records are
  DNS only, pointing at GitHub Pages); GitHub Pages issues the HTTPS certificate.

## Working with Jeff

- Jeff is learning: explain the reasoning behind changes, and show the simpler and
  the more sophisticated option when both exist.
- Ask before any design decision (layout, fonts, colors, naming, structure) instead
  of guessing. Present options with plain-language trade-offs.
- Preview visual changes locally (`npm run dev`, port 4321) before committing.
- Keep one idea per commit. Push only when Jeff asks: a push goes live.

## Design system

- Colors are tokens in `src/styles/global.css` `:root`: paper `#f0f5fa`, ink `#29445f`,
  muted `#59718a`, line `#d3dfea`, accent `#426b91`. The night sky adds a warm gold
  (`201, 146, 52`) and sage-green hills (`104, 146, 112`) in `src/scripts/night-sky.ts`.
- Fonts: Newsreader for headings (`--serif`), DM Sans for body text (`--sans`).
- Pages use one centered 820px column with 28px side padding (24px on phones), so
  the header and content line up across pages.
- Calm and minimal: no footer, no decorative arrows. Contact links are the icon row
  in `src/components/SocialLinks.astro`.

## How pages are built

- `src/layouts/Base.astro` wraps every page. Pass `sky` to draw the animated night
  sky (`src/components/NightSky.astro`), or `sky="hills"` for only the still hills
  with the telescope and laptop (the blog list uses this). Other pages have no sky.
- The home page, the Work and Blog lists, and every project and post page share
  one plain reading style:
  wrap the page in `.personal-home` and import `src/styles/personal-home.css`.
  It sets warm color tokens (paper `#faf9f6`, ink `#303a42`, accent `#3e617b`)
  that override the blue ones below, sans headings, and a 680px reading column.
  Project and post pages use it too; `.prose` styles their Markdown body there.
  So does the 404 page, so the blue tokens and serif headings below are no
  longer used by any page.
  `<Header illustrated />` swaps the text nav for the drawn ship (Work) and book
  (Blog) in `src/components/NavigationArtwork.astro`. The wordmark reads
  "Enrichyouenergy" on every page.
- The research page (`src/pages/research-and-coding.astro`, linked from the
  homepage's "ML and astrophysics") lists papers from the `papers` array at the
  top of the file. Add a paper there; `me` is bolded in the author line.
- Sky details: stars skip text, real constellations form around the cursor (data in
  `src/scripts/constellations.ts`), and hills with a telescope and laptop sit at the
  bottom of the page. Reduced motion gets a still frame.
- Projects are Markdown files in `src/content/projects/`, validated by the schema in
  `src/content.config.ts`; start from `docs/templates/project.md`. `draft` defaults
  to `true`, so set `draft: false` to publish. The projects list is a dated text list
  (year, category, title, summary), so new projects need no layout changes.

- Blog posts are Markdown files in `src/content/posts/` (schema in
  `src/content.config.ts`); start from `docs/templates/post.md`. Each post has one
  `category`: `reflection`, `project-log`, or `concepts-explained` (display labels
  live in `src/lib/posts.ts`). `draft` defaults to `true`. `/blog/` is a dated text
  list, newest first, with the hills.

## Deploying

- After a push, the Actions run usually finishes within a couple of minutes.
  GitHub's CDN caches pages for up to 10 minutes, so a change can appear late.

## Open to-dos

- Add a `www` CNAME (target `iknowitsimpossible.github.io`, DNS only) in Cloudflare.
- Delete the unused Cloudflare Worker `personal-website` (a duplicate host).
- Remove the `jinfanli.com` custom domain from OpenAI Sites without publishing.
