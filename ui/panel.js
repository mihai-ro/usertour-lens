// Lens — floating panel UI

let _ln_panel = null;
let _ln_currentItem = null; // the pick item currently displayed
let _ln_editingHostIdx = -1;
let _ln_hosts = []; // cache updated by LN_renderHostsSection

// Create

function LN_createPanel(startPaused, callbacks) {
  if (document.getElementById('__ln_panel__')) return;
  _ln_panel = document.createElement('div');
  _ln_panel.id = '__ln_panel__';
  _ln_panel.innerHTML = `<div class="__ln_ph__">
      <span class="__ln_logo__">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
        <span class="__ln_logo_text__">Lens<span class="__ln_logo_sub__">by mihairo</span></span>
      </span>
      <span class="__ln_pbtns__">
        <button id="__ln_tog__" class="__ln_tbtn__${startPaused ? '' : ' __ln_on__'}">
          ${startPaused ? LN_SVG_START : LN_SVG_PAUSE}
          ${startPaused ? 'Start' : 'Pause'}
        </button>
        <button id="__ln_cls__" class="__ln_ibtn__" title="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </span>
    </div>
    <div class="__ln_pb__">
      <div id="__ln_empty__" class="__ln_empty__">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3l14 9-14 9V3z" opacity="0.3"/></svg>
        <span>Hover any element,<br>then click to lock it</span>
      </div>
      <div id="__ln_res__" class="__ln_res__" style="display:none">
        <div id="__ln_meta__" class="__ln_meta__"></div>
        <div class="__ln_fmt__">
          <button class="__ln_fmtbtn__ __ln_fmtact__" data-fmt="css">CSS</button>
          <button class="__ln_fmtbtn__" data-fmt="xpath">XPath</button>
          <button class="__ln_fmtbtn__" data-fmt="pw">Playwright</button>
        </div>
        <div class="__ln_row__">
          <input id="__ln_inp__" class="__ln_inp__" readonly spellcheck="false"/>
          <button id="__ln_cpy__" class="__ln_cpy__" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <div id="__ln_count__" class="__ln_count__"></div>
        <div id="__ln_why__" class="__ln_why__"></div>
        <div class="__ln_actions__">
          <span class="__ln_hist__">
            <button id="__ln_back__" class="__ln_histbtn__" title="Previous pick" disabled>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="__ln_fwd__" class="__ln_histbtn__" title="Next pick" disabled>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </span>
          <button id="__ln_rst__" class="__ln_rst__">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset
          </button>
          <button id="__ln_confirm__" class="__ln_confirm__">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            Confirm &amp; close
          </button>
        </div>
      </div>
    </div>`;

  // Hosts section (appended after main body)
  const hostsSection = document.createElement('div');
  hostsSection.className = '__ln_phosts__';
  hostsSection.innerHTML = `
    <div class="__ln_phdivider__"></div>
    <div class="__ln_phhdr__">
      <span class="__ln_phhdr_lbl__">Hosts</span>
      <button id="__ln_hadd__" class="__ln_ibtn__" title="Add host">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>
    <div id="__ln_hlist__"></div>
    <div id="__ln_hform__" class="__ln_hform__" style="display:none">
      <input id="__ln_hf_name__" class="__ln_hf_input__" placeholder="Name" autocomplete="off" />
      <input id="__ln_hf_url__"  class="__ln_hf_input__" placeholder="URL" type="url" autocomplete="off" />
      <div class="__ln_hf_btns__">
        <button id="__ln_hf_cancel__" class="__ln_rst__">Cancel</button>
        <button id="__ln_hf_save__"   class="__ln_confirm__">Save</button>
      </div>
    </div>`;
  _ln_panel.appendChild(hostsSection);

  document.body.appendChild(_ln_panel);
  LN_setPanelPosition();

  _ln_makeDraggable(_ln_panel, _ln_panel.querySelector('.__ln_ph__'));

  _ln_panel
    .querySelector('#__ln_tog__')
    .addEventListener('click', callbacks.onToggle);
  _ln_panel
    .querySelector('#__ln_cls__')
    .addEventListener('click', callbacks.onClose);
  _ln_panel
    .querySelector('#__ln_cpy__')
    .addEventListener('click', _ln_copySelector);
  _ln_panel
    .querySelector('#__ln_rst__')
    .addEventListener('click', callbacks.onReset);
  _ln_panel
    .querySelector('#__ln_confirm__')
    .addEventListener('click', callbacks.onConfirm);
  _ln_panel
    .querySelector('#__ln_back__')
    .addEventListener('click', callbacks.onBack);
  _ln_panel
    .querySelector('#__ln_fwd__')
    .addEventListener('click', callbacks.onForward);

  // Hosts section — single delegated listener so re-renders never lose events
  hostsSection.addEventListener('click', (e) => {
    if (e.target.closest('#__ln_hadd__')) {
      _ln_showHostForm();
      return;
    }
    if (e.target.closest('#__ln_hf_cancel__')) {
      _ln_cancelHostForm();
      return;
    }
    if (e.target.closest('#__ln_hf_save__')) {
      _ln_saveHostForm();
      return;
    }
    const editBtn = e.target.closest('.__ln_hedit__');
    if (editBtn) {
      _ln_showHostForm(_ln_hosts[+editBtn.dataset.idx], +editBtn.dataset.idx);
      return;
    }
    const delBtn = e.target.closest('.__ln_hdel__');
    if (delBtn) {
      LN_deleteHost(+delBtn.dataset.idx);
      return;
    }
    const row = e.target.closest('.__ln_hrow__');
    if (row && !e.target.closest('.__ln_hbtns__'))
      LN_setActiveHost(row.dataset.url);
  });
  LN_renderHostsSection();

  // Format toggle
  _ln_panel.querySelectorAll('.__ln_fmtbtn__').forEach((btn) => {
    btn.addEventListener('click', () => {
      _ln_panel
        .querySelectorAll('.__ln_fmtbtn__')
        .forEach((b) => b.classList.remove('__ln_fmtact__'));
      btn.classList.add('__ln_fmtact__');
      LN_STATE.format = btn.dataset.fmt;
      _ln_refreshDisplay();
    });
  });
}

