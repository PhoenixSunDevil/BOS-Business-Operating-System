/**
 * ============================================================
 * Aetherion BOS — Google Apps Script storage backend
 * ============================================================
 * Deploy once, and the CRM stores all records (contacts, nested
 * tab records, alerts, budget, favorites) in Google Apps Script
 * PropertiesService — persistent server-side storage.
 *
 * DEPLOY STEPS:
 * 1. Go to https://script.google.com → New project.
 * 2. Paste this file's contents into Code.gs.
 * 3. Deploy → New deployment → type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone   (required so the CRM can call it)
 * 4. Copy the Web App URL (ends in /exec).
 * 5. In the BOS app, click the "Storage" button in the header,
 *    paste that URL, and reload. Status becomes "synced".
 *
 * API:
 *   GET  <url>?action=load   → { ok: true, data: <BOS_STORE JSON> }
 *   POST <url>?action=save    → body: BOS_STORE JSON (text/plain)
 *                             → { ok: true }
 *
 * NOTES:
 * - POST bodies are sent as text/plain so they remain CORS
 *   "simple requests"; Apps Script reads e.postData.contents.
 * - Storage is the whole store under one property key
 *   (BOS_STORE_V1): simple, atomic, last-write-wins. For heavy
 *   multi-user write volume later, migrate to Google Sheets or
 *   Firestore — the client adapter only needs this API shape.
 * ============================================================
 */

var STORE_KEY = 'BOS_STORE_V1';

function bosJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'load') {
    var raw = PropertiesService.getScriptProperties().getProperty(STORE_KEY);
    var data = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch (err) { data = null; }
    }
    return bosJson({ ok: true, data: data });
  }
  if (action === 'ping') {
    return bosJson({ ok: true, pong: true, service: 'Aetherion BOS Storage' });
  }
  return bosJson({ ok: false, error: 'Use ?action=load' });
}

function doPost(e) {
  var action = (e && e.parameter && e.parameter.action) || 'save';
  if (action !== 'save') {
    return bosJson({ ok: false, error: 'Unknown action' });
  }
  var payload = null;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return bosJson({ ok: false, error: 'Invalid JSON payload' });
  }
  // Structural validation: refuse anything that is not a BOS store.
  if (!payload || !Array.isArray(payload.contacts) ||
      typeof payload.tabsByContact !== 'object' || payload.tabsByContact === null) {
    return bosJson({ ok: false, error: 'Payload does not look like a BOS store' });
  }
  PropertiesService.getScriptProperties().setProperty(STORE_KEY, JSON.stringify(payload));
  return bosJson({ ok: true, saved: payload.contacts.length + ' contacts' });
}

/** Optional helper: run once from the editor to seed the store with
 *  the same structural placeholder contacts the UI ships with. */
function seedInitialStore() {
  var seed = {
    contacts: [
      { id: 'CT-1001', name: 'Sample Contact A', type: 'Student Loan', email: 'contact.a@example.invalid', phone: '(555) 010-0101', enrolled: '2025-03-15', customerId: 'CUST-100234', plan: '—', status: 'Active' }
    ],
    tabsByContact: {
      'CT-1001': { history: [{ ts: '2026-01-10 09:14', actor: 'system', entry: 'Contact record created' }], calls: [], emails: [], notes: [], emarketing: [], sms: [], docs: [], events: [], tasks: [], creditcard: [], bankaccount: [], debts: [], lenders: [], loans: [] }
    },
    alertsByContact: { 'CT-1001': [] },
    favorites: []
  };
  PropertiesService.getScriptProperties().setProperty(STORE_KEY, JSON.stringify(seed));
}
