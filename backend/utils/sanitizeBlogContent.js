const sanitizeHtml = require('sanitize-html');

function sanitizeBlogContent(html) {
    if (!html) return '';

    return sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'span', 'div'
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
            a: ['href', 'name', 'target', 'rel'],
            '*': ['class']
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
        }
    });
}

module.exports = sanitizeBlogContent;
