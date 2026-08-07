---
uid: comment-da5459f7
id: COMMENT-769
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T17:00:15.849972+00:00'
updated_at: '2026-08-07T17:00:15.849972+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-bf64e711
  kind: note
---

Report shape verified: `result: fail`, `report_kind: capability_validation`, `subject_uid: capability-12fee326`, `level: story`, integer counts.

## REPORT-1589 (`report-bf64e711`) — **FAIL**: 3 violations, 1 warning, 0 needs_review

**Intent ledger**: REQ-116 (edit render) → REQ-117 (the gesture + renderer back-fill) → **REQ-118 (image selection)**, all `free_and_reconciled`. REQ-119 is `draft` and BUG-32 is `free_coded`, so neither counts; REQ-115 is CAP-85's.

**The root cause of most of the drift**: REQ-118 reconciled into CAP-86 (STORY-100, via `updated_by`) and CAP-88 (STORY-102, new), but never touched CAP-87 — even though its headline behaviour is *click an image, pick a different one*, and this capability owns clicks.

1. **violation / consistency — STORY-101** (`story-body-edit`). Body still lists `images` under "Out of scope (the intent's declared non-goals)", quoting REQ-117's "Images — T4". T4 *is* REQ-118, which retired that non-goal: `copyFieldsOf` returns `src` (enum) + `alt` for `kind: 'image'` (`packages/site-schema/src/l1/edit.ts:233`), and REQ-118 §5 records that **no editor change was needed**.
2. **violation / coverage — CAP-87 tree**. "Clicking an image segment offers a picker" is expressed nowhere here. STORY-100 covers only derivation/write and explicitly defers "the browser gesture… the modal it opens"; STORY-102 covers only the listing. The gesture half is unowned.
3. **violation / consistency — AC-956** (`ac-edit`). STORY-98's body says the leakage criterion deliberately avoids a byte-identity claim "the marker would falsify" — but AC-956 makes exactly that claim. `contact-form/index.astro:88` and `carousel/index.astro:77` emit `data-l1-slot` in every channel, and REQ-117 added the contact-form one. The implemented UAT asserts the weaker true property, so the AC text is what's out of step.
4. **warning — STORY-101** cites "the edit rendering (CAP-84)"; CAP-84 is `superseded` and its story now sits in this same capability.

Verified as aligned: STORY-98's "placement note (resolved)" is true — STORY-85 (CAP-70) does carry the settled state as its second zero-CSS carve-out.

One tooling note in the report, not filed as a finding: the ticket index still returns STORY-98 under the superseded CAP-84's `capability_uid` filter. All conclusions above came from `ticket get`, not that filter.

Unrelated to this task: the claude.ai Gmail/Calendar/Drive connectors reported needing authorization; they can't be authorized from a headless session, and nothing here depended on them.
