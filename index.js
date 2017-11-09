/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }] */

const express = require('express');
const bodyParser = require('body-parser');
const cdsServices = require('./discovery/cds-services');

const app = express();

const isValidJson = (obj) => {
  try {
    JSON.stringify(obj);
    return true;
  } catch (err) {
    return false;
  }
};

// This is necessary middleware to parse JSON into the incoming request body for POST requests
app.use(bodyParser.json());

// CDS Services must implement CORS to be called from a web browser
app.use((request, response, next) => {
  response.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Origin, Accept, Content-Location, Location, X-Requested-With',
    'Content-Type': 'application/json; charset=utf-8',
  });
  next();
});

app.use((request, response, next) => {
  if (request.body) {
    if (!isValidJson(request.body)) {
      response.sendStatus(400);
      return;
    }
  }
  next();
});

app.set('json spaces', '  ');

app.use('/cds-services', cdsServices);

app.use((request, response, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Handle specified errors or return a 500 for internal errors
app.use((err, request, response, next) => {
  const status = err.status || 500;
  response.status(status);
  response.set('Content-Type', 'text/html');
  response.send(status !== 500 ? err.message : 'Internal Server Error');
});

module.exports = app;
