<script lang="ts">
  import {onMount} from "svelte"

  let tabs: Tab[] = $state([]);
  let bookmarks: Bookmark[] = $state([]);

  let activeTabId: number | null = $state(null);

  let selectables = $derived([...tabs, ...bookmarks]);

  // when search changes, reset to index 0
  let selectedSelectableIndex = $state(0); // TODO: initialize to active tab
  let selectedSelectableId: null | {type: string, id_value: string} = $derived.by(() => {
    if(selectedSelectableIndex >= selectables.length) {
      return null;
    }
    return selectables[selectedSelectableIndex].id
  })

  let searchQuery = $state("");

  class Tab implements Selectable {
    id: {type: "tab", id_value: string};
    title: string;
    url: string;
    iconUrl: string;
    constructor(id: number, title: string, url: string, iconUrl: string) {
      this.id = {type: "tab", id_value: id.toString()};
      this.title = title;
      this.url = url;
      this.iconUrl = iconUrl;
    }

    submit() {
      browser.tabs.update(parseInt(this.id.id_value), {
        active: true,
      });
      window.close();
    }
  }

  async function getNonPendingTabsOfCurrentWindow(searchQuery: string, tabIdPendingRemoval?: number | null) {
    return (await browser.tabs.query({ currentWindow: true }))
      .values()  
      .filter((tab) => {
        if(tab.id === tabIdPendingRemoval) {
          return false;
        }

        if (tab.id === undefined) {
          console.error("tab has no id");
          return false;
        }

        if (tab.title === undefined || tab.url === undefined || tab.favIconUrl === undefined) {
          console.error(`some tab property is not set. This should only happen, if the extension doesn't have tabs permission. The tab object: ${JSON.stringify(tab)}`)
          return false;
        }

        return true;
      })
      .map((tab) => {
        return new Tab(tab.id!, tab.title!, tab.url!, tab.favIconUrl!)
      })
      .filter((tab) => {
        return tab.url.includes(searchQuery) || tab.title.includes(searchQuery)
      })
      .toArray();
  }

  interface Selectable {
    id: {type: string, id_value: string}
    submit: () => void
  }

  class Bookmark implements Selectable {
    id: {type: "bookmark", id_value: string};
    title: string;
    url: string;

    constructor(id: string, title: string, url: string) {
      this.id = {type: "bookmark", id_value: id};
      this.title = title;
      this.url = url;
    }

    submit() {
      browser.bookmarks.get(this.id.id_value).then((bookmarkTreeNode) => {
        browser.tabs.create({ url: bookmarkTreeNode[0].url, active: true });
        window.close();
      });
    }
  }

  async function getBookmarks(searchQuery: string) {
    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    return (await browser.bookmarks.search({}))
      .values()
      .filter((bookmarkNode) => {
        const hasUrl = bookmarkNode.url != undefined;
        if (!hasUrl) {
          console.error(`bookmark with id ${bookmarkNode.id} does not have url`);
        }
        return hasUrl;
      })
      .map((bookmarkNode) => {
        return new Bookmark(bookmarkNode.id, bookmarkNode.title, bookmarkNode.url!)
      })
      .filter((bookmark) => {
        return bookmark.url.toLowerCase().includes(lowerCaseSearchQuery) || bookmark.title.includes(lowerCaseSearchQuery);
      })
      .toArray();
  }

  async function updateList(searchQuery: string, updateReason: "browserSentEvent" | "queryChange", ignoreIdOfPendingRemoval?: number | null) {
    tabs = await getNonPendingTabsOfCurrentWindow(searchQuery, ignoreIdOfPendingRemoval);
    bookmarks = await getBookmarks(searchQuery);

    switch (updateReason) {
      case "browserSentEvent":
        const currentIndex = selectables.findIndex((selectable) => {
          return !!selectedSelectableId && areIdsEqual(selectedSelectableId, selectable.id)
        });

        if(currentIndex === -1) {
          selectedSelectableIndex -= 1;
        } else if (currentIndex != selectedSelectableIndex) (
          selectedSelectableIndex = Math.max(0, selectedSelectableIndex - 1)
        )

        break;
      case "queryChange":
        selectedSelectableIndex = 0;
        break;
    }
  }

  function areIdsEqual(id1: {type: string, id_value: string}, id2: {type: string, id_value: string}) {
    return id1.type === id2.type && id1.id_value === id2.id_value;
  }

  function selectNextTabInOrder() {
    if (selectables.length == 0) return;

    selectedSelectableIndex = (selectedSelectableIndex + 1) % selectables.length;
  }

  function selectPreviousTabInOrder() {
    if (selectables.length == 0) return;

    selectedSelectableIndex = (selectedSelectableIndex - 1 + selectables.length) % selectables.length;
  }

  // search soll behalten werden, auch wenn sich ein tab schließt -> wenn es der Tab ist, der selektiert ist, soll vorheriger genommen werden, wenn es ein vorheriger ist, muss index nach unten geshiftet werden.
  // wenn search sich ändert, soll index auf 0 gesetzt werden
  // -> update list muss bei aufruf auf search-query zugreifen

  /*
  // this minimal example shows me, that its deterministic and the state update happens before is input event is called
  
	let inp = $state(null);

	function useState() {
		console.log(inp);
	}

  <input type="text" bind:value={inp} oninput={(e) => {
    console.log("val: " + e.target.value);
    useState();
  }}/>
  */
  // but maybe better to just use effect? -> nope, but function bindings!! : https://svelte.dev/docs/svelte/$effect#When-not-to-use-$effect
  onMount(() => {
    browser.tabs.onCreated.addListener(() => updateList(searchQuery, "browserSentEvent"));

    browser.tabs.onRemoved.addListener((tabIdPedingRemoval) => {
      updateList(searchQuery, "browserSentEvent", tabIdPedingRemoval); // this is needed, because the event fires to early
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key == "Enter") {
        let selectedSelectable = selectables.find(el => {
          return !!selectedSelectableId && areIdsEqual(el.id, selectedSelectableId);
        });

        if(!!selectedSelectable) {
          selectedSelectable.submit()
        }
      } else if (ev.key == "Tab") { // and not ctrl modifier?
        ev.preventDefault();
        if (ev.shiftKey) {
          selectPreviousTabInOrder();
        } else {
          selectNextTabInOrder();
        }
      }
    });

    // think about if queryChange is the right one here
    updateList(searchQuery, "queryChange");

    browser.tabs.onActivated.addListener((activateInfo) => {
      activeTabId = activateInfo.tabId;
    });

    browser.tabs
      .query({ currentWindow: true, active: true })
      .then((activeTabs) => {
        if(activeTabs.length > 0) {
          activeTabId = activeTabs[0].id ?? null;
        }
      });
  })
