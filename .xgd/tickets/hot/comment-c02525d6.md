---
uid: comment-c02525d6
id: COMMENT-2516
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T10:58:37.934169+00:00'
updated_at: '2026-09-10T10:58:37.934169+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-820c26e6
  kind: note
---

**REPORT-3717 (`report-820c26e6`) — PASS: 0 violations, 1 warning, 0 needs_review.**

## What I checked

All 36 active ACs on STORY-99 resolve to at least one `test_UAT_AC<n>_*` function across 16 test files, and every one drives real entry points — no AC rests on a structural/AST check alone.

**The previous cycle's six findings are genuinely closed.** I re-read each at the source rather than accepting the two fix reports:

- **AC-978** — `trees` now has four entries; the `/framework/` group the criterion names is present and unconditional, so it joins the shared `statuses` set. The fix also added per-tree liveness probes, which closes a way its own repair could have been self-defeating (a prefix serving nothing would have reported as *confined*).
- **AC-964** — a new workers-pool file sweeps all four classes admitted/unadmitted over real D1/R2, pinned to `401` specifically with per-class refusal-body comparison, plus two non-vacuity guards.
- **AC-966** — the forbidden disk byte-comparison is gone; the new mounted test never renders the site and drives the binding both ways.
- **AC-1033** — two concurrent workspaces, same slug on purpose, first primed first; the same-account premise is asserted off the shipped source rather than assumed.
- **AC-1401** — a shared `TRANSPORT_CONTRACT` both doors are held to, with each leg also asserting the contract still spans all four classes.
- **AC-1036** — traversal probes dropped.

## The one new finding

**AC-972 (warning, exclusivity).** Its test requests `/preview/beta/published/` twice and asserts `302` + location — the exact probe `test_UAT_AC1035_…` makes, and the one AC-972's Verification (rewritten today) explicitly says not to repeat. It's pre-existing, not a regression: the probe is in the file at `c9551c6a34`, so the previous report's "aligned — the invocation half only" row was a misreading. Graded a warning to match how the previous cycle graded the structurally identical AC-1036/AC-978 overlap — every substantive claim AC-972 owns is asserted correctly.

## One thing I could not do

I tried to run the newly authored evidence rather than trust the fix reports, and **this session's sandbox denies binding a listening socket**: `startBuilder` fails at `listen EPERM 0.0.0.0`, and the workers-pool files fail the same way when miniflare starts. That's a restriction of my session, not a defect in the tests — the fix loop ran these files and quoted output. So this assessment is source-level, as the previous cycle's was; whether the suites pass is `check_uat_coverage`'s question.
