const router = require('express').Router();
const { sitemap, llms } = require('../controllers/seo.controller');

// Public, unauthenticated SEO files generated live from the product catalogue.
// Served from the frontend domain via a Vercel proxy rewrite.
router.get('/sitemap.xml', sitemap);
router.get('/llms.txt',    llms);

module.exports = router;
