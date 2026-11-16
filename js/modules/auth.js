/* ============================================================
   Aetherion BOS — Authentication & session
   Users live in BOS_STORE.users (persisted to Google Apps Script
   with the rest of the store). Passwords are stored hashed.
   NOTE: front-end auth + GAS PropertiesService is suitable for
   team access control, NOT high-security production use. See
   README for the server-side auth upgrade path.
   ============================================================ */

const BOS_AUTH = {
  session: null
};

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

/* The current user is the logged-in session user, unless a test
   override is present (test harness sets window.__BOS_SESSION__). */
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

/* Restore a previous session on page load (survives refresh). */
function bosRestoreSession() {
  const name = localStorage.getItem('bos-session-user');
  if (!name) return false;
  const user = (BOS_STORE.users || []).find(u => u.username === name && u.active !== false);
  if (!user) return false;
  BOS_AUTH.session = user;
  return true;
}

/* First-run seed: the owner's account. CHANGE THIS PASSWORD from
   Admin → Password after first login. */
function bosEnsureSeedUsers() {
  if (!Array.isArray(BOS_STORE.users)) BOS_STORE.users = [];
  if (BOS_STORE.users.length === 0) {
    BOS_STORE.users.push({
      username: 'admin',
      displayName: 'Owner (Super Admin)',
      role: 'superadmin',
      passHash: bosHashPassword('admin1234'),
      granted: [],
      active: true,
      created: bosNow()
    });
  }
}
