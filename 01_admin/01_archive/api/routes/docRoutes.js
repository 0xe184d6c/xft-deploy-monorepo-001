/**
 * Documentation Routes
 * Routes for serving documentation pages
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const router = express.Router();

/**
 * @route GET /docs
 * @description Main documentation page
 * @access Public
 */
router.get('/', (req, res, next) => {
  try {
    const mdContent = fs.readFileSync('./docs/README.md', 'utf8');
    const htmlContent = renderMarkdownPage(mdContent, 'ABI to OpenAPI Documentation');
    res.send(htmlContent);
  } catch (error) {
    error.statusCode = 500;
    error.message = 'Error loading documentation';
    next(error);
  }
});

/**
 * @route GET /docs/:page
 * @description Specific documentation page
 * @access Public
 */
router.get('/:page', (req, res, next) => {
  try {
    const page = req.params.page;
    // Sanitize input to prevent directory traversal
    const filename = path.basename(page);
    const filePath = `./docs/${filename}`;
    
    if (!fs.existsSync(filePath)) {
      const error = new Error('Documentation page not found');
      error.statusCode = 404;
      return next(error);
    }
    
    const mdContent = fs.readFileSync(filePath, 'utf8');
    const title = getTitleFromMd(mdContent) || 'API Documentation';
    const htmlContent = renderMarkdownPage(mdContent, title);
    res.send(htmlContent);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = 'Error loading documentation page';
    }
    next(error);
  }
});

/**
 * Helper function to render markdown with HTML template
 * @param {String} markdown - Markdown content to render
 * @param {String} title - Page title
 * @returns {String} HTML content
 */
function renderMarkdownPage(markdown, title) {
  const htmlContent = marked(markdown);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    .markdown-body {
      padding: 20px;
    }
    .markdown-body pre {
      background-color: #f0f0f0;
      padding: 10px;
      border: 1px solid #ccc;
      overflow: auto;
    }
    .markdown-body code {
      font-family: monospace;
    }
    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
    }
    .markdown-body th, .markdown-body td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .markdown-body th {
      background-color: #f0f0f0;
    }
    nav {
      margin-bottom: 20px;
    }
    nav a {
      margin-right: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="text-start my-3">
      <h1>ABI to OpenAPI Docs</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/docs">Overview</a>
        <a href="/docs/index.md">API</a>
        <a href="/docs/examples.md">Examples</a>
        <a href="/docs/technical.md">Technical</a>
        <a href="/docs/integration.md">Integration</a>
      </nav>
    </header>
    <div class="markdown-body">
      ${htmlContent}
    </div>
    <footer class="text-start py-2">
      <p>© ABI to OpenAPI Converter</p>
    </footer>
  </div>
</body>
</html>
  `;
}

/**
 * Helper function to extract title from markdown content
 * @param {String} markdown - Markdown content
 * @returns {String|null} Title from markdown or null
 */
function getTitleFromMd(markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : null;
}

module.exports = router;