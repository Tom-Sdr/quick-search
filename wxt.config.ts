import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    permissions: ["tabs", "bookmarks"],
    commands: {
      "quick-search": {
        "suggested_key": { "mac": "MacCtrl+Space" },
        "description": "quickly search tabs and possibly bookmarks in the future"
      }
    },
  },
  manifestVersion: 3
});