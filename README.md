# Sandbox CDS Services

[![Build](https://img.shields.io/travis/cds-hooks/sandbox-cds-services.svg)](https://travis-ci.org/cds-hooks/sandbox-cds-services)
[![Coverage](https://img.shields.io/coveralls/github/cds-hooks/sandbox-cds-services.svg)](https://coveralls.io/github/cds-hooks/sandbox-cds-services?branch=master)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/cds-hooks/sandbox-cds-services.svg)](https://codeclimate.com/github/cds-hooks/sandbox-cds-services)
[![Dependencies](http://img.shields.io/gemnasium/cds-hooks/sandbox-cds-services.svg)](https://gemnasium.com/cds-hooks/sandbox-cds-services)


This repository hosts the default CDS Services configured for the [CDS Hooks Sandbox](http://sandbox.cds-hooks.org) tool. These services are spun up by a Node.js application hosted on Google App Engine.

## Getting Started
Once you clone the repository down to your machine, run the following command to install all necessary dependencies for the project.
```javascript
npm install
```

Once the dependencies are installed locally, you can run the server on localhost.
```javascript
npm run dev
```

You can test out this app from `http://localhost:3000`. Try hitting the discovery endpoint at `http://localhost:3000/cds-services`.

## Testing and Linting
The JavaScript linter configured for this project is [ESlint](https://eslint.org/), which uses the [Airbnb JavaScript](https://github.com/airbnb/javascript) style guide to correct and standardize JavaScript code. 

To lint:
```javascript
npm run lint
```
This project contains unit tests using the [Jest](https://facebook.github.io/jest/) library. Discovery and CDS Service endpoints are tested by each route and expected behavior.

To test:
```javascript
npm run test
```

## CDS Services
The following services are configured for this application:

`patient-greeting`: A CDS Service configured for the `patient-view` hook. The service prefetches the Patient resource of the patient in context of the EHR and returns a proper greeting that displays what patient is being seen by the current provider.

To add another default service for the CDS Hooks Sandbox:

1. Add the service definition to the `/discovery/service-definitions.json` file (metadata for the services found at the discovery endpoint)
2. Create the service endpoint route in a new file under the `/services` directory
3. Add a test file to test the service endpoint route under the `/tests` directory

## License

Copyright 2017 Cerner Innovation, Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
