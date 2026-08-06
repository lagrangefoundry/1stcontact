---
uid: report-53ea6ca1
id: REPORT-1496
type: report
title: Claude fix_reconciliation_review report
created_by: xgd
created_at: '2026-08-06T22:06:52.087293+00:00'
updated_at: '2026-08-06T22:06:52.087293+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-0385746c
---

All six code changes are in the working tree (ticket edits are auto-committed by the ticketing API). Every item in the review's verdict is addressed.

## Summary

**Stories created**: none. Every gap the review found was a *changed* behaviour whose story already existed — the review's own guidance (items 27–29) pointed at criteria to correct, not capabilities to add.

**Stories modified**
- **story-86c7c21b (STORY-93)** — Finding B. The load-bearing bullet "Colour comes from the site's own theme" was false after the colour token group was retired. Replaced with what the code does (both page-level colours are hex literals on the seeded L1 document; creation declares no palette), scope line updated, and two Technical Context entries added recording *why* the provenance moved and that a scaffolded page is deliberately literal-only.
- **story-179b8c06 (STORY-85)** — Finding D, taking the review's preferred option. The contract now carries the **settled state as a second declared carve-out**, bounded exactly like the invariant-element one: scoped to the edit channel by the document-level marker, and release-not-paint. Technical Context records the ruling and why narrowing AC-809 to the served channels was rejected as the weaker fix.
- **story-af36c2cb (STORY-98)** — its Technical Context explicitly invited a reviewer to rule on the placement; updated to record the ruling and how the criteria now split by ownership rather than duplicate.
- **AC-873** — rewritten: colours are literals in the page's own document, no palette at either level, theme is the non-colour groups only.
- **AC-870** — criterion now names the layout document (not the theme) as the background's source, with provenance as the point.
- **AC-931** — now states the precondition it had silently gained: the palette is an *input* to rendering, and a caller entering below the load boundary must supply it; rendering a referencing document without it throws, by the same no-fallback rule as a dangling reference.
- **AC-809** — admits the settled-state carve-out with its two bounds, and keeps the "no paint in any channel" guarantee explicit.
- Coverage fields: `uat_coverage` → `pass` on story-d0a8cfad (was `fail`), story-179b8c06 (was `needs_review`), story-86c7c21b, story-66115f6b.

**Stories deleted**: none.

**Code changes** (all tests; no production code needed changing — the production code was right and the matrix/evidence were stale)
- `tests/reconciliation-serve-deployed-snapshot.test.ts`, `tests/reconciliation-clean-page-urls.test.ts` — Finding A: `manifestKey` now called with the root, sourced from the Worker's own `SERVABLE_ROOT` rather than a bare `'sites'`, so the test addresses exactly the root the serving path reads.
- `tests/reconciliation-l1-control-and-texture.test.ts` — Finding C: shipped pages render against their own site's palette via a `paletteFor()` helper.
- `tests/reconciliation-colour-palette-overlay.test.ts` — added the evidence AC-931's new precondition claim requires (throws without the palette; byte-identical to the load-boundary render with it).
- `tests/reconciliation-scaffold-starter-l1.test.ts` — Finding B: AC-870/AC-873 rewritten against the literal model, including that the theme carries exactly the six non-colour groups and that the scaffold invents no third colour.
- `tests/reconciliation-behavior-l1-composition.test.ts` — Finding D: AC-809's test admits edit-scoped rules and adds a dedicated block bounding them — marker-scoped, closed release-property set, and the same no-paint screen the paint rules face.

**Verification** (run to completion, output read)
- Full suite: **1140 passed, 9 skipped, 0 failed** — was 9 failed / 1131 passed. All nine red UATs green, including the intermittent AC-845.
- `pnpm -r build`: clean. This closes REQ-114's own AC12, which the review recorded as unmet.

**Two review items I deliberately did not action**, both explicitly ungated:
- **FC-orphan duplication** (`tests/req116-edit-render.test.ts`, `tests/bug31-sandbox-r2-namespace.test.ts`, and also `tests/req114-palette-model.test.ts`, which the review did not name). The workflow's Phase-2 `check_fc_orphans` gate owns this and loops back with `fc_orphan_files` populated; deleting 36 tests here on my own reading of "duplicates" is the riskier call, and the review recorded it as noted-not-gated.
- **The scoped quality gate reporting `pass (0 tests, 0 failed)`** — a genuine tooling gap and the reason nine red UATs reached review unremarked, but it is a finding about XGD-the-tool for the operator, not a matrix defect.

**Confidence: high** that the next review passes Step 5b — the evidence failure was the entire basis of the FAIL, and it is measured green rather than argued. Moderate on Step 4A, where the judgment is qualitative: the reviewer must accept that STORY-85's contract *should* admit the settled-state carve-out rather than AC-809 being narrowed to the served channels. I took the option the review named as preferred and recorded the rejected alternative, so a differing reviewer has the reasoning in front of them rather than having to reconstruct it.
