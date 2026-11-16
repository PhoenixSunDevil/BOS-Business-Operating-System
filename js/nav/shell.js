/* ============================================================
   Aetherion BOS — Shell renderers
   Module placeholder, Contacts directory, Contact Dashboard
   (action bar + client panel + 14 nested tabs), WORKING modals.
   Every contact action and every nested tab is functional:
   records can be added and removed, scoped to the selected contact.
   ============================================================ */

const BOS_NESTED_TABS = [
  { id: 'history',     label: 'History',      pending: false },
  { id: 'calls',       label: 'Calls',        pending: false },
  { id: 'emails',      label: 'Emails',       pending: false },
  { id: 'notes',       label: 'Notes',        pending: false },
  { id: 'emarketing',  label: 'E-Marketing', pending: false },
  { id: 'sms',         label: 'SMS',          pending: false },
  { id: 'docs',        label: 'Docs',         pending: false },
  { id: 'events',      label: 'Events',       pending: false },
  { id: 'tasks',       label: 'Tasks',        pending: false },
  { id: 'creditcard',  label: 'Credit Card',  pending: false },
  { id: 'bankaccount', label: 'Bank Account', pending: false },
  { id: 'debts',       label: 'Debts',        pending: false },
  { id: 'lenders',     label: 'Lenders',     pending: false },
  { id: 'loans',       label: 'Loans',        pending: false }
];

/* Each tab defines: label, form fields (for adding records),
   and table columns. Everything is generic and contact-scoped. */
const BOS_TAB_DEFS = {
  history:    { label: 'History',     fields: [['entry','Entry (text)']], cols: ['ts','actor','entry'] },
  calls:      { label: 'Calls',       fields: [['phone','Phone'],['duration','Duration (min)'],['outcome','Outcome'],['note','Note']], cols: ['ts','phone','duration','outcome','note'] },
  emails:     { label: 'Emails',      fields: [['to','To'],['subject','Subject'],['status','Status (Sent/Received)'],['body','Body']], cols: ['ts','to','subject','status'] },
  notes:      { label: 'Notes',       fields: [['note','Note']], cols: ['ts','author','note'] },
  emarketing: { label: 'E-Marketing', fields: [['campaign','Campaign'],['channel','Channel'],['status','Status']], cols: ['ts','campaign','channel','status'] },
  sms:        { label: 'SMS',         fields: [['phone','Phone'],['message','Message'],['direction','Direction (Sent/Received)']], cols: ['ts','phone','direction'] },
  docs:       { label: 'Docs',        fields: [['name','Document name'],['type','Type'],['status','Status']], cols: ['ts','name','type','status'] },
  events:     { label: 'Events',      fields: [['title','Event'],['date','Date'],['location','Location']], cols: ['ts','title','date','location'] },
  tasks:      { label: 'Tasks',       fields: [['title','Task'],['due','Due date'],['status','Status (Open/Done)']], cols: ['ts','title','due','status'] },
  creditcard: { label: 'Credit Card', fields: [['issuer','Issuer'],['last4','Last 4 digits'],['expires','Expires (MM/YY)']], cols: ['ts','issuer','last4','expires'] },
  bankaccount:{ label: 'Bank Account',fields: [['bank','Bank'],['type','Account type'],['last4','Last 4 digits']], cols: ['ts','bank','type','last4'] },
  debts:      { label: 'Debts',       fields: [['creditor','Creditor'],['amount','Amount'],['status','Status']], cols: ['ts','creditor','amount','status'] },
  lenders:    { label: 'Lenders',     fields: [['name','Lender'],['type','Type'],['contact','Contact info']], cols: ['ts','name','type','contact'] },
  loans:      { label: 'Loans',       fields: [['lender','Lender'],['balance','Balance'],['status','Status']], cols: ['ts','lender','balance','status'] }
};

/* ---------- Module placeholder (main modules not yet built) ---------- */
function bosRenderModulePlaceholder(moduleId) {
  const mod = BOS_MODULES.find(m => m.id === moduleId);
  const label = mod ? mod.label : moduleId;
  document.getElementById('module-host').innerHTML =
    '<div class="placeholder">' +
      '<span class="ph-badge">Development pending</span>' +
      '<h2>' + label + '</h2>' +
      '<p>This module is a registered, accessible destination in the Aetherion BOS navigation architecture. ' +
      'Its workspace functionality is under development and will be connected here without changing this route.</p>' +
    '</div>';
}

