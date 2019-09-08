const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const moment = require('moment');
const RepeatingEvent = require('../../lib/repeatingEvent');

lab.test('RepeatingEvent.getDates', (done) => {
  const daysOfWeek = 'Tuesday';
  const dates = RepeatingEvent.getDates(daysOfWeek)
    .map(date => moment(date).format('YYYY-MM-DD'));

  const expected = [
    '2019-09-10',
    '2019-09-17',
    '2019-09-24',
    '2019-10-01'
  ];

  Code.expect(dates).to.equal(expected);
  done();
});