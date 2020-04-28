const uuidv4 = require('uuid/v4');

function getGivenName() {
  return 'Test';
}

module.exports = {
  givenName: getGivenName(),
  requestWithPrefetch: {
    hook: 'patient-view',
    prefetch: {
      patient: {
        name: [
          {
            given: [
              `${getGivenName()}`,
            ],
          },
        ],
      },
    },
  },
  requestWithoutPrefetch: {
    hook: 'patient-view',
  },
  requestWithSecuredFhirServer: {
    hook: 'patient-view',
    fhirServer: 'http://some-fhir-server/secured',
    fhirAuthorization: {
      access_token: 'foo-token'
    },
    context: {
      patientId: 'foo-id',
    }
  },
  requestWithOpenFhirServer: {
    hook: 'patient-view',
    fhirServer: 'http://some-fhir-server/open',
    context: {
      patientId: 'foo-id',
    }
  },
  validResponse: {
    cards: [
      {
        uuid: uuidv4(),
        summary: `Now seeing: ${getGivenName()}`,
        source: {
          label: 'Patient greeting service',
        },
        indicator: 'info',
      },
    ],
  },
};
