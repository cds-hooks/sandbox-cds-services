function getGivenName() {
  return 'Test';
}

module.exports = {
  givenName: getGivenName(),
  requestWithPrefetch: {
    hook: 'patient-view',
    prefetch: {
      patient: {
        resource: {
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
    patient: 'foo-id',
  },
  requestWithOpenFhirServer: {
    hook: 'patient-view',
    fhirServer: 'http://some-fhir-server/open',
    patient: 'foo-id',
  },
  validResponse: {
    cards: [
      {
        summary: `Now seeing: ${getGivenName()}`,
        source: {
          label: 'Patient greeting service',
        },
        indicator: 'info',
      },
    ],
  },
};
