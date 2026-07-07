# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

To record a change for the next release, run `pnpm changeset` and follow the
prompts — it writes a markdown file here describing the version bump (patch /
minor / major) for the affected packages. The **release/publish packages**
workflow consumes these on merge to `main`: it opens a "Version Packages" PR
that applies the bumps and updates changelogs, and publishes to npm when that PR
is merged.
