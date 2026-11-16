/* ============================================================
   Aetherion BOS — Application bootstrap
   Builds the main nav from the frozen registry, wires the theme
   toggle (dark mode persisted in localStorage), and performs the
   initial render. Nothing here bypasses the permission gate.
   ============================================================ */

(function () {
  // ---- Theme (light default, persisted dark mode) ----
  var saved = localStorage.getItem('bos-theme');
  if (saved === 'dark') document.body.classList.add('theme-dark');
  document.body.className = 'theme-' + (saved === 'dark' ? 'dark' : 'light');

  var toggle = document.getElementById('theme-toggle');
  toggle.addEventListener('click', function () {
    var dark = !document.body.classList.contains('theme-dark');
    document.body.className = dark ? 'theme-dark' : 'theme-light';
    localStorage.setItem('bos-theme', dark ? 'dark' : 'light');
    toggle.textContent = dark ? '☀️' : '🌙';
  });

  // ---- Main nav from registry (permission-aware) ----
  var nav = document.getElementById('main-nav');
  nav.innerHTML = '';
  BOS_MODULES.forEach(function (m) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-tab';
    btn.dataset.module = m.id;
    btn.textContent = m.label;
    var allowed = bosCanAccessModule(m.id);
    btn.disabled = !allowed;
    if (!allowed) btn.classList.add('disabled');
    btn.title = allowed ? m.label : m.label + ' (no access)';
    btn.addEventListener('click', function () {
      if (!bosCanAccessModule(m.id)) return; // visible ≠ authorized
      bosNavigate(m.id);
    });
    nav.appendChild(btn);
  });

  // ---- User badge ----
  var user = bosCurrentUser();
  document.getElementById('user-badge').textContent = user.name + ' · ' + (BOS_ROLES[user.role] ? BOS_ROLES[user.role].label : user.role);

  // ---- Initial route (hash or module entry point) ----
  if (!location.hash) location.hash = '#/dashboard';
  bosRender();
})();
