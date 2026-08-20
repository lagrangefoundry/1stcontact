---
uid: comment-bbcea3f4
id: COMMENT-1305
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T12:51:05.291677+00:00'
updated_at: '2026-08-20T12:51:05.291677+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7fdd6d05
  kind: note
---

Attempt 8 complete. 8 concrete mutations applied against `report-af76ac2a`, closing 9 of 12 violations plus the one warning.

**Two multi-finding `ac-edit`s** (the cheapest, and they close both consistency defects):
- **AC-731** — findings 8 + 9. The backing box now **adopts the captured surface-bearing rect** (`fold.ts:1654-1666`) instead of "the run's geometry", with the band guard, the accent-bearer fallback and its no-fill-only precedence, the radius corollary, and the rect as exact grouping identity (`:1610-1631`). Added the full-bleed bar as a second band-seeding path with the dominant-gap discriminator (`:1384-1434`).
- **AC-705** — findings 10, 11, 12. Report shape is now three channels of which two grade: the `mounted` diversion (text path only, never graded), the synthesized-surface exclusion from the non-text queue, and the width-ladder-only oracle dedup (`probes.ts:526-540, 574-584, 656, 671-684`).
- **AC-736** — warning 13. Clip-check retention now asserted for the slot as for the surface (`probes.ts:450-458` clips every leaf regardless of kind).

**Five new ACs under STORY-84**: AC-1345 scrim (finding 1), AC-1346 per-side padding + track (2), AC-1347 no-wrap threshold (4), AC-1348 capture-derived form config + derivation-gap channel (7), AC-1349 materialization/asset localization (6). All set `active`, `uat_coverage=fail`, with Verification sections written as executable test plans for the uat phase.

Every AC was checked against shipped code before authoring — `fold.ts`, `probes.ts`, `forms.ts`, `assets.ts`, `repro.ts` — not just against the story body. No code edits; consistent with the assessor's finding that nothing here is a `code-issue`.

**Remaining: 3 violations**, both held deliberately — finding 3 (viewport-height probe pair and its two attribution rules) and finding 5 (the centred content column, likely two ACs: the fit, and per-axis anchoring with its three refusal rules). These are the 200-line block the report flags as substantial; they get a fresh read next iteration rather than being rushed in behind six other mutations.

Completion report: `report-7fdd6d05` (`fixes_applied=8`, `progress_made=true`, `needs_more_work=true`, `violations_remaining=3`). No `needs_review` items to forward.
