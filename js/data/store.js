/* ============================================================
   Aetherion BOS — Data store (contact-scoped, session-local)
   IMPORTANT: This store intentionally contains NO real customer
   data. Contacts below are structural placeholders so the
   navigation architecture can be exercised. Financial tabs are
   intentionally empty — they must never be populated with
   fabricated real customer information.
   ============================================================ */

const BOS_STORE = {
  contacts: [
    { id: 'CT-1001', name: 'Sample Contact A', type: 'Student Loan',  email: 'contact.a@example.invalid', phone: '(555) 010-0101', enrolled: '2025-03-15', customerId: 'CUST-100234' },
    { id: 'CT-1002', name: 'Sample Contact B', type: 'Debt Settlement', email: 'contact.b@example.invalid', phone: '(555) 010-0102', enrolled: '2025-06-02', customerId: 'CUST-100235' }
  ],
  /* All nested-tab content is stored per contact ID.
     Switching contacts re-reads from this map, so no tab can ever
     render another contact's information. */
  tabsByContact: {
    'CT-1001': {
      history:   [{ ts: '2026-01-10 09:14', actor: 'agent.smith', entry: 'Contact record created' }],
      calls:     [],
      emails:    [],
      notes:     [{ ts: '2026-01-12 11:02', author: 'agent.smith', note: 'Structural sample note.' }],
      emarketing:[],
      sms:       [],
      docs:      [],
      events:    [],
      tasks:     [{ due: '2026-01-20', title: 'Follow-up call', status: 'Open' }],
      creditcard:[],
      bankaccount:[],
      debts:     [],
      lenders:   [],
      loans:     []
    },
    'CT-1002': {
      history:   [{ ts: '2026-02-01 15:40', actor: 'agent.jones', entry: 'Contact record created' }],
      calls:     [], emails: [], notes: [], emarketing: [], sms: [], docs: [],
      events:    [], tasks: [], creditcard: [], bankaccount: [], debts: [], lenders: [], loans: []
    }
  },
  favorites: []
};

/* Read helpers always scope by contactId. */
function bosGetContact(contactId) {
  return BOS_STORE.contacts.find(c => c.id === contactId) || null;
}
function bosGetTabData(contactId, tabId) {
  const byContact = BOS_STORE.tabsByContact[contactId];
  if (!byContact) return null; // unknown contact → no data rendered
  return byContact[tabId] !== undefined ? byContact[tabId] : null;
}
