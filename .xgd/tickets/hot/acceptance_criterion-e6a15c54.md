---
uid: acceptance_criterion-e6a15c54
id: AC-2228
type: acceptance_criterion
title: 1c reset previews without --yes, removes only the local state directories with
  --yes (public-site only with --include-public), never touches storage/, refuses
  while the dev port is listening, reports an absent store as already empty, and resolves
  paths from the repo root
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:29:48.085878+00:00'
updated_at: '2026-11-01T20:47:56.123471+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

`1c reset` is the one deliberate way to return the **local** dev store to a
known-empty state.

- **Without `--yes` it is a preview.** It prints each state directory it would
  remove, with its absolute path, file count and size, lists the `storage/`
  directories it will never touch, deletes nothing, and exits 0. The preview does
  not probe the port: it changes nothing a live server could be hurt by.
- **With `--yes` it removes `apps/control-app/.wrangler/state`**, and also
  `apps/public-site/.wrangler/state` only when `--include-public` is passed. It
  then names what it removed and prints the next step — seed it with
  `bin/publish`.
- **It never touches `storage/`** — not `storage/sites`, `storage/chat` nor
  `storage/references` — under any flag.
- **It refuses while something is listening on the dev port** (`--port`, default
  8788), detected by a TCP connect. The refusal says *something* is listening
  (not that it is the builder), explains that deleting under a live server
  corrupts the store, states nothing was deleted, names `--port` as the way past
  a port that belongs to something else, and exits non-zero. A port nothing
  answers on permits the reset. A `--port` that is not a positive number is
  refused as a usage error.
- **An absent state directory is a successful reset.** It is shown as "already
  empty" in the preview; with `--yes`, nothing is removed and the command reports
  the local dev store was already empty and exits 0.
- **It is repo-anchored.** The directories it names and removes are resolved from
  the repository root, identically whatever the working directory it is run from.

## Verification

With populated control-app and public-site state directories, run `1c reset`
without `--yes`: assert exit 0, both are still present, and the output names the
control-app directory with its file count and size (and not the public-site one).
Run with `--yes`: assert the control-app state is gone, the public-site state and
`storage/` are untouched. Run with `--yes --include-public`: assert the public-site
state is gone too.

With a listener on the given port, run with `--yes`: assert refusal, non-zero exit
and every directory still present. Assert the port probe answers true for a
listening port and false for a closed one.

With no state directory, run with `--yes`: assert it reports already empty and
exits 0. Run from a subdirectory of the repo and assert the directories named are
the repo-root ones.