let relevantTabInfo = [];
let searchBox = document.querySelector(".search-box");
searchBox.focus();

function getTabsOfCurrentWindow() {
  return browser.tabs.query({ currentWindow: true });
}

getTabsOfCurrentWindow().then((tablist) => {
  relevantTabInfo = tablist.map((tab) => {
    return {
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      id: tab.id,
    };
  });
});

searchBox.addEventListener("input", () => {
  console.log("input");
  createList(searchBox.value);
});

function getTabsByQuery(searchQuery) {
  const lowercaseSearchQuery = searchQuery.toLowerCase();
  return relevantTabInfo.filter((tabInfo) => {
    return (
      (!!tabInfo.url &&
        tabInfo.url.toLowerCase().includes(lowercaseSearchQuery)) ||
      (tabInfo.title &&
        tabInfo.title.toLowerCase().includes(lowercaseSearchQuery))
    );
  });
}

function createList(searchQuery) {
  const tabListElem = document.querySelector(".tab-list");
  const tabList = getTabsByQuery(searchQuery).map((tabInfo) => {
    return createElementFrom(tabInfo);
  });
  tabListElem.innerHTML = tabList.join("");
}

document.addEventListener("keypress", (ev) => {
  if (ev.key == "Enter") {
    console.log("keyCode is enter");

    const mostRelevantEntry = getTabsByQuery(searchBox.value)[0];
    console.log(getTabsByQuery(searchBox.value)[0]);
    if (mostRelevantEntry == undefined) return;
    const id = mostRelevantEntry.id;
    if (id == undefined) return;

    console.log("switching tab");

    browser.tabs.update(id, {
      active: true,
    });

    window.close();
  }
});

function createElementFrom(tabInfo) {
  return `
    <div class="tab-display"><img class="tab-icon" src=${tabInfo.favIconUrl}>${tabInfo.title} -- ${tabInfo.id}</div>
    `;
}

browser.runtime.onMessage.addListener((message) => {
  //   document.querySelector(".counter").innerHTML = message.toString();
});
