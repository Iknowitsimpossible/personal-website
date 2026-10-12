# Personal website

- Keep all website content and repository documentation in English.
- GitHub Pages is the deployment target. Push changes to `main` to trigger
  `.github/workflows/deploy.yml`; verify the Actions run succeeds.
- Do not publish changes through OpenAI Sites. The existing `.openai/hosting.json`
  identifies the previous host and is retained during the domain migration.
- Always pull the latest `main` before editing; other assistants also update this
  repository. Preserve their changes.
- Validate changes with `npm run build` before pushing.
- Production domain: `https://jinfanli.com` (DNS migration requires Cloudflare).
