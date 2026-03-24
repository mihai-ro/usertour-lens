// Lens — bootstrap

document.addEventListener('__ln_toggle__', LN_handleToggle);

LN_initChromeMessages();

if (LN_IS_USERTOUR) {
  LN_initUsertourWatcher();
} else {
  // Determine if we're running inside a registered app host (async).
  chrome.storage.sync.get('lnHosts', ({ lnHosts = [] }) => {
    const isApp = (lnHosts || []).some((h) => {
      try {
        return new URL(h.url).hostname === location.hostname;
      } catch {
        return false;
      }
    });
    if (!isApp || window.self === window.top) return; // panel only on Usertour
    LN_IS_APP = true;
    LN_initIframeBridge();
  });
}