</script>

<main>
<div class="tab-list">
  {#each tabs as tab}
    <div class={[
        "tab-display", 
        {
          "tab--selected": !!selectedSelectableId && areIdsEqual(selectedSelectableId, tab.id), 
          "tab-display--active": !!activeTabId && activeTabId.toString() == tab.id.id_value
        }
      ]}
      data-tab-id={tab.id}>
      <!-- TODO: getting error `Content at moz-extension://{id}/popup.html may not load or link to chrome://mozapps/skin/extensions/extension.svg` when trying to access favicon of about:addons -> get icon from somewhere else -->
      <!-- TODO: fix for no icon present -->
      <img class="tab-icon" src={tab.iconUrl} alt="tab-icon">
      <span class="tab-text">{tab.title}</span>
      <div class="tab-key-hint">↵</div>
    </div>
  {/each}
  <div class="divider-line"></div>
  {#each bookmarks as bookmark}
    <div class={[
        "tab-display", 
        {
          "tab--selected": !!selectedSelectableId && areIdsEqual(selectedSelectableId, bookmark.id)
        }
      ]} 
      data-bookmark-id={bookmark.id}>
        <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143Zm126 18L314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Zm0-201Z"/></svg>
        <span class="tab-text">{bookmark.title}</span>
        <div class="tab-key-hint">↵</div>
    </div>
  {/each}
</div>

</main>

<style>
/* TODO: fix different gap between icon and title for bookmarks and tabs */

.tab-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 2px;
  overflow-y: auto;
  scrollbar-color: #80808f transparent;
}

.tab-display {
  display: flex;
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
  height: 75%;
  aspect-ratio: 1/1;
}

.tab-text {
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
