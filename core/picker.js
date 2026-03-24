// Lens — picker orchestrator (mouse events + selection logic)

let _ln_pendingEl = null;
let _ln_rafId = null;
let _ln_lastTouchEl = null;

function _ln_isOwn(el) {
  return (
    el &&
    (el.id === '__ln_panel__' ||
      el.id === '__ln_tooltip__' ||
      el.id === '__ln_overlay__' ||
      el.closest?.('#__ln_panel__') ||
      el.closest?.('#__ln_tooltip__'))
  );
}

// Event handlers

function _ln_onMouseMove(e) {
  if (!LN_STATE.started) return;
  const el = e.target;
  if (
    _ln_isOwn(el) ||
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

function _ln_onClickEvt(e) {
  if (!LN_STATE.started || _ln_isOwn(e.target)) return;
  e.preventDefault();
  e.stopPropagation();

  const el = e.target;
  LN_STATE.lockedEl = el;

  const sd = LN_buildSelector(el);

  let xpath = null;
  let playwright = null;
  try {
    xpath = LN_buildXPath(el);
  } catch {}
  try {
    playwright = LN_buildPlaywrightLocator(el);
  } catch {}

  const item = {
    css: sd.selector,
    xpath,
    playwright,
    tag: el.tagName.toLowerCase(),
    confidence: sd.confidence,
    reason: sd.reason,
    elRef: new WeakRef(el),
  };

  _ln_pushHistory(item);
  LN_showOverlay(el);
  LN_hideTooltip();
  LN_showPick(item);
}

// History

const _LN_MAX_HISTORY = 10;

function _ln_pushHistory(item) {
  LN_STATE.history.splice(LN_STATE.historyIdx + 1);
  LN_STATE.history.push(item);
  if (LN_STATE.history.length > _LN_MAX_HISTORY) LN_STATE.history.shift();
  LN_STATE.historyIdx = LN_STATE.history.length - 1;
}

function LN_historyBack() {
  if (LN_STATE.historyIdx <= 0) return;
  LN_STATE.historyIdx--;
  _ln_restoreHistoryItem();
}

function LN_historyForward() {
  if (LN_STATE.historyIdx >= LN_STATE.history.length - 1) return;
  LN_STATE.historyIdx++;
  _ln_restoreHistoryItem();
}

function _ln_restoreHistoryItem() {
  const item = LN_STATE.history[LN_STATE.historyIdx];
  if (!item) return;
  const el = item.elRef?.deref();
  if (el && document.contains(el)) {
    LN_STATE.lockedEl = el;
    LN_showOverlay(el);
  } else {
    LN_STATE.lockedEl = null;
    LN_hideOverlay();
  }
  LN_showPick(item);
}

// Picker state

function _ln_resetSelection() {
  LN_STATE.lockedEl = null;
  LN_STATE.hoveredEl = null;
  LN_resetResult();
  LN_hideOverlay();
}

function LN_togglePicker() {
  LN_STATE.started = !LN_STATE.started;
  LN_setPickerState(LN_STATE.started);
  if (LN_STATE.started) {
    if (document.getElementById('__ln_iframe_modal__')) {
      try {
        chrome.runtime.sendMessage({ action: 'iframe_activate' });
      } catch {}
    } else if (document.body) {
      document.body.style.cursor = 'crosshair';
    }
  } else {
    if (document.body) document.body.style.cursor = '';
    if (document.getElementById('__ln_iframe_modal__')) {
      try {
        chrome.runtime.sendMessage({ action: 'iframe_pause' });
      } catch {}
    }
    if (!LN_STATE.lockedEl) LN_hideOverlay();
    LN_hideTooltip();
  }
}

// Touch handlers

function _ln_onTouchStart(e) {
  if (!LN_STATE.started) return;
  const el = e.target;
  if (_ln_isOwn(el)) return;
  _ln_lastTouchEl = el;
}

function _ln_onTouchEnd(e) {
  if (!LN_STATE.started) return;
  if (!_ln_lastTouchEl || _ln_isOwn(e.target)) return;
  e.preventDefault();

  const el = _ln_lastTouchEl;
  _ln_lastTouchEl = null;
  LN_STATE.lockedEl = el;

  const sd = LN_buildSelector(el);

  let xpath = null;
  let playwright = null;
  try {
    xpath = LN_buildXPath(el);
  } catch {}
  try {
    playwright = LN_buildPlaywrightLocator(el);
  } catch {}

  const item = {
    css: sd.selector,
    xpath,
    playwright,
    tag: el.tagName.toLowerCase(),
    confidence: sd.confidence,
    reason: sd.reason,
    elRef: new WeakRef(el),
  };

  _ln_pushHistory(item);
  LN_showOverlay(el);
  LN_hideTooltip();
  LN_showPick(item);
}

// Keyboard handler

function _ln_onKeyDown(e) {
  if (e.key === 'Escape' && LN_STATE.started) {
    LN_destroyAll();
  }
}

// Lifecycle

function LN_initPicker(startPaused) {
  if (document.getElementById('__ln_panel__')) return;
  LN_createOverlay();
  LN_createTooltip();
  LN_createPanel(startPaused, {
    onToggle: LN_togglePicker,
    onClose: LN_destroyAll,
    onReset: _ln_resetSelection,
    onBack: LN_historyBack,
    onForward: LN_historyForward,
    onConfirm: () => {
      const hadModal = !!document.getElementById('__ln_iframe_modal__');
      LN_closeIframeModal();
      if (!hadModal) LN_destroyAll();
    },
  });
  LN_STATE.started = !startPaused;
  if (document.body)
    document.body.style.cursor = startPaused ? '' : 'crosshair';
  document.addEventListener('mousemove', _ln_onMouseMove, true);
  document.addEventListener('click', _ln_onClickEvt, true);
  document.addEventListener('touchstart', _ln_onTouchStart, { passive: true });
  document.addEventListener('touchend', _ln_onTouchEnd, { passive: false });
  document.addEventListener('keydown', _ln_onKeyDown, true);
}

function LN_destroyAll() {
  if (_ln_rafId) cancelAnimationFrame(_ln_rafId);
  LN_STATE.started = false;
  LN_STATE.lockedEl = null;
  LN_STATE.hoveredEl = null;
  LN_STATE.history = [];
  LN_STATE.historyIdx = -1;
  if (document.body) document.body.style.cursor = '';
  document.removeEventListener('mousemove', _ln_onMouseMove, true);
  document.removeEventListener('click', _ln_onClickEvt, true);
  document.removeEventListener('touchstart', _ln_onTouchStart, {
    passive: true,
  });
  document.removeEventListener('touchend', _ln_onTouchEnd, { passive: false });
  document.removeEventListener('keydown', _ln_onKeyDown, true);
  LN_destroyPanel();
  LN_destroyTooltip();
  LN_destroyOverlay();
}

function LN_handleToggle() {
  if (!LN_IS_USERTOUR) return;
  document.getElementById('__ln_panel__')
    ? LN_destroyAll()
    : LN_initPicker(false);
}
