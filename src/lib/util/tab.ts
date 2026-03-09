import { Selectable } from "./selectable";

export class Tab implements Selectable {
  id: { type: "tab"; id_value: string };
  title: string;
  url: string;
  iconUrl: string;
  constructor(id: number, title: string, url: string, iconUrl: string) {
    this.id = { type: "tab", id_value: id.toString() };
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

export async function getNonPendingTabsOfCurrentWindow(
  searchQuery: string,
  tabIdPendingRemoval?: number | null,
) {
  return (await browser.tabs.query({ currentWindow: true }))
    .values()
    .filter((tab) => {
      if (tab.id === tabIdPendingRemoval) {
        return false;
      }

      if (tab.id === undefined) {
        console.error("tab has no id");
        return false;
      }

      // TODO: these might have to be captured & updated via the tabs.onUpdated event: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated
      if (tab.title === undefined) {
        console.error(
          `tab title is not set. This should only happen, if the extension doesn't have tabs permission.`,
        );
      }
      if (tab.url === undefined) {
        console.error(
          `tab url is not set. This should only happen, if the extension doesn't have tabs permission.`,
        );
      }
      if (tab.favIconUrl === undefined) {
        console.error(
          `tab favIcon is not set. This should only happen, if the extension doesn't have tabs permission.`,
        );
      }

      return true;
    })
    .map((tab) => {
      return new Tab(tab.id!, tab.title!, tab.url!, tab.favIconUrl!);
    })
    .filter((tab) => {
      return (
        tab.url.toLowerCase().includes(searchQuery) ||
        tab.title.toLowerCase().includes(searchQuery)
      );
    })
    .toArray();
}
