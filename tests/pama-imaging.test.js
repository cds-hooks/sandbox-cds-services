/* eslint-env jest */

const app = require('../index.js');
const stub = require('./stubs/pama-imaging-stub');

// Basing content tests on
// https://github.com/argonautproject/cds-hooks-for-pama/blob/master/connectathon-scenarios-2019-09/README.md

const request = require('supertest');

describe('PAMA Imaging Service Endpoint', () => {
  test('It returns an "not-appropriate" rating, given "spine CT for low back pain"', async (done) => {
    const input = stub.scenario1request;
    const response = await request(app)
      .post('/cds-services/pama-imaging')
      .send(input)
      .type('json');

    expect(response.status).toEqual(200);
    console.log(response.body);
    const { systemActions } = response.body.extension;

    expect(systemActions).toHaveLength(1);
    expect(systemActions[0].type).toEqual('update');
    const ratings = systemActions[0]
      .resource
      .extension
      .filter(e => e.url === 'http://fhir.org/argonaut/Extension/pama-rating')
      .map(e => e.valueCodeableConcept.coding[0]);

    expect(ratings).toHaveLength(1);
    expect(ratings[0]).toEqual({
      system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
      code: 'not-appropriate',
    });

    done();
  });

  test('It returns an "appropriate" rating, given "Abdominal MRI for pancreatitis with kidney disease"', (done) => {
    done();
  });

  test('It returns no rating, given "CT angiogram of chest for Dyspnea"', (done) => {
    done();
  });
});
