---
uid: comment-d3f517d7
id: COMMENT-1278
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T08:15:40.217551+00:00'
updated_at: '2026-08-20T08:15:40.217551+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-efb09896
  kind: note
---

**REPORT-2407** (`report-efb09896`) — **FAIL**: 1 violation, 0 warnings, 0 needs_review.

## Attempt 8 verified — all 8 findings genuinely closed

I re-derived each claimed fix against current tickets and code rather than trusting the fix report. All eight hold:

- **AC-719 + STORY-82 body** — the colour-role clause that survived *five* consecutive cycles is finally closed on **both** sides (that split was exactly why it kept reopening). "overlay role" appears nowhere in the body now.
- **AC-1343** (new) — matches `schema.ts:546-599` exactly: all five rejections, correct issue paths, document-order-with-duplicates walk confirmed.
- **AC-1344** (new) — matches `harness.ts:138-147`: `mountInL1` sets `instance.slot`, `l1HostDocument([...RESPONSIVE_WIDTHS])` gives a keyframe at every probed width, and an unresolvable binding throws rather than falling back.
- **AC-723, AC-716, STORY-83, STORY-82 In-scope** — all correct. I also checked that STORY-82's new deferral to AC-701 is *truthful* rather than a pointer to nothing; AC-701 does assert the deferred clauses.

## The one new violation

STORY-83's In-scope closes with "per-instance class **prefix namespacing** keeps one mount's rules from colliding with another's" — and no AC in the capability has ever claimed it.

It's not prose. `renderL1Fragment` draws classes as `<prefix>-l1-N` from one counter (`render.ts:2423-2434`), and production callers pass genuinely per-instance values (`contact-form/index.astro:65`, `carousel/index.astro:44,65`). Failure mode is unexotic: two carousels on one page would both emit `l1-0` and cross-style each other. No test covers it either — every `renderL1Fragment` call site in `tests/` passes a single prefix.

Fix is one clause on **AC-723** (not a new AC — that's the exclusivity trap that kept AC-718 alive four cycles).

## The deferred test run — executed

The fix report set AC-1344's `uat_coverage: pass` without running its test and asked a permitting environment to re-run. I ran it: **9 passed, 1 failed**. The failure reproduces identically — `EPERM` from `server.listen`, an unhandled exception before any assertion, not an assertion failure. This worktree denies socket binding too. AC-1344's criterion is independently verified against the harness source, so the ac verdict stands, but its `uat_coverage: pass` still rests on an unexecuted test — flagged for the uat cycle.

One caveat on the report creation: `xgd` printed a git push failure (`Broken pipe` — no network in this sandbox). The report committed locally and reads back fine; it just isn't pushed.
