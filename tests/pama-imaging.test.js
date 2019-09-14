/* eslint-env jest */

const app = require('../index.js');
const stub = require('./stubs/pama-imaging-stub');

// Basing content tests on
// https://github.com/argonautproject/cds-hooks-for-pama/blob/master/connectathon-scenarios-2019-09/README.md

const request = require('supertest');

describe('PAMA Imaging Service Endpoint', () => {
  async function confirm(rating, input, done) {
    const response = await request(app)
      .post('/cds-services/pama-imaging')
      .send(input)
      .type('json');

    expect(response.status).toEqual(200);
    const { systemActions } = response.body.extension;

    if (systemActions.length > 0) {
      expect(systemActions).toHaveLength(1);
      expect(systemActions[0].type).toEqual('update');
      const ratings = systemActions[0]
        .resource
        .extension
        .filter(e => e.url === 'http://fhir.org/argonaut/Extension/pama-rating')
        .map(e => e.valueCodeableConcept.coding[0]);

      if (ratings.length > 0) {
        expect(ratings).toHaveLength(1);
        expect(ratings[0]).toEqual({
          system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
          code: rating,
        });
      }
    }

    done();
  }

  test('It returns "no-guidelines-apply" when no reason is given.', (done) => {
    confirm('no-guidelines-apply', stub.dummy1, done);
  });

  test('It returns "no-guidelines-apply when no reason is given.', (done) => {
    confirm('no-guidelines-apply', stub.dummy2, done);
  });

  test('It returns "no-guidelines-apply when no cpt is given.', (done) => {
    confirm('no-guidelines-apply', stub.dummy3, done);
  });

  test('It returns "not-appropriate", given "spine CT for low back pain"', (done) => {
    confirm('not-appropriate', stub.s1r1, done);
  });

  test('It returns "appropriate", given "CT head for multiple reasons"', (done) => {
    confirm('appropriate', stub.s1r2, done);
  });

  test('It returns "no-guidelines-apply", given "MRI for a toothache"', (done) => {
    confirm('no-guidelines-apply', stub.s1r3, done);
  });

  test('It returns no cards when draft orders meet guidelines', async (done) => {
    const response = await request(app)
      .post('/cds-services/pama-imaging')
      .send(stub.s2r1)
      .type('json');
    expect(response.status).toEqual(200);
    expect(response.body.cards).toHaveLength(0);
    done();
  });

  test('It returns cards when draft orders do not meet guidelines', async (done) => {
    const response = await request(app)
      .post('/cds-services/pama-imaging')
      .send(stub.s2r2)
      .type('json');
    expect(response.status).toEqual(200);
    const { cards } = response.body;
    expect(cards).toHaveLength(1);
    expect(cards[0].suggestions).toHaveLength(1);
    expect(cards[0].indicator).toBe('info');
    expect(cards[0].source.label).toBe('Dx App Suite');
    expect(cards[0].summary).toBe('ACC recommends cardiac MRI');
    expect(cards[0].suggestions[0].actions).toHaveLength(1);
    expect(cards[0].links).toHaveLength(1);
    expect(cards[0].links[0].url).toBe('https://cds-hooks.github.io/pama-demo-app/');
    expect(cards[0].links[0].appContext).toBe(JSON.stringify(stub.s2r2.context));

    const action = cards[0].suggestions[0].actions[0];
    expect(action.resource.code.coding).toHaveLength(1);
    expect(action.resource.code.coding[0].code).toBe('75561');
    expect(action.type).toBe('update');
    expect(action.description).toBe('Update order to MRI');
    done();
  });

  test('It returns cards when draft orders do not meet guidelines, without a ServiceRequest.code supplied', async (done) => {
    const response = await request(app)
      .post('/cds-services/pama-imaging')
      .send(stub.s2r3)
      .type('json');

    // TODO: extract these and above (DRY)
    expect(response.status).toEqual(200);
    const { cards } = response.body;
    expect(cards).toHaveLength(1);
    expect(cards[0].suggestions).toHaveLength(1);
    expect(cards[0].indicator).toBe('info');
    expect(cards[0].source.label).toBe('Dx App Suite');
    expect(cards[0].summary).toBe('ACC recommends cardiac MRI');
    expect(cards[0].suggestions[0].actions).toHaveLength(1);

    const action = cards[0].suggestions[0].actions[0];
    expect(action.resource.code.coding).toHaveLength(1);
    expect(action.resource.code.coding[0].code).toBe('75561');
    expect(action.type).toBe('update');
    expect(action.description).toBe('Update order to MRI');
    done();
  });
});
