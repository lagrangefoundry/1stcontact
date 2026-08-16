---
uid: comment-f2fbe29a
id: COMMENT-1096
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T09:06:43.897472+00:00'
updated_at: '2026-08-16T09:06:43.897472+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-aec8af1b
  kind: note
---

**REPORT-2097** (`report-aec8af1b`) — **FAIL**: 3 violations, 2 warnings, 0 needs_review.

Every finding was re-verified at its cited `file:line` against current HEAD rather than inherited — none of the four cited files has changed since the last cycle (`validate.ts`/`text-style.ts` last touched 2026-07-31; `extract.ts`/`values-diff.ts` 2026-07-25).

**What moved since the last ac cycle**: AC-637 was deprecated (`lifecycle: deprecated`). That resolves two of the prior report's four violations, and it's the correct call — `resolveSurfaceGradient` (`text-style.ts:223`) has zero production callers, only two re-exports and two test imports.

**Violations** — all three on STORY-76, the gradient story:

1. **AC-638** (`ac-edit`) — advertises a palette-role alias as an *accepted* gradient stop colour. REQ-114 (free_and_reconciled, 2026-07-31) retired it: `validateGradient` routes every stop through `validateColor` (`validate.ts:130-134`), which rejects anything failing `isColorLiteral` (`:100-106`). Fourth identical filing. Not made moot by AC-637's deprecation — the gradient content-field type is live (`validate.ts:195`, `types.ts:43`).
2. **Surface-gradient capture rule has no AC** (`ac-add`) — STORY-76 item 2 states a four-clause ancestor-selection rule, live at `extract.ts:840-850`. AC-636 covers only the diff. This is the one spot where the capture can be silently wrong in a way the diff *cannot* detect: pick the wrong ancestor and both sides agree on a value that isn't what paints. Fourth filing.
3. **New this cycle** (`story-body-edit`) — AC-637's deprecation landed on the AC but not on the story bullet it answered. STORY-76 still declares the resolver authoring half in scope, so that leg now has zero active ACs. The fix is to mark the authoring half superseded (matching CAP-63's own Scope), *not* to write a replacement AC.

**Warnings**: STORY-77's "deterministic reference cell" claim is unpinned by any AC though live at `values-diff.ts:2709-2720`; AC-738 + STORY-79 guarantee 2 still classify `values-diff` as never-rendering, contradicted by `stdio.ts:4-5` and by sibling AC-1017.

Two things worth your attention beyond the report: STORY-75 (14 ACs) and STORY-78 (9 ACs) I checked in full and they are genuinely clean — recorded as `info` so the editor doesn't churn them. And the fix pass is now reaching this capability but only just: three cycles landed nothing, this one landed a single deprecation and left its story bullet behind.
