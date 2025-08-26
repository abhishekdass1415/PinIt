chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveScrollPosition") {
    // Save multiple pins per domain as an array
    chrome.storage.local.get([request.domain], (result) => {
      let pins = result[request.domain] || [];
      pins.push({ y: request.scrollY, time: Date.now() });
      chrome.storage.local.set({ [request.domain]: pins }, () => {
        console.log("Pinned scroll position saved for", request.domain);
      });
    });
  } else if (request.action === "getScrollPositions") {
    chrome.storage.local.get([request.domain], (result) => {
      sendResponse({ pins: result[request.domain] || [] });
    });
    return true;
  } else if (request.action === "removePin") {
    chrome.storage.local.get([request.domain], (result) => {
      let pins = result[request.domain] || [];
      pins.splice(request.index, 1);
      chrome.storage.local.set({ [request.domain]: pins }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  } else if (request.action === "getPinColor") {
    chrome.storage.local.get([`pinColor_${request.domain}`], (result) => {
      sendResponse({ color: result[`pinColor_${request.domain}`] || '#f1c40f' });
    });
    return true;
  }
});