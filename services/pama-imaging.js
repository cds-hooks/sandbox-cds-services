/* eslint-disable no-bitwise */
/* eslint-disable no-restricted-syntax */
const express = require('express');
const uuid = require('uuid');

const router = express.Router();

/**
 * Finds all resources from a bundle matching all the selections.
 *
 * @param {*} entries a list of resources.
 * @param {*} selections a list of selected resource strings matching the form 'Type/Id'.
 */
const findResources = (entries, selections) =>
  selections
    .map(s => s.split('/'))
    .map(([resourceType, resourceId]) =>
      entries
        .map(e => e.resource)
        .filter(r => r.resourceType === resourceType && r.id === resourceId)[0]);


function getRatings(resource) {
  // TODO: get the cpt code from the resource
  // TODO: get the SNOMED code
  // TODO: return an empty list if the reason code or cpt codes are not covered by the track
  // TODO: get the appropriate cpt codes mapped to the reason code
  // TODO: return apt or not-apt
  return [
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
      valueUri: `urn:uuid:${uuid.v4()}`,
    },
  ];
}

function getSystemActions(entries, selections) {
  return findResources(entries, selections).map(r => (
    {
      resource: {
        ...r,
        extension: [...r.extension || [], ...getRatings(r)],
      },
      type: 'update',
    }
  ));
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
