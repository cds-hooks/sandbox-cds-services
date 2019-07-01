const express = require("express");
const uuidv4 = require('uuid/v4');

const router = express.Router();

function buildCard(originalRequest) {
  return {
    cards: [],
    extension: {
      systemActions: [
        {
          type: "update",
          resource: {
            resourceType: "Bundle",
            entry: [
              {
                resource: {
                  ...originalRequest,
                  extension: [
                    ...(originalRequest.extension || []),
                    {
                      url: "http://fhir.org/argonaut/Extension/pama-rating",
                      valueCodeableConcept: {
                        coding: [
                          {
                            system:
                              "http://fhir.org/argonaut/CodeSystem/pama-rating",
                               code: "appropriate"
                          }
                        ]
                      }
                    },
                    {
                      url:
                        "http://fhir.org/argonaut/Extension/pama-rating-qcdsm-consulted",
                        valueString: "example-gcode"
                    },
                    {
                      url:
                        "http://fhir.org/argonaut/Extension/pama-rating-consult-id",
                        valueUri: "urn:uuid:"+uuidv4()
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  };
}

// CDS Service endpoint
router.post("/", (request, response) => {
  const resource = request.body.context.draftOrders.entry[0]
  response.json(buildCard(resource));
});

module.exports = router;
