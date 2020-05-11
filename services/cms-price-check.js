const express = require('express');
const uuidv4 = require('uuid/v4');
const priceTable = require('../lib/rxnorm-prices.json');

const router = express.Router();

function getValidCoding(codings, system) {
  let validCoding = null;
  codings.forEach((coding) => {
    if (coding.code && coding.system === system) {
      validCoding = coding;
    }
  });
  return validCoding;
}

function getValidCodingFromConcept(medicationCodeableConcept) {
  let coding = null;
  if (medicationCodeableConcept && medicationCodeableConcept.coding) {
    coding = getValidCoding(medicationCodeableConcept.coding, 'http://www.nlm.nih.gov/research/umls/rxnorm');
  }
  return coding;
}

function verifyPatient(resource, context) {
  return (resource.patient && resource.patient.reference === `Patient/${context.patientId}`) ||
    (resource.subject && resource.subject.reference === `Patient/${context.patientId}`);
}

function getValidResource(selections, resource, context) {
  let coding = null;
  if (['MedicationRequest', 'MedicationOrder'].includes(resource.resourceType) && selections.includes(`${resource.resourceType}/${resource.id}`)) {
    // Check if patient in reference from medication resource refers to patient in context, and
    // flex parsing to read from DSTU2 or STU3 MedicationOrder/MedicationRequest syntax
    if (verifyPatient(resource, context)) {
      const { medicationCodeableConcept } = resource;
      coding = getValidCodingFromConcept(medicationCodeableConcept);
    }
  }
  return coding;
}

function getValidResourceEntries(selections, draftOrders, context) {
  const resources = [];
  if (selections.length && draftOrders.resourceType === 'Bundle' && draftOrders.entry && draftOrders.entry.length) {
    draftOrders.entry.forEach((entryResource) => {
      if (entryResource.resource) {
        const isValidResource = getValidResource(selections, entryResource.resource, context);
        if (isValidResource) {
          resources.push(entryResource.resource);
        }
      }
    });
  }
  return resources;
}

function getValidContextResources(request) {
  let resources = [];
  const { context } = request.body;
  if (context && context.patientId && context.selections && context.draftOrders) {
    resources = getValidResourceEntries(context.selections, context.draftOrders, context);
  }
  return resources;
}

function constructCard(summary, suggestionResource) {
  const card = {
    uuid: uuidv4(),
    summary,
    source: { label: 'CMS Public Use Files' },
    indicator: 'info',
  };

  if (suggestionResource) {
    card.suggestions = [{
      label: 'Change to generic',
      uuid: uuidv4(),
      actions: [
        {
          type: 'create',
          description: 'Create a resource with the newly suggested medication',
          resource: suggestionResource,
        },
      ],
    }];

    card.overrideReasons = [
      {
        code: 'patient-requested-brand',
        system: 'http://terminology.cds-hooks.org/CodeSystem/OverrideReasons',
        display: 'Patient Requested Brand Product',
      },
      {
        code: 'generic-drug-unavailable',
        system: 'http://terminology.cds-hooks.org/CodeSystem/OverrideReasons',
        display: 'Generic Drug Out of Stock or Unavailable',
      },
    ];
  }
  return card;
}

function getSuggestionCard(prices, genericCode, resource) {
  if (prices.generic && prices.brand) {
    const brandPrice = Math.round(prices.brand.total * 100) / 100;
    const genericPrice = Math.round(prices.generic.total * 100) / 100;
    const priceDiff = Math.round((brandPrice - genericPrice) * 100) / 100;
    if (priceDiff > 0) {
      const newResource = resource;
      newResource.medicationCodeableConcept = {
        text: priceTable.cuiToName[genericCode],
        coding: [{
          code: genericCode,
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          display: priceTable.cuiToName[genericCode],
        }],
      };
      return constructCard(`Cost: $${Math.round(prices.brand.total * 100) / 100}. Save $${priceDiff} with a generic medication.`, newResource);
    }
  }
  return null;
}

function getPrice(prices, brandCode) {
  if (!brandCode) {
    return prices.generic ? prices.generic.total : prices.brand.total;
  }
  return prices.brand ? prices.brand.total : prices.generic.total;
}

function getCostCard(brandCode, genericCode, prices, currentResource) {
  let potentialSuggestionCard;
  const medPrice = getPrice(prices, brandCode);
  if (brandCode) {
    potentialSuggestionCard = getSuggestionCard(prices, genericCode, currentResource);
  }

  return potentialSuggestionCard || constructCard(`Cost: $${Math.round(medPrice * 100) / 100}`);
}

function getCardForResponse(resource) {
  const currentResource = resource;
  const codings = resource.medicationCodeableConcept.coding;
  const coding = getValidCoding(codings, 'http://www.nlm.nih.gov/research/umls/rxnorm');
  const currentMedCode = coding.code;

  let brandCode;
  let genericCode = priceTable.brandToGeneric[currentMedCode];
  if (genericCode) {
    brandCode = currentMedCode;
  } else {
    // current code in the resource is possibly already a generic
    genericCode = currentMedCode;
  }

  const prices = priceTable.ingredientsToPrices[priceTable.genericToIngredients[genericCode]];

  if (!prices) {
    return null;
  }

  return getCostCard(brandCode, genericCode, prices, currentResource);
}

function buildCards(resources) {
  if (!resources.length) {
    return { cards: [] };
  }
  const cards = [];
  resources.forEach((resource) => {
    const suggestedCard = getCardForResponse(resource);
    if (suggestedCard) {
      cards.push(suggestedCard);
    }
  });
  if (!cards.length) {
    return { cards: [] };
  }
  return { cards };
}

// CDS Service endpoint
router.post('/', (request, response) => {
  const validResources = getValidContextResources(request);
  const cards = buildCards(validResources);
  response.json(cards);
});

// Feedback endpoint
// Because this is a sample service, this service won't include logic to store card or suggestion
// UUIDs externally to some store to validate the UUID parameter at the feedback endpoint
router.post('/feedback', (request, response) => {
  response.sendStatus(200);
});


module.exports = router;
