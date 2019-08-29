/* eslint-disable no-bitwise */
/* eslint-disable no-restricted-syntax */
/* eslint-disable quote-props */
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


const SNOMED = 'http://snomed.info/sct'
const CPT = 'http://www.ama-assn.org/go/cpt'

// TODO: populate this with more data.
const appropriateCPTReasons = {
  '72133': { SNOMED: [['279039007']].map(x => new Set(x)) },
};

function findCodes(codes, systemName) {
  return codes.filter(c => c.coding.system === systemName).map(c => c.code);
}

function covers(subset, set) {
  if (subset.size > set.size) return false;
  for (const member of subset) if (!set.has(member)) return false;
  return true;
}

function getRatings(resource) {
  const cpt = findCodes([resource.code], CPT);
  if (!cpt.length) {
    console.log('no CPT code found in resource:', resource);
    return [];
  }
  if (!(cpt[0] in appropriateCPTReasons)) {
    console.log('pama doesn\'t care about cpt code:', cpt);
    return [];
  }
  const reasons = new Set(findCodes(resource.reasonCode, SNOMED));
  const found = appropriateCPTReasons[cpt][SNOMED].filter(r => covers(r, reasons));
  const appropriate = found.length === 0 ? 'not-appropriate' : 'appropriate';

  return [
    {
      url: 'http://fhir.org/argonaut/Extension/pama-rating',
      valueCodeableConcept: {
        coding: [{
          system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
          code: appropriate,
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
