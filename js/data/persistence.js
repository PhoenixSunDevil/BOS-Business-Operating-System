/* ============================================================
   Aetherion BOS — Persistence adapter (Google Apps Script)
   Loads the store from the Apps Script web app on startup and
   saves it (debounced) after every change. Works with ANY
   backend that exposes:
     GET  ?action=load → { ok, data }
     POST ?action=save → { ok }
   If no GAS URL is configured, the app runs in session-local mode
   (exactly like before) — everything still works, data just does
   not survive a refresh.
   ============================================================ */

const BOS_PERSISTENCE = {
  url: localStorage.getItem('bos-gas-url') || '',
  status: 'offline', // offline | loading | synced | error
  saveTimer: null,
  SAVE_DELAY_MS: 1200
};

function bosStorageConfigured() {
  return !!(BOS_PERSISTENCE.url && BOS_PERSISTENCE.url.indexOf('script.google.com') !== -1);
}

/* Replace the in-memory store with the loaded one. Refuses
   malformed or empty payloads so a bad server can never wipe
   the working store. */
function bosApplyLoadedStore(loaded) {
  if (!loaded || !Array.isArray(loaded.contacts) || loaded.contacts.length === 0) return false;
  if (typeof loaded.tabsByContact !== 'object' || loaded.tabsByContact === null) return false;
  BOS_STORE.contacts = loaded.contacts;
  BOS_STORE.tabsByContact = loaded.tabsByContact;
  BOS_STORE.alertsByContact = loaded.alertsByContact || {};
  BOS_STORE.favorites = loaded.favorites || [];
  return true;
}

function bosLoadFromServer() {
  if (!bosStorageConfigured()) {
    BOS_PERSISTENCE.status = 'offline';
    bosUpdateStorageBadge();
    return;
  }
  BOS_PERSISTENCE.status = 'loading';
  bosUpdateStorageBadge();
  fetch(BOS_PERSISTENCE.url + '?action=load')
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok) throw new Error(j && j.error ? j.error : 'load failed');
      bosApplyLoadedStore(j.data);
      BOS_PERSISTENCE.status = 'synced';
      bosUpdateStorageBadge();
      if (typeof bosRender === 'function') bosRender(); // re-render with server data
    })
    .catch(function (err) {
      BOS_PERSISTENCE.status = 'error';
      bosUpdateStorageBadge();
      console.error('[BOS] storage load failed:', err);
    });
}

/* Debounced save: every mutation funnels through here. */
function bosPersist() {
  if (!bosStorageConfigured()) return; // session-local mode
  clearTimeout(BOS_PERSISTENCE.saveTimer);
  BOS_PERSISTENCE.saveTimer = setTimeout(function () {
    fetch(BOS_PERSISTENCE.url + '?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(BOS_STORE)
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error(j && j.error ? j.error : 'save failed');
        BOS_PERSISTENCE.status = 'synced';
        bosUpdateStorageBadge();
      })
      .catch(function (err) {
        BOS_PERSISTENCE.status = 'error';
        bosUpdateStorageBadge();
        console.error('[BOS] storage save failed:', err);
      });
  }, BOS_PERSISTENCE.SAVE_DELAY_MS);
}

/* UI: header badge + storage settings modal. */
function bosUpdateStorageBadge() {
  const el = document.getElementById('storage-badge');
  if (!el) return;
  const labels = { offline: 'Storage: local session', loading: 'Storage: loading…', synced: 'Storage: synced', error: 'Storage: error' };
  el.textContent = labels[BOS_PERSISTENCE.status] || BOS_PERSISTENCE.status;
  el.title = 'Click to configure Google Apps Script storage';
}

function bosOpenStorageModal() {
  bosShowModal('Storage — Google Apps Script',
    '<p style="font-size:13px;color:var(--text-2)">Paste the Apps Script Web App URL (ends in /exec) to enable persistent storage. See apps/gas/Code.gs in the repository for deployment steps.</p>' +
    '<label>Web App URL<input id="gas-url" type="text" value="' + (BOS_PERSISTENCE.url || '') + '" placeholder="https://script.google.com/macros/s/…/exec"></label>' +
    '<div class="modal-actions">' +
      '<button class="btn" onclick="bosSaveStorageUrl()">Save &amp; reload</button>' +
      '<button class="btn secondary" onclick="bosCloseModal()">Cancel</button>' +
    '</div>');
}

function bosSaveStorageUrl() {
  const v = document.getElementById('gas-url').value.trim();
  if (v && v.indexOf('script.google.com') === -1) {
    alert('That does not look like an Apps Script URL.');
    return;
  }
  if (v) localStorage.setItem('bos-gas-url', v);
  else localStorage.removeItem('bos-gas-url');
  location.reload();
}

/* Call after every mutation so persistence is automatic. */
function bosAfterMutation() {
  bosPersist();
}
