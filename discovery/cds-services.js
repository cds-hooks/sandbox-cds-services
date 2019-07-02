const express = require('express');

const router = express.Router();
const serviceDefinitions = require('./service-definitions');
const patientGreetingService = require('../services/patient-greeting');
const cmsPriceCheck = require('../services/cms-price-check');
const pamaCheck = require('../services/pama-check');

// Discovery Endpoint
router.get('/', (request, response) => {
  const discoveryEndpointServices = {
    services: serviceDefinitions,
  };
  response.json(discoveryEndpointServices);
});

// Routes to patient-greeting CDS Service
router.use('/patient-greeting', patientGreetingService);
router.use('/cms-price-check', cmsPriceCheck);
router.use('/pama-imaging-select', pamaCheck);
router.use('/pama-imaging-sign', pamaCheck);

module.exports = router;
