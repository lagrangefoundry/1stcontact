---
uid: report-f7b844c5
id: REPORT-3743
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 8'
created_by: xgd
created_at: '2026-09-10T14:23:33.808102+00:00'
updated_at: '2026-09-10T14:23:33.808102+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 8
**Fixes applied this call**: 2 ticket mutations (one multi-section story-body
rewrite covering all three findings, one AC created)
**Violations remaining**: 0
**Needs more work**: false

All three findings of REPORT-72cbe69f (`report-72cbe69f`) are addressed. Per that
report's explicit instruction, none of REPORT-3740's six prior findings was
re-opened — they were re-verified closed by the assessor this cycle against both
the current bodies and the live source.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 (`story-8acc338d`) | Finding 1 (violation) — added the section-background box's **scrim** to the fold's account, in four places: a new bullet in the full-language list, the `opaque` boundary note on the backdrop bullet, In-scope, and a new Technical Context bullet |
| 2 | ac-add | AC-1629 (`acceptance_criterion-e8bcef98`) | Finding 1 — new AC: "A band's translucent scrim folds onto the section-background box alongside its background image", with Criterion + Verification including both negative controls |
| 3 | story-body-edit | STORY-84 | Finding 2 (warning) — named the derived nowrap threshold as a fact the fold reads off the ladder (new paragraph beside the visibility rule), added it to In-scope, and ceded the renderer half to STORY-83 / AC-1010 in Out-of-scope |
| 4 | story-body-edit | STORY-84 | Finding 3 (warning) — named `1c repro <slug> --ref <bundle>` in the materialization paragraph and `1c repro` in In-scope |

Findings 1, 3 and 4 were applied as one `xgd ticket update --body-file` write, so
the matrix never passed through a state where the scrim was half-expressed.

### Finding 1 — what was added and why it matches the code

BUG-24 (`bug-c50fdfcc`) names two independent gaps; the second is a fold gap
outright ("The fold never carried a captured scrim … `foldSectionBackgrounds` read
only `backgroundImageUrl`"). The capture half is expressed by CAP-63 STORY-75; the
fold half was not expressed anywhere. Added to STORY-84:

- **Full-language list, new bullet** — a *section-background* box carries two
  axes, the band's background photograph **and** its translucent scrim; a scrim is
  a colour with its **own alpha**, not element opacity, so it folds as a second
  axis of that one box and never as a node of its own; each axis reads from the
  widest width that carries it, *independently*; a section folds when it paints an
  image **OR** a scrim; a band painting neither folds no box and a plain band never
  gains a scrim. Matches `fold.ts:1260` (the image-OR-scrim trigger),
  `:1281-1288` (the per-axis widest-carrying-width read, `axes.overlay`), the
  BUG-24 doc comment at `:1246-1253`, called at `:2150`.
- **Backdrop bullet** — the `opaque` in "full-bleed opaque panel fill" is now
  explicit as a boundary: a full-bleed *translucent* fill is deliberately **not** a
  backdrop, it is the band's own scrim, folded as the overlay axis instead. This is
  STORY-75's exclusion, stated from this side.
- **Technical Context, new bullet** (placed with the existing backdrop-ordering
  bullet, which already named the section-background boxes) — the box is folded
  from the capture's per-band section values rather than the element manifest,
  because a band's photograph and veil never enter the manifest; both axes ride one
  box because the envelope already carried a typed overlay and the renderer already
  layered it above the image, so the fold reading only the image URL was the whole
  of the gap. Per BUG-24: "The renderer needed **no change**" — so no CAP-70 work
  is implied and nothing was mis-assigned upward.
- **In-scope** — "section-background boxes carrying a band's image and its
  translucent scrim".
- **Out-of-scope** — the capture-side cede now also names resolving a band's scrim
  through the canvas colour probe and the translucent-fill/backdrop-index exclusion
  (CAP-63, STORY-75), so the capture↔fold seam reads the same from both sides.

### Finding 2 — nowrap threshold, assigned rather than left silent

The finding offered either assignment; I named it in STORY-84 (rather than ceding
it) because the *derivation* is fold work — `fold.ts:222-240` `nowrapThreshold`,
applied at `:1843-1844` — while only the *spending* of the value is the renderer's
(`render.ts:1626`, `:2027-2031`). The new paragraph states it as a **width, not a
flag**, gives the suffix rule (one line at 1024 but two at 1280 yields the higher
rung, never the lower), and carries `lineCountOf`'s guard that an unmeasurable line
count breaks the suffix rather than reading as "one line" — which would pin a real
paragraph and overprint what sits absolutely positioned below it (`fold.ts:210-220`,
`:226-231`). Out-of-scope explicitly cedes the renderer's wrapping floor to
STORY-83 / AC-1010, so the ownership is now stated on both halves and a future term
sweep for "wrap" hits STORY-84 rather than finding zero.

No AC was added for it: the behaviour is already covered by AC-1009 / AC-1010
(`uat_coverage: pass`) under STORY-83, and duplicating it here would create two
homes for one rule.

### Finding 3 — the verb is named

`1c repro <slug> --ref <bundle>` (`cli/repro.ts:95` `cmdRepro`, wired at
`cli/index.ts:812`) now appears in the materialization paragraph and as `1c repro`
in In-scope, so the verb is visible to the term sweeps this capability's loop
relies on.

## Code Edits (if any)

None this call. All work was matrix-side; the implementing code already carries the
behaviour the story now expresses.

## Verification

`npm test -- tests/bug24-scrim-alpha.test.ts` — **6 passed / 6**, run this call
against the current tree (the wrangler log EPERM in the output is a sandbox
artifact, not a test failure). Four are the fold/render UATs that exercise exactly
what AC-1629 states:

- `test_UAT_FC_BUG-24_hero_scrim_folds_onto_the_section_background_box`
- `test_UAT_FC_BUG-24_scrim_over_image_renders_as_a_translucent_layer_above_it`
- `test_UAT_FC_BUG-24_scrim_without_a_background_image_still_folds`
- `test_UAT_FC_BUG-24_a_section_with_neither_image_nor_scrim_folds_no_box`

plus two real-Chromium capture UATs. No test was modified this call, so no
regression risk was introduced.

`uat_coverage` was deliberately **not** set on AC-1629: that field is owned by the
UAT-level cycle. The four UATs above are the natural binding for it and are already
green, so AC-1629 should not read as a fresh coverage gap.

## needs_review Items Forwarded

None. No finding in REPORT-72cbe69f was categorized `needs_review`, and none of the
three required an operator decision.

## Notes for the Assessor

- The assessor's recommended opening move (sweep every `REQ-N` / `BUG-N` citation
  in `fold.ts`, `probes.ts`, `gate.ts`, `repro.ts` against the story tree) was the
  basis for this fix pass too; the only citation that lacked story expression was
  BUG-24, and it now has it.
- Carried forward from REPORT-72cbe69f for sequencing: `uat_coverage: fail` still
  stands on the capability and both stories, driven by AC-689, AC-691, AC-694 and
  AC-731 at the UAT level. Attempt 7 corrected AC-691's and AC-731's superseded
  rules, so that cycle should be re-read against the corrected ACs rather than its
  own last verdict. Not touched here — it is not a story-level signal.
