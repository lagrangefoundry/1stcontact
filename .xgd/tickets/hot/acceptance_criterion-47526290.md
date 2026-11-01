---
uid: acceptance_criterion-47526290
id: AC-2162
type: acceptance_criterion
title: 1c builder and the package dev script start wrangler dev with the same env-file
  layering — .dev.vars then the secrets file (ONECONTACT_SECRETS or the default path)
  — from one shared definition
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T12:35:44.682309+00:00'
updated_at: '2026-11-01T12:35:44.682309+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c builder` and the root package dev script start `wrangler dev` with the same env-file layering. It comes from one shared definition, and the script is a caller of `1c builder`, not a second author of the layering.

- **Both files, in load order.** The `wrangler dev` invocation carries two `--env-file` flags:
  1. `.dev.vars` (the project's per-clone local-dev config), then
  2. the personal secrets file.

  Because the secrets file comes last, it wins, and it supplies the assistant's API key. Both flags are always passed. Naming only the secrets file would replace wrangler's default `.dev.vars` lookup and silently drop it.
- **Secrets path.**
  - When `ONECONTACT_SECRETS` is set and non-empty, its value is the secrets file.
  - Otherwise (unset or empty) the secrets file is `$HOME/Documents/secrets/1c.dev.env`.
- **One entry point.**
  - The root `dev:control` script invokes `1c builder`.
  - The control app package has no `dev` script of its own.

## Verification
Run `1c builder` with the process boundary (`spawn`) stubbed, and read the argv it would start. Confirm that:
- it is `wrangler dev --port 8788` followed by `--env-file .dev.vars --env-file <secrets>`, in that order;
- with `HOME` pointed at a scratch directory and no override, `<secrets>` is `<HOME>/Documents/secrets/1c.dev.env`;
- with `ONECONTACT_SECRETS=/some/path`, `<secrets>` is `/some/path`;
- with `ONECONTACT_SECRETS` set to the empty string, `<secrets>` falls back to the `$HOME` default.

Then read the root `package.json` and confirm `dev:control` runs `1c builder`. Read `apps/control-app/package.json` and confirm it declares no `dev` script.
