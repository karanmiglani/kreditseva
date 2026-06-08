(function () {

  // ── Current date ──
  const dateEl = document.getElementById('welcomeDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  // ── Admin info from localStorage ──
  const adminName = localStorage.getItem('admin-name') || 'Admin';
  document.getElementById('adminAvatar').textContent = adminName.charAt(0).toUpperCase();
  document.getElementById('welcomeName').textContent = adminName;

  // ── DataTable instance ──
  let table = null;

  // ── Fetch stats + leads ──
  async function getStats() {
    try {
      const resp = await fetch(`${window.location.origin}/api/dashboard/get-stats`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await resp.json();
      if (!data.success) return;

      // Stats cards
      document.getElementById('statTotalApplications').textContent = data.totalApplication;
      document.getElementById('statTotalBlogs').textContent        = data.totalBlogs;
      document.getElementById('statPending').textContent           = data.draft;
      document.getElementById('statApproved').textContent          = data.published;

      const tbody = document.getElementById('recentTableBody');

      if (data.leads?.length) {
        // Populate table rows
        tbody.innerHTML = data.leads.map(lead => `
          <tr>
            <td>${lead.id}</td>
            <td>${formatText(lead.name)}</td>
            <td>${lead.phone_number || '-'}</td>
            <td>${formatText(lead.city)}</td>
            <td>${formatCurrency(lead.net_monthly_salary)}</td>
            <td>${formatText(lead.product)}</td>
            <td>${formatText(lead.occupation)}</td>
            <td>${lead.pancard?.toUpperCase() || '-'}</td>
            <td>${formatCurrency(lead.total_outstanding_amount)}</td>
            <td>${new Date(lead.created_at).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}</td>
          </tr>
        `).join('');

        // Init DataTable once
        if (!table) {
          table = new DataTable('#leadTable', {
            pageLength: 25,
            ordering:   true,
            searching:  true,
            info:       true,
            scrollX: true
          });
        }

        // Populate filter dropdowns from data
        const cities   = [...new Set(data.leads.map(x => x.city).filter(Boolean))];
        const products = [...new Set(data.leads.map(x => x.product).filter(Boolean))];

        document.getElementById('filterCity').innerHTML =
          '<option value="">All Cities</option>' +
          cities.map(c => `<option value="${c}">${formatText(c)}</option>`).join('');

        document.getElementById('filterProduct').innerHTML =
          '<option value="">All Products</option>' +
          products.map(p => `<option value="${formatText(p)}">${formatText(p)}</option>`).join('');

      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="tbl-empty">No applications found</td>
          </tr>`;
      }

    } catch (err) {
      console.error('getStats error:', err);
    }
  }

  getStats();

  // ── Filter listeners ──
  document.getElementById('filterCity').addEventListener('change', function () {
    if (table) table.column(3).search(this.value).draw();
  });

  document.getElementById('filterProduct').addEventListener('change', function () {
    if (table) table.column(5).search(this.value).draw();
  });

  // ── Logout ──
  document.getElementById('logoutBtn')?.addEventListener('click', function () {
    localStorage.removeItem('ks_admin_token');
    window.location.href = 'index.html';
  });

  // ── Sidebar toggle ──
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sbOverlay');
  const toggleBtn = document.getElementById('sidebarToggle');

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  });

  // ── Helpers ──
  function formatText(value) {
    if (!value) return '-';
    return value.toString().replace(/-/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatCurrency(value) {
    if (!value || isNaN(value)) return '-';
    return `₹${Number(value).toLocaleString('en-IN')}`;
  }

})();
