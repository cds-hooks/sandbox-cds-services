const express = require('express');

const router = express.Router();


function extractInput(request) {
  // TODO: return a dictionary with only the important logical bits present.
  return request;
}

function getResponse(pamaRating) {
  return {
    extension: {
      systemActions: [{
        resource: {
          extension: [
            {
              url: 'http://fhir.org/argonaut/Extension/pama-rating',
              valueCodeableConcept: {
                coding: [{
                  system: 'http://fhir.org/argonaut/CodeSystem/pama-rating',
                  code: pamaRating,
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
          ],
        },
        type: 'update',
      }],
    },
  }
}

function determinePamaRating(input) {
  // TODO: apply logic here.
  return 'appropriate';
}

router.post('/', (request, response) => {
  const input = extractInput(request.body);
  const coding = determinePamaRating(input);
  response.json(getResponse(coding));
});

module.exports = router;
