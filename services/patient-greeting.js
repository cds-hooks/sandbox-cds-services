const express = require('express');

const router = express.Router();

function isValidRequest(request) {
  const data = request.body;
  if (!(data && data.prefetch && data.prefetch.patient && data.prefetch.patient.resource)) {
    return false;
  }
  const patient = data.prefetch.patient.resource;
  return patient.name && patient.name[0] && patient.name[0].given && patient.name[0].given[0];
}

// CDS Service endpoint
router.post('/', (request, response) => {
  if (!isValidRequest(request)) {
    response.sendStatus(412);
    return;
  }
  const data = request.body;
  const patient = data.prefetch.patient.resource;
  const name = patient.name[0].given[0];
  const card = {
    cards: [{
      summary: `Now seeing: ${name}`,
      source: {
        label: 'Patient greeting service',
      },
      indicator: 'info',
    }],
  };
  response.json(card);
});

module.exports = router;
