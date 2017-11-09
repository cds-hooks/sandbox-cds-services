const request = require('supertest');
const express = require('express');

const app = require('../index.js');

describe('Invalid Routes', () => {
  test('GET to the root should respond with a 404', (done) => {
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });

  test('POST to an invalid CDS Service endpoint should respond with a 404', (done) => {
    request(app)
      .post('/cds-services/unknown-service')
      .send({ valid: 'request' })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        done();
      });
  });

  test('POST to a CDS Service at the wrong path should respond with a 404', (done) => {
    request(app)
      .post('/unknown-service')
      .send({ valid: 'request' })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        done();
      });
  });
});
