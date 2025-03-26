
const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { validateAbi } = require('./validators');
const { parseAbi } = require('./abiParser');
const { generateOpenApiSpec } = require('./apiGenerator');

const router = express.Router();

router.post('/generateSpec', async (req, res) => {
  try {
    const abiJson = req.body;
    
    // Check for empty request body
    if (!abiJson || Object.keys(abiJson).length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Request body is empty'
      });
    }

    // Validate the ABI structure
    const validationResult = validateAbi(abiJson);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: true,
        message: 'Invalid ABI JSON structure',
        details: validationResult.errors
      });
    }
    
    try {
      // Parse the ABI
      const parsedAbi = parseAbi(abiJson);
      
      // Generate OpenAPI specification
      const openApiSpec = generateOpenApiSpec(parsedAbi);
      
      // Validate the generated spec has required fields
      if (!openApiSpec || !openApiSpec.openapi || !openApiSpec.paths) {
        throw new Error('Generated OpenAPI spec is invalid');
      }
      
      return res.status(200).json(openApiSpec);
    } catch (processingError) {
      console.error('Processing error:', processingError);
      return res.status(422).json({
        error: true,
        message: 'Failed to process ABI',
        details: processingError.message
      });
    }
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to generate OpenAPI specification',
      details: error.message
    });
  }
});

router.get('/', (req, res) => {
  try {
    res.sendFile('index.html', { root: './public' });
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Documentation routes
router.get('/docs', (req, res) => {
  try {
    const mdContent = fs.readFileSync('./docs/README.md', 'utf8');
    const htmlContent = renderMarkdownPage(mdContent, 'ABI to OpenAPI Documentation');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving documentation:', error);
    res.status(500).send('Error loading documentation');
  }
});

router.get('/docs/:page', (req, res) => {
  try {
    const page = req.params.page;
    // Sanitize input to prevent directory traversal
    const filename = path.basename(page);
    const filePath = `./docs/${filename}`;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Documentation page not found');
    }
    
    const mdContent = fs.readFileSync(filePath, 'utf8');
    const title = getTitleFromMd(mdContent) || 'API Documentation';
    const htmlContent = renderMarkdownPage(mdContent, title);
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving documentation page:', error);
    res.status(500).send('Error loading documentation page');
  }
});

// Helper function to render markdown with HTML template
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

// Helper function to extract title from markdown content
function getTitleFromMd(markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : null;
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
