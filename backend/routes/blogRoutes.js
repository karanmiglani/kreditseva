const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { createBlog , getAllBlogs, getBlog, updateBlog, deleteBlog, insertDummyBlogs } = require('../controllers/blogController');
const upload = require('../midllewares/uploadblogImage');
const router = express.Router();


router.post('/add-blog',authMiddleware,upload.single('image'), createBlog)
router.get('/get-blogs',authMiddleware, getAllBlogs);
router.get('/get-blog/:id', authMiddleware,getBlog)
router.put('/update-blog/:id', authMiddleware, upload.single('image'), updateBlog)
router.delete('/delete-blog/:id', authMiddleware, deleteBlog)

if (process.env.NODE_ENV !== 'production') {
    router.post('/dummy-blogs', authMiddleware, insertDummyBlogs);
}

module.exports = router;