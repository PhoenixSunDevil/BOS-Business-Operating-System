/* ============================================================
   Aetherion BOS — Login controller (index.html)
   Gates access: only the Super Admin can sign in from this page.
   All other users sign in through app.html. If a non-superadmin
   tries this page, they are told to use app.html instead.
   ============================================================ */

function bosDoLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  bosEnsureSeedUsers();
  const user = bosLogin(u, p);
  if (!user) {
    err.hidden = false;
    return false;
  }
  err.hidden = true;
  window.location.href = 'app.html';
  return false;
}

(function () {
  // Theme persistence applies on the login page too.
  const saved = localStorage.getItem('bos-theme');
  document.body.className = 'theme-' + (saved === 'dark' ? 'dark' : 'light');
  bosEnsureSeedUsers();
  // If already signed in as superadmin, skip straight to app.
  if (bosRestoreSession()) window.location.href = 'app.html';
})();
