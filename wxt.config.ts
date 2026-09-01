import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

import browserSupport from './browser-support.json';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      // Chromium extension pages can report Vite's cross-origin modulepreload
      // hints as cross-world resource mismatches. The chunks remain regular
      // static module dependencies, so omit the redundant hint.
      modulePreload: false,
    },
  }),
  manifest: ({ browser }) => ({
    name: '__MSG_appName__',
    description: '__MSG_appDesc__',
    default_locale: 'en',
    ...(browser === 'chrome' || browser === 'edge'
      ? { minimum_chrome_version: browserSupport.chromiumMinimum }
      : {}),
    permissions: ['activeTab', 'storage', 'declarativeNetRequest'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    action: {
      default_title: '__MSG_actionTitle__',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'mywebrequest@evecalm.com',
              strict_min_version: browserSupport.firefoxMinimum,
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
