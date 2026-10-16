import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://jinfanli.com',
  output: 'static',
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
  devToolbar: { enabled: false },
});
