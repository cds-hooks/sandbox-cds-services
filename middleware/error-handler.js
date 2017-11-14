/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }] */

module.exports = (err, request, response, next) => {
  const status = err.status || 500;
  response.status(status);
  response.set('Content-Type', 'text/html');
  response.send(status !== 500 ? err.message : 'Internal Server Error');
};
