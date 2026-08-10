---
uid: comment-e6607996
id: COMMENT-892
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-10T07:27:32.071309+00:00'
updated_at: '2026-08-10T07:27:32.071309+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6aa1d529
  kind: note
---

**REPORT-1742 (`report-6aa1d529`) — PASS**, 0 violations, 5 warnings, 0 needs_review.

## What I checked

CAP-86 → STORY-100 (`upgrade`, so ACs expected) → 17 ACs, all `active` (no deprecated/inactive/archived variants exist — queried explicitly). Intent ledger: REQ-117 + REQ-118 reconciled (via BUNDLE-16 / `request-66e4c630`), REQ-44 + REQ-115 out of capability, REQ-126/128/129 `bundled` = imminent.

Every one of STORY-100's eight in-scope bullets maps to at least one AC. I spot-checked the ACs against the shipped surface (`packages/site-schema/src/l1/edit.ts`, `tools/generate/src/cli/edit.ts`) — the enum widening, `imageChoices` current-handle rule, pre-validator membership check, and the `imageHandles` narrowing are all real, so no `code-issue`.

## Findings worth your attention

**One new warning (#4).** STORY-100's body has *zero* language about overflowing copy — greps for `overflow`, `truncat`, `clip`, `legible`, `box`, `multi-line`, `textarea` all return nothing. Yet AC-990 and AC-980's multi-line clause assert it, grounded in REQ-117 AC-8 and implemented at `edit.ts:180-186`. The ACs are right; the story body has no parent bullet for them. REPORT-1738 (story level, today) cleared the body as "all eight in-scope bullets trace" and missed this — so **if the story-level fix pass is scoped only to REPORT-1738's three findings, this falls through the gap between levels.** Resolution is `story-body-edit`, not an AC edit.

**Three exclusivity warnings have now survived two cycles unrepaired** (identical to REPORT-1614, 2026-08-07; AC text unchanged since): origin-parity duplicated in AC-1024/AC-1026 vs AC-992, one-diff atomicity in AC-1026 vs AC-983, multi-line-control rule in AC-990 vs AC-980. All fix by subtraction from the *newer* AC. Flagged in the notes: do not resolve #1 by narrowing AC-992 to copy — that would delete "there is no separate image route", the load-bearing claim of REQ-118's framing.

**The story-level violation does not cascade here** (recorded as info #6). REPORT-1738's open violation is on the *capability body* ("plain words and nothing else", no mention of images), which contradicts the five image ACs — but every AC is on the correct side of it, and no AC edit can repair it. STORY-100's body, which is my working reference at this level, was cleared and holds up.
