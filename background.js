chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.startsWith("https://gothiczek.pl/")
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: [
        "scripts/helper.js",
        "scripts/huntSection.js",
        "scripts/bagSection.js",
        "scripts/totalGold.js",
        "scripts/injected.js",
      ],
      world: "MAIN",
    });
  }
});
