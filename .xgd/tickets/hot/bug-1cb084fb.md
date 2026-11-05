---
uid: bug-1cb084fb
id: BUG-268
type: bug
title: Delegate refuses every build with idle_builds after earlier no-op builds, so
  a pending page fix can't be made across requests
created_by: xgd
created_at: '2026-10-24T02:58:19.768006+00:00'
updated_at: '2026-10-24T16:17:43.560556+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f66c3090
  severity: medium
  commits:
  - working_sha: 9b2cf572c7fd740c8d84c167f2d2a4454b1eec1c
    reconcile_sha: null
    main_sha: null
  - working_sha: df95fe4b79d5b8c94eee659f91cf1d5069a168d5
    reconcile_sha: null
    main_sha: null
  version: 0.2.613
  story_points: 2
---

**What I was doing:** commissioning a builder (role `builder`) with `Delegate` to rebuild one section of a page (scope `home.json`). In parallel, a second builder was scoped to another page (`catering.json`) to make a one-field text change.

**Expected:** a new request should start with a fresh build allowance, and the builders should run.

**What happened:** both calls failed straight away with `idle_builds`: "THE LAST 6/7 BUILDS CHANGED NOTHING … a further one is refused in this request." This happened on two requests in a row. The counter seems to carry over from earlier requests, not reset when a new one starts. Earlier builds on the same section had also ended with no changes and gave no reason. So the section can't be fixed by any route open to the consultant, because the consultant can't write pages directly.

**Repro:** let a few builds end with no changes on a page section. Then, in a later request, call `Delegate` with any scope. It is refused with `idle_builds` and no builder starts.

**Impact:** a fix the client asked for, and a review finding, stay blocked for as long as this lasts.

## Root cause

The idle-build count (REQ-436, `idle_builds: 2`) is per client message, and it is reset when a client message starts. Two things made it look as if it carried over:

1. **A refused `Delegate` counted as a build that changed nothing.** The host tallies every `Delegate` result; a refused one (no builder ran, so no `wrote`) was read as idle. Each refusal raised the count and repeated the "THE LAST N BUILDS CHANGED NOTHING" line — which is how it reached 6 and 7 with a limit of 2.
2. **The host kept holding the message after building was stopped.** Once the idle limit was hit, the host still carried the consultant's reply on for owed work (layout faults, a review finding, a promise to the client). Each hold reaches the consultant as a new prompt — to it, a new request — asking for a fix, and every `Delegate` in it was refused, because a hold is still the same client message.

## Fix

- Only a `Delegate` that actually ran a builder (its result carries `wrote`) is counted. A refused one neither raises the count nor gets the idle line again; it gets its refusal only.
- Once a message's building has been stopped for idleness, the host does not carry the reply on into another hold: the request ends with the consultant's report (what could not be done), and the client's next message starts with a fresh allowance.

Unchanged: two real builds in a row that change nothing still stop the building in that message; a build that wrote resets the count; a new client message starts at nought.

## Test plan

`tests/test_UAT_FC_BUG-268_*.workers.test.ts` (workerd route, real delegation surface, scripted model client):
- refused `Delegate` calls after the idle stop do not raise the count: the refusals carry no "CHANGED NOTHING" line, and no count above 2 appears.
- with layout faults owed after the idle stop, the host does not hold the reply on: no hold-cue round follows, and the next client message's first build is commissioned.
Regression: BUG-266 and REQ-436 workers UATs.