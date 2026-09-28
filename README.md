# Personal Website

Personal website of Jinfan (Jeff) Li, a Carnegie Mellon University undergraduate. Built with Astro and TypeScript to share projects, experiences, and interests.

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
