const express = require('express');
const cors = require('cors');

const getEnv = require('./environment');
const Issues = require('./issues');

const app = express();
const PORT = getEnv('PORT');
const CORS_ORIGIN = getEnv('CORS_ORIGIN', null);

class Server {
  constructor() {
	this.issueCache = new Issues();
	this.configureMiddleware();
	this.initializeRoutes();
  }

  configureMiddleware() {
    if (CORS_ORIGIN) {
      app.use(cors({
        origin: CORS_ORIGIN
      }));
    }
  }

  start() {
    app.listen(PORT, () => console.log(`listening on port ${PORT}!`));
  }

  initializeRoutes() {
    app.get('/github-issues', (req, res) => {
      let { category, query } = req.query;
      let results = this.issueCache.lookup({ category, query });
      res.json(results);
    });
  }

  setCache(newCache) {
    this.issueCache = newCache;
  }
}

module.exports = new Server();
