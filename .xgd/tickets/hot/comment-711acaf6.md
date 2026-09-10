---
uid: comment-711acaf6
id: COMMENT-2579
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T18:31:57.651501+00:00'
updated_at: '2026-09-10T18:31:57.651501+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7c4ca063
  kind: note
---

Attempt 8 complete. Both findings closed, report filed as REPORT-3776 (`report-7c4ca063`).

**Two mutations, both `ac-edit`, both in a Verification section:**

1. **AC-1130** (`acceptance_criterion-0e2f38fa`) — extended the identity enumeration from four controls to all six: `— a hundred for brightness, contrast and saturation, zero for black-and-white, the hue shift and the blur —`. The Verification earlier required the hue shift and blur to be submitted and stored, then cleared only the four percentage controls, leaving `hueRotateDeg`/`blurPx` in the region so its own final assertion ("no colour adjustment at all and no empty group") was unreachable. Confirmed against `FILTER_CONTROLS` (`packages/site-schema/src/l1/edit.ts:794-800`): all three of `grayscalePct`, `hueRotateDeg`, `blurPx` are `identity: 0`. The enumeration now matches the criterion's own identity paragraph verbatim; the pre-attempt-7 bare "its own identity" was not restored.

2. **AC-1117** (`acceptance_criterion-0c85504b`) — added one sentence exercising the absent-weight seed the criterion gained last attempt: address a run declaring no weight on the same multi-face page, assert the reported weight is the lowest declared face, re-post it alongside new words, assert the save reports the words alone as changed. I checked that last assertion is a real observable before writing it in — `applyCopyEdit` returns `{ok: true, changed: string[]}` (`edit.ts:1051`), and the write path returns `false` for an echoed seed on an absent axis (`edit.ts:1310`).

**Self-check per the report's own successor rule:** swept all 43 ACs for Verifications carrying a count word or control list, read the five that do (AC-991, AC-1024, AC-1118, AC-1270, AC-1274) in full — none narrows a general claim it makes elsewhere, so no further defect of this shape is in the tree.

No code and no tests were modified, so nothing was run — both mutations are ticket prose. Left for the `uat` level and flagged in the report: AC-1117's new clause needs a test (no existing test seeds a weight-less run), AC-1130's hue/blur storage sentence is likewise unexercised, and `uat_coverage` was deliberately not touched on either AC.
