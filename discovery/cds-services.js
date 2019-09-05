const express = require('express');

const router = express.Router();
const serviceDefinitions = require('./service-definitions');
const cmsPriceCheck = require('../services/cms-price-check');
const pamaImagingService = require('../services/pama-imaging');
const patientGreetingService = require('../services/patient-greeting');

// Discovery Endpoint
router.get('/', (request, response) => {
  const discoveryEndpointServices = {
    services: serviceDefinitions,
  };
  response.json(discoveryEndpointServices);
});

// Routes to patient-greeting CDS Service
router.use('/cms-price-check', cmsPriceCheck);
router.use('/pama-imaging', pamaImagingService);
router.use('/patient-greeting', patientGreetingService);

module.exports = router;
