const express = require('express');
const path = require('path');
const authMiddleware = require('../midllewares/authMiddleware');
const { pagesDir, adminDir, protectedDir } = require('../config/paths');
const { getLatestBlogs, featuredBlog, getBlog, getRecentArticles, relatedArticle } = require('../services/blogService');
const loanAmountPages = require('../data/loanAmountPages');
const { getPage: getCityPage } = require('../data/loanCityPages');
const { saveLead, downloadExcelReport } = require('../controllers/loanApplicationController');
const sanitizeBlogContent = require('../utils/sanitizeBlogContent');
const router = express.Router();

const page = (file) => path.join(pagesDir, file);
const adminPage = (file) => path.join(adminDir, file);
const protectedPage = (file) => path.join(protectedDir, file);

// Legacy /pages/*.html URLs → clean routes (301 permanent redirect)
const PAGE_SLUG_OVERRIDES = {
    'apply.html': '/apply-now',
    'check_cibil_score.html': '/check-my-credit-score',
    'sitemap-page.html': '/sitemap',
};

router.get('/pages/:file', (req, resp) => {
    const file = req.params.file;
    if (!file.endsWith('.html')) {
        return resp.status(404).sendFile(page('404.html'));
    }
    const target = PAGE_SLUG_OVERRIDES[file] || '/' + file.replace(/\.html$/, '');
    resp.redirect(301, target);
});

router.get('/pages', (req, resp) => {
    resp.redirect(301, '/sitemap');
});

router.get('/', async (req, resp, next) => {
        try {
            const latestBlogs = await getLatestBlogs();
            resp.render('index', {
                latestBlogs
            });
        } catch (err) {
            next(err);
        }
});

// Personal Loan Routes
router.get('/personal-loan',(req,resp) => {
    resp.sendFile(page('personal-loan.html'));
});

router.get('/personal-overdraft',(req,resp) => {
    resp.sendFile(page('personal-overdraft.html'));
});

router.get('/balance-transfer',(req,resp) => {
    resp.sendFile(page('balance-transfer.html'));
});

router.get('/debt-consolidation',(req,resp) => {
    resp.sendFile(page('debt-consolidation.html'));
});

router.get('/insta-loan',(req,resp) => {
    resp.sendFile(page('insta-loan.html'));
});


// Business Loan
router.get('/business-loan',(req,resp) => {
    resp.sendFile(page('business-loan.html'));
});

router.get('/working-capital',(req,resp) => {
    resp.sendFile(page('working-capital.html'));
});

router.get('/unsecured-business-loan',(req,resp) => {
    resp.sendFile(page('unsecured-business-loan.html'));
});

router.get('/business-overdraft',(req,resp) => {
    resp.sendFile(page('business-overdraft.html'));
});


// Professional Loan
router.get('/professional-loan',(req,resp) => {
    resp.sendFile(page('professional-loan.html'));
});

router.get('/loan-for-ca',(req,resp) => {
    resp.sendFile(page('loan-for-ca.html'));
});

router.get('/loan-for-cs',(req,resp) => {
    resp.sendFile(page('loan-for-cs.html'));
});

router.get('/loan-for-doctor',(req,resp) => {
    resp.sendFile(page('loan-for-doctor.html'));
});


// Secured Loan
router.get('/secured-loan',(req,resp) => {
    resp.sendFile(page('secured-loan.html'));
});

router.get('/loan-against-property',(req,resp) => {
    resp.sendFile(page('loan-against-property.html'));
});

router.get('/car-loan',(req,resp) => {
    resp.sendFile(page('car-loan.html'));
});

router.get('/home-loan',(req,resp) => {
    resp.sendFile(page('home-loan.html'));
});

// Cibil sore
router.get('/check-my-credit-score', (req,resp) => {
    resp.sendFile(page('check_cibil_score.html'));
})

// About us
router.get('/about-us', (req,resp) => {
    resp.sendFile(page('about-us.html'))
})

// Become Our partner
router.get('/become-our-partner', (req,resp) => {
    resp.sendFile(page('become-our-partner.html'))
})

router.get('/contact-us',(req,resp) => {
    resp.sendFile(page('contact-us.html'));
})

router.get('/our-team',(req,resp) => {
    resp.sendFile(page('our-team.html'));
})

// Credit Cards
router.get('/credit-card', (req, resp) => {
    resp.sendFile(page('credit-card.html'));
})

router.get('/blogs', async (req, resp, next) => {
    try {
        const fb = await featuredBlog();
        const blogs = await getLatestBlogs(20, 0);
        resp.render('blogs', {
            fb, blogs
        });
    } catch (error) {
        next(error);
    }
});

router.get('/load-more', async (req, resp, next) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const blogs = await getLatestBlogs(20, offset);
        return resp.json({
            blogs
        });
    } catch (err) {
        next(err);
    }
});

router.get('/blog/:slug', async (req, resp, next) => {
    const slug = req.params.slug;

    try {
        const [blog, recentBlogs, relatedBlogs] = await Promise.all([
            getBlog(slug),
            getRecentArticles(),
            relatedArticle(slug)
        ]);

        if (!blog || blog.length === 0) {
            return resp.status(404).sendFile(page('404.html'));
        }

        blog[0].content = sanitizeBlogContent(blog[0].content);

        resp.render('blog-detail', {
            blog,
            recentBlogs,
            relatedBlogs
        });
    } catch (error) {
        next(error);
    }
});

router.get('/apply-now', (req, resp) => {
    resp.sendFile(page('apply.html'));
});

// Loan Amount & City Dynamic Pages
router.get('/loan/:slug', (req, resp) => {
    const slug = req.params.slug;

    // Pehle amount pages check karo
    const amountPage = loanAmountPages[slug];
    if (amountPage) return resp.render('loan-amount', { page: amountPage });

    // Phir city pages check karo
    const cityPage = getCityPage(slug);
    if (cityPage) return resp.render('loan-city', { page: cityPage });

    resp.status(404).sendFile(page('404.html'));
});

router.get('/admin', (req,resp) => {
    const token = req.cookies.token;
    if(token){
        return resp.redirect('/admin/dashboard');
    }
    resp.sendFile(adminPage('index.html'));
})

router.get('/admin/dashboard' , authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('dashboard.html'))
})

router.get('/admin/blogs' , authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('blogs.html'))
})

router.get('/admin/blog-editor' , authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('blog-editor.html'))
})

router.get('/admin/loan-applications', authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('loan-applications.html'))
})

router.get('/admin/contact-messages', authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('contact-messages.html'))
})

router.get('/admin/partner-leads', authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('partner-leads.html'))
})

router.get('/admin/complete-leads', authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('complete-leads.html'))
})

router.get('/admin/raw-leads', authMiddleware, (req, resp) => {
    resp.sendFile(protectedPage('raw-leads.html'))
})

router.post('/apply-now/save-lead', saveLead)
router.get('/admin/logout', (req,resp)=> {
    resp.clearCookie('token');
    resp.redirect('/admin')
})

router.get('/disclaimer', (req,resp) => {
    resp.sendFile(page('disclaimer.html'))
})

router.get('/terms-condition', (req,resp) => {
    resp.sendFile(page('terms-condition.html'))
})

router.get('/privacy-policy', (req,resp) => {
    resp.sendFile(page('privacy-policy.html'))
})

router.get('/grievance-redressal', (req,resp) => {
    resp.sendFile(page('grievance-redressal.html'))
})

router.get('/sitemap', (req,resp) => {
    resp.sendFile(page('sitemap-page.html'))
})

router.get('/download-exel-report', authMiddleware, downloadExcelReport)

module.exports = router;