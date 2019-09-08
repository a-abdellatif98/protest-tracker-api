const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const RepeatingEvent = require('../../lib/repeatingEvent');

lab.test('RepeatingEvent.getDates with start date', (done) => {
  const daysOfWeek = 'Tuesday';
  const startDate = new Date('2019-09-09');
  const dates = RepeatingEvent.getDates(daysOfWeek, startDate);

  const expected = [
    '2019-09-10',
    '2019-09-17',
    '2019-09-24',
    '2019-10-01'
  ];

  Code.expect(dates).to.equal(expected);
  done();
});

lab.test('RepeatingEvent.getDates with start and end dates', (done) => {
  const daysOfWeek = 'Tuesday';
  const startDate = new Date('2019-09-09');
  const endDate = new Date('2019-09-26');
  const dates = RepeatingEvent.getDates(daysOfWeek, startDate, endDate);

  const expected = [
    '2019-09-10',
    '2019-09-17',
    '2019-09-24'
  ];

  Code.expect(dates).to.equal(expected);
  done();
});
