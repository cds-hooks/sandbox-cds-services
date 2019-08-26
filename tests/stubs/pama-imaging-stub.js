module.exports = {
  scenario1request: {
    hook: 'order-select',
    hookInstance: 'd1577c69-dfbe-44ad-ba6d-3e05e953b2ea',
    fhirServer: 'http://hooks.smarthealthit.org',
    context: {
      userId: 'Practitioner/123',
      patientId: 'MRI-59879846',
      encounterId: '89284',
      selections: [
        'ServiceRequest/example-MRI-59879846',
      ],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [{
          resource: {
            resourceType: 'ServiceRequest',
            id: 'example-MRI-59879846',
            status: 'draft',
            intent: 'plan',
            code: {
              coding: [{
                system: 'http://www.ama-assn.org/go/cpt',
                code: '72133',
              }],
              text: 'Lumbar spine CT',
            },
            subject: {
              reference: 'Patient/MRI-59879846',
            },
            reasonCode: [{
              coding: [{
                system: 'http://snomed.info/sct',
                code: '279039007',
                display: 'Low back pain',
              }],
            }],
          },
        }],
      },
    },
  },
};
