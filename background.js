chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.startsWith("https://gothiczek.pl/")
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: [
        "scripts/ext.js",
        "scripts/helper.js",
        "scripts/hunt.js",
        // "scripts/bagSection.js",
        // "scripts/totalGold.js",
        "scripts/mineGame.js",
        "scripts/mineQuest.js",
        "scripts/hooks.js",
        "scripts/mineGameRAW.js",
      ],
      world: "MAIN",
    });
  }
});
