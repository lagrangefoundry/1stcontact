---
uid: comment-2ea21131
id: COMMENT-821
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-08-07T22:27:27.763805+00:00'
updated_at: '2026-08-07T22:27:27.763805+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-769012c9
  kind: note
---

All three findings resolved; report filed as **REPORT-1641** (`report-769012c9`).

## What I did

**Finding 1 (the violation, AC-914)** — the report offered two honest routes and flagged the choice as the operator's. I took the **ac-edit** route after confirming the uat-edit route isn't reachable without a production change:

- `renderSite` throws on any page slug containing a separator (`render.ts:260-265`) and emits flat, so no site definition can put a top-level `out/draft/` in front of the gate.
- `assertNoReservedSegment` inspects only `out/`-prefixed entries (`content.ts:88-91`), so `source/` is no route in either.
- `collectSnapshotFiles` has no injection seam — pinning the wiring would mean adding a test-only file-list backdoor to `DeployOptions`. An instrumented R2 client can't substitute: with no colliding input the gate never fires, so there's no ordering to observe.

So AC-914 now states what's true and provable instead of implying evidence that didn't exist. I deleted the vacuous store-unchanged assertion and put a real one in its place: a deploy of a nested slug (`draft/index`) driven through `deploy()` is refused by name, and the store is byte-unchanged — a genuine "nothing shipped" claim, because a real deploy was attempted. It also acts as a canary: the day rendered output gains nesting, it fails, which is the signal to promote AC-914 back to a deploy-level proof.

**Be clear on the consequence:** `deploy.ts:136` is still not mutation-pinned. That's now stated in the AC rather than falsely implied. Adding the seam is a deliberate production change and yours to authorise — I forwarded it in the report.

**Finding 2 (AC-900)** — both upload-line regexes now require the size column, matching the render line.

**Finding 3 (AC-908, AC-918)** — relaxed both Verification paragraphs to permit seeding into an index-vouched snapshot. For AC-918 that's not cosmetic preference: the dotted-directory case needs `v1.2/page.html`, a nested shape the flat render cannot emit at all.

`AC-914.uat_coverage` and `STORY-95.uat_coverage` moved fail → pass.

## Verification

- Three affected files: 35 passed.
- Full suite: **173 files, 1186 passed / 112 skipped** — identical to the assessment baseline.
- One transient failure on the first full run (`reconciliation-l1-navigation.test.ts:475`, a jsdom `hashchange` assertion in another capability). It passes in isolation and on a repeat full run — flaky under parallel load, not from these edits, but worth a look by whoever owns L1 navigation.
