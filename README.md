# BOS — Business Operating System (Aetherion BOS)

Aetherion BOS is the central Business Operating System housing the Aetherion CRM and business modules.

## Navigation architecture (Phase 1)

Main modules (17, in fixed order):

Dashboard · Guidelines · Contacts · Creditors · Tasks · Calendar · Enrollments · Accounting · Billing · Settlements · Docs · Files · E-Marketing · SMS · Reports · Insights · Admin

Contact hierarchy:

```
AETHERION BOS
├── (17 main modules — see js/modules/registry.js)
└── Contacts
    └── Contact Directory
        └── Individual Contact
            ├── Client Dashboard
            ├── Contact Actions (search, Edit Contact, Clone, Create Order,
            │   Budget Analysis, Creditors, Enrollment, Settlements, Add Alert, Favorites)
            └── Nested Tabs (14): History, Calls, Emails, Notes, E-Marketing, SMS,
                Docs, Events, Tasks, Credit Card, Bank Account, Debts, Lenders, Loans
```

Nested contact tabs are workspaces inside the selected contact record, scoped by contact ID. They are not interchangeable with main modules.

## Structure

- index.html — Application shell
- css/theme.css — Light/dark theme tokens (dark mode via moon toggle, persisted)
- css/app.css — Component styles
- js/modules/registry.js — Frozen Phase 1 module registry (17 modules)
- js/modules/permissions.js — Role-based module/action gates; Super Admin-only test gate
- js/data/store.js — Contact-scoped data store (no real or fabricated customer data)
- js/nav/router.js — Hash router with permission gate on every navigation path
- js/nav/shell.js — Contact dashboard: action bar, client panel, 14 nested tabs
- js/app.js — Bootstrap
- test.html + js/tests/acceptance.js — Acceptance test harness (Super Admin only)

## Running locally

Open index.html in any modern browser. No build step, no dependencies.
Open test.html to run the acceptance suite and see actual pass/fail results.

## Permissions

- Modules and contact actions are permission-gated (js/modules/permissions.js).
- A visible tab is never proof of authorization — every navigation re-checks access.
- Unauthorized hash or URL manipulation renders Access denied, not the workspace.
- The module-test harness is restricted to Super Admin, independently enforced.

## Development status

Modules and nested tabs whose functionality is pending render a clearly labeled
Development pending destination. These are real, accessible routes — never dead tabs.
