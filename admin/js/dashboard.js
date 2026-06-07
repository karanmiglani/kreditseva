(function () {

  /* ── Auth guard ── */
  // const token = localStorage.getItem('ks_admin_token');
  // if (!token) {
  //   window.location.href = 'index.html';
  //   return;
  // }

  

  /* ── Set current date ── */
  const dateEl = document.getElementById('welcomeDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  /* ── Decode JWT and show admin info ── */
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    const name  = payload.name  || payload.email?.split('@')[0] || 'Admin';
    const role  = payload.role  || 'Admin';
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('adminName').textContent    = name;
    document.getElementById('adminRole').textContent    = role;
    document.getElementById('adminAvatar').textContent  = initial;
    document.getElementById('welcomeName').textContent  = name;
  } catch (e) {
    /* token malformed — ignore, guard already checked existence */
  }

  /* ── Load stats from API ── */
  async function loadStats() {
    try {
      const res  = await fetch('https://kreditseva.onrender.com/api/admin/stats', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();

      if (data.success) {
        document.getElementById('statTotal').textContent    = data.total    ?? 0;
        document.getElementById('statPending').textContent  = data.pending  ?? 0;
        document.getElementById('statApproved').textContent = data.approved ?? 0;
        document.getElementById('statRejected').textContent = data.rejected ?? 0;
      }
    } catch (err) {
      /* API not ready — show dashes */
    }
  }

  /* ── Load recent applications ── */
  async function loadRecent() {
    const tbody = document.getElementById('recentTableBody');

    try {
      const res  = await fetch('https://kreditseva.onrender.com/api/admin/applications?limit=8', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();

      if (data.success && data.applications?.length) {
        tbody.innerHTML = data.applications.map(app => `
          <tr>
            <td>#${app.id}</td>
            <td>${app.name}</td>
            <td>${app.loan_type}</td>
            <td>₹${Number(app.amount).toLocaleString('en-IN')}</td>
            <td>${new Date(app.created_at).toLocaleDateString('en-IN')}</td>
            <td>${badgeHtml(app.status)}</td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">No applications found.</td></tr>';
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Could not load data. Connect API.</td></tr>';
    }
  }

  function badgeHtml(status) {
    const map = {
      pending:  ['badge--pending',  'fa-clock',        'Pending'],
      approved: ['badge--approved', 'fa-circle-check', 'Approved'],
      rejected: ['badge--rejected', 'fa-circle-xmark', 'Rejected'],
    };
    const [cls, icon, label] = map[status] || map.pending;
    return `<span class="badge ${cls}"><i class="fa-solid ${icon}"></i>${label}</span>`;
  }

  loadStats();
  loadRecent();

  /* ── Logout ── */
  document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem('ks_admin_token');
    window.location.href = 'index.html';
  });

  /* ── Sidebar toggle (mobile) ── */
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sbOverlay');
  const toggleBtn = document.getElementById('sidebarToggle');

  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', function () {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

})();
