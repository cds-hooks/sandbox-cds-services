const express = require('express');

const router = express.Router();
const serviceDefinitions = require('./service-definitions');
const patientGreetingService = require('../services/patient-greeting');

// Discovery Endpoint
router.get('/', (request, response) => {
  const discoveryEndpointServices = {
    services: serviceDefinitions,
  };
  response.json(discoveryEndpointServices);
});

// Routes to patient-greeting CDS Service
router.use('/patient-greeting', patientGreetingService);

module.exports = router;
