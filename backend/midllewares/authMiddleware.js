const jwt = require('jsonwebtoken');

function wantsHtml(req) {
    const accept = req.headers.accept || '';
    return accept.includes('text/html');
}

function authMiddleware(req, resp, next) {
    try {
        const token = req.cookies?.token;
        if (!token) {
            if (wantsHtml(req) && req.path.startsWith('/admin')) {
                return resp.redirect('/admin');
            }
            return resp.status(401).json({
                success: false,
                message: 'User Unauthorized!'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.admin = decoded;
        next();
    } catch (err) {
        console.log(err);
        if (wantsHtml(req) && req.path.startsWith('/admin')) {
            resp.clearCookie('token');
            return resp.redirect('/admin');
        }
        return resp.status(401).json({
            success: false,
            message: 'Invalid token!'
        });
    }
}

/**
 * Restrict route to one or more roles.
 * Usage: requireRole('admin') or requireRole('admin', 'editor')
 * Aliases: "super admin", "superadmin" → admin
 */
function normalizeRole(role) {
    const r = String(role || '').toLowerCase().trim();
    if (r === 'super admin' || r === 'superadmin' || r === 'super_admin') return 'admin';
    return r;
}

function requireRole(...allowedRoles) {
    const allowed = allowedRoles.map((r) => normalizeRole(r));
    return (req, resp, next) => {
        const role = normalizeRole(req.admin?.role);
        if (!role || !allowed.includes(role)) {
            if (wantsHtml(req) && req.originalUrl.startsWith('/admin')) {
                // Blog editors land on blogs; others go to login
                if (role === 'editor') {
                    return resp.redirect('/admin/blogs');
                }
                return resp.redirect('/admin');
            }
            return resp.status(403).json({
                success: false,
                message: 'Forbidden — insufficient permissions'
            });
        }
        next();
    };
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
