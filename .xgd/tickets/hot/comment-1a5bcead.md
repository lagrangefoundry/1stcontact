---
uid: comment-1a5bcead
id: COMMENT-2477
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T06:13:10.735919+00:00'
updated_at: '2026-09-10T06:13:10.735919+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cd91df2c
  kind: note
---

**Result: FAIL** — REPORT-3678 (`report-cd91df2c`), 2 violations, 0 warnings, 0 needs_review.

## What I checked

The intent ledger for CAP-101 resolves to ten intents, all `free_and_reconciled` — REQ-141/142 (BUNDLE-19), REQ-143/145/146/149 (BUNDLE-20), BUG-36/37/38 (BUNDLE-21), and standalone REQ-162. Nothing retired, nothing imminent, so no Step 2.5 stale-vehicle case arises. At `ac` level I used the two story bodies as the working reference and consulted intent only to ground findings.

STORY-121's 16 ACs cover its In-scope list completely and correctly — including AC-1398 in its post-REQ-162 per-binding-pairing form rather than the retired counted form.

## The two violations (both `ac-add`, both on STORY-118)

**1. The port's five revision verbs have no AC.** STORY-118's body claims them in as many words — "this story owns that the revision storage verbs are declared on the same port and answered by every adapter". They are declared at `tools/generate/src/store/site-store.ts:206-233` and implemented in all three adapters, but AC-1321's enumeration of the total question set stops at the editing verbs. The hole bites: `tests/support/site-store-contract.ts` — the shared body AC-1385 exists to protect — has no revision assertion, so the memory adapter's five revision verbs are asserted nowhere. CAP-82's AC-1418/AC-1421 cover the publish *sequencing*, not the port-level cross-adapter claim.

**2. The assistant's tool adapter has no AC.** The In-scope list names three consumers driven through the store they were given; AC-1324 covers the editing surface and AC-1327 the preview. The toolbox takes an injected store (`ai/toolbox-core.ts:519`, `ai/toolbox.ts:186`) and REQ-142's implementation record names `ai/toolbox.ts` as one of three updated call sites — but a repo-wide AC scan found only AC-1239 mentioning the toolbox, and that's about grant grouping in a different capability.

Neither is drift away from intent: the code is right and the story bodies describe it correctly. The repair is two new ACs and nothing else — no existing AC is wrong. Three overlaps I examined and deliberately did *not* file (AC-1385's render exception, AC-1325/AC-1385, AC-1327/AC-1033) are recorded as `info` with the reasoning.
