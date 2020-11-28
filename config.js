module.exports = {
  "API_PORT": 8081,
  "API_URL": "localhost",

  "WEB_PORT": 8080,
  "WEB_URL": "localhost",

  "JWT_TOKEN_SECRET": "enter secret phrase here",

  "DATA_STORE_ENABLED": true,
  "DEFAULT_DATA_FETCH_RANGE": (60000 * 60 * 24 * 7 * 4), /* 4 weeks */
  "RUN_PIPELINE_ON_CLOSE_ONLY": true
};
