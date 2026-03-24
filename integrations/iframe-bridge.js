// Lens — iframe picker (runs when the app is loaded inside the iframe modal)

if (typeof _ln_pendingEl === 'undefined') {
  let _ln_pendingEl = null;
  let _ln_rafId = null;
}

function _ln_iframeIsOwn(el) {
  return (
    el &&
    (el.id === '__ln_overlay__' ||
      el.id === '__ln_tooltip__' ||
      el.closest?.('#__ln_overlay__') ||
      el.closest?.('#__ln_tooltip__'))
  );
}

function _ln_iframeOnMouseMove(e) {
  if (!LN_STATE.started || LN_STATE.lockedEl) return;
  const el = e.target;
  if (
    _ln_iframeIsOwn(el) ||
    el === document.body ||
    el === document.documentElement
  ) {
    LN_hideOverlay();
    LN_hideTooltip();
    return;
  }
  if (el === LN_STATE.hoveredEl) return;
  LN_STATE.hoveredEl = el;
  _ln_pendingEl = el;

  LN_showOverlay(el);

  if (_ln_rafId) return;
  _ln_rafId = requestAnimationFrame(() => {
    _ln_rafId = null;
    if (_ln_pendingEl && LN_STATE.hoveredEl === _ln_pendingEl) {
      LN_showTooltip(_ln_pendingEl, LN_buildSelector(_ln_pendingEl));
    }
  });
}

function _ln_iframeOnClickEvt(e) {
  if (!LN_STATE.started || _ln_iframeIsOwn(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
  const el = e.target;
  const sd = LN_buildSelector(el);
  let xpath = null,
    playwright = null;
  try {
    xpath = LN_buildXPath(el);
  } catch (_) {}
  try {
    playwright = LN_buildPlaywrightLocator(el);
  } catch (_) {}
  try {
    chrome.runtime.sendMessage({
      action: 'selector_picked',
      selector: sd.selector,
      confidence: sd.confidence,
      reason: sd.reason,
      tag: el.tagName.toLowerCase(),
      xpath,
      playwright,
    });
  } catch (_) {}
  LN_showOverlay(e.target);
  LN_flashOverlay();
  setTimeout(() => {
    LN_STATE.lockedEl = null;
    LN_STATE.hoveredEl = null;
  }, 600);
}

function LN_initIframeBridge() {
  if (_ln_rafId) cancelAnimationFrame(_ln_rafId);
  LN_createOverlay();
  LN_createTooltip();
  LN_STATE.started = false;
  document.body.style.cursor = '';
  document.addEventListener('mousemove', _ln_iframeOnMouseMove, true);
  document.addEventListener('click', _ln_iframeOnClickEvt, true);
}

function LN_pauseIframePicker() {
  if (_ln_rafId) cancelAnimationFrame(_ln_rafId);
  LN_STATE.started = false;
  document.body.style.cursor = '';
  LN_hideOverlay();
  LN_hideTooltip();
}

function LN_activateIframePicker() {
  LN_STATE.started = true;
  document.body.style.cursor = 'crosshair';
}
