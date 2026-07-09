const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { requireRole } = authMiddleware;
const { createBlog , getAllBlogs, getBlog, updateBlog, deleteBlog, insertDummyBlogs } = require('../controllers/blogController');
const upload = require('../midllewares/uploadblogImage');
const router = express.Router();

const canManageBlogs = [authMiddleware, requireRole('admin', 'editor')];

router.post('/add-blog', ...canManageBlogs, upload.single('image'), createBlog)
router.get('/get-blogs', ...canManageBlogs, getAllBlogs);
router.get('/get-blog/:id', ...canManageBlogs, getBlog)
router.put('/update-blog/:id', ...canManageBlogs, upload.single('image'), updateBlog)
router.delete('/delete-blog/:id', ...canManageBlogs, deleteBlog)

if (process.env.NODE_ENV !== 'production') {
    router.post('/dummy-blogs', ...canManageBlogs, insertDummyBlogs);
}

module.exports = router;