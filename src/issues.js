const { sources, categories } = require("./config");
const kebabCase = require("lodash/kebabCase");

module.exports = class Issues {
  constructor() {
    // These map from IDs to json:api formatted resources.
    this.issues = new Map();
    this.labels = new Map();
    this.categories = new Map();

    // This is our inverted search index that powers lookup. The keys are our
    // own internal encoded representations of things we want to search for, the
    // values are Sets of issues ids.
    this.searchIndex = new Map();
  }

  addIssues(githubResponse) {
    for (let issue of githubResponse) {
      this._processIssue(issue);
    }
  }

  _processIssue(rawIssue) {
    let { attributes, relationships } = this._issueFields(rawIssue);
    let issue = {
      type: "github-issues",
      id: rawIssue.id,
      attributes,
      relationships,
    };
    this._saveIssue(issue);
  }

  _issueFields(rawIssue) {
    let attributes = {
      "repository-name": rawIssue["repository_url"].replace(
        "https://api.github.com/repos/",
        ""
      ),
      "repository-html": rawIssue["repository_url"].replace(
        "api.github.com/repos",
        "github.com"
      ),
    };
    let relationships = {};
    for (let [fieldName, value] of Object.entries(rawIssue)) {
      switch (fieldName) {
        case "labels":
          if (value) {
            value = value.map(v =>
              this._processLabel(attributes["repository-name"], v)
            );
          } else {
            value = [];
          }
          relationships[fieldName] = { data: value };
          break;
        case "id":
          break;
        default:
          attributes[kebabCase(fieldName)] = value;
      }
    }
    return { attributes, relationships };
  }

  _saveIssue(issue) {
    this.issues.set(issue.id, issue);
    for (let { id: labelId } of issue.relationships.labels.data) {
      let categoryRef = this.labels.get(labelId).relationships.category.data;
      if (categoryRef) {
        this._addToSearchIndex(`category:${this.categories.get(categoryRef.id).attributes.name}`, issue.id);
      }
    }
  }

  _addToSearchIndex(key, value) {
    let set = this.searchIndex.get(key);
    if (set) {
      set.add(value);
    } else {
      this.searchIndex.set(key, new Set([value]));
    }
  }

  _processLabel(repoName, rawLabel) {
    let label = {
      type: "labels",
      id: rawLabel.id,
      attributes: {},
      relationships: {
        category: {
          data: this._processCategory(repoName, rawLabel.name.toLowerCase()),
        },
      },
    };
    for (let [fieldName, value] of Object.entries(rawLabel)) {
      switch (fieldName) {
        case "id":
          break;
        default:
          label.attributes[kebabCase(fieldName)] = value;
      }
    }
    this.labels.set(label.id, label);
    return { type: label.type, id: label.id };
  }

  _processCategory(repoName, labelName) {
    let source = sources.find(
      source =>
        source.repo === repoName && source.label === labelName
    );
    if (source) {
      let id = categories.indexOf(source.category);
      if (!this.categories.has(id)) {
        this.categories.set(id, {
          type: "categories",
          id,
          attributes: {
            name: source.category,
          },
        });
      }
      return { type: "categories", id };
    }
    return null;
  }

  lookup({ category }) {
    const ALL_ISSUES = {};
    let requiredKeys = [];
    if (category) {
      requiredKeys.push(`category:${category.toLowerCase()}`);
    }
    let matchingIssues = requiredKeys.reduce((matchingSet, key) => {
      if (matchingSet === ALL_ISSUES) {
        return this.searchIndex.get(key) || new Set();
      } else if (matchingSet.size === 0) {
        return matchingSet;
      } else {
        let nextSet = this.searchIndex.get(key);
        if (!nextSet) {
          return new Set();
        } else {
          return intersection(matchingSet, nextSet);
        }
      }
    }, ALL_ISSUES);

    if (matchingIssues === ALL_ISSUES) {
      return this._formatResponse([...this.issues.values()]);
    } else {
      return this._formatResponse([...matchingIssues].map(id => this.issues.get(id)));
    }
  }

  _formatResponse(issues) {
    return {
      meta: {
        total: issues.length
      },
      data: issues,
      included: this._included(issues),
    };
  }

  _included(issues) {
    let included = new Set();
    for (let issue of issues) {
      for (let { id } of issue.relationships.labels.data) {
        let label = this.labels.get(id);
        included.add(label);
        let categoryRef = label.relationships.category.data;
        if (categoryRef) {
          included.add(this.categories.get(categoryRef.id));
        }
      }
    }
    return [...included.values()];
  }
};

function intersection(setA, setB) {
  let result = new Set();
  for (let element of setA) {
    if (setB.has(element)) {
      result.add(element);
    }
  }
  return result;
}
