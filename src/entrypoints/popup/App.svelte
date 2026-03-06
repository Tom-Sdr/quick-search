<script lang="ts">
  import {onMount} from "svelte"

  let tabs: Tab[] = $state([]);
  let bookmarks: Bookmark[] = $state([]);

  let selectedSelectableId: null | {type: string, id_value: string} = $state(null);
  let activeTabId: number | null = $state(null);

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

  async function getNonPendingTabsOfCurrentWindow(tabIdPendingRemoval?: number | null) {
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
      }).toArray();
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

  async function getBookmarks() {
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
      .toArray();
  }

  // TODO: add query parameter here
  async function updateList(ignoreIdOfPendingRemoval?: number | null) {
    tabs = await getNonPendingTabsOfCurrentWindow(ignoreIdOfPendingRemoval);
    bookmarks = await getBookmarks();
  }

  function areIdsEqual(id1: {type: string, id_value: string}, id2: {type: string, id_value: string}) {
    return id1.type === id2.type && id1.id_value === id2.id_value;
  }

  onMount(() => {
    browser.tabs.onCreated.addListener(() => updateList());

    browser.tabs.onRemoved.addListener((tabIdPedingRemoval) => {
      updateList(tabIdPedingRemoval); // this is needed, because the event fires to early
    });

    updateList().then(() => {
      selectedSelectableId = !!tabs[0] && !!tabs[0].id ? tabs[0].id : null
    });

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
