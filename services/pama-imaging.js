/* eslint-disable no-restricted-syntax */
/* eslint-disable quote-props */
const express = require('express');
const flat = require('array.prototype.flat');
const uuid = require('uuid');

const router = express.Router();

const SNOMED = 'http://snomed.info/sct';
const CPT = 'http://www.ama-assn.org/go/cpt';

flat.shim();

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
  '70450': new Reasons([['25064002', '423341008']], []),
  '70544': new Reasons([], []),
  '71275': new Reasons([], [['13213009']]),
  '72133': new Reasons([], [['279039007']]),
  '75561': new Reasons([['13213009']], []),
};

const recommendations = {
  '13213009': [{
    indicator: 'info',
    source: {
      label: 'Dx App Suite',
    },
    summary: 'ACC recommends cardiac MRI',
    suggestions: {
      label: 'Choose MRI',
      actions: [
        {
          type: 'update',
          description: 'Update order to MRI',
          resource: { // Placeholder!  Replace this with the actual resource.
            code: {
              coding: [
                {
                  system: 'http://www.ama-assn.org/go/cpt',
                  code: '75561',
                },
              ],
            },
          },
        },
      ],
    },
  }],
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
  if (!(cpt[0] in cptReasons)) return [];
  const reasons = new Set(findCodes(resource.reasonCode, SNOMED));
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

function getCards(entries, actions) {
  const reasonCodes = new Set(entries
    .map(x => x.resource.reasonCode)
    .flat()
    .map(x => x.coding.map(y => y.code))
    .flat());
  const cards = Object.entries(recommendations)
    .filter(x => reasonCodes.has(x[0]))
    .map(x => x[1])
    .flat();
//  if (cards.length === 0) return []; // XXX
  const recommendedActions = new Set(cards
    .map(x => x.suggestions.actions
      .map(y => y.resource.code.coding
        .map(z => z.code))
      .flat())
    .flat());
  const selectedActions = new Set(entries
    .map(x => x.resource.code)
    .flat()
    .map(x => x.coding)
    .flat()
    .map(x => x.code));
  console.log(actions);
  console.log(selectedActions);
  console.log(recommendedActions);
  console.log(JSON.stringify(cards, null, 2));
//  console.log(JSON.stringify(entries, null, 2));
//  console.log(JSON.stringify(recommendations, null, 2));
//  console.log(reasonCodes);
  // TODO: insert the resources into the cards
  return [];
}

router.post('/', (request, response) => {
  const entries = request.body.context.draftOrders.entry;
  const { selections } = request.body.context;
  const actions = getSystemActions(entries, selections);
  response.json({
    cards: getCards(entries, actions),
    extension: {
      systemActions: actions,
    },
  });
});

module.exports = router;
