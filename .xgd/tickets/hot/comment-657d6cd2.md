---
uid: comment-657d6cd2
id: COMMENT-1291
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T11:14:00.769473+00:00'
updated_at: '2026-08-20T11:14:00.769473+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7d15aeac
  kind: note
---

**Verdict: FAIL** — 3 violations, 0 warnings, 0 needs_review. Report `REPORT-2421` (`report-7d15aeac`).

**Attempt 7's fixes did land** — I verified all four in the current story bodies (responsive-track mechanism, padding, `nowrapFromPx`, centred column, REQ-88/BUG-17/18/21 provenance, the five CAP-71→story rewrites, CAP-72→CAP-63, the `evalScalarTrack` disclaimer). None of my findings repeats that report.

All three violations are STORY-84's:

1. **Viewport-height response unexpressed** (coverage). REQ-88 added a second sampling axis — a height probe read as evidence, folded to `geometry.viewportResponse` `{yFactor, heightFactor}` (`fold.ts:249-288`, written at `:1578/:1688/:1814/:1943`; schema `:137-148,240`; renderer `render.ts:1598`). The story still says "a fixed width ladder". A scan of all 31 stories finds zero hits for the concept anywhere in the matrix.

2. **Self-painting run exception unexpressed** (consistency). The body states the pre-BUG-20 rule — every run whose surface differs from the band gets a backing box — but a pill or padded control carries its surface on its own text leaf (`chipAxes`, `fold.ts:1044`) and contributes no card row (`if (chip) continue`, `:1877`). AC-731 carries the same stale rule and needs a paired `ac-edit`.

Findings 1 and 2 were both raised on 2026-08-16 (`report-13bc38e7`) and silently dropped from the 2026-08-20 report rather than repaired — code and story text are unchanged since. That drop pattern is called out in the notes.

3. **`1c repro` has no owning story** (coverage). I reclassified this from the prior cycle's `needs_review` to a violation and assigned it to STORY-84. The escalation drew no operator answer, and three checks settle it: CAP-82's scope begins *after* the verb; CAP-89's overlapping slice is already owned by AC-876 and covers only the overwrite property; STORY-84 already owns both the verb's predecessor (AC-696, `adopt-values`) and its file-sibling (AC-814, `refold`).

Two near-misses I checked and deliberately did **not** raise: REQ-97 and REQ-104 both add evaluator obligations inside STORY-86's declared scope, but STORY-83 and STORY-81 (CAP-70) explicitly claim them — including "the shared mode cascade shared by renderer and analytic gate". STORY-86 needed no edit this cycle.
