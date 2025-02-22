const geo = require('../../lib/geo');
const config = require('../../config');
const Event = require('../../models/osdi/event');
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment-timezone');
const ODATA = require('../../lib/odata');
const Boom = require('boom');

const OPTS_SCHEMA = Joi.object().keys({
  per_page: Joi.number().integer().min(1).default(config.maxPageSize),
  page: Joi.number().integer().min(0).default(0),
  $filter: Joi.string(),
  $orderby: Joi.string(),
  $top: Joi.number().integer(),
  $inlinecount: Joi.number().integer(),

  // No ODATA standard for geometric search
  distance_postal_code: Joi.string(),
  distance_city: Joi.string(),
  distance_coords: Joi.array().items(Joi.number().required(), Joi.number().required()),
  distance_max: Joi.number().integer()
});

const get = function (opts, next) {
  Joi.validate(opts.query, OPTS_SCHEMA, function (err, query) {
    if (err) handleError(next, 'validating', err);
    const searchFilter = ODATA.createFilter(query.$filter);
    const distanceFilter = createProximityFilter(
      'location.location',
       query
    );
    // Exclude cancelled events.
    const confirmedFilter = ODATA.createFilter("status eq 'confirmed'");
    const filter = _.merge(searchFilter, distanceFilter, confirmedFilter);
    const orderBy = ODATA.createOrderBy(query.$orderby);
    console.log(`mongo db filter = ${JSON.stringify(filter)} orderBy = ${JSON.stringify(orderBy)}`);
    Event.count(filter)
      .exec(function (err, count) {
        if (err) handleError(next, 'counting events', err);

        Event.find(filter)
          .sort(orderBy)
          .limit(query.per_page)
          .skip(query.per_page * query.page)
          .exec(function (err, osdiEvents) {
            if (err) handleError(next, 'finding events', err);
            const renderedEvents = osdiEvents.map(render);
            const response = {
              total_pages: Math.ceil(count / query.per_page),
              per_page: query.per_page,
              page: query.page,
              total_records: count,
              _embedded: {
                'osdi:events': renderedEvents
              }
            };
            next(null, response);
          });
      });
  });
};

const getOne = function (opts, next) {
  Event.count(opts.params)
    .exec(function (err, count) {
      if (err) handleError(next, 'counting event', err);

      Event.find(opts.params)
        .exec(function (err, osdiEvents) {
          if (err) handleError(next, 'finding event', err);
          if (osdiEvents.length === 0) {
            next(null, []);
          } else if (osdiEvents.length === 1) {
            next(null, render(osdiEvents[0]));
          } else {
            next('Too many events found for unique identifier');
          }
        });
    });
};

const render = function (osdiEvent) {
  const formatByTimezone = function (date, tz) {
    if (date) {
      var utcDate = moment.tz(date, 'UTC');
      if (tz) {
        return utcDate.tz(tz).format();
      } else {
        return utcDate.format();
      }
    } else {
      return undefined;
    }
  };

  const event = osdiEvent.toJSON();
  const tz = event.timezone;
  event.start_date = formatByTimezone(event.start_date, tz);
  event.end_date = formatByTimezone(event.end_date, tz);
  delete event.timezone;
  return event;
};

const create = {
  validate: {
    payload: {
      identifiers: [Joi.string()],
      origin_system: Joi.string(),
      // name of the event for administrative display
      name: Joi.string(),
      // title of event for public display
      title: Joi.string().required(),
      // may contain text and/or HTML
      description: Joi.string().required(),
      // text-only, single paragraph. For listing pages with not enough room for description
      summary: Joi.string(),
      browser_url: Joi.string(),
      // whether event requires tickets or is open RSVP
      type: Joi.string().valid('ticketed', 'open'),
      featured_image_url: Joi.string(),
      total_accepted: Joi.number(),
      status: Joi.string().valid('confirmed', 'tentatives', 'cancelled'),
      // instructions for event shown after people have RSVPed. Text and/or HTML
      instructions: Joi.string(),
      start_date: Joi.date(),
      end_date: Joi.date(),
      add_day_date: Joi.date(),
      add_day: Joi.boolean(),
      capacity: Joi.number(),
      guests_can_invite_others: Joi.boolean(),
      facebookLink: Joi.string(),
      date: Joi.date(),
      loc: Joi.string()
    }
  },
  handler: function (req, reply) {
    return new Event(req.payload).save()
      .then(function (e) {
        reply(e);
      })
      .catch(function (err) {
        console.log('err', err);
        throw new Error(err);
      });
  }
};

const createProximityFilter = function (fieldName, query) {
  if (!query) return {};

  const maxDistance = query.distance_max;
  let coord = query.distance_coords;
  const postalCode = query.distance_postal_code;
  let city = query.distance_city;

  if (!coord) {
    if (postalCode) {
      coord = geo.postalCodeToCoords(postalCode);
      if (coord == null) {
        throw Boom.badRequest('Unknwon ZIP code');
      }
    }

    if (city) {
      coord = geo.cityToCoords(city);
    }
  }
  const filter = {};
  if (fieldName && coord && maxDistance) {
    filter[fieldName] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coord[0], coord[1]]
        },
        $maxDistance: maxDistance
      }
    };
  }
  return filter;
};

const handleError = function (next, str, err) {
  console.log(str, err);
  next(err);
};

exports.create = create;
exports.get = get;
exports.getOne = getOne;

// visible for testing
exports.createProximityFilter = createProximityFilter;
exports.render = render;
