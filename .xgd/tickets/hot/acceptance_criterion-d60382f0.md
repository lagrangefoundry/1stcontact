---
uid: acceptance_criterion-d60382f0
id: AC-2064
type: acceptance_criterion
title: '1c serve is not a command: refused as unknown with usage and exit 1, binds
  no port; help offers only the Worker-based builder'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-30T18:55:46.496399+00:00'
updated_at: '2026-10-30T20:30:53.434239+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c serve` is not a command. The CLI offers no raw-server way to look at a site; the only supported way to serve a site is a Worker.

- **Refused as unknown.** Invoking `1c serve <slug>` is refused as an unknown command:
  - stderr carries `Unknown command: serve`, followed by the CLI's usage text;
  - the process exits with status 1;
  - no port is bound, and nothing is rendered or served.
- **Help text.**
  - The help has no `1c serve` command line.
  - What it offers instead is `1c builder`, which starts `wrangler dev` (the same routes, store and runtime production uses).
  - Known leftover, not part of this criterion: two prose mentions of `serve` remain in the help. One is the L1 reproduction pipeline's "render/serve/shot/diff/values-diff loop"; the other is the Install preflight paragraph's offline-verb list. Removing them was not granted in this reconcile run. They are recorded as a code issue in story-e15a19ef's Technical Context.

## Verification
With every `net.Server#listen` call in the process observed, run `1c serve demo`. Confirm that:
- stderr contains `Unknown command: serve`, followed by the usage text;
- the exit code is 1;
- no listen call was made. The observer is shown to catch a real bind in the same process, so the check is not vacuous.

Then read the usage text and confirm that:
- no line begins with `1c serve`;
- it does offer `1c builder` / `wrangler dev`.
