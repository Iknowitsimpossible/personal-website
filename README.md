# Personal Website

Personal website of me, a Carnegie Mellon University undergraduate. Built with Astro and TypeScript to share about myself.

**Live at [jinfanli.com](https://jinfanli.com).**

## Development

Requires Node.js 22.12 or later.


## Content

Projects live in `src/content/projects/` and blog posts in `src/content/posts/`, one Markdown file each. Start from `docs/templates/project.md` or `docs/templates/post.md`. Entries are hidden by default: set `draft: false` in the frontmatter to publish one. Homepage content is in `src/pages/index.astro`.

Images are stored in `public/images/`, and shared styles are in `src/styles/global.css`.

## Publishing

GitHub Actions builds and deploys the website to GitHub Pages whenever changes
are pushed to `main`. 