// Display

// Full pick item: { css, xpath, playwright, tag, confidence, reason, elRef? }
function LN_showPick(item) {
  _ln_currentItem = item;

  const empty = document.getElementById('__ln_empty__');
  const res = document.getElementById('__ln_res__');
  const meta = document.getElementById('__ln_meta__');
  if (!empty || !res || !meta) return;

  empty.style.display = 'none';
  res.style.display = 'flex';

  const cls =
    { high: '__ln_ch__', medium: '__ln_cm__', low: '__ln_cl__' }[
      item.confidence
    ] || '__ln_ch__';
  const lbl =
    {
      high: 'High confidence',
      medium: 'Medium confidence',
      low: 'Low confidence',
    }[item.confidence] || 'High confidence';
  meta.innerHTML = `<span class="__ln_tp__">${item.tag || 'element'}</span><span class="__ln_cp__ ${cls}">${lbl}</span>`;

  _ln_refreshDisplay();
  _ln_refreshHistoryButtons();
}

// Compat wrapper for remote picks (no element available — css only).
// Also pushes to history so iframe-mode picks appear in the history nav.
function LN_showResult(sd) {
  const item = {
    css: sd.selector,
    xpath: sd.xpath ?? null,
    playwright: sd.playwright ?? null,
    tag: sd.tag || 'element',
    confidence: sd.confidence,
    reason: sd.reason,
  };
  _ln_pushHistory(item);
  LN_showPick(item);
}

// Updates input value + match count for the current format
function _ln_refreshDisplay() {
  if (!_ln_currentItem) return;
  const fmt = LN_STATE.format;
  const inp = document.getElementById('__ln_inp__');
  const count = document.getElementById('__ln_count__');
  const why = document.getElementById('__ln_why__');

  const val =
    fmt === 'css'
      ? _ln_currentItem.css
      : fmt === 'xpath'
        ? (_ln_currentItem.xpath ?? '–')
        : (_ln_currentItem.playwright ?? '–');

  if (inp) inp.value = val;
  if (why)
    why.textContent = _ln_currentItem.reason
      ? 'Why: ' + _ln_currentItem.reason
      : '';

  // Match count (#4)
  if (count) {
    if (fmt === 'pw' || !val || val === '–') {
      count.textContent = '';
      count.className = '__ln_count__';
    } else {
      const n = fmt === 'css' ? LN_countCSS(val) : LN_countXPath(val);
      if (n === null || n === 0) {
        // 0 matches is expected in iframe-pick mode (element lives in the other frame)
        count.textContent = '';
        count.className = '__ln_count__';
      } else if (n === 1) {
        count.textContent = '✓ unique';
        count.className = '__ln_count__ __ln_count_ok__';
      } else {
        count.textContent = `⚠ matches ${n} elements`;
        count.className = '__ln_count__ __ln_count_warn__';
      }
    }
  }
}

