// const Event = require('../models/osdi/event');
const csvParse = require('csv-parse/lib/sync');
const fetch = require('node-fetch');

require('../lib/database'); // Has side effect of connecting to database

const importEvents = async function () {
  const csvFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRk9VzF_6cp_W3zcE_HkBBa5IpiHDLJk9Xx5J1y7OQ_pR_nZMjfuSZYgN4PhlNJNCF9EN-zdjpARtg/pub?gid=393144295&single=true&output=csv';
  console.log(`Loading ${csvFile}`);

  const csv = await fetch(csvFile)
    .then(response => response.text())
    .then(body => csvParse(body));

  console.log(`Found ${csv.length} events`);
};

importEvents();
