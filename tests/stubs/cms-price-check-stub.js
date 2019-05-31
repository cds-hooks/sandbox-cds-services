const rxnormSystem = 'http://www.nlm.nih.gov/research/umls/rxnorm';

const createRequestContext = (resourceType, system, code, id) => {
  let patientPropertyName = resourceType === 'MedicationOrder' ? 'patient' : 'subject';
  return {
    resource: {
      resourceType: resourceType,
      id: id || '123',
      [`${patientPropertyName}`]: { reference: 'Patient/patient-example' },
      medicationCodeableConcept: {
        coding: [
          {
            display: 'Some Arbitrary Medication',
            system: system,
            code: code,
          },
        ],
      },
    },
  };
};

const createContextWithMultipleCodings = () => {
  return {
    resource: {
      resourceType: 'MedicationOrder',
      id: '123',
      patient: { reference: 'Patient/patient-example' },
      medicationCodeableConcept: {
        coding: [
          {
            display: 'Some Arbitrary Medication',
            system: 'google.com',
            code: '123',
          },
          {
            display: 'Some Arbitrary Medication',
            system: rxnormSystem,
            code: '251374',
          },
        ],
      },
    },
  };
};

const createContextWithoutCoding = () => {
  return {
    resource: {
      resourceType: 'MedicationOrder',
      id: '123',
      patient: { reference: 'Patient/patient-example' },
      medicationCodeableConcept: {
        foo: 'foo',
      },
    },
  };
};

const createContextWithoutMedCode = () => {
  return {
    resource: {
      resourceType: 'MedicationOrder',
      id: '123',
      patient: { reference: 'Patient/patient-example' },
      medicationCodeableConcept: {
        coding: [
          {
            display: 'Some Arbitrary Medication',
            system: rxnormSystem
          },
        ],
      },
    },
  };
};

const createContextWithoutMedCodeableConcept = () => {
  return {
    resource: {
      resourceType: 'MedicationOrder',
      id: '123',
      patient: { reference: 'Patient/patient-example' },
    },
  };
};

const createContextWithoutPatientInMed = () => {
  return {
    resource: {
      resourceType: 'MedicationOrder',
      id: '123',
      medicationCodeableConcept: {
        coding: [
          {
            display: 'Some Arbitrary Medication',
            system: rxnormSystem,
            code: '251374'
          },
        ],
      },
    },
  };
};

const selectionReference = (resourceEntry) => {
  return resourceEntry.resource.resourceType + '/' + resourceEntry.resource.id;
};

const createResponseCard = (cost, newResource, savings) => {
  let summary = '';
  const source = {
    label: 'CMS Public Use Files'
  };
  if (newResource && savings) {
    summary = `Cost: $${cost}. Save $${savings} with a generic medication.`;
    return {
      summary: summary,
      source: source,
      indicator: 'info',
      suggestions: [
        {
          label: 'Change to generic',
          uuid: '123',
          actions: [
            {
              type: 'create',
              description: 'Create a resource with the newly suggested medication',
              resource: newResource
            }
          ]
        }
      ]
    }
  } else {
    summary = `Cost: $${cost}`;
    return {
      summary: summary,
      source: source,
      indicator: 'info'
    }
  }
};

