---
uid: report-a5ba5dc9
id: REPORT-3588
type: report
title: Fix 1c Capture & Diff Fidelity (ac) — attempt 7
created_by: xgd
created_at: '2026-09-09T23:51:36.047186+00:00'
updated_at: '2026-09-09T23:51:36.047186+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: ac
  fixes_applied: 11
  progress_made: true
  needs_more_work: true
  violations_remaining: 3
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (ac)

**Attempt**: 7
**Fixes applied this call**: 11 (10 ticket mutations + 1 test edit)
**Violations remaining**: 3 (findings 10, 11, 12) + 2 warnings (13, 14)
**Needs more work**: true

Batched by the report's own clustering advice: STORY-75's five predicted coverage
gaps in one pass, then STORY-76's three-finding cluster (6 + 9 applied together, as
note 2 requires). STORY-77's reporting-stack gaps (10–12) and its two warnings are
next iteration.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-add | STORY-75 → **AC-1605** | Finding 1 (BUG-25). "A run's rendered extent is measured off the node that owns its glyphs" — single-run element uses its own box; a multi-run element measures each run off that run's text node. Grounded in `extract.ts:1101-1124` (`ownRun ? renderedTextBox(el) : textNodeBox(n)`), `:676` |
| 2 | ac-add | STORY-75 → **AC-1606** | Finding 2 (BUG-22). "Split-control surface axes resolve against the node bearing the backing surface" — shape/shadow/border/hairline and the surface's own position+size resolve off the backing box; identical-rendering split control raises no delta; no backing-surface reference → inert. Grounded in `values-diff.ts:137-144`, `:2103-2160` |
| 3 | ac-add | STORY-75 → **AC-1607** | Finding 3 (BUG-16). "Offline re-extract resolves the document's font references to the bundle's mirrored faces" — `fontLoaded:true`, intended face, glyph extents matching the online extract. Grounded in `reextract.ts:57-79` |
| 4 | ac-add | STORY-75 → **AC-1608** | Finding 4 (BUG-24). "A band's translucent veil is captured as its own overlay value, resolved through the colour probe" — modern-syntax veil (`color-mix`/`oklch`) captured with alpha exactly as `rgba`; opaque/fully-transparent are not overlays; the captured overlay is what makes AC-816's exclusion fire. Grounded in `extract.ts:1047-1071`, `:201`, `:1425` |
| 5 | ac-add | STORY-75 → **AC-1609** | Finding 5, first half (REQ-73). "Inter-row vertical spacing is compared as its own adjacent-row gap axis" — row grouping by rendered position, 6px default / 16px `--tolerant`, non-stacked rows contribute none. Grounded in `values-diff.ts:363`, `:1955` (`tol(…, 6, 16)`), `:2493-2537` |
| 6 | ac-add | STORY-75 → **AC-1610** | Finding 5, second half (REQ-73). "Section band padding is not compared; the measured adjacent-row gap supersedes it" — the proxy is *dropped*, not left alongside. Grounded in `values-diff.ts:2575-2579` |
| 7 | story-body-edit | **STORY-76** (`story-82eb6908`) | Finding 9. Repaired the story-level overshoot: restored a narrow In-scope clause for the retained **validation** leg ("the validation of the retained legacy `gradient` content-field type"), and narrowed Out-of-scope from "the authoring path in any live form" to the **resolver** path specifically (`resolveSurfaceGradient` + the REQ-84-deleted modules). Added a "Two legs must be distinguished" paragraph to Description item 2 and rewrote the matching Technical Context bullet, so AC-637's deprecation is scoped to the resolver leg only. Verified at HEAD: `resolveSurfaceGradient` has zero production callers (definition + two re-exports only), while `validate.ts:195-200` still dispatches `spec.type === 'gradient'`. Aligns with CAP-63 Scope bullet 2 |
| 8 | ac-edit | **AC-638** (`acceptance_criterion-a657c39c`) | Finding 6, fifth filing. Narrowed the accepted stop-colour form to a `#hex` literal only and moved the **palette-role alias** to the rejected side, citing REQ-114 (`request-3cd338cd`, free_and_reconciled, 2026-07-31) and DOC-23 §5. Direction clause left untouched per the finding. Verified against the **call graph**, not the stale comments note 3 warns about: `validateGradient` (`validate.ts:130-134`) routes every stop through `validateColor` (`:101-107`), which errors on anything failing `isColorLiteral` |
| 9 | uat-edit | `tests/reconcile-gradient-first-class.test.ts` | Paired with #8 so the edited AC is not left stale: extended `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` with the role-valued-stop rejection, asserting the error names `panelGradient.stops[1].color` and that the sibling `#hex` stop raises none. **4/4 pass** |
| 10 | ac-add | STORY-76 → **AC-1611** | Finding 7, fifth filing. "The surface gradient recorded is the nearest painting ancestor's, skipping text-fill and stopping at the first opaque solid" — all four clauses (nearest wins / skip `background-clip: text` / stop at first opaque solid / no gradient ancestor records none). Grounded in `extract.ts:840-850`, `:648`, `:846` |
| 11 | ac-add | STORY-76 → **AC-1612** | Finding 8 (REQ-72), new this cycle. "A modern-colour-space gradient captures its full ordered stop list resolved to hex in-browser" — for **both** gradient kinds, so AC-634/635/636 are not vacuous on a modern-syntax gradient. Grounded in `extract.ts:329-345` (`hexifyGradient`), applied at `:846` (surface) and `:1132` (text-fill) |

