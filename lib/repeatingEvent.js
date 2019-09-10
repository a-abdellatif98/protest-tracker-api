const moment = require('moment');

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* Returns an array of dates which are the specified `daysOfWeek` and fall between the
  specified startDate and endDate. Dates default to "now until 30 days from now".
 */
const getDates = function (daysOfWeek, startDate = new Date(), endDate) {
  let validDates = [];

  if (endDate) {
    endDate = moment(endDate);
  } else {
    endDate = moment(startDate).add(30, 'd');
  }

  const numDays = endDate.diff(startDate, 'days');

  for (let i = 0; i < numDays; i++) {
    let dayInQuestion = startDate;

    // console.debug(`Testing ${dayInQuestion}`);
    if (daysOfWeek.includes(days[dayInQuestion.getDay()])) {
      validDates.push(new Date(dayInQuestion));
    }

    dayInQuestion.setDate(dayInQuestion.getDate() + 1);
  }
  // console.debug(`For days of week ${days_of_week}, valid dates in next 10 days are`);
  // console.debug(validDates);

  return validDates.map(date => moment(date).format('YYYY-MM-DD'));
};

module.exports = { getDates };
