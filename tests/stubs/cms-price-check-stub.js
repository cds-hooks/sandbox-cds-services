const rxnormSystem = 'http://www.nlm.nih.gov/research/umls/rxnorm';

const createRequestContext = (resourceType, system, code) => {
  return {
    resourceType: resourceType,
    patient: { reference: 'Patient/patient-example' },
    medicationCodeableConcept: {
      coding: [
        {
          display: 'Some Arbitrary Medication',
          system: system,
          code: code
        }
      ]
    }
  };
};

const createContextWithMultipleCodings = () => {
  return {
    resourceType: 'MedicationOrder',
    patient: { reference: 'Patient/patient-example' },
    medicationCodeableConcept: {
      coding: [
        {
          display: 'Some Arbitrary Medication',
          system: 'google.com',
          code: '123'
        },
        {
          display: 'Some Arbitrary Medication',
          system: rxnormSystem,
          code: '251374'
        }
      ]
    }
  }
};

const createContextWithoutCoding = () => {
  return {
    resourceType: 'MedicationOrder',
    patient: { reference: 'Patient/patient-example' },
    medicationCodeableConcept: {
      foo: 'foo'
    }
  }
};

const createContextWithoutMedCode = () => {
  return {
    resourceType: 'MedicationOrder',
    patient: { reference: 'Patient/patient-example' },
    medicationCodeableConcept: {
      coding: [
        {
          display: 'Some Arbitrary Medication',
          system: rxnormSystem
        }
      ]
    }
  }
};

const createContextWithoutPatientInMed = () => {
  return {
    resourceType: 'MedicationOrder',
    medicationCodeableConcept: {
      coding: [
        {
          display: 'Some Arbitrary Medication',
          system: rxnormSystem,
          code: '251374'
        }
      ]
    }
  }
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
    hook: 'medication-prescribe'
  },
  contextRequest: (code, resourceType, system) => {
    return {
      context: {
        patientId: 'patient-example',
        'medications': [ createRequestContext(resourceType || 'MedicationOrder', system || rxnormSystem, code) ]
      }
    };
  },
  multipleContextRequestOneCard: (code, resourceType, system) => {
    return {
      context: {
        patientId: 'patient-example',
        'medications': [
          createRequestContext(resourceType || 'MedicationOrder', system || rxnormSystem, code),
          createRequestContext('MedicationOrder', 'http://google.com', code)
        ]
      }
    };
  },
  multipleCodingsInResource: {
    context: {
      patientId: 'patient-example',
      'medications': [createContextWithMultipleCodings()]
    }
  },
  createContextWithoutCoding: {
    context: {
      patientId: 'patient-example',
      'medications': [ createContextWithoutCoding() ]
    }
  },
  createContextWithoutCode: {
    context: {
      patientId: 'patient-example',
      'medications': [ createContextWithoutMedCode() ]
    }
  },
  createContextWithoutPatient: {
    context: {
      'medications': [ createRequestContext('MedicationOrder', rxnormSystem, '251374') ]
    }
  },
  createContextWithoutPatientInMed: {
    context: {
      patientId: 'patient-example',
      'medications': [ createContextWithoutPatientInMed() ]
    }
  },
  createContextWithPatientMismatch: {
    context: {
      patientId:'wrong-patient-example',
      'medications': [ createRequestContext('MedicationOrder', rxnormSystem, '251374') ]
    }
  },
  createContextWithoutMedicationsInProgress: {
    context: {
      patientId:'patient-example'
    }
  },
  createContextWithWrongResourceType: {
    context: {
      patientId:'patient-example',
      'medications': [ createRequestContext('Patient', rxnormSystem, '251374') ]
    }
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
