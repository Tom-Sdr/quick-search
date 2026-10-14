export function registerTabEvents() {
  // filter object (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#filter) is not available in chrome (-> also in the types it seems)
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.title == undefined) return; // is undefined when not changed in the currently handled update
    console.log("title: " + changeInfo.title);

    tab.title = "testoooo";
    // TODO: fixme: for this i would need content script permissions for all pages (which might not be something i want (as possible damage is way higher on compromise))
    browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        document.title = "... TODO: ...";
      },
    });
  });
}
