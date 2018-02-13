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

function getValidResource(resource, context) {
  let coding = null;
  if (resource.resourceType === 'MedicationOrder' || resource.resourceType === 'MedicationRequest') {
    // Check if patient in reference from medication resource refers to patient in context
    if (resource.patient && resource.patient.reference === `Patient/${context.patientId}`) {
      const { medicationCodeableConcept } = resource;
      coding = getValidCodingFromConcept(medicationCodeableConcept);
    }
  }
  return coding;
}

function getValidContextResources(request) {
  const resources = [];
  const { context } = request.body;
  if (context && context.patientId && context.medications) {
    const medResources = context.medications;
    medResources.forEach((resource) => {
      const isValidResource = getValidResource(resource, context);
      if (isValidResource) {
        resources.push(resource);
      }
    });
  }
  return resources;
}

function constructCard(summary, suggestionResource) {
  const card = {
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
          resource: suggestionResource,
        },
      ],
    }];
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

// Analytics endpoint
// Because this is a sample service, this service won't include logic to store suggestion UUIDs
// externally to some store to validate the UUID parameter at the analytics endpoint
router.post('/analytics/:uuid', (request, response) => {
  response.sendStatus(200);
});


module.exports = router;
