const express = require('express');
const db = require('./db');

const app = express();
const port = 3001;

app.use((req, res, next) => {
  console.log(`Received request for ${req.url}`);
  next();
});

app.get('/check-db-connection', (req, res) => {
  console.log('Received request for /check-db-connection');
  db.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Database connection failed:', err.stack);
      return res.status(500).send('Database connection failed: ' + err.stack);
    }
    console.log('Database connection successful');
    res.send('Database connection successful');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
