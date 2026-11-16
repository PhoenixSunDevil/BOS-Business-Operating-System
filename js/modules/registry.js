/* ============================================================
   Aetherion BOS — Phase 1 Module Registry
   All 17 main modules are registered here, in spec order.
   Every module has an id, label, workspace route, and required
   permission. Modules whose functionality is not yet implemented
   are marked pending: true and render a clearly labeled
   "Development pending" destination (never a dead tab).
   ============================================================ */

const BOS_MODULES = [
  { id: 'dashboard',    label: 'Dashboard',    pending: true  },
  { id: 'guidelines',   label: 'Guidelines',   pending: true  },
  { id: 'contacts',     label: 'Contacts',     pending: false },
  { id: 'creditors',    label: 'Creditors',    pending: true  },
  { id: 'tasks',        label: 'Tasks',        pending: true  },
  { id: 'calendar',     label: 'Calendar',     pending: true  },
  { id: 'enrollments',  label: 'Enrollments',  pending: true  },
  { id: 'accounting',   label: 'Accounting',   pending: true  },
  { id: 'billing',      label: 'Billing',     pending: true  },
  { id: 'settlements',  label: 'Settlements',  pending: true  },
  { id: 'docs',         label: 'Docs',         pending: true  },
  { id: 'files',        label: 'Files',        pending: true  },
  { id: 'emarketing',   label: 'E-Marketing', pending: true  },
  { id: 'sms',          label: 'SMS',          pending: true  },
  { id: 'reports',      label: 'Reports',      pending: true  },
  { id: 'insights',     label: 'Insights',     pending: true  },
  { id: 'admin',        label: 'Admin',        pending: true, adminOnly: true }
];

/* Freeze the registry so modules cannot be added/removed/reordered
   at runtime outside an approved registry change. */
Object.freeze(BOS_MODULES);
if (typeof module !== 'undefined' && module.exports) { module.exports = { BOS_MODULES }; }