/* ---------- Contacts: directory ---------- */
function bosRenderContactDirectory() {
  const rows = BOS_STORE.contacts.map(c =>
    '<tr onclick="bosNavigate(\'contacts\', \'' + c.id + '\')" style="cursor:pointer">' +
      '<td>' + c.name + '</td><td>' + c.id + '</td><td>' + c.type + '</td>' +
      '<td>' + c.email + '</td><td>' + c.phone + '</td></tr>'
  ).join('');
  document.getElementById('module-host').innerHTML =
    '<h2 style="margin-top:0">Contact Directory</h2>' +
    '<table class="data-table"><thead><tr>' +
      '<th>Name</th><th>Contact ID</th><th>File Type</th><th>Email</th><th>Phone</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

/* ---------- Contact Dashboard ---------- */
function bosRenderContactDashboard(contact, tabId) {
  const data = bosGetTabData(contact.id, tabId) || [];
  const isFav = BOS_STORE.favorites.indexOf(contact.id) !== -1;
  const initials = contact.name.split(' ').map(function(w){ return w.charAt(0); }).slice(0,2).join('').toUpperCase();
  const alerts = bosGetAlerts(contact.id);

  const actionButtons = [
    ['Edit Contact', 'editContact', 'bosOpenEditContact(\'' + contact.id + '\')'],
    ['Clone', 'clone', 'bosDoClone(\'' + contact.id + '\')'],
    ['Create Order', 'createOrder', 'bosOpenAddRecord(\'' + contact.id + '\', \'orders\')'],
    ['Budget Analysis', 'budgetAnalysis', 'bosOpenBudget(\'' + contact.id + '\')'],
    ['Creditors', 'creditors', 'bosOpenAddRecord(\'' + contact.id + '\', \'creditors\')'],
    ['Enrollment', 'enrollment', 'bosOpenEnrollment(\'' + contact.id + '\')'],
    ['Settlements', 'settlements', 'bosOpenAddRecord(\'' + contact.id + '\', \'settlements\')'],
    ['Add Alert', 'addAlert', 'bosOpenAddAlert(\'' + contact.id + '\')']
  ].map(function(pair) {
    if (!bosCanAccessAction(pair[1])) return '';
    return '<button class="contact-action-btn" onclick="' + pair[2] + '">' + pair[0] + '</button>';
  }).join('');

  const favSel = bosCanAccessAction('favorites')
    ? '<select class="favorites-select" title="Favorites" onchange="bosFavoritesAction(this.value, \'' + contact.id + '\')">' +
        '<option value="">☆ Favorites</option>' +
        '<option value="toggle">★ Favorite this contact</option>' +
        '<option value="view">View favorites</option></select>'
    : '';

  const tabs = BOS_NESTED_TABS.map(function(t) {
    return '<button class="nested-tab' + (t.id === tabId ? ' active' : '') + '"' +
      ' onclick="bosNavigate(\'contacts\', \'' + contact.id + '\', \'' + t.id + '\')">' + t.label + '</button>';
  }).join('');

  document.getElementById('module-host').innerHTML =
    '<div class="contact-action-bar">' +
      '<div class="action-search"><input type="search" placeholder="Contact search…" aria-label="Contact search"></div>' +
      actionButtons + favSel +
    '</div>' +
    '<div class="contact-layout">' +
      '<aside class="client-panel">' +
        '<div class="client-head">' +
          '<div class="client-avatar" aria-hidden="true">' + initials + '</div>' +
          '<div class="client-head-info">' +
            '<div class="client-name">' + contact.name + '</div>' +
            '<div class="client-sub">' + contact.customerId + ' · ' + contact.type + '</div>' +
          '</div>' +
          (bosCanAccessAction('favorites')
            ? '<button class="fav-star' + (isFav ? ' active' : '') + '" type="button" ' +
              'title="' + (isFav ? 'Remove from favorites' : 'Add to favorites') + '" ' +
              'onclick="bosToggleFavorite(\'' + contact.id + '\')">' + (isFav ? '★' : '☆') + '</button>'
            : '') +
        '</div>' +
        '<h3>Client Information</h3>' +
        bosKvRow('Name', contact.name) +
        bosKvRow('Customer ID', contact.customerId) +
        bosKvRow('Contact ID', contact.id) +
        bosKvRow('File Type', contact.type) +
        bosKvRow('Email', contact.email) +
        bosKvRow('Phone', contact.phone) +
        '<div class="snapshot-card"><h4>Client Snapshot</h4>' +
          bosKvRow('Date Enrolled', contact.enrolled) +
          bosKvRow('Plan', contact.plan || '—') +
          bosKvRow('Debt Amount', bosSumAmounts(contact.id, 'debts', 'amount')) +
          bosKvRow('Enrollment Status', contact.status) +
        '</div>' +
        '<div class="alerts-card"><h4>Alerts</h4>' +
          (alerts.length === 0
            ? '<p class="no-alerts">No alerts on file for this client.</p>'
            : alerts.map(function(a) {
                return '<p class="alert-item"><strong>' + a.level + '</strong> — ' + a.text +
                  ' <button class="link-btn" onclick="bosDismissAlert(\'' + contact.id + '\', ' + BOS_STORE.alertsByContact[contact.id].indexOf(a) + ')">dismiss</button></p>';
              }).join('')) +
        '</div>' +
      '</aside>' +
      '<section>' +
        '<div class="nested-tabs" role="tablist">' + tabs + '</div>' +
        '<div class="nested-workspace" id="nested-workspace"></div>' +
      '</section>' +
    '</div>';

  bosRenderNestedTab(contact, tabId, data);
}

/* ---------- Nested tab workspace: full record management ---------- */
function bosRenderNestedTab(contact, tabId, data) {
  const ws = document.getElementById('nested-workspace');
  const def = BOS_TAB_DEFS[tabId];
  if (!def) { ws.innerHTML = '<p style="color:var(--text-2)">Unknown tab.</p>'; return; }

  const header =
    '<div class="tab-header">' +
      '<h3 style="margin:0">' + def.label + ' <span class="tab-count">(' + data.length + ')</span></h3>' +
      '<button class="btn" onclick="bosOpenAddRecord(\'' + contact.id + '\', \'' + tabId + '\')">+ Add ' + def.label + ' record</button>' +
    '</div>';

  if (!data || data.length === 0) {
    ws.innerHTML = header +
      '<p style="color:var(--text-2);margin-top:12px">No ' + def.label + ' records yet for ' + contact.name + ' (' + contact.id + '). Use “Add record” to create the first one.</p>';
    return;
  }

  const rows = data.map(function(r, i) {
    return '<tr>' +
      def.cols.map(function(k) { return '<td>' + (r[k] !== undefined ? r[k] : '') + '</td>'; }).join('') +
      (tabId === 'history'
        ? '<td></td>'
        : '<td><button class="link-btn" onclick="bosDeleteRecord(\'' + contact.id + '\', \'' + tabId + '\', ' + i + ')">Delete</button></td>') +
      '</tr>';
  }).join('');

  ws.innerHTML = header +
    '<table class="data-table"><thead><tr>' +
      def.cols.map(function(c) { return '<th>' + c + '</th>'; }).join('') +
      '<th></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function bosDeleteRecord(contactId, tabId, index) {
  if (!bosRemoveRecord(contactId, tabId, index)) return;
  bosLogHistory(contactId, 'Deleted a record from ' + BOS_TAB_DEFS[tabId].label);
  bosRender();
}

/* ---------- Generic add-record form (any tab) ---------- */
function bosOpenAddRecord(contactId, tabId) {
  const def = BOS_TAB_DEFS[tabId] ||
    /* action-bar destinations that are record lists, not tabs */
    BOS_ACTION_LIST_DEFS[tabId] ||
    { label: tabId, fields: [['name','Name'],['amount','Amount'],['status','Status']], cols: ['ts','name','amount','status'] };
  const inputs = def.fields.map(function(f) {
    return '<label>' + f[1] + '<input id="bos-fld-' + f[0] + '" type="text"></label>';
  }).join('');
  bosShowModal('Add ' + def.label + ' record',
    '<form onsubmit="bosSaveRecord(event, \'' + contactId + '\', \'' + tabId + '\')">' +
      inputs +
      '<div class="modal-actions"><button type="submit" class="btn">Save record</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Cancel</button></div>' +
    '</form>');
}

function bosSaveRecord(e, contactId, tabId) {
  e.preventDefault();
  const def = BOS_TAB_DEFS[tabId] || BOS_ACTION_LIST_DEFS[tabId];
  const record = {};
  def.fields.forEach(function(f) {
    const el = document.getElementById('bos-fld-' + f[0]);
    record[f[0]] = el ? el.value : '';
  });
  bosAddRecord(contactId, tabId, record);
  bosLogHistory(contactId, 'Added a record to ' + def.label);
  bosCloseModal();
  bosRender();
  if (location.hash.indexOf('/contacts/') === -1 || !bosGetContact(contactId)) return;
}

/* Extra record lists reachable from the action bar (kept in the
   contact's tabsByContact store so they stay contact-scoped) */
const BOS_ACTION_LIST_DEFS = {
  orders:      { label: 'Order',       fields: [['name','Order name'],['amount','Amount'],['status','Status']], cols: ['ts','name','amount','status'] },
  creditors:   { label: 'Creditor',    fields: [['name','Creditor name'],['type','Type'],['amount','Amount']], cols: ['ts','name','type','amount'] },
  settlements: { label: 'Settlement',  fields: [['name','Settlement'],['amount','Amount'],['status','Status']], cols: ['ts','name','amount','status'] }
};

/* ---------- Edit Contact ---------- */
function bosOpenEditContact(contactId) {
  const c = bosGetContact(contactId);
  if (!c) return;
  bosShowModal('Edit Contact',
    '<form onsubmit="bosSaveEditContact(event, \'' + contactId + '\')">' +
      '<label>Name<input id="ec-name" type="text" value="' + c.name + '"></label>' +
      '<label>Email<input id="ec-email" type="text" value="' + c.email + '"></label>' +
      '<label>Phone<input id="ec-phone" type="text" value="' + c.phone + '"></label>' +
      '<label>File Type<select id="ec-type"><option>Student Loan</option><option>Debt Settlement</option></select></label>' +
      '<label>Status<select id="ec-status"><option>Active</option><option>Pending</option><option>Closed</option></select></label>' +
      '<div class="modal-actions"><button type="submit" class="btn">Save</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Cancel</button></div>' +
    '</form>');
  document.getElementById('ec-type').value = c.type;
  document.getElementById('ec-status').value = c.status;
}
function bosSaveEditContact(e, contactId) {
  e.preventDefault();
  const c = bosGetContact(contactId);
  if (!c) return;
  c.name = document.getElementById('ec-name').value || c.name;
  c.email = document.getElementById('ec-email').value;
  c.phone = document.getElementById('ec-phone').value;
  c.type = document.getElementById('ec-type').value;
  c.status = document.getElementById('ec-status').value;
  bosLogHistory(contactId, 'Contact record edited');
  bosCloseModal();
  bosRender();
}

/* ---------- Clone ---------- */
function bosDoClone(contactId) {
  const copy = bosCloneContact(contactId);
  if (!copy) return;
  bosLogHistory(contactId, 'Contact cloned as ' + copy.id);
  bosNavigate('contacts', copy.id, 'history');
}

/* ---------- Budget Analysis ---------- */
function bosOpenBudget(contactId) {
  const b = bosGetBudget(contactId);
  bosShowModal('Budget Analysis',
    '<form onsubmit="bosSaveBudget(event, \'' + contactId + '\')">' +
      '<label>Monthly income<input id="bg-income" type="number" value="' + (b ? b.income : '') + '"></label>' +
      '<label>Monthly expenses<input id="bg-expenses" type="number" value="' + (b ? b.expenses : '') + '"></label>' +
      '<div id="bg-result">' + (b ? bosBudgetResultHtml(b) : 'Enter figures and save to compute.') + '</div>' +
      '<div class="modal-actions"><button type="submit" class="btn">Save budget</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Close</button></div>' +
    '</form>');
}
function bosSaveBudget(e, contactId) {
  e.preventDefault();
  const b = {
    income: parseFloat(document.getElementById('bg-income').value) || 0,
    expenses: parseFloat(document.getElementById('bg-expenses').value) || 0
  };
  bosSetBudget(contactId, b);
  bosLogHistory(contactId, 'Budget analysis updated (income ' + b.income + ', expenses ' + b.expenses + ')');
  document.getElementById('bg-result').innerHTML = bosBudgetResultHtml(b);
}
function bosBudgetResultHtml(b) {
  const net = b.income - b.expenses;
  const color = net >= 0 ? 'var(--ok)' : 'var(--danger)';
  return '<p style="font-size:13px;color:var(--text-2)">Net monthly: <strong style="color:' + color + '">' + net.toFixed(2) + '</strong></p>';
}

/* ---------- Enrollment ---------- */
function bosOpenEnrollment(contactId) {
  const c = bosGetContact(contactId);
  bosShowModal('Enrollment',
    '<form onsubmit="bosSaveEnrollment(event, \'' + contactId + '\')">' +
      '<label>Plan<input id="en-plan" type="text" value="' + (c.plan && c.plan !== '—' ? c.plan : '') + '"></label>' +
      '<label>Enrollment date<input id="en-date" type="date"></label>' +
      '<label>Status<select id="en-status"><option>Active</option><option>Pending</option><option>Closed</option></select></label>' +
      '<div class="modal-actions"><button type="submit" class="btn">Save enrollment</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Close</button></div>' +
    '</form>');
  document.getElementById('en-status').value = c.status;
}
function bosSaveEnrollment(e, contactId) {
  e.preventDefault();
  const c = bosGetContact(contactId);
  c.plan = document.getElementById('en-plan').value || '—';
  const d = document.getElementById('en-date').value;
  if (d) c.enrolled = d;
  c.status = document.getElementById('en-status').value;
  bosLogHistory(contactId, 'Enrollment updated (plan: ' + c.plan + ', status: ' + c.status + ')');
  bosCloseModal();
  bosRender();
}

/* ---------- Add Alert ---------- */
function bosOpenAddAlert(contactId) {
  bosShowModal('Add Alert',
    '<form onsubmit="bosSaveAlert(event, \'' + contactId + '\')">' +
      '<label>Level<select id="al-level"><option>Info</option><option>Warning</option><option>Critical</option></select></label>' +
      '<label>Alert text<input id="al-text" type="text" required></label>' +
      '<div class="modal-actions"><button type="submit" class="btn">Add alert</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Cancel</button></div>' +
    '</form>');
}
function bosSaveAlert(e, contactId) {
  e.preventDefault();
  bosAddAlert(contactId, document.getElementById('al-level').value, document.getElementById('al-text').value);
  bosLogHistory(contactId, 'Alert added');
  bosCloseModal();
  bosRender();
}
function bosDismissAlert(contactId, index) {
  const list = BOS_STORE.alertsByContact[contactId];
  if (list) { list.splice(index, 1); bosLogHistory(contactId, 'Alert dismissed'); bosRender(); }
}

/* ---------- Helpers ---------- */
function bosSumAmounts(contactId, tabId, key) {
  const arr = bosGetTabData(contactId, tabId) || [];
  let sum = 0;
  arr.forEach(function(r) { sum += parseFloat(r[key]) || 0; });
  return sum > 0 ? sum.toFixed(2) : '—';
}
function bosKvRow(k, v) {
  return '<div class="kv-row"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
}
function bosFavoritesAction(value, contactId) {
  if (value === 'toggle') { bosToggleFavorite(contactId); }
  else if (value === 'view') { bosShowModal('Favorites', '<p style="color:var(--text-2)">' +
    (BOS_STORE.favorites.length === 0 ? 'No favorites yet.' :
      BOS_STORE.favorites.map(function(id) { const c = bosGetContact(id); return c ? c.name + ' (' + id + ')' : id; }).join('<br>')) +
    '</p><div class="modal-actions"><button class="btn secondary" onclick="bosCloseModal()">Close</button></div>'); }
}
function bosToggleFavorite(contactId) {
  const i = BOS_STORE.favorites.indexOf(contactId);
  if (i === -1) BOS_STORE.favorites.push(contactId);
  else BOS_STORE.favorites.splice(i, 1);
  bosRender();
}

/* ---------- Modal core ---------- */
function bosShowModal(title, bodyHtml) {
  if (!document.getElementById('bos-modal')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'bos-modal'; backdrop.className = 'modal-backdrop';
    backdrop.onclick = function(e) { if (e.target === backdrop) bosCloseModal(); };
    document.body.appendChild(backdrop);
  }
  const backdrop = document.getElementById('bos-modal');
  backdrop.innerHTML = '<div class="modal"><h3>' + title + '</h3>' + bodyHtml + '</div>';
  backdrop.classList.add('open');
}
function bosOpenModal(id) { bosShowModal(id, '<div class="modal-actions"><button class="btn secondary" onclick="bosCloseModal()">Close</button></div>'); }
function bosCloseModal() {
  const m = document.getElementById('bos-modal');
  if (m) m.classList.remove('open');
}
