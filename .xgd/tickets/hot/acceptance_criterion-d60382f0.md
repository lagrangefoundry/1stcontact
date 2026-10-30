---
uid: acceptance_criterion-d60382f0
id: AC-2064
type: acceptance_criterion
title: '1c serve is not a command: refused as unknown with usage and exit 1, binds
  no port; help offers only the Worker-based builder'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-30T18:55:46.496399+00:00'
updated_at: '2026-10-30T20:02:37.577561+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c serve` is not a command. There is no raw-server way to look at a site from the
CLI; the only supported way to serve a site is a Worker.

- Invoking `1c serve <slug>` is refused as an unknown command: stderr carries
  `Unknown command: serve` followed by the CLI's usage text, and the process exits
  with status 1. No port is bound and nothing is rendered or served.
- The CLI's help text names no `serve` command anywhere — no `1c serve` line, no
  `serve` in a pipeline or in the list of offline verbs — and advertises no way to
  serve a site outside a Worker. What it offers instead is `1c builder`, which
  starts `wrangler dev` — the same routes, store and runtime production uses.

## Verification
With every `net.Server#listen` in the process observed, run `1c serve demo` and
confirm stderr contains `Unknown command: serve` and the usage text, that the exit
code is 1, and that no listen call was made (the observer is shown to catch a real
bind in the same process, so the check is not vacuous). Read the usage text and
confirm it contains no `serve` as a whole word (case-insensitive; `serves`,
`served`, `server` are prose), and that it does offer `1c builder` / `wrangler dev`.