Every new AC was authored with `uat_coverage: missing` so the uat level sees them as
open coverage rather than as passing.

## Code Edits (if any)

None. The one non-ticket edit is the UAT extension in row 9 (a test, not production
code). No `code-issue` was opened: as the report states, in every finding the code is
right and the matrix was silent or wrong about it.

Note for a follow-up outside this check (report note 3): `validate.ts:131` ("a bare
colour string (hex/role)") and `:167-168` ("Absolute value (#hex) or a palette-role
alias… the same literal-or-role rule") still carry the REQ-114-retired formulation in
their comments. The behaviour is correct; only the prose is stale. Left alone here —
it is a comment-only cleanup, outside this level's mandate — but it is the most likely
reason findings 6 and 7 survived five cycles, and it will keep misleading a reader who
verifies AC-638 from nearby source rather than from the call graph.

## Environment note

`tests/reconcile-gradient-first-class.test.ts` initially failed to import at all in
this worktree — `Cannot find module './generated/ai-workers.js'`, a location artifact
rather than a regression. Resolved by running `./bin/1c assets`, which regenerates
`apps/control-app/src/generated/`. No `dist-assets.staging/` was left behind and the
tree is otherwise clean.

## Remaining Work (next iteration)

| Finding | Category | Element | Plan |
|---|---|---|---|
| 10 | ac-add | STORY-77 In-scope item 6 | `values-diff --multi-viewport`: projects across every persisted rung, reports worst-cell-first, fails loud on a bundle with no ladder |
| 11 | ac-add | STORY-77 In-scope item 7 | `--collapse`: N-rung defect → one row; un-collapsed cell view stays the default, width attribution retained |
| 12 | ac-add | STORY-77 In-scope item 8 | `--clusters`: ranked causes with count/worst-tier/width-scope/disposition; derived axes never counted; an untaxonomised property falls back to its own name at `review` |
| 13 (warning) | ac-edit | AC-647 | Extend so the per-rung **value manifest** is asserted alongside the per-rung screenshots |
| 14 (warning) | ac-add | STORY-77 Technical Context | Pin deterministic per-width reference-cell selection (primary engine at rest preferred, documented fallback order) — carried unrepaired across four prior reports |

## needs_review Items Forwarded

None. No finding in `report-6c3ed8d8` is categorized `needs_review`, and none arose
during this pass.
