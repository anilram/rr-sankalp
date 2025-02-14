const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process'); // Import child_process for running commands

const app = express();
const port = 3000;

app.use(express.json());

// Start tileserver-gl-light
const tileserver = spawn('tileserver-gl-light', ['--config', 'config.json'], {
  cwd: __dirname,  // Ensure it runs in the correct directory
  shell: true,
  stdio: 'inherit'  // Show tileserver logs in the console
});

tileserver.on('error', (err) => {
  console.error('Failed to start tileserver-gl-light:', err);
});

tileserver.on('exit', (code) => {
  console.log(`Tileserver exited with code ${code}`);
});

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
  const UDISE = req.query.UDISE || '';  // Get the UDISE from query params
  const scriptFile = UDISE ? `map_${UDISE}.js` : 'map.js';  // Map UDISE-based JS or default JS
  console.log('scriptfile:', scriptFile);
  res.sendFile(path.join(__dirname, 'map.html'), { scriptFile });
});

// Sample data
let appState = {
  application: 'application.showcase',
  phase: 'appphase.waiting',
  phaseTimes: {
    'appphase.uninitialized': 1570084156590,
    'appphase.waiting': 0,
    'appphase.loading': 0,
    'appphase.starting': 0,
    'appphase.playing': 0,
    'appphase.error': 0,
  },
};

// Define routes
app.get('/app/state', (req, res) => {
  res.json(appState);
});

app.post('/app/state', (req, res) => {
  appState = req.body;
  res.json(appState);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Gracefully stop tileserver-gl-light when the Express server stops
process.on('SIGINT', () => {
  console.log('Shutting down tileserver-gl-light...');
  tileserver.kill();
  process.exit();
});
