<script lang="ts">
  import { Bookmark, getBookmarks } from "../util/bookmark";
  import { areIdsEqual } from "../util/selectable";
  import { getNonPendingTabsOfCurrentWindow, Tab } from "../util/tab";

  let { searchQuery }: { searchQuery: string } = $props();

  let tabs: Tab[] = $state([]);
  let bookmarks: Bookmark[] = $state([]);
  let selectables = $derived([...tabs, ...bookmarks]);

  let activeTabId: number | null = $state(null);
  let selectedSelectableIndex = $state(0);

  let selectedSelectableId: null | { type: string; id_value: string } =
    $state(null);

  function updateFromBrowser() {
    const indexById = selectables.findIndex((selectable) => {
      return (
        !!selectedSelectableId &&
        areIdsEqual(selectedSelectableId, selectable.id)
      );
    });

    // TODO: think about when selectedSelectableId is null
    if (indexById !== -1) {
      selectedSelectableIndex = indexById;
    } else {
      selectedSelectableIndex = Math.max(0, selectedSelectableIndex - 1);
    }
    selectedSelectableId = selectables[selectedSelectableIndex].id;
  }

  function selectNextTabInOrder() {
    if (selectables.length == 0) return;

    selectedSelectableIndex =
      (selectedSelectableIndex + 1) % selectables.length;
    selectedSelectableId = selectables[selectedSelectableIndex].id;
  }

  function selectPreviousTabInOrder() {
    if (selectables.length == 0) return;

    selectedSelectableIndex =
      (selectedSelectableIndex - 1 + selectables.length) % selectables.length;
    selectedSelectableId = selectables[selectedSelectableIndex].id;
  }

  $effect(() => {
    const currentSearchQuery = searchQuery; // create dependency on reactive prop

    const tabUpdatePromise = getNonPendingTabsOfCurrentWindow(
      currentSearchQuery,
    ).then((updatedTabs) => (tabs = updatedTabs));
    const bookmarkUpdatePromise = getBookmarks(currentSearchQuery).then(
      (updatedBookmarks) => (bookmarks = updatedBookmarks),
    );

    Promise.all([tabUpdatePromise, bookmarkUpdatePromise]).then(() => {
      selectedSelectableIndex = 0;
      // TODO: handle null case
      selectedSelectableId = selectables[selectedSelectableIndex].id;
    });
  });

  onMount(() => {
    browser.tabs.onCreated.addListener(() => {
      getNonPendingTabsOfCurrentWindow(searchQuery).then((nonPendingTabs) => {
        tabs = nonPendingTabs;
        updateFromBrowser();
      });
    });

    browser.tabs.onRemoved.addListener((tabIdPedingRemoval) => {
      getNonPendingTabsOfCurrentWindow(searchQuery, tabIdPedingRemoval).then(
        (nonPendingTabs) => {
          tabs = nonPendingTabs;
          updateFromBrowser();
        },
      );
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key == "Enter") {
        let selectedSelectable = selectables.find((el) => {
          return (
            !!selectedSelectableId && areIdsEqual(el.id, selectedSelectableId)
          );
        });

        if (!!selectedSelectable) {
          selectedSelectable.submit();
        }
      } else if (ev.key == "Tab") {
        // and not ctrl modifier?
        ev.preventDefault();
        if (ev.shiftKey) {
          selectPreviousTabInOrder();
        } else {
          selectNextTabInOrder();
        }
      }
    });

    browser.tabs.onActivated.addListener((activateInfo) => {
      activeTabId = activateInfo.tabId;
    });

    browser.tabs
      .query({ currentWindow: true, active: true })
      .then((activeTabs) => {
        if (activeTabs.length > 0) {
          activeTabId = activeTabs[0].id ?? null;
        }
      });

    getNonPendingTabsOfCurrentWindow(searchQuery).then((nonPendingTabs) => {
      tabs = nonPendingTabs;
      updateFromBrowser();
    });
    getBookmarks(searchQuery).then((updatedBookmarks) => {
      bookmarks = updatedBookmarks;
      updateFromBrowser();
    });
  });

  function scrollIntoView(thisTabDisplay: HTMLDivElement) {
    thisTabDisplay.scrollIntoView({ block: "nearest" });
  }
