export function registerShortcuts() {
  document.addEventListener("keydown", (ev) => {
    if (!ev.ctrlKey) return;
    switch (ev.code) {
      case "KeyO":
        browser.runtime.sendMessage({ action: "previousTab" }).then(() => {
          window.close();
        });
        break;
      case "KeyI":
        browser.runtime.sendMessage({ action: "nextTab" }).then(() => {
          window.close();
        });
        break;
    }
  });
}
