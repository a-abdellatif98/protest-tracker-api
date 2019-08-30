# Protest Tracker API - Dev Setup

1. Clone repo from Github to your machine. `git clone git@github.com:sosamerica2019/protest-tracker-api.git`
1. `cd protest-tracker-api`
1. Install required node version (from /.node-version) or install [nodenv][1] and run `nodenv install`.
1. Install [yarn package manager][2]
1. Install dependencies: `yarn install`
1. Install semistandard linter: `yarn install semistandard -g`

[1]: https://github.com/nodenv/nodenv#installation
[2]: https://yarnpkg.com/en/docs/install

## Deployment setup

1. Install [Heroku CLI][3]
1. Make sure you've been invited to the projects.
1. `heroku git:remote -a protest-tracker-api-stg -r stg`
1. `heroku git:remote -a protest-tracker-api-prd -r prd`

[3]: https://devcenter.heroku.com/articles/heroku-cli#download-and-install

## Deploying changes

1. Merge changes to `master` branch.
1. Stage changes with `git push stg master:master`
1. Release current master branch to production: `git push prd master:master`