function _ln_refreshHistoryButtons() {
  const back = document.getElementById('__ln_back__');
  const fwd = document.getElementById('__ln_fwd__');
  if (back) back.disabled = LN_STATE.historyIdx <= 0;
  if (fwd) fwd.disabled = LN_STATE.historyIdx >= LN_STATE.history.length - 1;
}

function LN_resetResult() {
  _ln_currentItem = null;
  const empty = document.getElementById('__ln_empty__');
  const res = document.getElementById('__ln_res__');
  if (empty) empty.style.display = 'flex';
  if (res) res.style.display = 'none';
}

// Panel state

function LN_setPanelPosition() {
  if (!_ln_panel) return;
  Object.assign(_ln_panel.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    top: 'auto',
    left: 'auto',
    zIndex: '2147483647',
  });
}

function LN_setPickerState(isActive) {
  const btn = document.getElementById('__ln_tog__');
  if (!btn) return;
  btn.className = isActive ? '__ln_tbtn__ __ln_on__' : '__ln_tbtn__';
  btn.innerHTML = isActive ? LN_SVG_PAUSE + ' Pause' : LN_SVG_START + ' Start';
}

function LN_flashPanel() {
  if (!_ln_panel) return;
  _ln_panel.style.transition = 'box-shadow 0.15s';
  _ln_panel.style.boxShadow = '0 0 0 3px #4ade80, 0 8px 40px rgba(0,0,0,0.65)';
  setTimeout(() => {
    if (_ln_panel) _ln_panel.style.boxShadow = '';
  }, 900);
}

function LN_destroyPanel() {
  _ln_panel?.remove();
  _ln_panel = null;
  _ln_currentItem = null;
}

// Host management

function LN_renderHostsSection() {
  const list = document.getElementById('__ln_hlist__');
  if (!list) return;

  chrome.storage.sync.get(
    ['lnHosts', 'lnActiveHost'],
    ({ lnHosts = [], lnActiveHost }) => {
      _ln_hosts = lnHosts || [];

      // Update Start button — disabled when no active host is configured
      const togBtn = document.getElementById('__ln_tog__');
      if (togBtn) togBtn.disabled = !lnActiveHost;

      if (_ln_hosts.length === 0) {
        list.innerHTML = `<div class="__ln_hempty__">No hosts yet</div>`;
        return;
      }

      list.innerHTML = _ln_hosts
        .map(
          (h, i) => `
      <div class="__ln_hrow__${h.url === lnActiveHost ? ' __ln_hactive__' : ''}" data-idx="${i}" data-url="${h.url}">
        <span class="__ln_hdot__"></span>
        <span class="__ln_hname__" title="${h.url}">${h.name}</span>
        <span class="__ln_hbtns__">
          <button class="__ln_hedit__ __ln_ibtn__" data-idx="${i}" title="Edit">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="__ln_hdel__ __ln_ibtn__" data-idx="${i}" title="Delete">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </span>
      </div>`
        )
        .join('');
      // No per-row listeners needed — event delegation handles all clicks on hostsSection
    }
  );
}

function LN_setActiveHost(url) {
  chrome.storage.sync.get('lnHosts', ({ lnHosts = [] }) => {
    const host = (lnHosts || []).find((h) => h.url === url);
    if (!host) return;
    chrome.storage.sync.set({ lnActiveHost: url }, () => {
      LN_renderHostsSection();
      LN_switchIframeHost(host);
    });
  });
}