module.exports = {
  /**
   * Medication Code Constants
   */
  // Has only generic, only has generic pricing
  codeWithGenericOnly: '251374', // Acetaminophen 80 MG Disintegrating Oral Tablet, cost $5

  // Has only brand, with only brand pricing
  codeWithBrandOnly: '199672', // Albendazole 200 MG Oral Tablet, cost $47

  // Has brand and generic, produces suggestion where generic is cheaper than brand
  codeWithBrandAndGeneric: '731370', // Acetaminophen 80 MG [Tylenol], cost $5, could save $1 on generic

  // Has brand and generic, only has brand pricing
  codeWithBrand: '207840', // tiopronin 100 MG Oral Tablet [Thiola], cost $306

  // Has brand and generic, only has generic pricing
  codeWithGeneric: '206605', // Mebendazole 100 MG Chewable Tablet [Vermox], Cost $23

  // Has brand and generic, brand is cheaper than generic
  codeWithCheaperBrand: '1046775', // 12 HR Hyoscyamine Sulfate 0.375 MG Extended Release Oral Tablet [Symax]

  // No code in list of rxnorm prices
  emptyCode: '0000',

  /**
   * Request Stubs
   */
  missingContext: {
    hook: 'order-select'
  },
  contextRequest: (code, resourceType, system) => {
    const resource = createRequestContext(resourceType || 'MedicationOrder', system || rxnormSystem, code);
    
    return {
      context: {
        patientId: 'patient-example',
        selections: [selectionReference(resource)],
        draftOrders: {
          resourceType: 'Bundle',
          entry: [
            resource,
          ]
        }
      }
    };
  },
  multipleContextRequestOneCard: (code, resourceType, system) => {
    const resource1 = createRequestContext(resourceType || 'MedicationOrder', system || rxnormSystem, code, '123');
    const resource2 = createRequestContext('MedicationOrder', 'http://google.com', code, '456');
    
    return {
      context: {
        patientId: 'patient-example',
        selections: [selectionReference(resource1), selectionReference(resource2)],
        draftOrders: {
          resourceType: 'Bundle',
          entry: [
            resource1,
            resource2,
          ],
        },
      },
    };
  },
  multipleCodingsInResource: {
    context: {
      patientId: 'patient-example',
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createContextWithMultipleCodings(),
        ],
      },
    },
  },
  createContextWithoutCoding: {
    context: {
      patientId: 'patient-example',
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createContextWithoutCoding(),
        ],
      },
    },
  },
  createContextWithoutCode: {
    context: {
      patientId: 'patient-example',
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createContextWithoutMedCode(),
        ],
      },
    },
  },
  createContextWithoutCodeableConcept: {
    context: {
      patientId: 'patient-example',
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createContextWithoutMedCodeableConcept(),
        ],
      },
    },
  },
  createContextWithoutPatient: {
    context: {
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createRequestContext('MedicationOrder', rxnormSystem, '251374', '123'),
        ],
      },
    },
  },
  createContextWithoutPatientInMed: {
    context: {
      patientId: 'patient-example',
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createContextWithoutPatientInMed(),
        ],
      },
    },
  },
  createContextWithPatientMismatch: {
    context: {
      patientId:'wrong-patient-example',
      selections: ['MedicationOrder/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createRequestContext('MedicationOrder', rxnormSystem, '251374', '123'),
        ],
      },
    },
  }, 
  createContextWithoutDraftOrders: {
    context: {
      patientId:'patient-example',
      selections: ['MedicationOrder/123']
    },
  },
  createContextWithoutSelections: {
    context: {
      patientId:'patient-example',
      selections: [],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createRequestContext('Patient', rxnormSystem, '251374'),
        ],
      },
    },
  },
  createContextWithWrongResourceType: {
    context: {
      patientId:'patient-example',
      selections: ['Patient/123'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          createRequestContext('Patient', rxnormSystem, '251374', '123'),
        ],
      },
    },
  },
  createContextWithoutBundleType: {
    context: {
      patientId: 'patient-example',
      selections: ['Patient/123'],
      draftOrders: [ createRequestContext('Patient', rxnormSystem, '251374', '123') ],
    },
  },
  createContextWithoutProperEntry: {
    context: {
      patientId: 'patient-example',
      selections: ['foo/1'],
      draftOrders: {
        resourceType: 'Bundle',
        entry: [
          {
            foo: 'foo',
          },
        ],
      },
    },
  },

  /**
   * Response Stubs
   */
  emptyResponse: {
    cards: []
  },
  cardsResponse: (cost) => {
    return (
      {
        cards: [
          createResponseCard(cost)
        ]
      }
    );
  }
};
