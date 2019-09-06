const csvParse = require('csv-parse/lib/sync');
const fetch = require('node-fetch');
const db = require('../lib/database'); // Has side effect of connecting to database
const Event = require('../models/osdi/event');

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

  // One record may become many, so collect and flatten them/
  const osdiEvents = eventData.map(eventToOSDI).reduce((e,a) => a.concat(e), []);
  console.debug(osdiEvents);

  // osdiEvents.forEach(upsertEvent);
};

const columns = [
  'timestamp',
  'email',
  'organization',
  'title',
  'type',
  'repeating_or_single',
  'repeating_start_date',
  'repeating_end_date',
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

const eventToOSDI = function(evt) {
  const originSystem = 'pt_evt_db_ss';
  let dates, repeating;
  switch (evt.repeating_or_single) {
    case 'One-time':
      repeating = false;
      dates = [new Date(evt.single_start_time)];
      break;
    case 'Repeating':
      repeating = true;
      const days_of_week = evt.repeating_days_of_week.split(',').map(day => day.trim());
      dates = getRepeatingDates(days_of_week);
      break;
    default:
      console.error(`ERROR: Invalid value for evt.repeating_or_single ${evt.repeating_or_single}`);
  }

  return dates.map(date => {
    const dateStr = date.toISOString().replace(/T.*$/, '');
    let startDate;
    if (repeating) {
      startDate = new Date(`${dateStr}T${evt.repeating_start_time}`);
    } else {
      startDate = new Date(evt.single_start_time);
    }
    const identifier = `${originSystem}:${evt.unique_name}:${dateStr}`;

    // TODO: Figure out if we need zip codes
    // TODO: Geocode addresses (maybe use geo.js)
    // TODO: Figure out if timezones are an issue. I suspect they are not.
    return new Event({
      identifiers: [identifier],
      origin_system: originSystem,
      name: evt.title,
      title: evt.title,
      description: evt.description,
      summary: evt.description,
      browser_url: evt.event_url,
      type: 'open',
      status: 'confirmed',
      start_date: startDate
      // end_date: facebookEvent.end_time ? new Date(facebookEvent.end_time) : undefined,
      // all_day_date
      // all_day
      // capacity
      // guests_can_invite_others: facebookEvent.can_guests_invite,
      // transparence
      // visibility
      // location: evt.osdiLocation,
      // reminders
      // share_url
      // total_shares
      // share_options
      // timezone: evt.timezone,
      // contact: osdiContact
    });
  });
};

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

  // Zip columns and rows into an array of objects
  return rows.map((row) => {
    let obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const getRepeatingDates = function(days_of_week) {
  let validDates = [];
  let dayInQuestion;
  for (let i = 0; i < 30; i++) {
    dayInQuestion = new Date();
    dayInQuestion.setDate(dayInQuestion.getDate() + i);

    // console.debug(`Testing ${dayInQuestion}`);
    if (days_of_week.includes(days[dayInQuestion.getDay()])) {
      validDates.push(dayInQuestion);
    }
  }
  // console.debug(`For days of week ${days_of_week}, valid dates in next 10 days are`);
  // console.debug(validDates);
  return validDates;
};

const upsertEvent = function(osdiEvent) {
  const query = { identifiers: { $in: [osdiEvent.identifiers[0]] } };
  Event.upsert(query, osdiEvent, function (err, doc) {
    if (err) { return console.error(`ERROR upserting: ${err}`) };
    console.log(`Successfully upserted ${doc.title}`);
  });
};

importEvents()
  .then(() => db.disconnect())
  .catch((err) => {
    db.disconnect();
    console.error(err);
    process.exit(1);
  });
