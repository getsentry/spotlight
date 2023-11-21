# Contributing to Spotlight

## Local Setup

- `pnpm install`
- `pnpm build`

### Run Local Dev build

If you want to run this locally for development, you have to open two terminals and run the following commands:

1. Terminal 1: `pnpm dev:core`
2. Terminal 2: `pnpm dev:website`

Then you can find the website under http://localhost:4321/spotlight.

## Changesets

Spotlight uses [Changesets](https://github.com/changesets/changesets) to track changes & versions.

Whenever you make a change that is users facing, you should add a changeset to your PR. You can do this by runing the
following command:

```bash
pnpm changeset:add
```

This will guide you through the process to define the changeset. You have to select which package(s) are affected by
this change, if it is a patch/minor/major change, and provide a description for the change.

Note that not all PRs need a changeset (e.g. if you only write docs), and a PR can also have more than one changeset.

## Publishing

When you want to publish a new version, you need to trigger the
[Prepare Publish](https://github.com/getsentry/spotlight/actions/workflows/prepare-publish.yml) Github Action. This
action will open a PR with all versions bumped & changelogs updated according to the currently pending changesets. If
you approve & merge this PR, these versions will automatically be published to NPM.
