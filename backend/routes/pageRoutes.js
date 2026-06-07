const express = require('express');
const path = require('path');
const authMiddleware = require('../midllewares/authMiddleware');
const { getLatestBlogs, featuredBlog, getBlog, getRecentArticles, relatedArticle } = require('../services/blogService');
const loanAmountPages = require('../data/loanAmountPages');
const { getPage: getCityPage } = require('../data/loanCityPages');
const { route } = require('./pageRoutes');
const router = express.Router();


router.get('/',async (req,resp) => {
        try{
            const latestBlogs = await getLatestBlogs();
            resp.render('index', {
                latestBlogs
            });
        }catch(err){
            console.log(err);
            resp.send('Server error');
        }
});

// Personal Loan Routes
router.get('/personal-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/personal-loan.html'));
});

router.get('/personal-overdraft',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/personal-overdraft.html'));
});

router.get('/balance-transfer',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/balance-transfer.html'));
});

router.get('/debt-consolidation',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/debt-consolidation.html'));
});

router.get('/insta-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/insta-loan.html'));
});


// Business Loan
router.get('/business-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/business-loan.html'));
});

router.get('/working-capital',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/working-capital.html'));
});

router.get('/unsecured-business-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/unsecured-business-loan.html'));
});

router.get('/business-overdraft',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/business-overdraft.html'));
});


// Professional Loan
router.get('/professional-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/professional-loan.html'));
});

router.get('/loan-for-ca',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/loan-for-ca.html'));
});

router.get('/loan-for-cs',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/loan-for-cs.html'));
});

router.get('/loan-for-doctor',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/loan-for-doctor.html'));
});


// Secured Loan
router.get('/secured-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/secured-loan.html'));
});

router.get('/loan-against-property',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/loan-against-property.html'));
});

router.get('/car-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/car-loan.html'));
});

router.get('/home-loan',(req,resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/home-loan.html'));
});

// Cibil sore
router.get('/check-my-credit-score', (req,resp) => {
    resp.sendFile(path.join(__dirname,"../../pages/check_cibil_score.html"));
})

// About us
router.get('/about-us', (req,resp) => {
    resp.sendFile(path.join(__dirname, "../../pages/about-us.html"))
})

// Become Our partner
router.get('/become-our-partner', (req,resp) => {
    resp.sendFile(path.join(__dirname, "../../pages/become-our-partner.html"))
})

router.get('/blogs', async (req, resp) => {
    try {
        const fb = await featuredBlog();
        const blogs = await getLatestBlogs(20,0);
        console.log(fb);
        resp.render('blogs',{
            fb, blogs
        })
    } catch (error) {
        console.log(error);
        resp.send('Server error.');
    }
})

router.get('/load-more', async(req, resp) => {
    console.log('route hit');
    try{
        const offset = parseInt(req.query.offset) || 0;
        const blogs = await getLatestBlogs(20, offset);
        return resp.json({
            blogs
        })
    }catch(err){
        console.log(err);
    }
})

router.get('/blog/:slug', async (req, resp) => {

    console.time('TOTAL');

    const slug = req.params.slug;

    try {

        console.time('blog');

        const [blog, recentBlogs, relatedBlogs] = await Promise.all([
            getBlog(slug),
            getRecentArticles(),
            relatedArticle(slug)
        ]);

        console.timeEnd('blog');

        console.time('render');

        resp.render('blog-detail', {
            blog,
            recentBlogs,
            relatedBlogs
        });

        console.timeEnd('render');

    } catch (error) {
        console.log(error);
    }

    console.timeEnd('TOTAL');

});

router.get('/apply-now', (req, resp) => {
    resp.sendFile(path.join(__dirname,'../../pages/apply.html'));
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

    resp.status(404).send('Page not found');
});

router.get('/admin', (req,resp) => {
    resp.sendFile(path.join(__dirname,"../../admin/index.html"));
})

router.get('/admin/dashboard' , authMiddleware, (req, resp) => {
    resp.sendFile(path.join(__dirname, '../../protected/dashboard.html'))
})

router.get('/admin/blogs' , authMiddleware, (req, resp) => {
    resp.sendFile(path.join(__dirname, '../../protected/blogs.html'))
})

router.get('/admin/blog-editor' , authMiddleware, (req, resp) => {
    resp.sendFile(path.join(__dirname, '../../protected/blog-editor.html'))
})

module.exports = router;