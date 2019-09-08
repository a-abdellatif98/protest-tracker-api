const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const moment = require('moment');
const RepeatingEvent = require('../../lib/repeatingEvent');

lab.test('RepeatingEvent.getDates with start date', (done) => {
  const daysOfWeek = 'Tuesday';
  const startDate = new Date('2019-09-09');
  const dates = RepeatingEvent.getDates(daysOfWeek, startDate)
    .map(date => moment(date).format('YYYY-MM-DD'));

  const expected = [
    '2019-09-10',
    '2019-09-17',
    '2019-09-24',
    '2019-10-01',
  ];

  Code.expect(dates).to.equal(expected);
  done();
});

lab.test('RepeatingEvent.getDates with start and end dates', (done) => {
  const daysOfWeek = 'Tuesday';
  const startDate = new Date('2019-09-09');
  const endDate = new Date('2019-09-26');
  const dates = RepeatingEvent.getDates(daysOfWeek, startDate, endDate)
    .map(date => moment(date).format('YYYY-MM-DD'));

  const expected = [
    '2019-09-10',
    '2019-09-17',
    '2019-09-24'
  ];

  Code.expect(dates).to.equal(expected);
  done();
});