(function () {

  const adminName = localStorage.getItem('admin-name') || 'Admin';
  document.getElementById('adminAvatar').textContent = adminName.charAt(0).toUpperCase();
  document.getElementById('adminName').textContent   = adminName;

  let table = null;

  // Set today as default date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateFrom').value = today;
  document.getElementById('dateTo').value   = today;

  async function fetchLeads() {
    const from = document.getElementById('dateFrom').value;
    const to   = document.getElementById('dateTo').value;
    if (!from || !to) return;

    const tbody = document.getElementById('completeLeadsTbody');
    tbody.innerHTML = `<tr><td colspan="8" class="tbl-empty">Loading...</td></tr>`;
    if (table) { table.destroy(); table = null; }

    try {
      const resp = await fetch(`${window.location.origin}/api/dashboard/complete-leads?from=${from}&to=${to}`, {
        credentials: 'include'
      });
      const data = await resp.json();

      if (data.success && data.leads?.length) {
        tbody.innerHTML = data.leads.map(l => `
          <tr>
            <td>${l.id}</td>
            <td>${formatText(l.name)}</td>
            <td>${l.phone_number || '-'}</td>
            <td>${formatText(l.city)}</td>
            <td>${formatText(l.product)}</td>
            <td>${formatCurrency(l.net_monthly_salary)}</td>
            <td>${formatCurrency(l.loan_amount)}</td>
            <td>${new Date(l.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
          </tr>
        `).join('');
        table = new DataTable('#completeLeadsTable', { pageLength: 25, ordering: true, info: true });
      } else {
        tbody.innerHTML = `<tr><td colspan="8" class="tbl-empty">No leads found for selected date range.</td></tr>`;
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="tbl-empty">Error loading data.</td></tr>`;
      console.error(err);
    }
  }

  document.getElementById('applyFilter').addEventListener('click', fetchLeads);

  document.getElementById('resetFilter').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFrom').value = today;
    document.getElementById('dateTo').value   = today;
    fetchLeads();
  });

  // Export CSV
  document.getElementById('exportBtn').addEventListener('click', () => {
    if (!table) return;
    const heads = ['ID','Name','Mobile','City','Product','Income','Loan Amount','Date'];
    const rows  = table.rows({ search: 'applied' }).data().toArray();
    const csv   = [heads.join(','), ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const a     = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `complete-leads-${document.getElementById('dateFrom').value}.csv`
    });
    a.click();
  });

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sbOverlay');
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open'); overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open'); overlay?.classList.remove('open');
  });
  document.getElementById('reportsToggle')?.addEventListener('click', () => {
    document.getElementById('reportsToggle').closest('.sb-group').classList.toggle('open');
  });

  // Load today's data on page open
  fetchLeads();

  function formatText(v) {
    if (!v) return '-';
    return v.toString().replace(/-/g,' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  function formatCurrency(v) {
    if (!v || isNaN(v)) return '-';
    return `₹${Number(v).toLocaleString('en-IN')}`;
  }

})();
