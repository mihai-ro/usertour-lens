// Lens — Chrome runtime message handler

const LN_IS_USERTOUR = location.hostname === LN_CONFIG.USERTOUR_HOST;
let LN_IS_APP = false; // set async in content.js after storage check

function LN_initChromeMessages() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'toggle') {
      LN_handleToggle();
      sendResponse({ ok: true });
    }

    if (msg.action === 'selector_picked' && LN_IS_USERTOUR) {
      LN_injectSelector(msg.selector);
      LN_setPanelPosition();
      LN_showResult({
        selector: msg.selector,
        confidence: msg.confidence || 'high',
        reason: msg.reason || 'Picked with Lens',
        tag: msg.tag || 'element',
        xpath: msg.xpath ?? null,
        playwright: msg.playwright ?? null,
      });
      LN_flashPanel();
      sendResponse({ ok: true });
    }

    if (
      msg.action === 'iframe_pause' &&
      LN_IS_APP &&
      window.self !== window.top
    ) {
      LN_pauseIframePicker();
      sendResponse({ ok: true });
    }

    if (
      msg.action === 'iframe_activate' &&
      LN_IS_APP &&
      window.self !== window.top
    ) {
      LN_activateIframePicker();
      sendResponse({ ok: true });
    }

    return true;
  });
}
