/**
 * Build Article JSON-LD from a published blog row (render-time, not stored).
 * @param {object} post - blogs row (+ admins.name as `name`)
 * @param {string} siteUrl - e.g. https://kreditseva.com
 * @returns {object}
 */
function buildBlogSchema(post, siteUrl) {
  const base = String(siteUrl || 'https://kreditseva.com').replace(/\/$/, '');
  const slug = post.slug || '';
  const pageUrl = `${base}/blog/${slug}`;

  let image = post.featured_image || '/images/blog/blog1.png';
  if (!String(image).startsWith('http')) {
    image = base + (String(image).startsWith('/') ? image : '/' + image);
  }

  const logoUrl = `${base}/images/logo.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.meta_title || post.title || '',
    description: post.meta_desc || '',
    image: [image],
    datePublished: post.created_at || undefined,
    dateModified: post.updated_at || post.created_at || undefined,
    author: {
      '@type': 'Person',
      name: post.name || 'KreditSeva'
    },
    publisher: {
      '@type': 'Organization',
      name: 'KreditSeva',
      url: base,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl
    },
    url: pageUrl
  };

  if (post.category) {
    schema.articleSection = String(post.category).replace(/-/g, ' ');
  }
  if (post.meta_keywords) {
    schema.keywords = post.meta_keywords;
  }

  return schema;
}

function buildBlogSchemaJson(post, siteUrl) {
  return JSON.stringify(buildBlogSchema(post, siteUrl));
}

module.exports = { buildBlogSchema, buildBlogSchemaJson };
