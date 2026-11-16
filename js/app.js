/* ============================================================
   Aetherion BOS — Application bootstrap (app.html)
   Builds the main nav from the frozen registry — but ONLY the
   modules the logged-in user can access (per-user grants).
   Los Cabos Tours shows only for users the owner granted it to.
   ============================================================ */

window.bosBuildNav = function () {
  var nav = document.getElementById('main-nav');
  nav.innerHTML = '';
  var user = bosCurrentUser();
  var visible = user.role === 'superadmin' ? BOS_MODULES : BOS_MODULES.filter(function (m) {
    return bosUserModules(user).indexOf(m.id) !== -1;
  });
  visible.forEach(function (m) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-tab';
    btn.dataset.module = m.id;
    btn.textContent = m.label;
    btn.addEventListener('click', function () {
      if (!bosCanAccessModule(m.id)) return; // visible ≠ authorized
      bosNavigate(m.id);
    });
    nav.appendChild(btn);
  });
};

(function () {
  // ---- Auth gate: must be signed in ----
  bosEnsureSeedUsers();
  if (!bosRestoreSession()) {
    window.location.href = 'index.html';
    return;
  }

  // ---- Theme (light default, persisted dark mode) ----
  var saved = localStorage.getItem('bos-theme');
  document.body.className = 'theme-' + (saved === 'dark' ? 'dark' : 'light');

  var toggle = document.getElementById('theme-toggle');
  toggle.textContent = saved === 'dark' ? '☀️' : '🌙';
  toggle.addEventListener('click', function () {
    var dark = !document.body.classList.contains('theme-dark');
    document.body.className = dark ? 'theme-dark' : 'theme-light';
    localStorage.setItem('bos-theme', dark ? 'dark' : 'light');
    toggle.textContent = dark ? '☀️' : '🌙';
  });

  // ---- User badge ----
  var user = bosCurrentUser();
  document.getElementById('user-badge').textContent =
    (user.displayName || user.name) + ' · ' + (BOS_ROLES[user.role] ? BOS_ROLES[user.role].label : user.role);

  // ---- Nav from user's granted modules ----
  window.bosBuildNav();

  // ---- Initial route ----
  if (!location.hash) location.hash = '#/dashboard';
  bosRender();

  // ---- Storage: load persisted store from Google Apps Script ----
  if (typeof bosLoadFromServer === 'function') bosLoadFromServer();
})();
