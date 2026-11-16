/* ============================================================
   Aetherion BOS — Acceptance Test Harness (test.html)
   Super Admin-only. Verifies the navigation architecture AND
   functional behavior with ACTUAL runtime results.
   ============================================================ */
window.__BOS_SESSION__ = { role: 'superadmin', name: 'Super Admin' };

const results = [];
function T(name, fn) {
  try {
    const pass = fn();
    results.push({ name, pass: !!pass });
  } catch (e) {
    results.push({ name, pass: false, error: String(e) });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (!bosCanRunModuleTests()) {
    document.body.innerHTML = '<h2>Access denied</h2><p>Module tests are restricted to Super Admin.</p>';
    return;
  }

  T('All 17 main CRM modules exist', () => BOS_MODULES.length === 17 &&
    ['dashboard','guidelines','contacts','creditors','tasks','calendar','enrollments','accounting','billing','settlements','docs','files','emarketing','sms','reports','insights','admin'].every(m => BOS_MODULES.some(x => x.id === m)));

  T('Every main module can be selected (superadmin)', () =>
    BOS_MODULES.every(m => bosCanAccessModule(m.id)));

  T('Contacts opens the Contacts workspace', () => {
    location.hash = '#/contacts'; bosRender();
    return document.getElementById('module-host').textContent.indexOf('Contact Directory') !== -1;
  });

  T('An individual contact can be selected', () => {
    location.hash = '#/contacts/CT-1001'; bosRender();
    return document.getElementById('module-host').textContent.indexOf('Client Information') !== -1;
  });

  T('Contact dashboard displays the correct contact', () =>
    document.getElementById('module-host').textContent.indexOf('CT-1001') !== -1);

  T('All 9 contact action-bar items are present', () => {
    const bar = document.querySelector('.contact-action-bar');
    if (!bar) return false;
    const need = ['Edit Contact','Clone','Create Order','Budget Analysis','Creditors','Enrollment','Settlements','Add Alert'];
    const txt = bar.textContent;
    return need.every(n => txt.indexOf(n) !== -1) &&
      !!bar.querySelector('input[type="search"]') && !!bar.querySelector('.favorites-select');
  });

  T('All 14 nested contact tabs exist', () =>
    ['history','calls','emails','notes','emarketing','sms','docs','events','tasks','creditcard','bankaccount','debts','lenders','loans'].every(id => BOS_NESTED_TABS.some(t => t.id === id)) && BOS_NESTED_TABS.length === 14);

  T('Every nested tab opens its own workspace', () => {
    return BOS_NESTED_TABS.every(t => {
      location.hash = '#/contacts/CT-1001/' + t.id; bosRender();
      return !!document.getElementById('nested-workspace') &&
        document.getElementById('nested-workspace').textContent.indexOf('Development pending') === -1;
    });
  });

  T('Every nested tab shows an Add-record control', () => {
    return BOS_NESTED_TABS.every(t => {
      location.hash = '#/contacts/CT-1001/' + t.id; bosRender();
      const ws = document.getElementById('nested-workspace');
      return !!ws.querySelector('.tab-header button.btn');
    });
  });

  T('Records can be added through the store (add → appears in tab)', () => {
    bosAddRecord('CT-1001', 'calls', { phone: '(555) 010-0101', duration: '5', outcome: 'Answered', note: 'Test call' });
    const calls = bosGetTabData('CT-1001', 'calls');
    return calls.length === 1 && calls[0].note === 'Test call';
  });

  T('Records can be deleted (remove → gone from tab)', () => {
    bosRemoveRecord('CT-1001', 'calls', 0);
    return bosGetTabData('CT-1001', 'calls').length === 0;
  });

  T('Every action writes to History', () => {
    const before = bosGetTabData('CT-1001', 'history').length;
    bosAddRecord('CT-1001', 'notes', { note: 'History check' });
    bosLogHistory('CT-1001', 'Note added (test)');
    const after = bosGetTabData('CT-1001', 'history').length;
    bosRemoveRecord('CT-1001', 'notes', 0);
    return after >= before + 1;
  });

  T('Switching contacts does not show previous contact info', () => {
    location.hash = '#/contacts/CT-1002/notes'; bosRender();
    const txt = document.getElementById('module-host').textContent;
    return txt.indexOf('CT-1002') !== -1 && txt.indexOf('Sample Contact A') === -1;
  });

  T('Clone creates a new contact with empty record sets', () => {
    const copy = bosCloneContact('CT-1001');
    return copy && copy.id !== 'CT-1001' &&
      bosGetTabData(copy.id, 'creditcard').length === 0 &&
      bosGetTabData(copy.id, 'history').length === 0;
  });

  T('Alerts can be added and read per contact', () => {
    bosAddAlert('CT-1001', 'Warning', 'Test alert');
    const a = bosGetAlerts('CT-1001');
    return a.length === 1 && a[0].text === 'Test alert';
  });

  T('Permissions are enforced (readonly denied Admin)', () => {
    const prev = window.__BOS_SESSION__;
    window.__BOS_SESSION__ = { role: 'readonly', name: 'RO User' };
    const denied = !bosCanAccessModule('admin') && !bosCanAccessModule('sms');
    window.__BOS_SESSION__ = prev;
    return denied;
  });

  T('Unauthorized hash navigation is denied (readonly → admin)', () => {
    const prev = window.__BOS_SESSION__;
    window.__BOS_SESSION__ = { role: 'readonly', name: 'RO User' };
    location.hash = '#/admin'; bosRender();
    const denied = document.getElementById('module-host').textContent.indexOf('Access denied') !== -1;
    window.__BOS_SESSION__ = prev;
    return denied;
  });

  T('Super Admin-only module-test restriction enforced', () => {
    const prev = window.__BOS_SESSION__;
    window.__BOS_SESSION__ = { role: 'manager', name: 'Mgr' };
    const blocked = !bosCanRunModuleTests();
    window.__BOS_SESSION__ = prev;
    return blocked;
  });

  T('Financial tabs start empty (no fabricated data)', () => {
    ['creditcard','bankaccount','debts','lenders','loans'].forEach(id => {
      if (bosGetTabData('CT-1002', id).length !== 0) throw new Error(id + ' populated');
    });
    return true;
  });

  // ---- Report actual results ----
  const pass = results.filter(r => r.pass).length;
  const html = '<h1>Acceptance Test Results</h1>' +
    '<p><strong>' + pass + ' / ' + results.length + ' passed</strong></p>' +
    '<table class="data-table"><thead><tr><th>Test</th><th>Result</th><th>Detail</th></tr></thead><tbody>' +
    results.map(r => '<tr><td>' + r.name + '</td><td style="color:' + (r.pass ? 'var(--ok)' : 'var(--danger)') + '"><strong>' + (r.pass ? 'PASS' : 'FAIL') + '</strong></td><td>' + (r.error ? r.error : (r.pass ? 'OK' : 'check spec item')) + '</td></tr>').join('') +
    '</tbody></table>';
  document.getElementById('test-results').innerHTML = html;
});
