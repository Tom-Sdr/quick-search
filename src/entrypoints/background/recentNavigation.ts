let previousTabs: number[] = [];
let nextTabs: number[] = [];
let currentTab: number | null = null;
browser.tabs.getCurrent().then((tab) => {
  currentTab = tab?.id || null;
});
let blockStackOperation = false;

export function registerRecentNavigation() {
  browser.tabs.onActivated.addListener((activeInfo) => {
    if (!!currentTab && !blockStackOperation) {
      previousTabs.push(currentTab);
      nextTabs = [];
    }
    blockStackOperation = false;
    currentTab = activeInfo.tabId;
    // console.log(
    //   "current: " +
    //     currentTab +
    //     "previousTabs: " +
    //     JSON.stringify(previousTabs) +
    //     ", nextTabs: " +
    //     JSON.stringify(nextTabs),
    // );
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action == "previousTab") {
      let previousTabId = previousTabs.pop();
      if (previousTabId == undefined) return;
      if (!!currentTab) {
        nextTabs.push(currentTab);
      }
      blockStackOperation = true;
      browser.tabs.update(previousTabId, {
        active: true,
      });
    } else if (message.action == "nextTab") {
      let nextTabId = nextTabs.pop();
      if (nextTabId == undefined) return;
      if (!!currentTab) {
        previousTabs.push(currentTab);
      }
      blockStackOperation = true;
      browser.tabs.update(nextTabId, {
        active: true,
      });
    }
  });
}
