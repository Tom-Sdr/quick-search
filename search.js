let relevantTabInfo = [];
relevantBookmarkInfo = [];
let searchBoxElem = document.querySelector(".search-box");
searchBoxElem.focus();
let selectedTabFromList;
const tabListElem = document.querySelector(".tab-list");
const selectionIndicatorClass = "tab--selected";
const tabActiveClass = "tab-display--active";

// FIXME: sanitize tab-title! something like <canvas> in the title will actually be inserted into the dom because of innerHTML=...

// TODO:
// - handle missing favicons
// - display for bookmark-folders -> tree view by default? enter to show?
// - see if it can be fixed that ctrl+tab has to be used twice to get to next tab & regain focus immediately afterwards

function getTabsOfCurrentWindow() {
  return browser.tabs.query({ currentWindow: true });
}

browser.tabs.onCreated.addListener(() => updateList());

browser.tabs.onRemoved.addListener((tabIdPedingRemoval) => {
  updateList(tabIdPedingRemoval); // this is needed, because the event fires to early
});

function displayActiveStatusForTab(tabId) {
  document.querySelectorAll(`.${tabActiveClass}`).forEach((el) => {
    el.classList.remove(tabActiveClass);
  });
  const currentlyActiveTab = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (!!!currentlyActiveTab) return;

  currentlyActiveTab.classList.add(tabActiveClass);
}

browser.tabs.onActivated.addListener((activateInfo) => {
  displayActiveStatusForTab(activateInfo.tabId);
});

function updateTabInfo(ignoreIdOfPendingRemoval = null) {
  return new Promise((resolve) => {
    getTabsOfCurrentWindow().then((tablist) => {
      relevantTabInfo = tablist
        .filter((tab) => {
          return !(tab.id === ignoreIdOfPendingRemoval); // both null-ids and the pendingRemovalId should be ignored
        })
        .map((tab) => {
          return {
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            id: tab.id,
          };
        });
      resolve();
    });
  });
}

function updateBookmarkInfo() {
  return new Promise((resolve) => {
    browser.bookmarks.search({}).then((bookmarkInfo) => {
      relevantBookmarkInfo = bookmarkInfo
        .filter((bookmarkInfo) => {
          return bookmarkInfo.type === "bookmark";
        })
        .map((bookmarkInfo) => {
          return {
            id: bookmarkInfo.id,
            title: bookmarkInfo.title,
            url: bookmarkInfo.url,
          };
        });

      // console.log(relevantBookmarkInfo.length);
      resolve();
    });
  });
}

function updateRelevantInfo(ignoreIdOfPendingRemoval = null) {
  return Promise.all([
    updateTabInfo(ignoreIdOfPendingRemoval),
    updateBookmarkInfo(),
  ]);
}

function handleSearchQueryChange() {
  createList(searchBoxElem.value);
  selectFirstTab();
}

searchBoxElem.addEventListener("input", handleSearchQueryChange);

searchBoxElem.addEventListener("keydown", (ev) => {
  if (ev.key === "Backspace" || ev.key === "Delete") {
    handleSearchQueryChange();
  }
});

function getSelectableElements() {
  return Array.from(
    document.querySelectorAll("[data-bookmark-id], [data-tab-id]")
  );
}

function selectPreviousTabInOrder() {
  // TODO: what happens when there is no tab -> what does indexOf return on null
  const selectables = getSelectableElements();
  if (selectables.length == 0) return;

  const currentIndex = selectables.indexOf(selectedTabFromList);
  const nextIndex =
    (currentIndex - 1 + selectables.length) % selectables.length;

  const newSelection = selectables[nextIndex];

  selectTabFromList(newSelection);
}

function selectNextTabInOrder() {
  const selectables = getSelectableElements();
  if (selectables.length == 0) return;

  const currentIndex = selectables.indexOf(selectedTabFromList);
  const nextIndex = (currentIndex + 1) % selectables.length;

  const newSelection = selectables[nextIndex];

  selectTabFromList(newSelection);
}

