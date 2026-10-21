# Personal Website

Personal website of me, a Carnegie Mellon University undergraduate. Built with Astro and TypeScript to share about myself

## Development

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Content

Project entries live in `src/content/projects/`. Set `draft: true` to hide an entry from the published site. Homepage content is in `src/pages/index.astro` and `src/components/Hero.astro`.

Images are stored in `public/images/`, and shared styles are in `src/styles/global.css`.

## Publishing

GitHub Actions builds and deploys the website to GitHub Pages whenever changes
are pushed to `main`. You can also run **Deploy personal website** manually from
the repository's Actions tab. No OpenAI Sites access is needed for this workflow.

The production domain is `jinfanli.com`. Repository Settings → Pages must use
**GitHub Actions** as the publishing source and `jinfanli.com` as the custom
domain. Cloudflare manages the domain's DNS.

To update the site, pull the latest `main`, edit the content, run `npm run build`,
then commit and push. Check the Actions run for deployment success.
