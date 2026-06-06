-- Run this once to fix slow blog-detail page queries

-- 1. Unique index on slug — used by getBlog() WHERE slug = ?
ALTER TABLE blogs ADD UNIQUE INDEX idx_slug (slug);

-- 2. Composite index for published blog listings — used by getRecentArticles(), relatedArticle(), getLatestBlogs()
--    Covers: WHERE status = 'published' ORDER BY created_at DESC
ALTER TABLE blogs ADD INDEX idx_status_created (status, created_at DESC);