</script>

<div class="tab-list">
  {#each tabs as tab}
    <div
      class={[
        "tab-display",
        {
          "tab--selected":
            !!selectedSelectableId && areIdsEqual(selectedSelectableId, tab.id),
          "tab-display--active":
            !!activeTabId && activeTabId.toString() == tab.id.id_value,
        },
      ]}
      {@attach !!selectedSelectableId &&
        areIdsEqual(selectedSelectableId, tab.id) &&
        scrollIntoView}
    >
      <!-- TODO: getting error `Content at moz-extension://{id}/popup.html may not load or link to chrome://mozapps/skin/extensions/extension.svg` when trying to access favicon of about:addons -> get icon from somewhere else -->
      <!-- TODO: fix for no icon present -->
      <img class="tab-icon" src={tab.iconUrl} alt="" />
      <span class="tab-text">{tab.title}</span>
      <div class="tab-key-hint">↵</div>
    </div>
  {/each}
  <div class="divider-line"></div>
  {#each bookmarks as bookmark}
    <div
      class={[
        "tab-display",
        {
          "tab--selected":
            !!selectedSelectableId &&
            areIdsEqual(selectedSelectableId, bookmark.id),
        },
      ]}
      {@attach !!selectedSelectableId &&
        areIdsEqual(selectedSelectableId, bookmark.id) &&
        scrollIntoView}
    >
      <svg
        class="tab-icon"
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e3e3e3"
        ><path
          d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143Zm126 18L314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Zm0-201Z"
        /></svg
      >
      <span class="tab-text">{bookmark.title}</span>
      <div class="tab-key-hint">↵</div>
    </div>
  {/each}
</div>

<style>
  .tab-list {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: 2px;
    overflow-y: auto;
    scrollbar-color: #80808f transparent;
  }

  .tab-display {
    display: grid;
    grid-template-areas: "icon title keyhint";
    --icon-size: 20px;
    grid-template-columns: var(--icon-size) 1fr var(--icon-size);
    width: 100%;
    height: 2rem;
    color: white;
    font-family: "Inter", Arial;
    gap: 0.5rem;
    padding: 4px 8px;
    border-radius: 4px;
    box-sizing: border-box;
    align-items: center;
  }

  .tab-display--active::before {
    position: absolute;
    translate: calc(-100% - 4px) 0;
    display: block;
    background-color: #80808f;
    width: 4px;
    height: 8px;
    border-radius: 2px;
    content: " ";
  }

  .tab-icon {
    grid-column: icon-start / icon-end;
    width: 100%;
    height: 100%;
    aspect-ratio: 1/1;
  }

  .tab-text {
    grid-column: title-start / keyhint-end;
    width: 100%;
    overflow: hidden;
    text-wrap: nowrap;
    text-overflow: ellipsis;
  }

  .tab-key-hint {
    display: none;
    width: 1rem;
    height: 1rem;
    border: 1px solid #80808f;
    color: #80808f;
    font-weight: 800;
    font-size: 0.65rem;
    line-height: 1rem;
    text-align: center;
    border-radius: 4px;
    padding: 1px;
  }

  .tab--selected {
    background-color: #3a3944;
  }

  .tab--selected > .tab-text {
    grid-column: title-start / title-end;
  }

  .tab--selected > .tab-key-hint {
    display: block;
  }

  .divider-line {
    background-color: #80808f;
    width: 100%;
    height: 1px;
    display: block;
    min-width: 100%;
    min-height: 1px;
    margin: 4px 0;
  }
</style>
