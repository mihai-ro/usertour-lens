// Lens — Usertour builder integration

let _ln_waitObs = null; // tracked so we can cancel before starting a new one (#1)

// Selector injection

function LN_injectSelector(selector) {
  const input = document.getElementById(LN_CONFIG.SELECTOR_INPUT_ID);
  if (!input) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
    input,
    selector
  );
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.style.transition = 'box-shadow 0.2s';
  input.style.boxShadow = '0 0 0 3px rgba(85,51,255,0.6)';
  setTimeout(() => {
    input.style.boxShadow = '';
  }, 1200);
}

// Button injection

function _ln_injectLensButton() {
  if (document.getElementById('__ln_pick_btn__')) return;

  // Find "CSS selector" label - works for both flows and launchers
  const cssLabel = Array.from(document.querySelectorAll('label')).find(
    (el) => el.textContent.trim() === LN_CONFIG.CSS_SELECTOR_LABEL
  );

  if (!cssLabel) return;

  const btn = document.createElement('button');
  btn.id = '__ln_pick_btn__';
  btn.type = 'button';
  btn.title = 'Pick with Lens';
  btn.innerHTML =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
  btn.addEventListener('click', () => {
    if (!document.getElementById('__ln_panel__')) LN_initPicker(true);
    LN_setPanelPosition();
    LN_openIframeModal(LN_destroyAll);
  });

  // Insert button right after the CSS selector label
  cssLabel.after(btn);
}

function _ln_removeInjectedUI() {
  document.getElementById('__ln_pick_btn__')?.remove();
  LN_closeIframeModal();
}

// Route detection

function _ln_isBuilderRoute() {
  const m = location.pathname.match(LN_CONFIG.BUILDER_ROUTE_RE);
  if (!m) return false;
  // Exclude detail route
  return !location.pathname.includes('/builder/detail');
}

function _ln_hasSelectorTarget() {
  return (
    document.getElementById(LN_CONFIG.SELECTOR_INPUT_ID) ||
    Array.from(document.querySelectorAll('label')).some(
      (el) => el.textContent.trim() === LN_CONFIG.CSS_SELECTOR_LABEL
    )
  );
}

function _ln_waitForInput() {
  // Cancel any previously running observer before starting a new one (#1)
  if (_ln_waitObs) {
    _ln_waitObs.disconnect();
    _ln_waitObs = null;
  }

  if (_ln_hasSelectorTarget()) {
    _ln_injectLensButton();
    return;
  }

  _ln_waitObs = new MutationObserver(() => {
    if (_ln_hasSelectorTarget()) {
      _ln_injectLensButton();
      _ln_waitObs.disconnect();
      _ln_waitObs = null;
    }
  });
  _ln_waitObs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => {
    _ln_waitObs?.disconnect();
    _ln_waitObs = null;
  }, 15000);
}

function _ln_onRouteChange() {
  _ln_isBuilderRoute() ? _ln_waitForInput() : _ln_removeInjectedUI();
}

// Escape handler

function _ln_initEscapeHandler() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !document.getElementById('__ln_iframe_modal__'))
      return;
    if (LN_STATE.started) {
      LN_STATE.started = false;
      LN_setPickerState(false);
      try {
        chrome.runtime.sendMessage({ action: 'iframe_pause' });
      } catch (_) {}
    } else {
      LN_closeIframeModal();
    }
  });
}

// Boot

function LN_initUsertourWatcher() {
  // Patch history methods for SPA navigation
  const _push = history.pushState.bind(history);
  const _replace = history.replaceState.bind(history);
  history.pushState = (...a) => {
    _push(...a);
    _ln_onRouteChange();
  };
  history.replaceState = (...a) => {
    _replace(...a);
    _ln_onRouteChange();
  };
  window.addEventListener('popstate', _ln_onRouteChange);
  window.addEventListener('hashchange', _ln_onRouteChange);

  // Belt-and-suspenders: many SPAs update <title> on navigation (#13)
  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(_ln_onRouteChange).observe(titleEl, {
      childList: true,
      characterData: true,
    });
  }

  // Broad DOM watcher to catch late button/input renders.
  // Gated on isBuilderRoute first so getElementById is only called on relevant pages. (#10)
  new MutationObserver(() => {
    if (!_ln_isBuilderRoute()) return;
    if (document.getElementById('__ln_pick_btn__')) return;
    if (document.getElementById(LN_CONFIG.SELECTOR_INPUT_ID))
      _ln_injectLensButton();
  }).observe(document.body, { childList: true, subtree: true });

  _ln_initEscapeHandler();
  _ln_onRouteChange();
}
