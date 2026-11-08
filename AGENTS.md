# Personal website

- Keep all website content and repository documentation in English.
- GitHub Pages is the deployment target. Push changes to `main` to trigger
  `.github/workflows/deploy.yml`. Do not watch the Actions run or check the
  live site after pushing; Jeff checks deploys. (A run takes a couple of minutes,
  and GitHub's CDN can serve the old page for up to 10 minutes.)
- Do not publish changes through OpenAI Sites. The existing `.openai/hosting.json`
  identifies the previous host and is retained until the old setup is removed.
- Always pull the latest `main` before editing; other assistants also update this
  repository. Preserve their changes.
- Validate changes with `npm run build` before pushing.
- Production domain: `https://jinfanli.com`. Cloudflare manages DNS (records are
  DNS only, pointing at GitHub Pages); GitHub Pages issues the HTTPS certificate.
- Jeff's manual to-dos (DNS, old hosts) live in `TODO.md`. Do not act on them.

## Working with Jeff

- Jeff is learning: explain the reasoning behind changes, and show the simpler and
  the more sophisticated option when both exist.
- Ask before any design decision (layout, fonts, colors, naming, structure) instead
  of guessing. Present options with plain-language trade-offs.
- Preview visual changes locally (`npm run dev`, port 4321) before committing.
- Keep one idea per commit. Push only when Jeff asks: a push goes live.

## Design system

- Every page is wrapped in `.personal-home` and styled by `src/styles/personal-home.css`,
  which defines the warm palette as tokens: paper `#faf9f6`, ink `#303a42`, heading
  `#27333c`, body `#424c54`, muted `#677078`, line `#e6e3dc`, accent `#3e617b`.
  `src/styles/global.css` holds only the shared base: element resets, header,
  Markdown `.prose`, social icons and the night sky. Its `:root` still has older blue
  fallback tokens, which `.personal-home` overrides.
- Fonts: DM Sans (`--sans`) for text, headings and the wordmark; weights 550-600 give
  headings their emphasis. The one exception is Chakra Petch (`--display`), used only
  for the Work and Blog labels in `src/components/NavigationArtwork.astro` and the
  homepage's section headings (`.home-sections`).
- Layout: a centered 820px column (28px side padding, 24px on phones) holds the header
  and content, and text sits in a 680px reading column (`.personal-reading`), so the
  header and content line up across pages.
- Calm and minimal: no footer, no decorative arrows. Contact links are the icon row
  in `src/components/SocialLinks.astro`. The night sky adds a warm gold
  (`201, 146, 52`) and sage-green hills (`104, 146, 112`) in `src/scripts/night-sky.ts`.

## How pages are built

- `src/layouts/Base.astro` wraps every page. Pass `sky` to draw the animated night
  sky (`src/components/NightSky.astro`), or `sky="hills"` for only the still hills
  with the telescope and laptop (the blog list uses this). Other pages have no sky.
- Sky details: stars skip text, real constellations form around the cursor (data in
  `src/scripts/constellations.ts`), and reduced motion gets a still frame.
- Every page (home, Work and Blog lists, project and post pages, 404) imports
  `src/styles/personal-home.css` and wraps its content in `.personal-home`;
  `.prose` styles the Markdown body of projects and posts.
- `<Header illustrated />` swaps the text nav for the drawn ship (Work) and book
  (Blog) in `src/components/NavigationArtwork.astro`. The wordmark reads
  "Enrichyouenergy" on every page.
- The research page (`src/pages/research-and-coding.astro`, linked from the
  homepage's "ML and astrophysics") lists papers from the `papers` array at the
  top of the file. Add a paper there; `me` is bolded in the author line.
- Projects are Markdown files in `src/content/projects/`, validated by the schema in
  `src/content.config.ts`; start from `docs/templates/project.md`. `draft` defaults
  to `true`, so set `draft: false` to publish. The projects list is a dated text list
  (year, category, title, summary), so new projects need no layout changes.
- Blog posts are Markdown files in `src/content/posts/` (schema in
  `src/content.config.ts`); start from `docs/templates/post.md`. Each post has one
  `category`: `reflection`, `project-log`, or `concepts-explained` (display labels
  live in `src/lib/posts.ts`). `draft` defaults to `true`. `/blog/` is a dated text
  list, newest first, with the hills.