document.addEventListener("keydown", (ev) => {
  if (ev.key == "Tab") {
    ev.preventDefault();
    if (ev.shiftKey) {
      selectPreviousTabInOrder();
    } else {
      selectNextTabInOrder();
    }
  }
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

function getBookmarksByQuery(searchQuery) {
  const lowercaseSearchQuery = searchQuery.toLowerCase();

  return relevantBookmarkInfo.filter((bookmarkInfo) => {
    return (
      (!!bookmarkInfo.url &&
        bookmarkInfo.url.toLowerCase().includes(lowercaseSearchQuery)) ||
      (bookmarkInfo.title &&
        bookmarkInfo.title.toLowerCase().includes(lowercaseSearchQuery))
    );
  });
}

function createList(searchQuery) {
  const tabList = getTabsByQuery(searchQuery).map((tabInfo) => {
    return createTabDisplayFrom(tabInfo);
  });
  const bookmarkList = getBookmarksByQuery(searchQuery).map((bookmarkInfo) => {
    return createBookmarkDisplayFrom(bookmarkInfo);
  });

  tabListElem.innerHTML = `
  ${tabList.join("")}
  <div class="divider-line"></div>
  ${bookmarkList.join("")}
  `;
}

document.addEventListener("keypress", (ev) => {
  if (ev.key == "Enter") {
    let selectedElement = document.querySelector("." + selectionIndicatorClass);
    if (!!!selectedElement == undefined) return;
    const tabId = selectedElement.dataset.tabId;
    const bookmarkId = selectedElement.dataset.bookmarkId;
    if (!!tabId) {
      browser.tabs.update(parseInt(tabId), {
        active: true,
      });
      window.close();
      return;
    } else if (!!bookmarkId) {
      // get url by bookmarkId
      browser.bookmarks.get(bookmarkId).then((bookmarkTreeNode) => {
        browser.tabs.create({ url: bookmarkTreeNode[0].url, active: true });
        window.close();
      });
    }
  }
});

function createTabDisplayFrom(tabInfo) {
  return `
    <div class="tab-display" data-tab-id="${tabInfo.id}">
        <img class="tab-icon" src=${tabInfo.favIconUrl}>
        <span class="tab-text">${tabInfo.title}</span>
        <div class="tab-key-hint">↵</div>
    </div>
    `;
}

function createBookmarkDisplayFrom(bookmarkInfo) {
  return `
    <div class="tab-display" data-bookmark-id="${bookmarkInfo.id}">
        <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143Zm126 18L314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Zm0-201Z"/></svg>
        <span class="tab-text">${bookmarkInfo.title}</span>
        <div class="tab-key-hint">↵</div>
    </div>
    `;
}

function clearTabSelection() {
  // would there be any benefit in using querySelector and querying for the class?
  const tabArray = Array.from(getSelectableElements());
  tabArray.forEach((child) => {
    child.classList.remove(selectionIndicatorClass);
  });
}

function selectTabFromList(tab) {
  clearTabSelection();
  selectedTabFromList = tab;
  // console.log("tab: " + selectedTabFromList);
  selectedTabFromList.classList.add(selectionIndicatorClass);
  selectedTabFromList.scrollIntoView({ block: "nearest" });
}

function selectFirstTab() {
  selectTabFromList(getSelectableElements()[0]);
}

function updateList(ignoreIdOfPendingRemoval = null) {
  updateRelevantInfo(ignoreIdOfPendingRemoval).then(() => {
    createList("");
    console.log("length: " + tabListElem.children.length);
    console.log(
      "first-child: " + JSON.stringify(tabListElem.firstElementChild)
    );
    selectFirstTab();
    browser.tabs
      .query({ currentWindow: true, active: true })
      .then((activeTabs) => {
        let currentTab = activeTabs[0];
        displayActiveStatusForTab(currentTab.id);
      });
  });
}

updateList();
