const express = require("express");
const uuidv4 = require("uuid/v4");

const router = express.Router();

let ratingIndex = 0;
const ratings = ["appropriate", "not-appropriate", "no-criteria-apply"];

function getNextRating() {
  const rating = ratings[ratingIndex++];
  ratingIndex = ratingIndex % ratings.length;
  return rating;
}

function buildCard(originalRequest) {
  return {
    cards: [
      {
        summary: "Example Card",
        indicator: "info",
        detail: "This is an example card.",
        source: {
          label: "Static CDS Service Example",
          url: "https://example.com",
          icon: "https://example.com/img/icon-100px.png"
        },
        links: [
          {
            label: "Google",
            url: "https://google.com",
            type: "absolute"
          },
          {
            label: "Github",
            url: "https://github.com",
            type: "absolute"
          },
          {
            label: "SMART Example App",
            url: "https://smart.example.com/launch",
            type: "smart",
            appContext: '{"session":3456356,"settings":{"module":4235}}'
          }
        ]
      },
      {
        summary: "Another card",
        indicator: "warning",
        source: {
          label: "Static CDS Service Example"
        }
      }
    ],
    extension: {
      systemActions: [
        {
          type: "update",
          resource: {
            ...originalRequest,
            extension: [
              ...(originalRequest.extension || []),
              {
                url: "http://fhir.org/argonaut/Extension/pama-rating",
                valueCodeableConcept: {
                  coding: [
                    {
                      system: "http://fhir.org/argonaut/CodeSystem/pama-rating",
                      code: getNextRating()
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
                valueUri: "urn:uuid:" + uuidv4()
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
  const resource = request.body.context.draftOrders.entry[0].resource;
  response.json(buildCard(resource));
});

module.exports = router;
