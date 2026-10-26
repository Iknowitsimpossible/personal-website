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
are pushed to `main`. You can also run **Deploy personal website** manually from
the repository's Actions tab. No OpenAI Sites access is needed for this workflow.

The production domain is `jinfanli.com`. Repository Settings → Pages must use
**GitHub Actions** as the publishing source and `jinfanli.com` as the custom
domain. Cloudflare manages the domain's DNS.

To update the site, pull the latest `main`, edit the content, run `npm run build`,
then commit and push. Check the Actions run for deployment success.
