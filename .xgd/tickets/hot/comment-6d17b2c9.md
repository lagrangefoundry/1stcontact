---
uid: comment-6d17b2c9
id: COMMENT-2604
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T21:07:21.428316+00:00'
updated_at: '2026-09-10T21:07:21.428316+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-be95f0c9
  kind: note
---

**PASS** — REPORT-3798 (`report-be95f0c9`): 0 violations, 1 warning, 0 needs_review.

## What I checked

**Prior attempts.** The check that failed was REPORT-3795 (20:55Z); the fix landed at 20:57Z (STORY-103 `last_field_updated: body`), reported as REPORT-3796 (20:58Z). I re-verified all three prior findings independently rather than trusting the fix report: the false "no tenancy" clauses are gone and correctly narrowed to the corpus, `CAP-87` occurs zero times (both sites now `CAP-86`), and the failure-reporting bullet now carries the per-origin qualification.

**Coverage — no gaps.** Every reconciled ask maps to a criterion: REQ-122 → AC-1051…1061, REQ-123 → AC-1317…1320, REQ-127 → AC-1053/1055/1058, REQ-146 AC1–AC7 → AC-1404/1406/1407/1408/1057 plus CAP-92's AC-1411 and AC-1074 for the two correctly out-of-scope ones, REQ-149 AC13 → AC-1410, BUG-38 → AC-1055 + AC-1456. I confirmed the two cross-capability landings actually exist rather than assuming them.

**The one thing that could have invalidated the story.** REQ-162 (free_and_reconciled, 2026-08-31) is the only reconciled intent after BUNDLE-21, and it merges chat schemas into the product TypePack — which would make the continuity criteria stale if it had moved the transcript. It explicitly did not (out of scope in both its plan and its "Not done here"), and the code agrees: `apps/control-app/src/ai.ts:197` still builds `R2TranscriptArchive`. The `chat_transcript` comment in its evidence line is a TypePack fixture, not the live path. AC-1057 is current.

I also re-verified every ID/UID pair in the body, since one was wrong last round — all four are correct now.

## The remaining warning

STORY-103's in-scope bullet "What the assistant is told about itself" opens with *"the priming is generated rather than hand-written."* REQ-122 §"Priming: three layers, **one hand-written**" designs the opposite for exactly that layer — the system preamble in `ai/roles.ts`, hand-written deliberately — and the code agrees (`roles.ts:38` is prose; `host-core.ts:443-446` enters it first, ahead of the generated documents). The body's own Technical Context states it correctly 90 lines later ("Neither *document* is hand-authored prose *about the tools*"), so the body contradicts itself and the loose summary is what an AC author reads first. No AC is misled — AC-1319 is precisely worded — so this is a warning, not a blocker.

Worth flagging for whoever picks it up: this is the same *shape* as last round's finding 3 — an unqualified In-scope bullet contradicted by a precise Technical Context paragraph. I checked the other six bullets against their paragraphs and found no third instance, but the durable repair is to read that list as a set rather than patch one sentence per cycle.
