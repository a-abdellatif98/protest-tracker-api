require('dotenv').config();

const port = process.env.PORT || 8000;

module.exports = {
  port: port,
  baseUrl: process.env.BASE_URL || `http://localhost:${port}`,
  maxPageSize: Number(process.env.MAX_PAGE_SIZE) || 25,
  mongoUri: process.env.MONGODB_URI,
  s3ImageBucket: process.env.S3_BUCKET_NAME,
  eventTimeToLiveMs: 30 * 24 * 60 * 60 * 1000,
  facebookGraphApiVersion: process.env.FB_GRAPH_API_VERSION || '2.8',
  facebookGraphApiToken: process.env.FB_GRAPH_API_TOKEN,
  slackEndpoint: process.env.SLACK_ENDPOINT,
  emailAddress: process.env.SENDER_EMAIL_ADDRESS
};