function LN_deleteHost(idx) {
  chrome.storage.sync.get(
    ['lnHosts', 'lnActiveHost'],
    ({ lnHosts = [], lnActiveHost }) => {
      const hosts = [...(lnHosts || [])];
      const [deleted] = hosts.splice(idx, 1);
      const wasActive = deleted?.url === lnActiveHost;
      const newActive = wasActive ? (hosts[0]?.url ?? null) : lnActiveHost;

      chrome.storage.sync.set(
        { lnHosts: hosts, lnActiveHost: newActive },
        () => {
          LN_renderHostsSection();
          if (wasActive) {
            // Pause picking if active so the user isn't left in crosshair mode
            if (LN_STATE.started) LN_togglePicker();
            // Remove stale modal and re-open — shows prompt if no hosts remain
            const modal = document.getElementById('__ln_iframe_modal__');
            if (modal) {
              modal.remove();
              LN_openIframeModal(_ln_iframeOnClose);
            }
          }
        }
      );
    }
  );
}

function _ln_showHostForm(host = null, idx = -1) {
  _ln_editingHostIdx = idx;
  const form = document.getElementById('__ln_hform__');
  if (!form) return;
  document.getElementById('__ln_hf_name__').value = host?.name ?? '';
  document.getElementById('__ln_hf_url__').value = host?.url ?? '';
  form.style.display = 'flex';
}

function _ln_cancelHostForm() {
  _ln_editingHostIdx = -1;
  const form = document.getElementById('__ln_hform__');
  if (!form) return;
  form.style.display = 'none';
  document.getElementById('__ln_hf_name__').value = '';
  document.getElementById('__ln_hf_url__').value = '';
}

function _ln_saveHostForm() {
  const name = document.getElementById('__ln_hf_name__')?.value.trim();
  const url = document.getElementById('__ln_hf_url__')?.value.trim();
  if (!name || !url) return;

  chrome.storage.sync.get(
    ['lnHosts', 'lnActiveHost'],
    ({ lnHosts = [], lnActiveHost }) => {
      const hosts = [...(lnHosts || [])];
      const editIdx = _ln_editingHostIdx;

      if (editIdx >= 0) {
        const oldUrl = hosts[editIdx]?.url;
        hosts[editIdx] = { name, url };
        const newActive = lnActiveHost === oldUrl ? url : lnActiveHost;

        chrome.storage.sync.set(
          { lnHosts: hosts, lnActiveHost: newActive },
          () => {
            _ln_cancelHostForm();
            LN_renderHostsSection();
            // If the edited host was active and the iframe is open, reload it
            if (lnActiveHost === oldUrl) {
              const modal = document.getElementById('__ln_iframe_modal__');
              if (modal) {
                modal.remove();
                LN_openIframeModal(_ln_iframeOnClose);
              }
            }
          }
        );
      } else {
        hosts.push({ name, url });
        const newActive = lnActiveHost || url; // auto-select first host
        chrome.storage.sync.set(
          { lnHosts: hosts, lnActiveHost: newActive },
          () => {
            _ln_cancelHostForm();
            LN_renderHostsSection();
          }
        );
      }
    }
  );
}

// Internal helpers

function _ln_makeDraggable(el, handle) {
  let ox, oy, sx, sy;
  handle.style.cursor = 'grab';
  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    ({ clientX: sx, clientY: sy } = e);
    ({ left: ox, top: oy } = el.getBoundingClientRect());
    handle.style.cursor = 'grabbing';
    const mv = (e) => {
      el.style.right = el.style.bottom = 'auto';
      el.style.left = Math.max(0, ox + e.clientX - sx) + 'px';
      el.style.top = Math.max(0, oy + e.clientY - sy) + 'px';
    };
    const up = () => {
      handle.style.cursor = 'grab';
      document.removeEventListener('mousemove', mv);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  });
}

// Clipboard copy — execCommand removed (#11)
async function _ln_copySelector() {
  const inp = document.getElementById('__ln_inp__');
  if (!inp?.value) return;
  await navigator.clipboard.writeText(inp.value);
  const btn = document.getElementById('__ln_cpy__');
  const orig = btn.innerHTML;
  btn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';
  btn.style.borderColor = '#4ade80';
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.borderColor = '';
  }, 2000);
}
