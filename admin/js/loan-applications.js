(function () {

  // ── Admin info ──
  const adminName = localStorage.getItem('admin-name') || 'Admin';
  document.getElementById('adminAvatar').textContent = adminName.charAt(0).toUpperCase();
  document.getElementById('adminName').textContent   = adminName;
  const BASE_URL = window.location.origin;

  // ── DataTable instance ──
  let table = null;
  let currentPage = 1;




  table = new DataTable('#applicationsTable', {
    processing : true,
    serverSide : true,
    pageLength: 25,
    ordering:   true,
    searching:  true, // custom search below
    info:       true,
    language: {
      emptyTable: 'No applications found.',
      zeroRecords: 'No matching applications found.',
    },
    ajax : {
      url : `${BASE_URL}/api/dashboard/all-leads`,
      type : 'GET',
      xhrFields : {
        withCredentials : true
      }
    }
  });

  

  // ── Reset filters ──
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchInput').value  = '';
    document.getElementById('filterCity').value   = '';
    document.getElementById('filterProduct').value = '';
    document.getElementById('filterStatus').value  = '';
    document.getElementById('dateFrom').value      = '';
    document.getElementById('dateTo').value        = '';
    if (table) table.search('').columns().search('').draw();
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

  // ── Logout ──
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('ks_admin_token');
    window.location.href = 'index.html';
  });

})();
