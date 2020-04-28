const request = require('supertest');
const express = require('express');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const app = require('../index.js');
const stub = require('./stubs/patient-greeting-stub');

jest.mock("uuid/v4", () => {
  return () => 1;
});

describe('Patient Greeting Service Endpoint', () => {
  describe('GET', () => {
    test('should respond with a 404 and empty body', (done) => {
      request(app).get('/cds-services/patient-greeting').then((response) => {
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({});
        done();
      });
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

    describe('When a valid prefetch body is supplied', () => {
      test('a request should yield a 200 status and CDS Service response in the body', (done) => {
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

    describe('When an invalid prefetch body is supplied', () => {
      test('a request without the fhirServer and patient field should yield a 412 status', (done) => {
        request(app)
          .post('/cds-services/patient-greeting')
          .send(stub.requestWithoutPrefetch)
          .type('json')
          .then((response) => {
            expect(response.statusCode).toBe(412);
            done();
          });
      });

      describe('and the passed in FHIR server is called', () => {
        let requestStub;
        let mock;

        beforeEach(() => {
          requestStub = stub.requestWithSecuredFhirServer;
          mock = new MockAdapter(axios);
        });
        afterEach(() => { mock.restore(); });

        test('returns a card if the FHIR response was valid at an open endpoint', (done) => {
          let headers;
          requestStub = stub.requestWithOpenFhirServer;
          mock.onGet(`${requestStub.fhirServer}/Patient/${requestStub.context.patientId}`)
            .reply((config) => {
              headers = config.headers;
              return [
                200,
                {
                  name: [{
                    given: [stub.givenName]
                  }]
                }
              ];
            });

          request(app)
            .post('/cds-services/patient-greeting')
            .send(requestStub)
            .type('json')
            .then((response) => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual(stub.validResponse);
              expect(headers['Authorization']).toBeUndefined();
              done();
            });
        });

        test('returns a card if the FHIR response was valid at a secured endpoint', (done) => {
          let headers;
          mock.onGet(`${requestStub.fhirServer}/Patient/${requestStub.context.patientId}`)
            .reply((config) => {
              headers = config.headers;
              return [
                200,
                {
                  name: [{
                    given: [stub.givenName]
                  }]
                }
              ];
            });

          request(app)
            .post('/cds-services/patient-greeting')
            .send(requestStub)
            .type('json')
            .then((response) => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual(stub.validResponse);
              expect(headers['Authorization']).toEqual(`Bearer ${requestStub.fhirAuthorization.access_token}`);
              done();
            });
        });

        test('returns a 412 if the FHIR service call failed', (done) => {
          mock.onGet(`${requestStub.fhirServer}/Patient/${requestStub.context.patientId}`)
            .networkError();

          request(app)
            .post('/cds-services/patient-greeting')
            .send(requestStub)
            .type('json')
            .then((response) => {
              expect(response.statusCode).toBe(412);
              done();
            });
        });

        test('returns a 412 if the FHIR response is invalid', (done) => {
          mock.onGet(`${requestStub.fhirServer}/Patient/${requestStub.context.patientId}`)
            .reply(200, {
              name: [{
                given: []
              }]
            });

          request(app)
            .post('/cds-services/patient-greeting')
            .send(requestStub)
            .type('json')
            .then((response) => {
              expect(response.statusCode).toBe(412);
              done();
            });
        });
      });
    });
  });
});
