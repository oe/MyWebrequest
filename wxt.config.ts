import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    name: '__MSG_appName__',
    description: '__MSG_appDesc__',
    default_locale: 'en',
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
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
