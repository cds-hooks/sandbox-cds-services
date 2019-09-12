/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable quote-props */
const express = require('express');
const fhirpath = require('fhirpath');
const flatMap = require('array.prototype.flatmap');
const uuid = require('uuid');

const router = express.Router();

flatMap.shim();

const CPT = {
  _FHIR_CODING_SYSTEM: 'http://www.ama-assn.org/go/cpt',
  CARDIAC_MRI: '75561',
  CT_HEAD_NO_CONTRAST: '70450',
  CTA_WITH_CONTRAST: '71275',
  LUMBAR_SPINE_CT: '72133',
  MRA_HEAD: '70544',
};

const SNOMED = {
  _FHIR_CODING_SYSTEM: 'http://snomed.info/sct',
  CONGENITAL_HEART_DISEASE: '13213009',
  HEADACHE: '25064002',
  LOW_BACK_PAIN: '279039007',
  OPTIC_DISC_EDEMA: '423341008',
};

class Reasons {
  static covers(subset, set) {
    if (subset.size > set.size) {
      return false;
    }
    for (const member of subset) {
      if (!set.has(member)) {
        return false;
      }
    }
    return true;
  }

  constructor(appropriate, notAppropriate) {
    this.appropriate = appropriate.map(x => new Set(x));
    this.notAppropriate = notAppropriate.map(x => new Set(x));
  }

  getRating(reasons) {
    if (this.appropriate.filter(s => Reasons.covers(s, reasons)).length) {
      return 'appropriate';
    }
    if (this.notAppropriate.filter(s => Reasons.covers(s, reasons)).length) {
      return 'not-appropriate';
    }
    return 'no-guidelines-apply';
  }
}

const cptReasons = {
  '1234': new Reasons([['1']], [['2', '3']]),
  [CPT.CT_HEAD_NO_CONTRAST]: new Reasons([[SNOMED.HEADACHE, SNOMED.OPTIC_DISC_EDEMA]], []),
  [CPT.MRA_HEAD]: new Reasons([], []),
  [CPT.CTA_WITH_CONTRAST]: new Reasons([], [[SNOMED.CONGENITAL_HEART_DISEASE]]),
  [CPT.LUMBAR_SPINE_CT]: new Reasons([], [[SNOMED.LOW_BACK_PAIN]]),
  [CPT.CARDIAC_MRI]: new Reasons([[SNOMED.CONGENITAL_HEART_DISEASE]], []),
};

const CARD_TEMPLATES = {
  [SNOMED.CONGENITAL_HEART_DISEASE]: [{
    indicator: 'info',
    links: [
      {
        label: 'SMART PAMA Demo App',
        url: 'https://cds-hooks.github.io/pama-demo-app/',
        type: 'smart',
        appContext: { session: 3456356, settings: { module: 4235 } },
      },
    ],
    source: {
      label: 'Dx App Suite',
    },
    summary: 'ACC recommends cardiac MRI',
    suggestions: [{
      label: 'Choose MRI',
      actions: [
        {
          type: 'update',
          description: 'Update order to MRI',
          resource: { // Placeholder resource.
            code: { coding: [{ code: CPT.CARDIAC_MRI, system: CPT._FHIR_CODING_SYSTEM }] },
            reasonCode: [{
              coding: [
                {
                  code: SNOMED.CONGENITAL_HEART_DISEASE,
                  system: SNOMED._FHIR_CODING_SYSTEM,
                },
              ],
            }],
          },
        },
      ],
    }],
  }],
};

function findCodes(codes, systemName) {
  return codes
    .flatMap(c => c.coding
      .filter(x => x.system === systemName)
      .map(x => x.code));
}

function getRatings(resource) {
  const cpt = findCodes([resource.code], CPT._FHIR_CODING_SYSTEM);
  if (!(cpt[0] in cptReasons)) return [];
  const reasons = new Set(findCodes(resource.reasonCode, SNOMED._FHIR_CODING_SYSTEM));
  const rating = cptReasons[cpt[0]].getRating(reasons);
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


function getSystemActions(resources) {
  return resources.map(r => (
    {
      resource: {
        ...r,
        extension: [...r.extension || [], ...getRatings(r)],
      },
      type: 'update',
    }
  ));
}

const findSet = (json, path) => new Set(fhirpath.evaluate(json, path));

/**
 * Merge two resources, applying a PAMA rating to the combined resource.
 *
 * @param {*} source a resource, typically one that is selected but not finalized.
 * @param {*} recommended a resource, one that contains attributes to apply to another.
 */
function mergeResources(source, recommended) {
  const merged = { ...source, ...recommended };
  return {
    ...merged,
    extension: [...merged.extension || [], ...getRatings(merged)],
  };
}

function makeCards(resources) {
  const proposedReasons = findSet(resources, 'reasonCode.coding.code');
  const matchingCards = Object.entries(CARD_TEMPLATES)
    .filter(x => proposedReasons.has(x[0]))
    .flatMap(x => x[1]);

  // Eliminate returning cards if the proposed orders already meet guidelines.
  const guidelineActions = findSet(matchingCards, 'suggestions.actions.resource.code.coding.code');
  const selectedActions = findSet(resources, 'code.coding.code');
  if (Reasons.covers(guidelineActions, selectedActions)) return [];

  return matchingCards.slice().map(card => ({
    ...card,
    suggestions: card.suggestions.map(suggestion => ({
      ...suggestion,
      actions: suggestion.actions.map(action => ({
        ...action,
        resource: mergeResources(resources[0], action.resource),
      })),
    })),
  }));
}

router.post('/', (request, response) => {
  const entries = request.body.context.draftOrders.entry;
  const { selections } = request.body.context;
  const resources = findResources(entries, selections);
  response.json({
    cards: makeCards(resources),
    extension: {
      systemActions: getSystemActions(resources),
    },
  });
});

module.exports = router;
