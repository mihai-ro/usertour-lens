// Lens — highlight overlay

let _ln_overlay = null;

function LN_createOverlay() {
  _ln_overlay = document.createElement('div');
  _ln_overlay.id = '__ln_overlay__';
  document.body.appendChild(_ln_overlay);
}

function LN_showOverlay(el) {
  if (!_ln_overlay || !el) return;
  const r = el.getBoundingClientRect();
  Object.assign(_ln_overlay.style, {
    top: r.top + 'px',
    left: r.left + 'px',
    width: r.width + 'px',
    height: r.height + 'px',
    display: 'block',
  });
}

function LN_hideOverlay() {
  if (_ln_overlay) _ln_overlay.style.display = 'none';
}

function LN_flashOverlay() {
  if (!_ln_overlay) return;
  Object.assign(_ln_overlay.style, {
    borderColor: '#4ade80',
    background: 'rgba(74,222,128,0.12)',
  });
  setTimeout(() => {
    if (_ln_overlay)
      Object.assign(_ln_overlay.style, { borderColor: '', background: '' });
  }, 600);
}

function LN_destroyOverlay() {
  _ln_overlay?.remove();
  _ln_overlay = null;
}
