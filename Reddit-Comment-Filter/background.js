// background.js
console.log("Background script running.");
fetch(chrome.runtime.getURL('output.json'))
  .then(response => response.json())
  .then(data => {
    chrome.storage.local.set({ commentDataset: data }, () => {
      console.log("Dataset loaded from JSON and stored in local storage.");
    });
  });

  // Background script
chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension context invalidated.");
  // You could also send a message to all content scripts if needed
  chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "stopObserver" });
      });
  });
});
