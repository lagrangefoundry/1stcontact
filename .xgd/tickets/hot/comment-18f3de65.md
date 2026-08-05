---
uid: comment-18f3de65
id: COMMENT-680
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T22:57:36.288372+00:00'
updated_at: '2026-08-05T22:57:36.288372+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-728bd245
  kind: note
---

Schema verified — `result: fail` in frontmatter, matching the known-good story-level report exactly.

## Assessment complete: **FAIL** — REPORT-1327 (`report-728bd245`)

**2 violations, 1 warning, 0 needs_review** across the 39 distinct ACs under CAP-63's five stories (all `feature`/`upgrade`, so all correctly expected to carry ACs).

Both violations land on **STORY-76** (gradients), on the same item — "Panel/card surface gradients", whose three legs are Captured / Diffed / Authored:

**Violation 1 — AC-637 title (`ac-edit`).** Titled *"A text-block authored with a gradient panel renders a padded, rounded panel…"*, contradicted three ways: STORY-76's Out-of-scope explicitly disclaims that render ("no module currently owns a padded/rounded/inset gradient-panel render"); the AC's own Criterion/Verification describe only the shared `resolveSurfaceGradient` returning a declaration (`text-style.ts:257`, tested at `req62-gradient-panel.test.ts:76-82`); and `text-block` was deleted by the REQ-79/84 pivot (`dials.ts:10` — the semantic layout modules "are gone"; only `carousel` and `contact-form` remain). Corroborating: `reconcile-gradient-first-class.test.ts` carries `test_UAT_AC634/635/636/638` — every AC of STORY-76 except AC-637. Title-only defect; the body is correct and must not be rewritten toward it.

**Violation 2 — capture selection rule uncovered (`ac-add`).** STORY-76 declares capture in scope and states a specific rule (nearest painting ancestor, skip text-fill gradient, stop at first opaque solid). No AC pins it — AC-636 covers only the diff and feeds `surfaceGradient` in as fixture input. Live at `extract.ts:490-502`. Concrete failure mode: drop the `background-clip:text` guard and a wordmark's glyph paint records as its panel surface with every AC still green. Two Chromium UATs already exist as unclaimed evidence (`req62-gradient-panel.test.ts:157,172`).

**Warning — deterministic per-width cell choice.** STORY-77's Technical Context says "prefer the primary engine at rest"; `selectProjectionAtWidth` (`values-diff.ts:2431-2442`) implements a real 3-tier fallback shared with STORY-78, but AC-639/AC-648 accept *any* cell at that width. Warning rather than violation since it sits in Technical Context, not the In-scope list.

STORY-75, 77, 78, 79 are aligned at this level.

Two things worth flagging beyond the findings:

- **The story level is still failing and unrepaired.** REPORT-1326 (same cycle) directs STORY-77 to gain the `--multi-viewport` ladder-diff item *"then author ACs"*. I did not count that as an AC-level gap — the story body is my working reference and it isn't there — but a further AC pass over STORY-77 is owed once that edit lands. Sequence story-body-first or the AC cycle is wasted.
- **My `needs_review_count: 0` is not a resolution.** REPORT-1326's two escalations (BUNDLE-10 marked `free_and_reconciled` with its code absent from `main`; nine unexpressed pre-matrix intents) have no AC-level surface, so re-filing them would double-count against the gate. They remain the capability's actual blocking questions.

One measurement caveat that would corrupt a naive re-run: `ticket list` returned 16 and 18 ACs for STORY-77/78, which have 8 and 9 real ones — the stale branch index. I deduplicated by UID; counting those rows would produce nine phantom exclusivity violations.
