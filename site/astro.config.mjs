import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://app.evecalm.com',
  base: '/MyWebrequest',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          'zh-CN': 'zh-CN',
          ko: 'ko-KR',
          ja: 'ja-JP',
          fr: 'fr-FR',
          es: 'es-ES',
        },
      },
    }),
  ],
});
