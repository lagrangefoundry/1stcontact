---
uid: comment-22ad994d
id: COMMENT-1214
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T02:06:49.501792+00:00'
updated_at: '2026-08-20T02:06:49.501792+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-46c342b8
  kind: note
---

**Result: PASS** — REPORT-2308 (`report-46c342b8`), 0 violations, 1 warning, 0 needs_review.

## What I checked

Read all 31 AC bodies for STORY-99 directly from the ticket store (not inherited from prior reports), re-verified the four intents' statuses live (BUG-32 `merged`; BUNDLE-16, BUG-33, BUNDLE-17 `free_and_reconciled` — none retired, cumulative picture purely additive), and checked consistency/coverage/exclusivity of the AC layer against the story body as it now stands.

## Attempt-4 fixes — all seven verified applied

| Prior finding | Verified |
|---|---|
| V1 AC-966 stale "not a re-generation" | Gone; replaced with request-time production, equality ceded to AC-1032 by name |
| V2 no AC for the derived client bytes | AC-1240 exists under STORY-99; route confirmed shipping at `tools/generate/src/cli/builder.ts:462-468` |
| W3 write-path transport placement | Story-body pointer added; **AC-992 verified live** (`story-37a3921b`, active, `uat_coverage=pass`) — not a dangling reference |
| W4 AC-966/AC-1032 overlap | Closed by the cession |
| W5 AC-960 exclusion list | Story body now carries it |
| W6 AC-1110 teardown | Story body now carries symmetric disposal |
| W7 AC-1036 rider | Labelled, naming AC-978/AC-979 as owners |

## The one warning (optional, doesn't affect the verdict)

**AC-966 vs AC-1031** — the same edit that removed AC-966's restatement of AC-1032 introduced a smaller restatement of a *different* neighbour: its verification now requires a never-rendered-to-disk fixture, which is AC-1031's subject. Raised as a warning because AC-966 uses it as a guard on its own probe rather than as a standalone claim, and its distinct subject (the *pane* shows the rendering, whole) is real. Worth naming as a pattern — this is the second AC-966 edit to produce a restatement of a neighbour.

## Two things recorded as info rather than findings

- **AC-992 (CAP-88) carries a clause REQ-119 retired** — it asserts a save "re-renders both … before reporting success" with outputs "on disk", while STORY-99's Technical Context states that step is gone. Genuine drift, but it lives in CAP-88's matrix and nothing in CAP-85 depends on it; STORY-99's pointer cites only the two properties that *are* current. Forwarded to CAP-88's own cycle.
- **AC-1240's `pending` status is benign** — checked, not assumed: `pending` is the schema default in `ticket_types.yaml`, and `xgd_source/api/capability.py` filters only deprecated *stories*, applying no status filter to ACs. Its `uat_coverage: fail` is honest state for the uat level.

One note: the report committed locally but `git push` failed (`Broken pipe` — no network in this sandbox). The ticket is in the local store; it will need a push when connectivity returns.
