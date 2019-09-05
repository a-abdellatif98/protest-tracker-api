const csvParse = require('csv-parse/lib/sync');
const fetch = require('node-fetch');
const db = require('../lib/database'); // Has side effect of connecting to database
// const Event = require('../models/osdi/event');

const columns = [

];

const importEvents = async function () {
  const csvFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRk9VzF_6cp_W3zcE_HkBBa5IpiHDLJk9Xx5J1y7OQ_pR_nZMjfuSZYgN4PhlNJNCF9EN-zdjpARtg/pub?gid=393144295&single=true&output=csv';
  console.log(`Loading ${csvFile}`);

  const parseOptions = {
    trim: true,
    skip_lines_with_error: true
  };

  const rows = await fetch(csvFile)
    .then(response => response.text())
    .then(body => csvParse(body, parseOptions));

  colHeadings = rows[0];
  events = rows.slice(1);

  console.log(`Found ${events.length} events`);

  if (colHeadings.length !== columns.length) {
    throw(`ERROR: Expected ${columns.length} columns, but found ${colHeadings.length}.`);
  }
};

importEvents()
  .then(() => db.disconnect())
  .catch((err) => {
    db.disconnect();
    console.error(err);
    process.exit(1);
  });
