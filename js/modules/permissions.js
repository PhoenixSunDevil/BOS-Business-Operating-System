/* ============================================================
   Aetherion BOS — Permission architecture (per-user grants)
   Module access is controlled by the Super Admin through the
   Admin → User Management panel. Every user has a granted[] list;
   a user can only reach modules in their list (plus role defaults).
   "Los Cabos Tours" is GRANT-ONLY: it is never granted by default
   to any role — not even managers — only to users the owner
   explicitly grants it to.
   The superadmin role always has full access ("*").
   This is the navigation-layer gate; server-side data access must
   still be re-checked in any real backend.
   ============================================================ */

const BOS_ROLES = {
  superadmin: { id: 'superadmin', label: 'Super Admin', modules: '*' },
  manager:    { id: 'manager',    label: 'Manager',    modules: ['dashboard','guidelines','contacts','creditors','tasks','calendar','enrollments','accounting','billing','settlements','docs','files','emarketing','sms','reports','insights'] },
  agent:      { id: 'agent',      label: 'Agent',      modules: ['dashboard','guidelines','contacts','tasks','calendar','docs','sms'] },
  readonly:   { id: 'readonly',   label: 'Read Only',  modules: ['dashboard','contacts','reports'] }
};

const BOS_Actions = {
  editContact: 'contacts.edit',
  clone: 'contacts.clone',
  createOrder: 'orders.create',
  budgetAnalysis: 'contacts.budget',
  creditors: 'contacts.creditors',
  enrollment: 'contacts.enrollment',
  settlements: 'contacts.settlements',
  addAlert: 'contacts.alert',
  contactSearch: 'contacts.search',
  favorites: 'contacts.favorites',
  userAdmin: 'admin.users'
};

/* Modules that are NEVER included in role defaults — the owner
   grants them per user. */
const BOS_GRANT_ONLY_MODULES = ['loscabostours', 'admin'];

function bosCurrentUser() {
  if (window.__BOS_SESSION__) return window.__BOS_SESSION__;
  if (window.BOS_AUTH && BOS_AUTH.session) return BOS_AUTH.session;
  return { role: 'anonymous', name: 'Not signed in', granted: [] };
}

/* Full module list a user can reach: role defaults + personal
   grants (grant-only modules must be in granted[] to count). */
function bosUserModules(user) {
  user = user || bosCurrentUser();
  const role = BOS_ROLES[user.role];
  if (!role) return [];
  let list = role.modules === '*' ? BOS_MODULES.map(m => m.id) : (role.modules || []).slice();
  (user.granted || []).forEach(function(g) {
    if (list.indexOf(g) === -1 && BOS_MODULES.some(m => m.id === g)) list.push(g);
  });
  /* grant-only safety net: never let a non-superadmin inherit one */
  if (role.modules !== '*') {
    list = list.filter(function(id) {
      if (BOS_GRANT_ONLY_MODULES.indexOf(id) === -1) return true;
      return (user.granted || []).indexOf(id) !== -1;
    });
  }
  return list;
}

function bosCanAccessModule(moduleId) {
  const user = bosCurrentUser();
  const mod = BOS_MODULES.find(m => m.id === moduleId);
  if (!mod) return false;
  if (user.role === 'superadmin') return true;
  return bosUserModules(user).indexOf(moduleId) !== -1;
}

function bosCanAccessAction(action) {
  const user = bosCurrentUser();
  if (user.role === 'superadmin') return true;
  const grants = {
    manager:  [BOS_Actions.contactSearch, BOS_Actions.favorites, BOS_Actions.editContact, BOS_Actions.clone, BOS_Actions.createOrder, BOS_Actions.budgetAnalysis, BOS_Actions.creditors, BOS_Actions.enrollment, BOS_Actions.settlements, BOS_Actions.addAlert],
    agent:    [BOS_Actions.contactSearch, BOS_Actions.favorites, BOS_Actions.addAlert, BOS_Actions.editContact],
    readonly: [BOS_Actions.contactSearch, BOS_Actions.favorites]
  };
  const list = grants[user.role] || [];
  return list.indexOf(action) !== -1;
}

/* Super Admin-only module-test restriction, independently enforced. */
function bosCanRunModuleTests() {
  return bosCurrentUser().role === 'superadmin';
}

/* Admin helpers: create/update users, grant/revoke modules. */
function bosUpsertUser(data) {
  if (!Array.isArray(BOS_STORE.users)) BOS_STORE.users = [];
  let u = BOS_STORE.users.find(x => x.username === data.username);
  if (!u) {
    u = { username: data.username, displayName: data.displayName || data.username, role: data.role || 'agent', granted: [], active: true, created: bosNow(), passHash: null };
    BOS_STORE.users.push(u);
  }
  if (data.displayName !== undefined) u.displayName = data.displayName;
  if (data.role !== undefined) u.role = data.role;
  if (data.active !== undefined) u.active = data.active;
  if (data.password) u.passHash = bosHashPassword(data.password);
  if (data.granted !== undefined) u.granted = data.granted;
  if (typeof bosAfterMutation === 'function') bosAfterMutation();
  return u;
}

function bosGrantModule(username, moduleId) {
  const u = (BOS_STORE.users || []).find(x => x.username === username);
  if (!u) return false;
  if (!Array.isArray(u.granted)) u.granted = [];
  if (u.granted.indexOf(moduleId) === -1) u.granted.push(moduleId);
  if (typeof bosAfterMutation === 'function') bosAfterMutation();
  return true;
}

function bosRevokeModule(username, moduleId) {
  const u = (BOS_STORE.users || []).find(x => x.username === username);
  if (!u || !Array.isArray(u.granted)) return false;
  const i = u.granted.indexOf(moduleId);
  if (i !== -1) u.granted.splice(i, 1);
  if (typeof bosAfterMutation === 'function') bosAfterMutation();
  return true;
}
