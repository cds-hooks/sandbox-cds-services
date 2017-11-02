const request = require('supertest');
const express = require('express');

const app = require('../index.js');
const definitions = require('../discovery/service-definitions');

describe('Discovery Endpoint', () => {
  test('GET should respond with a 200 and object of service definitions in the body', (done) => {
    request(app).get('/cds-services').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        services: definitions,
      });
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      done();
    });
  });
});
