/* eslint-disable no-bitwise */
/* eslint-disable no-restricted-syntax */
const express = require('express');

const router = express.Router();

/**
 * Finds all resources from a bundle matching all the selections.
 *
 * @param {*} entries a list of resources.
 * @param {*} selections a list of selected resource strings matching the form 'Type/Id'.
 */
function* findResources(entries, selections) {
  for (let i = 0; i < selections.length; i += 1) {
    const [resourceType, resourceId] = selections[i].split('/');
    const resources = entries
      .map(e => e.resource)
      .filter(r => r.resourceType === resourceType && r.id === resourceId);
    for (const resource of resources) {
      yield resource;
    }
  }
}

// See: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    // eslint-disable-next-line no-mixed-operators
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function* getRatings(resource) {
  // TODO: use the features of the resource to generate a rating.
  console.log('getResource: ', resource);
  yield {
    url: 'http://fhir.org/argonaut/Extension/pama-rating',
    valueCodeableConcept: {
      coding: [{
        system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
        code: 'appropriate',
      }],
    },
  };
  yield {
    url: 'http://fhir.org/argonaut/Extension/pama-rating-qcdsm-consulted',
    valueString: 'example-gcode',
  };
  yield {
    url: 'http://fhir.org/argonaut/Extension/pama-rating-consult-id',
    valueUri: `urn:uuid:${uuidv4()}`,
  };
}

function* getSystemActions(entries, selections) {
  for (const r of findResources(entries, selections)) {
    yield {
      // Create a shallow copy of the resource, which also includes the 'extension' attibute.
      resource: Object.assign({ extension: Array.from(getRatings(r)) }, r),
      type: 'update',
    };
  }
}

router.post('/', (request, response) => {
  const entries = request.body.context.draftOrders.entry;
  const { selections } = request.body.context;
  response.json({
    cards: [],
    extension: {
      systemActions: Array.from(getSystemActions(entries, selections)),
    },
  });
});

module.exports = router;
