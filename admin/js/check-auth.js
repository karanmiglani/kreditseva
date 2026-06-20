(function(){

    async function checkAuth(){
        try{
            const resp = await fetch(`${window.location.origin}/api/auth/check-auth`, {
                credentials : 'include'
            });
            const data = await resp.json();
            if(!data.success){ console.log(data); }
            localStorage.setItem('admin-name', data.admin.name);
            localStorage.setItem('admin-role', data.admin.role);
            document.getElementById('adminName').textContent = data.admin.name;
            document.getElementById('adminRole').textContent = data.admin.role;
        }catch(err){
            console.log('Message from console : ', err);
        }
    }
    checkAuth();

    // ── Sidebar toggle (hamburger) ──
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
        document.getElementById('sbOverlay')?.classList.toggle('active');
    });
    document.getElementById('sbOverlay')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sbOverlay')?.classList.remove('active');
    });

    // ── Reports dropdown toggle ──
    document.getElementById('reportsToggle')?.addEventListener('click', () => {
        document.getElementById('reportsToggle').closest('.sb-group').classList.toggle('open');
    });

    // ── Mark active sidebar link ──
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sb-link, .sb-sublink').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('sb-active');
            const group = link.closest('.sb-group');
            if (group) group.classList.add('open');
        }
    });

})();