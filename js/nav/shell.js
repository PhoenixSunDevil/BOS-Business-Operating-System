/* ============================================================
   Aetherion BOS — Shell renderers
   Module placeholder, Contacts directory, Contact Dashboard
   (action bar + client panel + 14 nested tabs), modals.
   Client profile layout follows the approved FORTH CRM reference.
   ============================================================ */

const BOS_NESTED_TABS = [
  { id: 'history',     label: 'History',      pending: false },
  { id: 'calls',       label: 'Calls',        pending: true  },
  { id: 'emails',      label: 'Emails',       pending: true  },
  { id: 'notes',       label: 'Notes',        pending: false },
  { id: 'emarketing',  label: 'E-Marketing', pending: true  },
  { id: 'sms',         label: 'SMS',          pending: true  },
  { id: 'docs',        label: 'Docs',         pending: true  },
  { id: 'events',      label: 'Events',       pending: true  },
  { id: 'tasks',       label: 'Tasks',        pending: false },
  { id: 'creditcard',  label: 'Credit Card',  pending: true  },
  { id: 'bankaccount', label: 'Bank Account', pending: true  },
  { id: 'debts',       label: 'Debts',        pending: true  },
  { id: 'lenders',     label: 'Lenders',     pending: true  },
  { id: 'loans',       label: 'Loans',        pending: true  }
];

/* ---------- Module placeholder ---------- */
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
  // Contact-scoped tab data, always re-read for THIS contact.
  const data = bosGetTabData(contact.id, tabId);
  const pendingTab = (BOS_NESTED_TABS.find(t => t.id === tabId) || {}).pending;
  const isFav = BOS_STORE.favorites.indexOf(contact.id) !== -1;
  const initials = contact.name.split(' ').map(function(w){ return w.charAt(0); }).slice(0,2).join('').toUpperCase();

  const actionButtons = [
    ['Edit Contact', 'editContact', 'bosOpenModal(\'edit-contact\')'],
    ['Clone', 'clone', 'bosOpenModal(\'clone\')'],
    ['Create Order', 'createOrder', 'bosOpenModal(\'create-order\')'],
    ['Budget Analysis', 'budgetAnalysis', 'bosOpenModal(\'budget\')'],
    ['Creditors', 'creditors', 'bosOpenModal(\'creditors\')'],
    ['Enrollment', 'enrollment', 'bosOpenModal(\'enrollment\')'],
    ['Settlements', 'settlements', 'bosOpenModal(\'settlements\')'],
    ['Add Alert', 'addAlert', 'bosOpenModal(\'add-alert\')']
  ].map(function(pair) {
    if (!bosCanAccessAction(pair[1])) return '';
    return '<button class="contact-action-btn" onclick="' + pair[2] + '">' + pair[0] + '</button>';
  }).join('');

  const favSel = bosCanAccessAction('favorites')
    ? '<select class="favorites-select" title="Favorites">' +
        '<option>☆ Favorites</option><option>★ Favorite this contact</option><option>View favorites</option></select>'
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
          bosKvRow('Plan', '— development pending') +
          bosKvRow('Debt Amount', '—') +
          bosKvRow('Enrollment Status', 'Active') +
        '</div>' +
        '<div class="alerts-card"><h4>Alerts</h4>' +
          '<p class="no-alerts">No alerts on file for this client.</p>' +
        '</div>' +
      '</aside>' +
      '<section>' +
        '<div class="nested-tabs" role="tablist">' + tabs + '</div>' +
        '<div class="nested-workspace" id="nested-workspace"></div>' +
      '</section>' +
    '</div>';

  bosRenderNestedTab(contact, tabId, data, pendingTab);
}

function bosToggleFavorite(contactId) {
  const i = BOS_STORE.favorites.indexOf(contactId);
  if (i === -1) BOS_STORE.favorites.push(contactId);
  else BOS_STORE.favorites.splice(i, 1);
  bosRender(); // re-render current view with updated favorite state
}

function bosRenderNestedTab(contact, tabId, data, pendingTab) {
  const ws = document.getElementById('nested-workspace');
  if (pendingTab) {
    const t = BOS_NESTED_TABS.find(x => x.id === tabId);
    ws.innerHTML =
      '<div class="placeholder">' +
        '<span class="ph-badge">Development pending</span>' +
        '<h2>' + t.label + ' — ' + contact.name + ' (' + contact.id + ')</h2>' +
        '<p>This workspace is scoped to contact ' + contact.id + '. No fabricated records are shown for financial tabs.</p>' +
      '</div>';
    return;
  }
  if (!data || data.length === 0) {
    ws.innerHTML = '<p style="color:var(--text-2)">No records yet for ' + contact.name + ' (' + contact.id + ') in ' + tabId + '.</p>';
    return;
  }
  // Simple record table for implemented tabs.
  const keys = Object.keys(data[0]);
  const rows = data.map(function(r) {
    return '<tr>' + keys.map(function(k) { return '<td>' + r[k] + '</td>'; }).join('') + '</tr>';
  }).join('');
  ws.innerHTML =
    '<table class="data-table"><thead><tr>' +
      keys.map(function(k) { return '<th>' + k + '</th>'; }).join('') +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function bosKvRow(k, v) {
  return '<div class="kv-row"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
}

/* ---------- Modals (contact actions) ---------- */
function bosOpenModal(id) {
  const titles = {
    'edit-contact': 'Edit Contact',
    'clone': 'Clone Contact',
    'create-order': 'Create Order',
    'budget': 'Budget Analysis',
    'creditors': 'Creditors',
    'enrollment': 'Enrollment',
    'settlements': 'Settlements',
    'add-alert': 'Add Alert'
  };
  if (!document.getElementById('bos-modal')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'bos-modal'; backdrop.className = 'modal-backdrop';
    backdrop.onclick = function(e) { if (e.target === backdrop) bosCloseModal(); };
    document.body.appendChild(backdrop);
  }
  const backdrop = document.getElementById('bos-modal');
  backdrop.innerHTML =
    '<div class="modal"><h3>' + (titles[id] || id) + '</h3>' +
    '<p style="color:var(--text-2);font-size:13px">This action destination is part of the Aetherion BOS contact dashboard. Backend functionality is development pending.</p>' +
    '<div class="modal-actions"><button class="btn secondary" onclick="bosCloseModal()">Close</button></div></div>';
  backdrop.classList.add('open');
}
function bosCloseModal() {
  const m = document.getElementById('bos-modal');
  if (m) m.classList.remove('open');
}
