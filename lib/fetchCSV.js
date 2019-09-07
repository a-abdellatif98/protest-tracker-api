const csvParse = require('csv-parse/lib/sync');
const fetch = require('node-fetch');

const fetchAndParse = async function (csvURL, columns) {
  const parseOptions = {
    trim: true,
    skip_lines_with_error: true
  };

  const rows = await fetch(csvURL)
    .then(response => response.text())
    .then(body => csvParse(body, parseOptions));

  const colHeadings = rows[0].filter(heading => heading.length > 0);
  const nonHeadingRows = rows.slice(1);

  if (colHeadings.length !== columns.length) {
    throw new Error(`Expected ${columns.length} columns, but found ${colHeadings.length}.`);
  }

  // Zip columns and rows into an array of objects
  return nonHeadingRows.map((row) => {
    let obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
};

module.exports = fetchAndParse;
