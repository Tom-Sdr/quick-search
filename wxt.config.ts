import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],
  manifest: {
    permissions: ["tabs", "bookmarks"],
    commands: {
      "quick-search": {
        suggested_key: { mac: "MacCtrl+Space" },
        description: "quickly search tabs and bookmarks",
      },
    },
    browser_specific_settings: {
      gecko: {
        strict_min_version: "109.0",
        id: "{a0dc3a6a-4f16-4b01-8882-db46d573333e}",
      },
    },
    description: "Launcher to quickly search tabs and bookmarks",
    version: "0.2.0",
  },
  manifestVersion: 3,
  webExt: {
    openDevtools: true,
  },
  autoIcons: {
    baseIconPath: "assets/appicon.svg",
  },
});
