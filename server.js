const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy API requests to the Matterport API
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://my.matterport.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  })
);

// Serve static files
app.use('/bundle', express.static(path.join(__dirname, 'bundle')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'allschool.html'));
});

app.get('/map.html', (req, res) => {
  const title = req.query.title || '';  // Get the title from query params
  console.log('Title:', title); // For debugging purposes

  // Dynamically determine the JavaScript file to serve based on the title
  const scriptFile = title ? `map_${title}.js` : 'map.js';  // Map title-based JS or default JS

  // Render the map.html template with the dynamically determined script
   res.sendFile(path.join(__dirname, 'map.html'), { scriptFile });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
