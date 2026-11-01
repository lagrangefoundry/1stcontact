---
uid: acceptance_criterion-764c4c41
id: AC-2164
type: acceptance_criterion
title: 1c builder composes the same wrangler dev argv from any working directory,
  and --port/--remote keep their meaning
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T12:35:49.559566+00:00'
updated_at: '2026-11-01T12:41:14.484573+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c builder` builds the same `wrangler dev` invocation whatever directory it is typed in. Its `--port` and `--remote` options keep their meanings next to the env-file layering.

- **Working directory doesn't matter.** The control app directory comes from the repository root, not the caller's working directory. Run from the repo root or from any subdirectory, `1c builder` starts `wrangler dev` in the control app directory with an identical argv. This is what lets the root `dev:control` script call it without a hidden "must be run from the root" precondition.
- **`--port`.** `--port <n>` sets the dev-server port. The default is 8788.
- **`--remote`.** `--remote` is appended after the env-file flags. The startup banner reports the store as `REMOTE — this edits production data`. Without `--remote`, the store is local and no `--remote` flag is passed.

## Verification
Run `1c builder --remote` with `spawn` stubbed, once from the repository root and once from a different working directory. Confirm that:
- both runs spawn with the same `cwd` (the control app directory) and an identical argv;
- the argv contains both `--env-file` flags, followed by `--remote`;
- the banner names the remote store.