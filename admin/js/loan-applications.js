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
      },
      data : function(d){
        d.city = document.getElementById('filterCity').value;
        d.product = document.getElementById('filterProduct').value;
        d.fromDate = document.getElementById('dateFrom').value
        d.toDate = document.getElementById('dateTo').value
      }
    }
  });

  async function loadCities(){
    const resp = await fetch(`${window.location.origin}/api/dashboard/all-cities`, {
      method : 'GET',
      credentials : 'include'
    });
    const data = await resp.json();
    if(data.success){
      document.getElementById('filterCity').innerHTML = 
      '<option value =""> All Cities </option>' + 
      data.cities.map(d => {
        const c = d.city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return `<option value="${d.city}">${c}</option>`
    }).join('');
    }
  }

  loadCities();

document.getElementById('filterCity').addEventListener('change', function(){
  table.draw();
})

async function getProducts(){
  try {
    const resp = await fetch(`${window.location.origin}/api/dashboard/all-products`, {
      method : 'GET',
      credentials : 'include'
    });
    const data = await resp.json();
    if(data.success){
      document.getElementById('filterProduct').innerHTML = 
      '<option value="">All Products</option>' +  
      data.products.map(p => {
        const pd = p.product.replace(/-/g,' ').replace(/\b\w/g, w => w.toUpperCase());
        return `<option value="${p.product}">${pd}</option>`
      }).join('');
      
    }
  } catch (error) {
    console.log(error);
  }
}

getProducts();

document.getElementById('filterProduct').addEventListener('change', function(){
  table.draw();
})
document.getElementById('dateFrom').addEventListener('change', function(){
  table.draw();
})

document.getElementById('dateTo').addEventListener('change', function(){
  table.draw();
})

document.getElementById('resetFilters')
  .addEventListener('click', function () {

    document.getElementById('filterCity').value = '';
    document.getElementById('filterProduct').value = '';
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';

    table.search('').draw();
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


  // ── Active sidebar link ──
  const path = window.location.pathname;
  document.querySelectorAll('.sb-link, .sb-sublink').forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
      const group = link.closest('.sb-group');
      if (group) group.classList.add('open');
    }
  });

  // ── Reports toggle ──
  document.getElementById('reportsToggle')?.addEventListener('click', () => {
    document.getElementById('reportsToggle').closest('.sb-group').classList.toggle('open');
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


})();
