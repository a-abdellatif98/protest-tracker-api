const moment = require('moment-timezone');
const db = require('../lib/database'); // Has side effect of connecting to database
const geo = require('../lib/geo');
const fetchCSV = require('../lib/fetchCSV');
const getRepeatingDates = require('../lib/repeatingEvent').getDates;
const Event = require('../models/osdi/event');

// Main function
const importEvents = async function () {
  // This spreadsheet is fed by the "Add Event" Google Form linked on our site.
  const csvFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRk9VzF_6cp_W3zcE_HkBBa5IpiHDLJk9Xx5J1y7OQ_pR_nZMjfuSZYgN4PhlNJNCF9EN-zdjpARtg/pub?gid=393144295&single=true&output=csv';

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

  console.debug(`Loading ${csvFile}`);
  let eventData = await fetchCSV(csvFile, columns);
  console.log(`Found ${eventData.length} event data rows`);

  eventData = eventData.filter(eventApproved);
  console.log(`Found ${eventData.length} approved events`);

  eventData = ensureUniqueNames(eventData);
  console.log(`Found ${eventData.length} events with unique names`);

  const nestedOSDIEvents = await Promise.all(eventData.map(eventToOSDI));
  // Each "nested" event is an array of events. Flatten them.
  const osdiEvents = nestedOSDIEvents.reduce((e, a) => a.concat(e), []);

  osdiEvents.forEach(upsertEvent);
};

const ensureUniqueNames = function (events) {
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

const eventToOSDI = async function (evt) {
  const originSystem = 'pt_evt_db_ss';
  let dates, repeating;
  switch (evt.repeating_or_single) {
    case 'One-time':
      repeating = false;
      dates = [new Date(evt.single_start_time)];
      break;
    case 'Repeating':
      repeating = true;
      const daysOfWeek = evt.repeating_days_of_week.split(',').map(day => day.trim());
      // TODO: Incorporate start and end dates
      dates = getRepeatingDates(daysOfWeek);
      break;
    default:
      console.error(`ERROR: Invalid value for evt.repeating_or_single ${evt.repeating_or_single}`);
  }

  const fullAddrStr = `${evt.adddress}, ${evt.city}, ${evt.state}`;
  const geoAddr = (await geo.addressToGeocodedLocation(fullAddrStr));
  const location = {
    venue: evt.location_name,
    address_lines: [ evt.address ],
    locality: evt.city,
    region: evt.state,
    postal_code: geoAddr.zipcode,
    country: geoAddr.countryCode,
    location: {
      latitude: geoAddr.latitude,
      longitude: geoAddr.longitude
    },
    public: true
  };
  const timezone = geoAddr.timezone;

  return dates.map(date => {
    const dateStr = date.toISOString().replace(/T.*$/, '');
    let startDate, endDate;
    if (repeating) {
      const format = 'YYYY-MM-DD HH:mm:ss A';
      startDate = moment.tz(`${dateStr} ${evt.repeating_start_time}`, format, timezone);
      if (evt.repeating_end_time.length) {
        endDate = moment.tz(`${dateStr} ${evt.repeating_end_time}`, format, timezone);
      }
    } else {
      const format = 'YYYY-MM-DD HH:mm';
      startDate = moment.tz(evt.single_start_time, format, timezone);
      endDate = moment.tz(evt.single_end_time, format, timezone);
    }
    const identifier = `${originSystem}:${evt.unique_name}:${dateStr}`;

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
      start_date: startDate.utc(),
      end_date: endDate.utc(),
      transparence: 'transparent',
      visibility: 'public',
      location: location,
      timezone: timezone
    });
  });
};

const upsertEvent = function (osdiEvent) {
  const query = { identifiers: { $in: [osdiEvent.identifiers[0]] } };
  Event.upsert(query, osdiEvent, function (err, doc) {
    if (err) { return console.error(`ERROR upserting: ${err}`); }
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
