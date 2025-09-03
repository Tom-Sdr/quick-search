let relevantTabInfo = [];
let searchBoxElem = document.querySelector(".search-box");
searchBoxElem.focus();
let selectedTabInOrder = 0;
const tabListElem = document.querySelector(".tab-list");

// TODO:
// - search for bookmarks
// - handle missing favicons

function getTabsOfCurrentWindow() {
  return browser.tabs.query({ currentWindow: true });
}

browser.tabs.onCreated.addListener(() => updateList());

browser.tabs.onRemoved.addListener((tabIdPedingRemoval) => {
  updateList(tabIdPedingRemoval); // this is needed, because the event fires to early
});

function updateRelevantInfo(ignoreIdOfPendingRemoval = null) {
  return new Promise((resolve) => {
    getTabsOfCurrentWindow().then((tablist) => {
      relevantTabInfo = tablist
        .filter((tab) => {
          console.log(ignoreIdOfPendingRemoval);
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

function handleSearchQueryChange() {
  selectedTabInOrder = 0;
  createList(searchBoxElem.value);
  updateSelection();
}

searchBoxElem.addEventListener("input", handleSearchQueryChange);

searchBoxElem.addEventListener("keydown", (ev) => {
  if (ev.key === "Backspace" || ev.key === "Delete") {
    handleSearchQueryChange();
  }
});

function selectPreviousTabInOrder() {
  if (selectedTabInOrder > 0) {
    selectedTabInOrder--;
  } else {
    selectedTabInOrder = getTabsByQuery(searchBoxElem.value).length - 1;
  }
}

function selectNextTabInOrder() {
  if (selectedTabInOrder < getTabsByQuery(searchBoxElem.value).length - 1) {
    selectedTabInOrder++;
  } else {
    selectedTabInOrder = 0;
  }
}

document.addEventListener("keydown", (ev) => {
  if (ev.key == "Tab") {
    ev.preventDefault();
    if (ev.shiftKey) {
      selectPreviousTabInOrder();
    } else {
      selectNextTabInOrder();
    }
    updateSelection();
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

function createList(searchQuery) {
  const tabList = getTabsByQuery(searchQuery).map((tabInfo) => {
    return createElementFrom(tabInfo);
  });
  tabListElem.innerHTML = tabList.join("");
}

document.addEventListener("keypress", (ev) => {
  if (ev.key == "Enter") {
    const selectedTabEntry = getTabsByQuery(searchBoxElem.value)[
      selectedTabInOrder
    ];
    if (selectedTabEntry == undefined) return;
    const id = selectedTabEntry.id;
    if (id == undefined) return;

    // console.log("switching tab");

    browser.tabs.update(id, {
      active: true,
    });

    window.close();
  }
});

function createElementFrom(tabInfo) {
  return `
    <div class="tab-display">
        <img class="tab-icon" src=${tabInfo.favIconUrl}>
        <span class="tab-text">${tabInfo.title}</span>
        <div class="tab-key-hint">↵</div>
    </div>
    `;
}

const selectionIndicatorClass = "tab--selected";
function updateSelection() {
  const tabArray = Array.from(tabListElem.children);
  tabArray.forEach((child, index) => {
    child.classList.remove(selectionIndicatorClass);
    if (index == selectedTabInOrder) {
      child.classList.add(selectionIndicatorClass);
    }
  });
}

function updateList(ignoreIdOfPendingRemoval = null) {
  updateRelevantInfo(ignoreIdOfPendingRemoval).then(() => {
    createList("");
    updateSelection();
  });
}

updateList();
