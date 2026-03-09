import { Selectable } from "./selectable";

export class Bookmark implements Selectable {
  id: { type: "bookmark"; id_value: string };
  title: string;
  url: string;

  constructor(id: string, title: string, url: string) {
    this.id = { type: "bookmark", id_value: id };
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

export async function getBookmarks(searchQuery: string) {
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
      return new Bookmark(
        bookmarkNode.id,
        bookmarkNode.title,
        bookmarkNode.url!,
      );
    })
    .filter((bookmark) => {
      return (
        bookmark.url.toLowerCase().includes(lowerCaseSearchQuery) ||
        bookmark.title.toLowerCase().includes(lowerCaseSearchQuery)
      );
    })
    .toArray();
}
