import { registerRecentNavigation } from "./recentNavigation";

export default defineBackground(() => {
  browser.commands.onCommand.addListener((command) => {
    if (command === "quick-search") {
      browser.action.openPopup();
    }
  });

  registerRecentNavigation();
});
