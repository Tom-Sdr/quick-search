<script lang="ts">
  import {onMount} from "svelte"

  let tabs: globalThis.Browser.tabs.Tab[] = $state([]);
  let bookmarks: globalThis.Browser.bookmarks.BookmarkTreeNode[] = $state([]);

  let selectables = $derived([...tabs, ...bookmarks]);

  // FIXME: tab is not correct here! has to be both bookmarks and tabs, discriminate by something to get if it is bookmark or tab
  let selectedTab: null | number = $state(null);

  async function getTabsOfCurrentWindow() {
    return await browser.tabs.query({ currentWindow: true });
  }

  async function getBookmarks() {
    return browser.bookmarks.search({})
  }

  async function updateList(ignoreIdOfPendingRemoval?: number | null) {
    tabs = (await getTabsOfCurrentWindow()).filter((tab) => {
      return !(tab.id === ignoreIdOfPendingRemoval)
    });
    bookmarks = await getBookmarks();
  }

  onMount(() => {
    browser.tabs.onCreated.addListener(() => updateList());

    browser.tabs.onRemoved.addListener((tabIdPedingRemoval) => {
      updateList(tabIdPedingRemoval); // this is needed, because the event fires to early
    });

    updateList().then(() => {
      selectedTab = !!tabs[0] && !!tabs[0].id ? tabs[0].id : null
    });
  })
</script>

<main>
<div class="tab-list">
{#each tabs as tab}
  <div class={["tab-display", selectedTab === tab.id ? "tab--selected" : ""]} data-tab-id={tab.id}>
    <!-- TODO: getting error `Content at moz-extension://{id}/popup.html may not load or link to chrome://mozapps/skin/extensions/extension.svg` when trying to access favicon of about:addons -> get icon from somewhere else -->
    <!-- TODO: fix for no icon present -->
    <img class="tab-icon" src={tab.favIconUrl} alt="tab-icon">
    <span class="tab-text">{tab.title}</span>
    <div class="tab-key-hint">↵</div>
  </div>
{/each}
{#each bookmarks as bookmark}
  <div class="tab-display" data-bookmark-id={bookmark.id}>
      <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143Zm126 18L314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Zm0-201Z"/></svg>
      <span class="tab-text">{bookmark.title}</span>
      <div class="tab-key-hint">↵</div>
  </div>
{/each}
</div>

</main>

<style>
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
</style>
