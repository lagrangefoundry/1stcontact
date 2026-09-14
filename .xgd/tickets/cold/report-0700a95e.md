---
uid: report-0700a95e
id: REPORT-960
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-24T22:55:21.584766+00:00'
updated_at: '2026-07-24T22:55:21.584766+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-84af044b
  plan_item_index: '2'
---

All four mutations applied; working tree clean (no runtime or test code touched — ticket writes are auto-committed by the ticketing system).

Two discrepancies in the plan item, corrected rather than propagated:

1. **Wrong UID for AC-682.** The plan gave `acceptance_criterion-62adf959`, but that UID is **AC-685** ("Injection payloads … are inert"). AC-682's real UID is `acceptance_criterion-78662fd0`. I matched on the plan's *description* (which unambiguously describes AC-682 — the well-formed-document criterion and its `test_UAT_AC682_*` fixture) and edited the correct ticket. AC-685 was left untouched.
2. **"No test asserts either attribute" is half true.** `data-l1-slot` *is* asserted in `tests/req85-carousel.test.ts`, `tests/reconciliation-behavior-modules.test.ts`, and `tests/generate.test.ts` — but incidentally, as carousel-mounting evidence under CAP-72, never as an L1-emitter obligation. `data-l1-behavior` is asserted nowhere in the repo. AC-723 is worded to pin both at the emitter, and the story's Technical Context records the distinction.

I confirmed the regression rather than trusting the plan: `npx vitest run tests/reconciliation-l1-substrate.test.ts` → **1 failed | 6 passed**, `test_UAT_AC682_valid_document_and_optional_primitives_accepted` failing on the legacy `capability` key at line 129. I did **not** repair the fixture — this prompt forbids modifying UATs; the requirement is recorded in AC-682 as a note for downstream UAT authoring.

Intent was read first: REQ-87's body plus COMMENT-257, where the operator's session explicitly decided to include the slot seam in the rename ("pre-launch, no live site data", keeps L1 consistent) and to add no back-compat alias. The code matches that intent, so nothing was absorbed as divergence.

```
Upgrade mutations applied for plan item 2 of 2

Target Stories: story-d0a8cfad
Primary Story UID: story-d0a8cfad
Stories Modified: 1
ACs Modified: 2
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d0a8cfad"          # STORY-83, story_kind: feature -> upgrade
  acceptance_criteria:
    modified: ["acceptance_criterion-78662fd0",   # AC-682 — slot's optional field is `behavior`
               "acceptance_criterion-33ecc306"]   # AC-686 — legacy key rejected as unknown key
    added:    ["acceptance_criterion-8db8ef76"]   # AC-723 — slot placeholder render attributes
    removed:  []

Progress: 2 of 2 plan items complete
```

Scope check: no new story created; no new capability introduced (AC-723 documents an emitter behaviour that already ships, previously undocumented); CAP-70's title is matrix-sense "capability" and was correctly left alone; CAP-72 and STORY-85 belong to plan item 1 and were not touched.
