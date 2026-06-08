(function () {

  // ── Admin info ──
  const adminName = localStorage.getItem('admin-name') || 'Admin';
  document.getElementById('adminAvatar').textContent = adminName.charAt(0).toUpperCase();
  document.getElementById('adminName').textContent   = adminName;

  // ── DataTable instance ──
  let table = null;

  table = new DataTable('#applicationsTable', {
    pageLength: 25,
    ordering:   true,
    searching:  false, // custom search below
    info:       true,
    language: {
      emptyTable: 'No applications found.',
      zeroRecords: 'No matching applications found.',
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

  // ── Export CSV ──
  document.getElementById('exportBtn').addEventListener('click', () => {
    const rows  = table.rows({ search: 'applied' }).data().toArray();
    const heads = ['ID','Name','Mobile','City','Product','Occupation','Monthly Salary','PAN Card','Outstanding','Status','Date'];
    const csv   = [heads.join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob  = new Blob([csv], { type: 'text/csv' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `leads_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
