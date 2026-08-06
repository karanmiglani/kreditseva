(function(){

    const BLOG_ONLY_PATHS = ['/admin/blogs', '/admin/blog-editor'];
    const ADMIN_ONLY_SELECTORS = [
        'a[href="/admin/dashboard"]',
        'a[href="/admin/loan-applications"]',
        'a[href="/admin/contact-messages"]',
        'a[href="/admin/partner-leads"]',
        '.sb-group'
    ];

    function normalizeRole(role) {
        const r = String(role || '').toLowerCase().trim();
        if (r === 'super admin' || r === 'superadmin' || r === 'super_admin') return 'admin';
        return r;
    }

    function roleLabel(role) {
        const r = normalizeRole(role);
        if (r === 'editor') return 'Blog Editor';
        if (r === 'admin') return 'Admin';
        return role || 'Admin';
    }

    function applyRoleUI(role) {
        const r = normalizeRole(role);
        if (r !== 'editor') return;

        ADMIN_ONLY_SELECTORS.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
                el.style.display = 'none';
            });
        });

        const path = window.location.pathname;
        if (!BLOG_ONLY_PATHS.includes(path)) {
            window.location.replace('/admin/blogs');
        }
    }

    async function checkAuth(){
        try{
            const resp = await fetch(`${window.location.origin}/api/auth/check-auth`, {
                credentials : 'include'
            });
            const data = await resp.json();
            if(!data.success || !data.admin){
                window.location.href = '/admin';
                return;
            }
            localStorage.setItem('admin-name', data.admin.name);
            localStorage.setItem('admin-role', data.admin.role);
            const nameEl = document.getElementById('adminName');
            const roleEl = document.getElementById('adminRole');
            if (nameEl) nameEl.textContent = data.admin.name;
            if (roleEl) roleEl.textContent = roleLabel(data.admin.role);
            const avatar = document.getElementById('adminAvatar');
            if (avatar && data.admin.name) {
                avatar.textContent = data.admin.name.charAt(0).toUpperCase();
            }
            const welcome = document.getElementById('welcomeName');
            if (welcome) welcome.textContent = data.admin.name;
            applyRoleUI(data.admin.role);
        }catch(err){
            console.log('Message from console : ', err);
            window.location.href = '/admin';
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
