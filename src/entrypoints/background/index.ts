import { registerRecentNavigation } from "./recentNavigation";
import { registerTabEvents } from "./tabEvents";

export default defineBackground(() => {
  browser.commands.onCommand.addListener((command) => {
    if (command === "quick-search") {
      browser.action.openPopup();
    }
  });

  registerRecentNavigation();
  registerTabEvents();
});
