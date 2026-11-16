/* ============================================================
   Aetherion BOS — Permission architecture (front-end gate)
   NOTE: This is the navigation-layer gate. It prevents a user
   from reaching restricted workspaces via UI, URL or hash
   manipulation while the app is open. It does NOT replace a
   server-side authorization layer in production — real data
   access must always be re-checked server-side.
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
  favorites: 'contacts.favorites'
};

function bosCurrentUser() {
  // Session user. In production this comes from the auth system.
  const u = window.__BOS_SESSION__ || { role: 'superadmin', name: 'Super Admin' };
  return u;
}

function bosCanAccessModule(moduleId) {
  const user = bosCurrentUser();
  const mod = BOS_MODULES.find(m => m.id === moduleId);
  if (!mod) return false;
  if (mod.adminOnly && user.role !== 'superadmin') return false;
  const role = BOS_ROLES[user.role];
  if (!role) return false;
  if (role.modules === '*') return true;
  return role.modules.indexOf(moduleId) !== -1;
}

function bosCanAccessAction(action) {
  const user = bosCurrentUser();
  if (user.role === 'superadmin') return true;
  // Per-role action grants (front-of-matrix; refine in Phase 2).
  const grants = {
    manager:  [BOS_Actions.contactSearch, BOS_Actions.favorites, BOS_Actions.editContact, BOS_Actions.clone, BOS_Actions.createOrder, BOS_Actions.budgetAnalysis, BOS_Actions.creditors, BOS_Actions.enrollment, BOS_Actions.settlements, BOS_Actions.addAlert],
    agent:    [BOS_Actions.contactSearch, BOS_Actions.favorites, BOS_Actions.addAlert],
    readonly: [BOS_Actions.contactSearch, BOS_Actions.favorites]
  };
  const list = grants[user.role] || [];
  return list.indexOf(action) !== -1;
}

// Super Admin-only module-test restriction, independently enforced.
function bosCanRunModuleTests() {
  return bosCurrentUser().role === 'superadmin';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BOS_ROLES, BOS_Actions, bosCanAccessModule, bosCanAccessAction, bosCanRunModuleTests };
}
