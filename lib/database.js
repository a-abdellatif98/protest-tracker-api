const bluebird = require('bluebird');
const mongoose = require('mongoose');
const config = require('../config');

mongoose.Promise = bluebird;
mongoose.connect(config.mongoUri, { useMongoClient: true })
  .then(
    () => console.log('Connection with database succeeded'),
    err => console.error(`Connection error - ${err}`)
  );

module.exports = mongoose;
