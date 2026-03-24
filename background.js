// Lens — background service worker

chrome.action.onClicked.addListener((tab) => toggleOnTab(tab.id));

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-lens') return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) toggleOnTab(tab.id);
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggle') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) toggleOnTab(tabs[0].id);
    });
    sendResponse({ ok: true });
  }

  if (msg.action === 'selector_picked') {
    chrome.tabs.query({ url: 'https://app.usertour.io/*' }, (tabs) => {
      tabs?.forEach((tab) =>
        chrome.tabs
          .sendMessage(tab.id, {
            action: 'selector_picked',
            selector: msg.selector,
            confidence: msg.confidence,
            reason: msg.reason,
            tag: msg.tag,
            xpath: msg.xpath,
            playwright: msg.playwright,
          })
          .catch(() => {})
      );
    });
    sendResponse({ ok: true });
  }

  if (msg.action === 'iframe_pause' || msg.action === 'iframe_activate') {
    const tabId = sender.tab?.id;
    if (tabId)
      chrome.tabs.sendMessage(tabId, { action: msg.action }).catch(() => {});
    sendResponse({ ok: true });
  }

  return true;
});

function toggleOnTab(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => document.dispatchEvent(new CustomEvent('__ln_toggle__')),
    })
    .catch(() =>
      chrome.tabs.sendMessage(tabId, { action: 'toggle' }).catch(() => {})
    );
}
