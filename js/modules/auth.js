/* ============================================================
   Aetherion BOS — Authentication & session
   Users live in BOS_STORE.users (persisted to Google Apps Script).
   Passwords are stored hashed. NO default password exists and
   NO account is ever auto-created. Existing user records —
   including any password already set — are never modified
   by this code.
   ============================================================ */

const BOS_AUTH = { session: null };

/* Deterministic hash (demo-grade; keeps plaintext out of the store) */
function bosHashPassword(pw) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) {
    h = ((h << 5) + h + pw.charCodeAt(i)) >>> 0;
  }
  return 'b' + h.toString(16);
}

function bosIsLoggedIn() {
  return !!(BOS_AUTH.session && BOS_AUTH.session.active !== false);
}

function bosCurrentUser() {
  if (window.__BOS_SESSION__) return window.__BOS_SESSION__;
  if (bosIsLoggedIn()) return BOS_AUTH.session;
  return { role: 'anonymous', name: 'Not signed in', granted: [] };
}

function bosLogin(username, password) {
  const user = (BOS_STORE.users || []).find(u => u.username === username && u.active !== false);
  if (!user || user.passHash !== bosHashPassword(password)) return null;
  BOS_AUTH.session = user;
  localStorage.setItem('bos-session-user', user.username);
  return user;
}

function bosLogout() {
  BOS_AUTH.session = null;
  localStorage.removeItem('bos-session-user');
  location.hash = '#/dashboard';
  if (typeof window.bosBuildNav === 'function') window.bosBuildNav();
  bosRender();
}

function bosRestoreSession() {
  const name = localStorage.getItem('bos-session-user');
  if (!name) return false;
  const user = (BOS_STORE.users || []).find(u => u.username === name && u.active !== false);
  if (!user) return false;
  BOS_AUTH.session = user;
  return true;
}

/* Ensure the users list exists — WITHOUT creating any account
   and WITHOUT touching any existing user or password. */
function bosEnsureSeedUsers() {
  if (!Array.isArray(BOS_STORE.users)) BOS_STORE.users = [];
}
