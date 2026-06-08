(function () {


  /* ── Set current date ── */
  const dateEl = document.getElementById('welcomeDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /* ── Admin Info ── */
  const name = localStorage.getItem('admin-name') || 'Admin';

  document.getElementById('adminAvatar').textContent =
    name.charAt(0).toUpperCase();

  document.getElementById('welcomeName').textContent = name;
let table;

  /* ── Dummy Stats ── */
  // Get Stats
  async function getStats() {
    try {
      const resp = await fetch(`${window.location.origin}/api/dashboard/get-stats`, {
        method: 'GET',
        credentials: 'include'
      })
      const data = await resp.json();
      if (data.success) {
        document.getElementById('statTotalApplications').textContent = data.totalApplication;
        document.getElementById('statTotalBlogs').textContent = data.totalBlogs;
        document.getElementById('statPending').textContent = data.draft;
        document.getElementById('statApproved').textContent = data.published;
        const tbody = document.getElementById('recentTableBody');

        if (data.leads?.length) {
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
      <td>
        ${new Date(lead.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
      </td>
    </tr>
  `).join('');
  if(!table){
    table = new  DataTable('#leadTable', {
    pageLength : 25,
    ordering : true,
    searching : true,
    info : true,
  })
const cities = [...new Set(data.leads.map(x => x.city).filter(Boolean))];
const products = [...new Set(data.leads.map(x => x.product).filter(Boolean))];

document.getElementById('filterCity').innerHTML = '<option value="">All cities</option>' + cities.map(city => `<option value="${city}">${city.charAt(0).toUpperCase() + city.slice(1)}</option>`).join('');
document.getElementById('filterProduct').innerHTML =
  '<option value="">All Products</option>' +
  products.map(p => {
    const label = p
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return `<option value="${label}">${label}</option>`;
  }).join('');

}
        } else {
          tbody.innerHTML = `
    <tr>
      <td colspan="10" class="tbl-empty">
        No applications found
      </td>
    </tr>
  `;
        }

      }
    } catch (error) {
      console.error(error);
    }
  }

  getStats();

// City Filter 
document.getElementById('filterCity').addEventListener('change', function(){
  table.column(3).search(this.value).draw();
})

document.getElementById('filterProduct').addEventListener('change', function(){
  table.column(5).search(this.value).draw();
})

  // Helpers
  function formatText(value) {
    if (!value) return '-';

    return value
      .toString()
      .replace(/-/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function formatCurrency(value) {
    if (!value || isNaN(value)) return '-';

    return `₹${Number(value).toLocaleString('en-IN')}`;
  }



  /* ── Logout ── */
  document.getElementById('logoutBtn')?.addEventListener('click', function () {
    localStorage.removeItem('ks_admin_token');
    window.location.href = 'index.html';
  });

  /* ── Sidebar Toggle ── */
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sbOverlay');
  const toggleBtn = document.getElementById('sidebarToggle');

  toggleBtn?.addEventListener('click', function () {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });

  overlay?.addEventListener('click', function () {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  });

})();