const uuid = require('uuid');

function getReasons(reasons) {
  return reasons.map(r => (
    {
      coding: r.reasons.map(x => (
        {
          system: 'http://snomed.info/sct',
          code: x.code,
          display: x.display,
        }
      )),
    }
  ));
}

function getResources(
  bundle, patientId,
  intent = 'plan',
  resourceType = 'ServiceRequest',
  status = 'draft',
) {
  return bundle.map(x => (
    {
      resource: {
        resourceType,
        id: `example-${patientId}`,
        status,
        intent,
        code: {
          coding: [{
            system: 'http://www.ama-assn.org/go/cpt',
            code: x.code,
          }],
          text: x.text,
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        reasonCode: getReasons(x.snomed),
      },
    }
  ));
}

function getRequest(
  bundle,
  encounterId = '89284',
  fhirServer = 'http://hooks.smarthealthit.org',
  hook = 'order-select',
  patientId = 'MRI-59879846',
  userId = 'Practitioner/123',
) {
  return {
    hook,
    hookInstance: `${uuid.v4()}`,
    fhirServer,
    context: {
      userId,
      patientId,
      encounterId,
      selections: [`ServiceRequest/example-${patientId}`],
      draftOrders: {
        resourceType: 'Bundle',
        entry: getResources(bundle, patientId),
      },
    },
  };
}

module.exports = {
  s1r1: getRequest([{
    code: '72133',
    text: 'Lumbar spine CT',
    snomed: [{
      reasons: [
        { code: '279039007', display: 'Low back pain' },
      ],
    }],
  }]),

  s1r2: getRequest([{
    code: '70450',
    text: 'CT head without contrast',
    snomed: [{
      reasons: [
        { code: '25064002', display: 'Headache' },
        { code: '423341008', display: 'Optic disc edema' },
      ],
    }],
  }]),

  s1r3: getRequest([{
    code: '70544',
    text: 'Magnetic resonance angiography, head',
    snomed: [{
      reasons: [
        { code: '27355003', display: 'Toothache (finding)' },
      ],
    }],
  }]),
};
