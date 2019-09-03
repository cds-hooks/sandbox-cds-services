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

function covers(subset, set) {
  if (subset.size > set.size) return false;
  for (const member of subset) if (!set.has(member)) return false;
  return true;
}

class Apt {
  constructor(yes, no) {
    this.yes = yes.map(x => new Set(x));
    this.no = no.map(x => new Set(x));
  }

  getRating(reasons) {
    if (this.yes.filter(s => covers(s, reasons)).length) {
      return 'appropriate';
    }
    if (this.no.filter(s => covers(s, reasons)).length) {
      return 'not-appropriate';
    }
    return 'no-guidelines-apply';
  }
}

const cptReasons = {
  '72133': new Apt([], [['279039007']]),
  '70450': new Apt([['25064002', '423341008 ']], []),
  '70544': new Apt([], []),
};

function findCodes(codes, systemName) {
  return codes
    .map(c => c.coding
      .filter(x => x.system === systemName)
      .map(x => x.code))
    .flat();
}

function getRatings(resource) {
  const cpt = findCodes([resource.code], CPT);
  if (!cpt.length) {
    console.log('no CPT code found in resource:', resource);
    return [];
  }
  if (!(cpt[0] in cptReasons)) {
    console.log('pama doesn\'t care about cpt code:', cpt);
    return [];
  }
  const reasons = new Set(findCodes(resource.reasonCode, SNOMED));
  const rating = cptReasons[cpt].getRating(reasons);
  return [
    {
      url: 'http://fhir.org/argonaut/Extension/pama-rating',
      valueCodeableConcept: {
        coding: [{
          system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
          code: rating,
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
