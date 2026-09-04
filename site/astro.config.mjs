import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://request.forth.ink',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/zh-CN/'),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          'zh-hans': 'zh-Hans',
          ko: 'ko',
          ja: 'ja',
          fr: 'fr',
          es: 'es',
        },
      },
    }),
  ],
});
