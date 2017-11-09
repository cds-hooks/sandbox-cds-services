module.exports = {
  requestWithPrefetch: {
    hook: 'patient-view',
    prefetch: {
      patient: {
        resource: {
          name: [
            {
              given: [
                'dummy',
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
  validResponse: {
    cards: [
      {
        summary: 'Now seeing: dummy',
        source: {
          label: 'Patient greeting service',
        },
        indicator: 'info',
      },
    ],
  },
};
