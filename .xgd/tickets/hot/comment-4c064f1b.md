---
uid: comment-4c064f1b
id: COMMENT-1290
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T11:02:45.533408+00:00'
updated_at: '2026-08-20T11:02:45.533408+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3bb5d93d
  kind: note
---

All four actionable findings are resolved; the one `needs_review` item is forwarded.

**Mutations (5, across 3 tickets):**

1. **STORY-84 body** (findings 1 & 2) — added the general mechanism as one statement rather than enumerating axis families: *any* scalar axis that varies across the sampled ladder folds to its own per-width track, while a constant axis stays a plain scalar from the widest sample. Then the three specific gaps REQ-88/BUG-17 left unexpressed: per-side padding as a folded axis, the no-wrap threshold, and the recovered centred content column with column-anchored node geometry. **In scope** extended to match.
2. **STORY-84 Technical Context** — added REQ-88 provenance plus a BUG-17/BUG-18/BUG-21 bullet that preserves widest-sample-as-base and frames the track as layered over it.
3. **STORY-86 body** (finding 3) — all five CAP-71 references rewritten as intra-capability story references; the scope split between the two halves is intact, only the "different capability" claim is gone. Duplicate-text-pairing cross-reference retargeted CAP-72 (deprecated, wrong subsystem) → CAP-63. Zero `CAP-71`/`CAP-72` occurrences remain.
4. **STORY-86 evaluator description** (finding 4, warning) — took the assessor's second option: `evalScalarTrack` is stated as living in the probes module but not being a third mirrored axis, since no probe reads a non-geometry track and its only caller is the out-of-scope round-trip spine.
5. **AC-691** — paired with finding 2 so the matrix isn't left with a story and an AC disagreeing: criterion now says base axes from the widest sample *plus* a track for a varying axis, with matching verification.

Every claim was checked against the code first (`fold.ts:552/623/657/1317/1838-1844`, `fitColumn` at `:335`, `probes.ts:138` with its sole caller `roundtrip.ts:130`, schema `:983/:1352`). I also confirmed the CAP-70 references in both stories are **not** stale — CAP-70 is active, just retitled — so I left them alone.

**Forwarded to the operator (finding 5):** `1c repro <slug> --ref <bundle>` is live at `tools/generate/src/cli/index.ts:557` with reconciled intent behind it, but no story in any capability expresses it. CAP-71's Scope doesn't claim CLI packaging; CAP-82 and CAP-89 are plausible homes. Ownership is a decision, not a lookup, so I didn't guess.

**Noted for the `ac` cycle:** none of STORY-84's 18 ACs covers padding tracks, the no-wrap threshold, or the column/anchor pair. I didn't add them here — an `ac-add` wants a paired `uat-add`, which is `uat`-level work.

Report: `report-3bb5d93d` (REPORT-2420), `needs_more_work: false`, `progress_made: true`, `violations_remaining: 0`.
