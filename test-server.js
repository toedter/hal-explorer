#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Custom MIME type middleware
app.use((req, res, next) => {
  if (req.url.includes('.hal.')) {
    res.setHeader('Content-Type', 'application/hal+json');
    if (req.url.includes('users.hal.')) {
      res.setHeader('Link', '<http://localhost:3000/spring.profile.json>;rel="profile"');
      res.setHeader('Access-Control-Expose-Headers', 'Location,Date,Link,ETag,X-Application-Context');
    }
  } else if (req.url.includes('.hal-forms.')) {
    res.setHeader('Content-Type', 'application/prs.hal-forms+json');
  } else if (req.url.includes('.json')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// Route to simulate a 401 error with HAL-FORMS content
app.get('/error-401-with-templates.hal-forms.json', (req, res) => {
  res.setHeader('Content-Type', 'application/prs.hal-forms+json');
  res.status(401);
  res.sendFile(path.join(__dirname, 'test-data', 'error-401-with-templates.hal-forms.json'));
});

// Serve static files from test-data directory
app.use(express.static(path.join(__dirname, 'test-data')));

app.listen(port, () => {
  console.error(`Test data server running at http://localhost:${port}`);
});

