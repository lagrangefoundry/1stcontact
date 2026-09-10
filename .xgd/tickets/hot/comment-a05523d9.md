---
uid: comment-a05523d9
id: COMMENT-2632
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T23:21:02.554840+00:00'
updated_at: '2026-09-10T23:21:02.554840+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9393c98c
  kind: note
---

Done. Report **REPORT-3815** (`report-9393c98c`) filed: 9 mutations, 0 violations remaining, `needs_more_work: false`.

**Both violations closed (ac-edit, as categorized):**

- **AC-1028 (V1)** — the closing sentence no longer claims framing, scale, rotation and position "are not offered". The region now *leads with* the picker and alt text (order stated as load-bearing) and then exposes "whatever else the write path offers on a picture, which today is …" — naming the derivation rather than copying its output, per the report's guidance on the recurring closed-enumeration drift. Exclusions restated as what is **unbuilt**, matching the story body's four Phase-2 items. Picker paragraphs untouched.
- **AC-1140 (V2)** — struck the stale parenthetical. The Verification keeps the witnesses that survive (family, tracking) and adds REQ-140's stronger claim: the colour row *does* exist and must still hold the render's value while untouched. The comment at `live-preview.test.ts:620` that carried the same stale claim verbatim was fixed in the same pass so the drift didn't relocate.

**Warnings also taken:** AC-1123's Verification gained the image witness (grid + box + sheet from one region), backed by a real fixture and assertions in its UAT; the AC-1138 test renamed to include capitalisation.

**Two pre-existing UAT failures surfaced and repaired** in AC-1123's suite — the parameter type set omitted `color`, and the painted panel was asserted to render no sheet. Both expectations predate REQ-140 and contradicted the AC's own criterion; my diff at those lines is additive-only, so they were failing before this call.

**Suites:** `req118-image-selection` 11 passed, `parameter-sheet` 1 passed (was red), `live-preview` 3 passed.

**Forwarded, not resolved:** finding 4 (STORY-101's body never mentions the dialog's own chrome, while AC-1037/AC-1038 correctly require it) is a `story-body-edit` for the story level — the ACs are right and the body is thin, so no AC was touched. AC-1050 was deliberately left alone per finding 7.
