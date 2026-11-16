/* ============================================================
   Aetherion BOS — Phase 1 Module Registry
   All 18 main modules are registered here, in spec order.
   Los Cabos Tours is GRANT-ONLY: hidden from every role by
   default (BOS_GRANT_ONLY_MODULES) and only reachable by users
   the Super Admin explicitly grants it to.
   Each module has an id, label, and workspace route. Modules whose
   functionality is not yet implemented render a clearly labeled
   "Development pending" destination (never a dead tab).
   ============================================================ */

const BOS_MODULES = [
  { id: 'dashboard',    label: 'Dashboard',       pending: true  },
  { id: 'guidelines',   label: 'Guidelines',      pending: true  },
  { id: 'contacts',     label: 'Contacts',        pending: false },
  { id: 'creditors',    label: 'Creditors',       pending: true  },
  { id: 'tasks',        label: 'Tasks',           pending: true  },
  { id: 'calendar',     label: 'Calendar',        pending: true  },
  { id: 'enrollments',  label: 'Enrollments',     pending: true  },
  { id: 'accounting',   label: 'Accounting',      pending: true  },
  { id: 'billing',      label: 'Billing',         pending: true  },
  { id: 'settlements',  label: 'Settlements',     pending: true  },
  { id: 'docs',         label: 'Docs',            pending: true  },
  { id: 'files',        label: 'Files',           pending: true  },
  { id: 'emarketing',   label: 'E-Marketing',    pending: true  },
  { id: 'sms',          label: 'SMS',             pending: true  },
  { id: 'reports',      label: 'Reports',         pending: true  },
  { id: 'insights',     label: 'Insights',        pending: true  },
  { id: 'loscabostours', label: 'Los Cabos Tours', pending: true, grantOnly: true },
  { id: 'admin',        label: 'Admin',           pending: false, adminOnly: true }
];

/* Freeze the registry so modules cannot be added/removed/reordered
   at runtime outside an approved registry change. */
Object.freeze(BOS_MODULES);
if (typeof module !== 'undefined' && module.exports) { module.exports = { BOS_MODULES }; }
