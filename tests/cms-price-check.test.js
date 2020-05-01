const request = require('supertest');
const express = require('express');

const app = require('../index.js');
const stub = require('./stubs/cms-price-check-stub');

jest.mock("uuid/v4", () => {
  return () => 1;
});

describe('CMS Price Check Service Endpoint', () => {
  describe('GET', () => {
    test('should respond with a 404 and empty body', (done) => {
      request(app).get('/cds-services/cms-price-check').then((response) => {
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({});
        done();
      });
    });
  });

  describe('POST', () => {
    const verifyStatusAndHeaders = (response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    };

    describe('Return a 200 and empty array of cards', () => {
      const sendRequestAndVerifyEmptyResponse = (stubBody, done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stubBody)
          .type('json')
          .then((response) => {
            verifyEmptyCardArrayResponse(response, done);
          });
      };

      const verifyEmptyCardArrayResponse = (response, done) => {
        expect(response.body).toEqual(stub.emptyResponse);
        verifyStatusAndHeaders(response);
        done();
      };

      test('when body of request is missing', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .type('json')
          .then((response) => {
            verifyEmptyCardArrayResponse(response, done);
          });
      });

      test('when context property is missing', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.missingContext, done);
      });

      test('when medication code has no associated price in reference document', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.contextRequest(stub.emptyCode), done);
      });

      test('when patient property is not in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutPatient, done);
      });

      test('when draftOrders property is not in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutDraftOrders, done);
      });

      test('when selections property is not in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutSelections, done);
      });

      test('when patient property is not in med resource', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutPatientInMed, done);
      });

      test('when patient in reference of medication is not the patient in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithPatientMismatch, done);
      });

      test('when medications is not of type bundle', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutBundleType, done);
      });

      test('when medications entries do not have the proper resource attribute', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutProperEntry, done);
      });

      test('when resource type does not match MedicationOrder or MedicationRequest', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithWrongResourceType, done);
      });

      test('when coding system does not match http://www.nlm.nih.gov/research/umls/rxnorm', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.contextRequest(stub.codeWithBrand, 'MedicationRequest', 'http://google.com'), done);
      });

      test('when coding array is not present in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutCoding, done);
      });

      test('when code property inside coding array is not present in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutCode, done);
      });

      test('when medicationCodeableConcept property is not present in context', (done) => {
        sendRequestAndVerifyEmptyResponse(stub.createContextWithoutCodeableConcept, done);
      });
    });

    describe('Analytics Endpoint', () => {
      test('returns a 200 for any UUID param', (done) => {
        request(app)
          .post('/cds-services/cms-price-check/analytics/123')
          .send({})
          .type('json')
          .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({});
            done();
          });
      });
    });

    describe('When drug in context has a brand and generic option', () => {
      test('return 200 and card array with brand cost if brand is sole price option', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.contextRequest(stub.codeWithBrand))
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(306.38)); // $306.38
            verifyStatusAndHeaders(response);
            done();
          });
      });

      test('return 200 and card array with generic cost if generic is sole price option', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.contextRequest(stub.codeWithGeneric))
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(22.99)); // $22.99
            verifyStatusAndHeaders(response);
            done();
          });
      });

      test('return 200 and suggestion to switch from brand to generic if cheaper', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.contextRequest(stub.codeWithBrandAndGeneric, 'MedicationRequest'))
          .type('json')
          .then((response) => {
            const resCard = response.body.cards[0];
            if (resCard && resCard.suggestions && resCard.suggestions[0]) {
              const action = resCard.suggestions[0].actions[0];
              if (action) {
                const resource = action.resource;
                if (resource && resource.medicationCodeableConcept && resource.medicationCodeableConcept) {
                  const medCoding = resource.medicationCodeableConcept.coding;
                  medCoding.forEach((coding) => {
                    if (coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm') {
                      // Code for generic alternative
                      expect(coding.code).toEqual('307696');
                    }
                  });
                }
              }
            }
            expect(resCard.summary).toEqual('Cost: $5.47. Save $0.73 with a generic medication.');
            verifyStatusAndHeaders(response);
            done();
          });
      });

      test('return 200 and card array with brand cost for cheaper brand drug than generic', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.contextRequest(stub.codeWithCheaperBrand))
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(50.31)); // $50.31
            verifyStatusAndHeaders(response);
            done();
          });
      });
    });

    describe('When drug in context is already a generic drug', () => {
      test('return 200 and card array with generic cost', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.contextRequest(stub.codeWithGenericOnly))
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(4.74)); // $4.74
            verifyStatusAndHeaders(response);
            done();
          });
      });
    });

    describe('When drug in context is a brand that does not have a generic option', () => {
      test('return 200 and card array with brand cost', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.contextRequest(stub.codeWithBrandOnly))
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(47.27)); // $47.27
            verifyStatusAndHeaders(response);
            done();
          });
      });
    });

    describe('when multiple medications are being prescribed', () => {
      test('returns one card if only one medication meets prerequisites for decision support', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.multipleContextRequestOneCard(stub.codeWithBrandOnly))
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(47.27)); // $47.27
            verifyStatusAndHeaders(response);
            done();
          });
      });
    });

    describe('when multiple coding objects in a coding array are present', () => {
      test('returns a card related to the coding with the correct system and present code', (done) => {
        request(app)
          .post('/cds-services/cms-price-check')
          .send(stub.multipleCodingsInResource)
          .type('json')
          .then((response) => {
            expect(response.body).toEqual(stub.cardsResponse(4.74)); // $4.74
            verifyStatusAndHeaders(response);
            done();
          });
      });
    });
  });
});
