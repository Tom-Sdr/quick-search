// in here, the browser can be accessed

//browser.browserAction.openPopup(); // but why doesn't this open the extension immedeately?

browser.commands.onCommand.addListener((command) => {
  if (command === "quick-search") {
    browser.action.openPopup();
  }
  //   browser.runtime.sendMessage(command);
});
