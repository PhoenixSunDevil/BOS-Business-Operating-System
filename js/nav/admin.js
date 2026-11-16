/* ============================================================
   Aetherion BOS — Admin workspace (user management)
   Super Admin only. Create users, set/reset passwords, assign
   roles, and grant or revoke module access — including the
   grant-only Los Cabos Tours module.
   Loaded after shell.js; wraps the placeholder renderer so the
   admin module renders this workspace instead of a placeholder.
   ============================================================ */

(function () {
  const originalPlaceholder = window.bosRenderModulePlaceholder;

  window.bosRenderModulePlaceholder = function (moduleId) {
    if (moduleId === 'admin' && bosCurrentUser().role === 'superadmin') {
      bosRenderAdminWorkspace();
      return;
    }
    originalPlaceholder(moduleId);
  };

  function bosRenderAdminWorkspace() {
    const users = BOS_STORE.users || [];
    const me = bosCurrentUser();

    /* user rows with per-module grant toggles */
    const rows = users.map(function (u, idx) {
      const moduleToggles = BOS_MODULES.map(function (m) {
        if (m.id === 'admin' && u.role !== 'superadmin') return '';
        const grantedNow = (u.granted || []).indexOf(m.id) !== -1;
        const inherited = u.role === 'superadmin';
        const inRoleDefaults = !inherited && BOS_ROLES[u.role] && BOS_ROLES[u.role].modules !== '*' &&
          BOS_ROLES[u.role].modules.indexOf(m.id) !== -1;
        const checked = inherited || inRoleDefaults || grantedNow;
        const locked = inherited || inRoleDefaults;
        return '<label class="grant-toggle" title="' + (locked ? 'Included with role' : 'Grant or revoke for this user') + '">' +
          '<input type="checkbox" ' + (checked ? 'checked' : '') + ' ' + (locked ? 'disabled' : '') +
          ' onchange="bosAdminToggleGrant(\'' + u.username + '\', \'' + m.id + '\', this.checked)">' +
          m.label + '</label>';
      }).join('');

      return '<tr>' +
        '<td>' + u.username + (u.username === me.username ? ' (you)' : '') + '</td>' +
        '<td>' + (u.displayName || '') + '</td>' +
        '<td>' + (BOS_ROLES[u.role] ? BOS_ROLES[u.role].label : u.role) + '</td>' +
        '<td>' + (u.active === false ? 'Disabled' : 'Active') + '</td>' +
        '<td><button class="link-btn" onclick="bosAdminOpenEdit(\'' + u.username + '\')">Edit / password</button></td>' +
        '<td class="grant-cell">' + moduleToggles + '</td>' +
        '</tr>';
    }).join('');

    document.getElementById('module-host').innerHTML =
      '<h2 style="margin-top:0">User Management</h2>' +
      '<p style="color:var(--text-2);font-size:13px">Create users and control exactly which module tabs each user sees. ' +
      '“Los Cabos Tours” is grant-only — it appears only for users you explicitly grant it to, never by role default.</p>' +
      '<div class="tab-header">' +
        '<h3 style="margin:0">Users (' + users.length + ')</h3>' +
        '<button class="btn" onclick="bosAdminOpenCreate()">+ New user</button>' +
      '</div>' +
      '<table class="data-table"><thead><tr>' +
        '<th>Username</th><th>Display name</th><th>Role</th><th>Status</th><th>Account</th><th>Module access</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }
})();

/* ---------- Grant / revoke ---------- */
function bosAdminToggleGrant(username, moduleId, grant) {
  if (grant) bosGrantModule(username, moduleId);
  else bosRevokeModule(username, moduleId);
}

/* ---------- Create user modal ---------- */
function bosAdminOpenCreate() {
  bosShowModal('New user',
    '<form onsubmit="return bosAdminCreateUser(event)">' +
      '<label>Username<input id="nu-user" type="text" required></label>' +
      '<label>Display name<input id="nu-display" type="text"></label>' +
      '<label>Password<input id="nu-pass" type="password" required minlength="6"></label>' +
      '<label>Role<select id="nu-role"><option value="agent">Agent</option><option value="manager">Manager</option><option value="readonly">Read Only</option><option value="superadmin">Super Admin</option></select></label>' +
      '<label class="grant-toggle"><input type="checkbox" id="nu-lct"> Grant Los Cabos Tours</label>' +
      '<div class="modal-actions"><button type="submit" class="btn">Create user</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Cancel</button></div>' +
    '</form>');
  return false;
}
function bosAdminCreateUser(e) {
  e.preventDefault();
  const username = document.getElementById('nu-user').value.trim();
  const password = document.getElementById('nu-pass').value;
  const granted = [];
  if (document.getElementById('nu-lct').checked) granted.push('loscabostours');
  const u = bosUpsertUser({
    username: username,
    displayName: document.getElementById('nu-display').value.trim() || username,
    role: document.getElementById('nu-role').value,
    password: password,
    granted: granted,
    active: true
  });
  if (!u) return false;
  bosCloseModal();
  bosRender();
  return false;
}

/* ---------- Edit user / reset password ---------- */
function bosAdminOpenEdit(username) {
  const u = (BOS_STORE.users || []).find(x => x.username === username);
  if (!u) return;
  bosShowModal('Edit user — ' + u.username,
    '<form onsubmit="return bosAdminSaveUser(event, \'' + u.username + '\')">' +
      '<label>Display name<input id="eu-display" type="text" value="' + (u.displayName || '') + '"></label>' +
      '<label>Role<select id="eu-role">' +
        '<option value="agent"' + (u.role === 'agent' ? ' selected' : '') + '>Agent</option>' +
        '<option value="manager"' + (u.role === 'manager' ? ' selected' : '') + '>Manager</option>' +
        '<option value="readonly"' + (u.role === 'readonly' ? ' selected' : '') + '>Read Only</option>' +
        '<option value="superadmin"' + (u.role === 'superadmin' ? ' selected' : '') + '>Super Admin</option>' +
      '</select></label>' +
      '<label>New password (leave blank to keep current)<input id="eu-pass" type="password" minlength="6"></label>' +
      '<label class="grant-toggle"><input type="checkbox" id="eu-active"' + (u.active !== false ? ' checked' : '') + '> Account active</label>' +
      '<div class="modal-actions"><button type="submit" class="btn">Save</button>' +
      '<button type="button" class="btn secondary" onclick="bosCloseModal()">Cancel</button></div>' +
    '</form>');
}
function bosAdminSaveUser(e, username) {
  e.preventDefault();
  const changes = {
    displayName: document.getElementById('eu-display').value.trim(),
    role: document.getElementById('eu-role').value,
    active: document.getElementById('eu-active').checked
  };
  const pw = document.getElementById('eu-pass').value;
  if (pw) changes.password = pw;
  bosUpsertUser(Object.assign({ username: username }, changes));
  bosCloseModal();
  bosRender();
  return false;
}
