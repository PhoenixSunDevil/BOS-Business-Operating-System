/* ============================================================
   Aetherion BOS — Data store (contact-scoped)
   No real customer data. Sample contacts are structural placeholders.
   Financial tabs start EMPTY; records are only ever created through
   the UI by an authorized user — never fabricated.
   Every mutation calls bosAfterMutation() (persistence adapter)
   when the app is wired for Google Apps Script storage.
   ============================================================ */

const BOS_STORE = {
  contacts: [
    { id: 'CT-1001', name: 'Sample Contact A', type: 'Student Loan',    email: 'contact.a@example.invalid', phone: '(555) 010-0101', enrolled: '2025-03-15', customerId: 'CUST-100234', plan: '—', status: 'Active'  },
    { id: 'CT-1002', name: 'Sample Contact B', type: 'Debt Settlement', email: 'contact.b@example.invalid', phone: '(555) 010-0102', enrolled: '2025-06-02', customerId: 'CUST-100235', plan: '—', status: 'Pending' }
  ],
  /* All nested-tab content is stored per contact ID. Every workspace
     re-reads from this map, so no tab can ever render another
     contact's information. */
  tabsByContact: {
    'CT-1001': {
      history:    [{ ts: '2026-01-10 09:14', actor: 'agent.smith', entry: 'Contact record created' }],
      calls:      [], emails: [], notes: [], emarketing: [], sms: [], docs: [], events: [],
      tasks:      [{ due: '2026-01-20', title: 'Follow-up call', status: 'Open' }],
      creditcard: [], bankaccount: [], debts: [], lenders: [], loans: []
    },
    'CT-1002': {
      history:    [{ ts: '2026-02-01 15:40', actor: 'agent.jones', entry: 'Contact record created' }],
      calls:      [], emails: [], notes: [], emarketing: [], sms: [], docs: [], events: [],
      tasks:      [], creditcard: [], bankaccount: [], debts: [], lenders: [], loans: []
    }
  },
  alertsByContact: { 'CT-1001': [], 'CT-1002': [] },
  favorites: []
};

function bosNow() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

/* Persist hook — defined by persistence.js; safe no-op if absent
   (e.g., in the test harness which runs its own script set). */
function bosAfterMutation() {
  if (typeof bosPersist === 'function') bosPersist();
}

function bosGetContact(contactId) {
  return BOS_STORE.contacts.find(c => c.id === contactId) || null;
}

function bosGetTabData(contactId, tabId) {
  const byContact = BOS_STORE.tabsByContact[contactId];
  if (!byContact) return null;
  return byContact[tabId] !== undefined ? byContact[tabId] : null;
}

/* Add a record to a contact-scoped list. Creates the list if the
   key does not exist yet (orders, settlements, creditors, etc.). */
function bosAddRecord(contactId, tabId, record) {
  const by = BOS_STORE.tabsByContact[contactId];
  if (!by) return null;
  if (!Array.isArray(by[tabId])) by[tabId] = [];
  record.ts = bosNow();
  by[tabId].unshift(record);
  bosAfterMutation();
  return record;
}

function bosRemoveRecord(contactId, tabId, index) {
  const arr = BOS_STORE.tabsByContact[contactId] && BOS_STORE.tabsByContact[contactId][tabId];
  if (!Array.isArray(arr) || arr[index] === undefined) return false;
  arr.splice(index, 1);
  bosAfterMutation();
  return true;
}

/* Every action on a record is logged to that contact's History. */
function bosLogHistory(contactId, entry) {
  const by = BOS_STORE.tabsByContact[contactId];
  if (!by) return;
  by.history.unshift({ ts: bosNow(), actor: bosCurrentUser().name, entry: entry });
  bosAfterMutation();
}

/* Contact record edits (Edit Contact / Enrollment forms) */
function bosUpdateContact(contactId, changes) {
  const c = bosGetContact(contactId);
  if (!c) return null;
  Object.keys(changes).forEach(function(k) { c[k] = changes[k]; });
  bosAfterMutation();
  return c;
}

/* Budget Analysis (per contact) */
function bosGetBudget(contactId) {
  const by = BOS_STORE.tabsByContact[contactId];
  return by && by.budget ? by.budget : null;
}
function bosSetBudget(contactId, budget) {
  const by = BOS_STORE.tabsByContact[contactId];
  if (by) by.budget = budget;
  bosAfterMutation();
}

/* Alerts (per contact) */
function bosGetAlerts(contactId) {
  return BOS_STORE.alertsByContact[contactId] || [];
}
function bosAddAlert(contactId, level, text) {
  if (!BOS_STORE.alertsByContact[contactId]) BOS_STORE.alertsByContact[contactId] = [];
  BOS_STORE.alertsByContact[contactId].unshift({ ts: bosNow(), level: level, text: text });
  bosAfterMutation();
}
function bosDismissAlert(contactId, index) {
  const list = BOS_STORE.alertsByContact[contactId];
  if (list) { list.splice(index, 1); bosAfterMutation(); }
}

/* Favorites */
function bosToggleFavorite(contactId) {
  const i = BOS_STORE.favorites.indexOf(contactId);
  if (i === -1) BOS_STORE.favorites.push(contactId);
  else BOS_STORE.favorites.splice(i, 1);
  bosAfterMutation();
}

/* Clone — creates a new contact with a fresh, EMPTY record set.
   Sensitive tab records are intentionally NOT copied. */
function bosNextContactId() {
  let max = 1000;
  BOS_STORE.contacts.forEach(function (c) {
    const n = parseInt(c.id.replace('CT-', ''), 10);
    if (n > max) max = n;
  });
  return 'CT-' + (max + 1);
}
function bosCloneContact(contactId) {
  const src = bosGetContact(contactId);
  if (!src) return null;
  const id = bosNextContactId();
  const copy = {
    id: id, name: src.name + ' (Clone)', type: src.type, email: src.email,
    phone: src.phone, enrolled: src.enrolled, customerId: src.customerId + '-C',
    plan: src.plan, status: src.status
  };
  BOS_STORE.contacts.push(copy);
  BOS_STORE.tabsByContact[id] = {
    history: [], calls: [], emails: [], notes: [], emarketing: [], sms: [], docs: [],
    events: [], tasks: [], creditcard: [], bankaccount: [], debts: [], lenders: [], loans: []
  };
  BOS_STORE.alertsByContact[id] = [];
  bosAfterMutation();
  return copy;
}
