---
uid: comment-5ab21210
id: COMMENT-1242
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T03:20:09.900875+00:00'
updated_at: '2026-08-20T03:20:09.900875+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2d3ee21a
  kind: note
---

Done. All four violations and the three actionable warnings from `report-f924eef4` are resolved; completion report is `report-2d3ee21a` (`fixes_applied: 4`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`).

## What the findings actually were

Findings 1–5 were **one omission, not five**: `bundle-4ff83a8b` (BUNDLE-10, `free_and_reconciled` 2026-07-29) is referenced by no ticket in the matrix, while five of its members are live in this capability's capture-and-compare spine. I re-verified each in production code at the cited file:line before writing it into a story — `SurfaceShape` at `capture/types.ts:282` with the diff-side resolution at `values-diff.ts:146,712,752`; the `bandRoots.length === 0` fallback at `extract.ts:1391-1403`; `textNodeBox` + two-pass `runsUnder` at `extract.ts:666-684,1097-1116`; `FONT_BARRIER` at `playwright-driver.ts:21-68,155-160` plus `rewriteMirroredRefs` and `fontLoadedOf`; and `overlayOf` resolving through `rgbaOf` at `extract.ts:1047-1071`. Intent wording came from BUNDLE-10's own body, not the finding table.

## Mutations

| Element | Change |
|---|---|
| STORY-75 body | Four new Description items (per-text-node run geometry → 2; surface-bearing box → 5; capture-time font settling → 9) plus two clauses (all-collapse band fallback into item 11; modern-syntax scrim capture into item 12). Renumbered 11 → 14. Story sentence, **In scope**, **Out of scope** and three Technical Context bullets updated so the behaviour isn't documented in one place only. |
| STORY-75 `updated_by` | `+bundle-31e474b9` (finding 7 — §7 is REQ-79's, named in the comment at `values-diff.ts:2477`), `+bundle-4ff83a8b` (findings 1–5 root cause) |
| STORY-79 `updated_by` | `[bundle-31e474b9, bundle-cceaba25, bundle-15c1f647]` (finding 6) |
| CAP-63 body | History entry recording the BUNDLE-10 repair and the deliberate scope split |

New items were placed beside the content they correct rather than appended — run geometry after rendered-text extent, the surface-bearing box between box-border and pairing, font settling immediately before the fontLoad diff-direction item it complements. I checked renumbering was safe first: no story body in the matrix carries a `STORY-75 §N` cross-reference.

## Deferred, not skipped

- **Finding 8** — the assessor's own resolution is "no edit yet". BUNDLE-19 is still `reconciling` and neither `cli/shared-store.ts` nor a `preflight` verb exists on this branch, so writing it into STORY-79 now would describe absent code.
- **CAP-70 / CAP-71** — BUNDLE-10's other members (fold/L1-pipeline, plus BUG-21) are not this capability's and were deliberately not swept into STORY-75. The same skipped intent likely left gaps there; that's outside this scope path, so I recorded it in CAP-63's History rather than acting on it.

No code or tests were touched, so there was nothing to run.
