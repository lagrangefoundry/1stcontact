---
uid: bug-332da6eb
id: BUG-203
type: bug
title: 'bin/deploy: ships stale builder browser assets beside a fresh Worker'
created_by: EPIC-19
created_at: '2026-10-04T17:58:10.800589+00:00'
updated_at: '2026-10-04T17:58:10.800589+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  story_points: 2
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-20fa21fe
---

## Symptom (2026-10-04)

After `bin/deploy --env dev`, the builder's browser UI was a day old. The comp board (REQ-378), the panel progress counter (REQ-379) and BUG-196's upload controls were all missing, while the server side of the same commits was live. So the consultant told the client a comp was "on the comparison board", and the client saw no board at all.

## Root cause

`bin/deploy` (~L340–390) **copies** `apps/control-app/dist-assets` into the snapshot. It doesn't build it, by design ("the Worker serves what it builds"). Only `bin/build` / `1c assets` rebuild `dist-assets`. At deploy time:

| | |
|---|---|
| `dist-assets/builder/plan-panel.js` | 10,180 bytes, built 2026-10-03 11:12, 0 occurrences of `plan-comps` |
| `src/builder/plan-panel.js` | 22,772 bytes, committed 2026-10-04 09:24, the comp board present |
| `.dev-snapshot/assets/builder/plan-panel.js` | 10,180 bytes: the stale copy |

The Worker bundle *is* rebuilt from source, so the server and the browser shipped from different commits, and nothing warned. That's the opposite of what the frozen dev snapshot exists to guarantee (EPIC-16: "I need to know what I'm running").

## Fix

`bin/deploy` must never ship browser assets older than the source it ships the Worker from. Either it builds `dist-assets` itself as part of the deploy, or it refuses with the exact command to run when any file under `src/builder/` (or anything `1c assets` consumes) is newer than its `dist-assets` counterpart. Building it is preferred: one command, one commit, no trap. The banner the dev server prints at start states the commit both halves were built from.

## Test plan

UAT named `test_UAT_FC_<TICKET-ID>_*`: with a builder source file newer than its `dist-assets` copy, `bin/deploy --env dev` produces a snapshot whose asset matches the source, or exits non-zero naming the stale file. It never succeeds with the stale copy.