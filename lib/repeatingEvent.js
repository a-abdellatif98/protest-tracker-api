const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const getDates = function(days_of_week) {
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

module.exports = { getDates };