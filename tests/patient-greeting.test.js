const request = require('supertest');
const express = require('express');

const app = require('../index.js');
const stub = require('./stubs/patient-greeting-stub');

describe('Patient Greeting Service Endpoint', () => {
  test('GET should respond with a 404 and empty body', (done) => {
    request(app).get('/cds-services/patient-greeting').then((response) => {
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({});
      done();
    });
  });

  describe('POST', () => {
    test('with a bad request should yield a 400 status', (done) => {
      request(app)
        .post('/cds-services/patient-greeting')
        .send('{"invalid"}')
        .type('json')
        .then((response) => {
          expect(response.statusCode).toBe(400);
          done();
        });
    });

    test('without prefetched data in a valid request should yield a 412 status and an empty body response', (done) => {
      request(app)
        .post('/cds-services/patient-greeting')
        .send(stub.requestWithoutPrefetch)
        .type('json')
        .then((response) => {
          expect(response.statusCode).toBe(412);
          expect(response.body).toEqual({});
          done();
        });
    });

    test('with prefetch data in a valid request should yield a 200 status and CDS Service response in the body', (done) => {
      request(app)
        .post('/cds-services/patient-greeting')
        .send(stub.requestWithPrefetch)
        .type('json')
        .then((response) => {
          expect(response.statusCode).toBe(200);
          expect(response.body).toEqual(stub.validResponse);
          expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
          done();
        });
    });
  });
});
