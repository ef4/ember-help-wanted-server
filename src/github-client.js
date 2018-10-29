const octokit = require('@octokit/rest')();

const { labels, orgsByLabel } = require('./config');
const getEnv = require('./environment');
const Issues = require('./issues');

const API_TOKEN = getEnv('GITHUB_API_TOKEN');
const PAGE_SIZE = 100; // Github's max is 100
const MAX_PAGE_COUNT = 10; // Github's max record depth is 1000

let client;
module.exports = function() {
  if (client) {
    return client;
  }
  client = new GithubClient(octokit);
  return client;
}

class GithubClient {
  constructor(api) {
    this.api = api;

    this.api.authenticate({
      type: 'token',
      token: API_TOKEN
    });
  }

  buildQuery(label) {
    let orgQuery = orgsByLabel[label].map(org => `org:${org}`).join(' ');
    return `is:open ${orgQuery} label:"${label}"`;
  }

  async fetchIssuePage(label, page) {
    let query = this.buildQuery(label);

    let response = await octokit.search.issues({
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: PAGE_SIZE,
      page
    });
    return response.data.items;
  }

  async fetchAllIssues(label, saveIssues) {
    let page = 0;
    let moreItems = true;
    let underPageLimit = true;

    while(moreItems && underPageLimit) {
      page++;
      let pageData = await this.fetchIssuePage(label, page);

      saveIssues(pageData);

      moreItems = pageData.total_count > (pageData.length * page);
      underPageLimit = page < MAX_PAGE_COUNT;
    }
  }

  async fetchIssueSet() {
    let issues = new Issues();
    let save = issues.addIssues.bind(issues);
    await Promise.all(labels.map(label => this.fetchAllIssues(label, save)));
    return issues;
  }

  async getRateLimit() {
    return await this.api.misc.getRateLimit({});
  }
}