const csvParse = require('csv-parse/lib/sync');
const fetch = require('node-fetch');
const db = require('../lib/database'); // Has side effect of connecting to database
// const Event = require('../models/osdi/event');

// Main function
const importEvents = async function () {
  // This spreadsheet is fed by the "Add Event" Google Form linked on our site.
  const csvFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRk9VzF_6cp_W3zcE_HkBBa5IpiHDLJk9Xx5J1y7OQ_pR_nZMjfuSZYgN4PhlNJNCF9EN-zdjpARtg/pub?gid=393144295&single=true&output=csv';
  console.debug(`Loading ${csvFile}`);

  let eventData = await fetchAndParse(csvFile);
  console.log(`Found ${eventData.length} event data rows`);

  eventData = eventData.filter(eventApproved);
  console.log(`Found ${eventData.length} approved events`);

  eventData = ensureUniqueNames(eventData);
  console.log(`Found ${eventData.length} events with unique names`);

  //   .each(upsertEvent);
};

const columns = [
  'timestamp',
  'email',
  'organization',
  'title',
  'type',
  'repeating_or_single',
  'repeating_days_of_week',
  'repeating_start_time',
  'repeating_end_time',
  'single_start_time',
  'single_end_time',
  'location_name',
  'address',
  'city',
  'state',
  'map_url',
  'description',
  'event_url',
  'hashtags',
  'twitter_username',
  'approved',
  'unique_name'
];

const ensureUniqueNames = function(events) {
  let uniqueNames = [];

  return events.filter((evt) => {
    if (uniqueNames.includes(evt.unique_name)) {
      return false;
    } else {
      uniqueNames.push(evt.unique_name);
      return true;
    }
  });
};

const eventApproved = (evt) => evt.approved === 'Yes';

const fetchAndParse = async function(csvFile) {
  const parseOptions = {
    trim: true,
    skip_lines_with_error: true
  };

  const rows = await fetch(csvFile)
    .then(response => response.text())
    .then(body => csvParse(body, parseOptions));

  const colHeadings = rows[0].filter(heading => heading.length > 0);
  events = rows.slice(1);

  if (colHeadings.length !== columns.length) {
    throw(`ERROR: Expected ${columns.length} columns, but found ${colHeadings.length}.`);
  }

  return rows.map((row) => {
    let obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
};

importEvents()
  .then(() => db.disconnect())
  .catch((err) => {
    db.disconnect();
    console.error(err);
    process.exit(1);
  });
