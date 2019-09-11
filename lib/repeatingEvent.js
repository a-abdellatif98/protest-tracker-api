const moment = require('moment');

/* Returns an array of dates which are the specified `daysOfWeek` and fall between the
  specified startDate and endDate. Dates default to "now until 30 days from now".
  startDate and endDate should be moments, or endDate may be undefined.
 */
const getDates = function (daysOfWeek, startDate = moment(), endDate) {
  let validDates = [];

  if (!endDate) {
    endDate = moment(startDate).add(30, 'd');
  }

  const numDays = endDate.diff(startDate, 'days');

  for (let i = 0; i < numDays; i++) {
    let dayInQuestion = startDate;
    // console.debug(`Testing ${dayInQuestion}`);
    if (daysOfWeek.includes(dayInQuestion.format('dddd'))) {
      validDates.push(new Date(dayInQuestion));
    }

    dayInQuestion.add(1, 'days');
  }
  // console.debug(`For days of week ${days_of_week}, valid dates in next 10 days are`);
  // console.debug(validDates);

  return validDates.map(date => moment(date).format('YYYY-MM-DD'));
};

module.exports = { getDates };
