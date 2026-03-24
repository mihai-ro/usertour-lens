// Lens — hover tooltip

let _ln_tooltip = null;

function LN_createTooltip() {
  _ln_tooltip = document.createElement('div');
  _ln_tooltip.id = '__ln_tooltip__';
  document.body.appendChild(_ln_tooltip);
}

function LN_showTooltip(el, sd) {
  if (!_ln_tooltip) return;
  const cc = { high: '#4ade80', medium: '#facc15', low: '#f87171' }[
    sd.confidence
  ];
  const sel =
    sd.selector.length > 50 ? sd.selector.slice(0, 50) + '…' : sd.selector;
  _ln_tooltip.innerHTML =
    `<span class="__ln_tt__">${el.tagName.toLowerCase()}</span>` +
    `<span class="__ln_ts__">${LN_escHtml(sel)}</span>` +
    `<span class="__ln_tb__" style="color:${cc};border-color:${cc}40">${sd.confidence}</span>`;
  const r = el.getBoundingClientRect();
  let top = r.top - 46 + scrollY;
  if (r.top < 54) top = r.bottom + 8 + scrollY;
  _ln_tooltip.style.top = top + 'px';
  _ln_tooltip.style.left =
    Math.max(8, Math.min(r.left, innerWidth - 340)) + 'px';
  _ln_tooltip.style.display = 'flex';
}

function LN_hideTooltip() {
  if (_ln_tooltip) _ln_tooltip.style.display = 'none';
}

function LN_destroyTooltip() {
  _ln_tooltip?.remove();
  _ln_tooltip = null;
}
