/* ============================================================
   Aetherion BOS — Router
   Hash-based routing. EVERY navigation request — click, hash
   change, or manual URL edit — passes through bosRoute(), which
   re-checks permissions. Unauthenticated visitors are redirected
   to the login page. Unauthorized destinations render
   "Access denied", never the restricted workspace.
   ============================================================ */

function bosRoute() {
  const raw = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const parts = raw.split('/');
  const view = { module: parts[0] || 'dashboard' };
  if (parts[1]) view.contactId = parts[1];
  if (parts[2]) view.tab = parts[2];
  return view;
}

function bosNavigate(module, contactId, tab) {
  let hash = '#/' + module;
  if (contactId) hash += '/' + encodeURIComponent(contactId);
  if (tab) hash += '/' + tab;
  location.hash = hash;
}

window.addEventListener('hashchange', bosRender);

function bosRender() {
  // ---- auth gate: not signed in → login page ----
  if (!bosIsLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const v = bosRoute();
  const host = document.getElementById('module-host');
  const crumb = document.getElementById('breadcrumb');

  // ---- permission gate ----
  if (!bosCanAccessModule(v.module)) {
    host.innerHTML =
      '<div class="access-denied"><h2>Access denied</h2>' +
      '<p>Your account does not have access to the requested workspace (' + v.module + ').</p></div>';
    bosSetActiveNav(v.module);
    return;
  }

  bosSetActiveNav(v.module);
  crumb.innerHTML = bosBreadcrumb(v);

  if (v.module === 'contacts') {
    if (v.contactId) {
      const contact = bosGetContact(decodeURIComponent(v.contactId));
      if (!contact) { bosRenderAccessDeniedContact(); return; }
      bosRenderContactDashboard(contact, v.tab || 'history');
    } else {
      bosRenderContactDirectory();
    }
  } else {
    bosRenderModulePlaceholder(v.module);
  }
}

function bosSetActiveNav(module) {
  document.querySelectorAll('#main-nav .nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.module === module);
  });
}

function bosBreadcrumb(v) {
  let html = '<a href="#" onclick="bosNavigate(\'dashboard\');return false;">AETHERION BOS</a><span class="sep">›</span>';
  const mod = BOS_MODULES.find(m => m.id === v.module);
  const label = mod ? mod.label : v.module;
  if (v.module === 'contacts' && v.contactId) {
    html += '<a href="#/contacts">Contacts</a><span class="sep">›</span>';
    const c = bosGetContact(decodeURIComponent(v.contactId));
    html += '<span>' + (c ? c.name : v.contactId) + '</span><span class="sep">›</span><span>Client Dashboard</span>';
  } else {
    html += '<span>' + label + '</span>';
  }
  return html;
}

function bosRenderAccessDeniedContact() {
  document.getElementById('module-host').innerHTML =
    '<div class="access-denied"><h2>Contact not found</h2><p>The requested contact record does not exist.</p></div>';
}
