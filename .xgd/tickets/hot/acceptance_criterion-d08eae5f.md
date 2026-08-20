---
uid: acceptance_criterion-d08eae5f
id: AC-1326
type: acceptance_criterion
title: Command arguments, output and refusal envelopes are unchanged by where storage
  lives
created_by: xgd
created_at: '2026-08-20T05:10:37.112199+00:00'
updated_at: '2026-08-20T05:24:46.027667+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

What the operator types and what they get back is unchanged by where storage lives.

- `1c copy set`, the palette commands and the asset commands accept the same arguments and
  produce the same output as before storage became a port.
- A refusal is still an error carrying a code, the path the refusal concerns, and a hint; the
  same refusal reaching the builder's editing route still arrives at the browser as a 400
  carrying those three fields.
- `1c asset add <file> --as <name>` still takes a path on the operator's own machine, and a
  missing source file is still refused with a not-found envelope naming that path and hinting
  at a readable one.

## Verification

Exercise each command at the command line and assert its accepted arguments and its output.
Provoke a refusal from the editing surface and assert the three envelope fields are present and
correct; drive the same refusal through the builder's editing route and assert the 400 and the
same three fields. Invoke `1c asset add` with a source path that does not exist and assert the
not-found code, the path it names and the hint.