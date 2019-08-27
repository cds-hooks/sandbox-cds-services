const express = require('express');

const router = express.Router();

/**
 * Finds a resource from a bundle matching a selection.
 *
 * @param {*} entries a list of resources.
 * @param {*} selection a selected resource string matching the form 'Type/Id'.
 */
function findResource(entries, selection) {
  const [resourceType, resourceId] = selection.split('/');
  return entries
    .map(e => e.resource)
    .filter(r => r.resourceType === resourceType && r.id === resourceId);
}

function getSystemActions(entries, selections) {
  const r = findResource(entries, selections[0]);
  r.extension = [
    {
      url: 'http://fhir.org/argonaut/Extension/pama-rating',
      valueCodeableConcept: {
        coding: [{
          system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
          code: 'appropriate',
        }],
      },
    },
    {
      url: 'http://fhir.org/argonaut/Extension/pama-rating-qcdsm-consulted',
      valueString: 'example-gcode',
    },
    {
      url: 'http://fhir.org/argonaut/Extension/pama-rating-consult-id',
      valueUri: 'urn:uuid:55f3b7fc-9955-420e-a460-ff284b2956e6',
    },
  ];
  return [{
    resource: r,
    type: 'update',
  }];
}

router.post('/', (request, response) => {
  const entries = request.body.context.draftOrders.entry;
  const { selections } = request.body.context;
  response.json({
    cards: [],
    extension: {
      systemActions: getSystemActions(entries, selections),
    },
  });
});

module.exports = router;
