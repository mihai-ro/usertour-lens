// Lens — iframe modal (opens an app host inside the usertour builder)

let _ln_iframeOnClose = null;

// Open / close

function LN_openIframeModal(onClose) {
  _ln_iframeOnClose = onClose ?? null;

  chrome.storage.sync.get(
    ['lnHosts', 'lnActiveHost'],
    ({ lnHosts = [], lnActiveHost }) => {
      const hosts = lnHosts || [];
      const activeHost = hosts.find((h) => h.url === lnActiveHost) || null;

      // If modal already open for the same host, leave it; if stale, replace it.
      const existing = document.getElementById('__ln_iframe_modal__');
      if (existing) {
        if (existing.dataset.hostUrl === (activeHost?.url ?? '')) return;
        existing.remove();
      }

      const modal = document.createElement('div');
      modal.id = '__ln_iframe_modal__';
      modal.dataset.hostUrl = activeHost?.url ?? '';
      document.body.appendChild(modal);

      if (!activeHost) {
        _ln_renderHostPrompt(modal);
      } else {
        _ln_renderIframe(modal, activeHost);
      }
    }
  );
}

function LN_closeIframeModal() {
  document.getElementById('__ln_iframe_modal__')?.remove();
  _ln_iframeOnClose?.();
  _ln_iframeOnClose = null;
}

// Renderers

function _ln_renderHostPrompt(modal) {
  modal.innerHTML = `<div id="__ln_iframe_inner__">
      <div id="__ln_iframe_bar__">
        <span id="__ln_iframe_title__">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
          No host configured
        </span>
        <button id="__ln_iframe_close__">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Close
        </button>
      </div>
      <div id="__ln_host_prompt__">
        <p class="__ln_hp_desc__">Add a host to load the app in this panel.</p>
        <div class="__ln_hp_fields__">
          <input id="__ln_hp_name__" class="__ln_hp_input__" placeholder="Name (e.g. Staging)" autocomplete="off" />
          <input id="__ln_hp_url__" class="__ln_hp_input__" placeholder="URL (e.g. https://app.example.com)" type="url" autocomplete="off" />
        </div>
        <button id="__ln_hp_save__" class="__ln_hp_save__">Save &amp; open</button>
      </div>
    </div>`;

  modal
    .querySelector('#__ln_iframe_close__')
    .addEventListener('click', LN_closeIframeModal);

  modal.querySelector('#__ln_hp_save__').addEventListener('click', () => {
    const name = modal.querySelector('#__ln_hp_name__').value.trim();
    const url = modal.querySelector('#__ln_hp_url__').value.trim();
    if (!name || !url) return;

    chrome.storage.sync.get('lnHosts', ({ lnHosts = [] }) => {
      const hosts = [...(lnHosts || []), { name, url }];
      chrome.storage.sync.set({ lnHosts: hosts, lnActiveHost: url }, () => {
        modal.dataset.hostUrl = ''; // force re-render on next open
        LN_openIframeModal(_ln_iframeOnClose);
        LN_renderHostsSection();
      });
    });
  });
}

function _ln_renderIframe(modal, host) {
  modal.innerHTML = `<div id="__ln_iframe_inner__">
      <div id="__ln_iframe_bar__">
        <span id="__ln_iframe_title__">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
          ${host.name} — press Start in the panel to begin picking
        </span>
        <button id="__ln_iframe_close__">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Close
        </button>
      </div>
      <iframe id="__ln_iframe__" src="${host.url}"></iframe>
    </div>`;

  modal
    .querySelector('#__ln_iframe_close__')
    .addEventListener('click', LN_closeIframeModal);
}

// Called from panel when user switches the active host.
function LN_switchIframeHost(host) {
  const modal = document.getElementById('__ln_iframe_modal__');
  if (!modal) return;
  modal.dataset.hostUrl = host.url;
  _ln_renderIframe(modal, host);
}
