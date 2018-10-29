/*
  This is how we decide which issues from GitHub we should fetch and show.

  Each entry should have:

    repo:     the GitHub repo name.

    label:    the name of a label on that repo. We will only include issues
              that are tagged with the label.

    category: assigns the issues to the given category within our app. At the
              time of writing, the app shows the following categories, each on
              their own page: core, learning, community, rfcs,
              emberHelpWanted.
*/
const sources = [
  {
    repo: "ember-cli/ember-cli",
    label: "good first issue",
    category: "core",
  },
  {
    repo: "ember-cli/ember-twiddle",
    label: "good first issue",
    category: "community",
  },
  {
    repo: "ember-cli/ember-twiddle",
    label: "help wanted",
    category: "community",
  },
  {
    repo: "ember-engines/ember-engines",
    label: "help wanted",
    category: "community",
  },
  {
    repo: "ember-learn/ember-help-wanted",
    label: "good first issue",
    category: "emberHelpWanted",
  },
  {
    repo: "ember-learn/ember-help-wanted",
    label: "help wanted",
    category: "emberHelpWanted",
  },
  {
    repo: "ember-learn/ember-styleguide",
    label: "help wanted :sos:",
    category: "learning",
  },
  {
    repo: "ember-learn/guides-app",
    label: "help wanted",
    category: "learning",
  },
  {
    repo: "ember-learn/guides-source",
    label: "help wanted",
    category: "learning",
  },
  {
    repo: "emberjs/data",
    label: "Good for New Contributors",
    category: "core",
  },
  {
    repo: "emberjs/ember-inspector",
    label: "good for new contributors",
    category: "core",
  },
  {
    repo: "emberjs/ember-inspector",
    label: "help wanted",
    category: "core",
  },
  {
    repo: "emberjs/ember-optional-features",
    label: "good first issue",
    category: "core",
  },
  {
    repo: "emberjs/ember-optional-features",
    label: "help wanted",
    category: "core",
  },
  {
    repo: "emberjs/ember-test-helpers",
    label: "beginner-friendly",
    category: "core",
  },
  {
    repo: "emberjs/ember.js",
    label: "Good for New Contributors",
    category: "core",
  },
  {
    repo: "emberjs/ember.js",
    label: "Help Wanted",
    category: "core",
  },
  {
    repo: "emberjs/rfcs",
    label: "Final Comment Period",
    category: "rfcs",
  },
  {
    repo: "emberjs/rfcs",
    label: "Needs Champion",
    category: "rfcs",
  },
  {
    repo: "emberjs/website",
    label: "good first issue",
    category: "core",
  },
  {
    repo: "emberjs/website",
    label: "help wanted",
    category: "core",
  },
  {
    repo: "typed-ember/ember-cli-typescript",
    label: "good first issue",
    category: "community",
  },
  {
    repo: "typed-ember/ember-cli-typescript",
    label: "help wanted",
    category: "community",
  },
];

function gatherOrgs(sources) {
  let labels = {};
  for (let source of sources) {
    let org = source.repo.split("/")[0];
    if (!labels[source.label]) {
      labels[source.label] = [];
    }
    if (!labels[source.label].includes(org)) {
      labels[source.label].push(org);
    }
  }
  return labels;
}

const uniq = require('lodash/uniq');
const orgsByLabel = gatherOrgs(sources);

module.exports = {
  sources: sources.map(s => {
    s.label = s.label.toLowerCase();
    s.category = s.category.toLowerCase();
    return s;
  }),
  orgsByLabel,
  labels: Object.keys(orgsByLabel),
  categories: uniq(sources.map(source => source.category.toLowerCase()))
};
