---
uid: report-c67cf489
id: REPORT-1383
type: report
title: 'Reconciliation Review: commits (BUNDLE-11)'
created_by: xgd
created_at: '2026-08-06T04:12:13.542888+00:00'
updated_at: '2026-08-06T04:12:13.542888+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-ee56a66e
  anchor_uid: bundle-ee56a66e
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Anchor**: bundle-ee56a66e (BUNDLE-11)
**Subject**: bundle-ee56a66e
**Stories Reviewed**: 10 (9 in the workflow list + story-d5de22a5, a plan-item-3 target the list omits)

## Method

Intent read first: all 15 source-intent bodies in the bundle (90,063 chars) including
the as-implemented Outcome sections on BUG-27, REQ-96, REQ-97, REQ-99, REQ-100, REQ-101
and REQ-103. Then the code (entry files per the plan's behavior inventory). Then the ten
stories and their 87 in-scope acceptance criteria. Then the evidence: full suite executed
(`pnpm vitest run`) — **998 tests, 927 passed, 8 failed, 63 skipped, 144 files** — and every
AC number cross-referenced against `test_UAT_AC<N>_*` names in `tests/`.

## Behavior Inventory

12 feature clusters / ~60 discrete behaviors traced through the code. Every behaviour the
stories claim was verified present in the implementation — no invented behaviour found:

| claim | verified at |
|---|---|
| shared surface + node-level axis groups, `l1BoxAxesSchema` gone | `packages/site-schema/src/l1/schema.ts:567,605,912,939` (spread at 682, 880, 888, 966, 980, 1019) |
| `control` leaf + both-direction binding validation | `schema.ts:1007`, `packages/framework/src/modules/behavior.ts:342` |
| link role, `newTab` rel-pinning, retag-not-wrap | `schema.ts:736,751,968,982`; `render.ts` |
| duplicate DOM id rejection | `packages/site-schema/src/l1/validate.ts:616,626` |
| `pattern` axis + radial gradient branch | `schema.ts:503,576,402,412`; `render.ts:303` |
| `responsiveLayout` track + shared cascade + envelope coherence | `packages/site-schema/src/l1/layout.ts:21`, `validate.ts:500-516` |
| envelope on authored pages | `packages/site-schema/src/validate.ts:52` |
| cross-gate causes + perceptual floor flags | `tools/generate/src/cli/gate.ts:117-131`, `cli/index.ts:190,543` |
| three-state redistribution + `unprovenanced-file` | `packages/site-schema/src/fonts.ts:33`, `cli/fonts.ts:106` |
| `canEnhance` before `preventDefault` | `modules/contact-form/client.js:43,54` |
| `starterHomePage`, `1c refold` | `cli/scaffold.ts:40`, `cli/index.ts:442` |
| band painted extent, document-wide backdrop index, invariant skip | `cli/capture/extract.ts:410-474,440` |

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Shared L1 axis groups; text measure; slot sizing; probe mirror | Covered | story-d0a8cfad | AC-801/802/803/804/805 + AC-725/726 restated; all UATs pass |
| 2 | `control` node, zero-CSS modules, `config.view` deleted, L2 preset, `getModuleCss` fix | Covered | story-179b8c06, story-d0a8cfad | AC-806..811 + AC-699/701 modified; AC UATs pass |
| 3a | Fold: backdrop leaf, control leaf rebased to seam, offline refold | Covered | story-8acc338d | AC-812/813/814 active, AC-733 correctly superseded |
| 3b | **Capture: band painted extent, document-wide backdrops, `backgroundImage` axis, invariant exclusion** | **Uncovered (dormant)** | story-d5de22a5 | **AC-815/816/817/818 are `status: pending` with ZERO UATs — see Gap 2** |
| 4 | Interaction state + scroll motion | Partial | story-d2b5cb1c | 9 of 10 AC UATs pass; **AC-820 fails — see Gap 1** |
| 5 | Texture: pattern axis, radial branch, layer order, envelope | Covered | story-d0a8cfad | AC-829..832; AC-831 carries the "renders exactly as before" clause |
| 6 | Responsive layout track, wrap, shared cascade, media ordering | Covered | story-3569e1a4 | AC-833..838; AC-838's envelope rules grounded at validate.ts:500-516 |
| 7 | Link role + DOM ids | Covered | story-2e4e2c45 | AC-839..848; all pass |
| 8 | Authored-page envelope | Covered | story-d0a8cfad | AC-849/850/851; AC-851 correctly frames renderer degradation as independent |
| 9 | Cross-gate `1c gate` | Partial | story-24098299 | AC-852..856 pass, but **pre-existing AC-705 and AC-737 UATs now fail — see Gap 3** |
| 10 | Font provenance registry + check | Covered | story-8685be2d | AC-857..868; all AC UATs pass |
| 11 | `1c new` scaffolding | Covered | story-86c7c21b | AC-869..876; all pass |
| 12 | contact-form enhancement gate | Covered | story-179b8c06 | AC-877/878 + AC-703 extended |

## Intent Fidelity

Faithful throughout. The stories track the operator's stated framing rather than merely the
diff — notably the recurring "REQ-96 made L1 the sole owner of appearance, so this gap is a
hole in that contract" argument, which is what justifies eight items as upgrades to STORY-83/85
rather than parallel stories. Deliberate non-deliveries the intents record are correctly NOT
claimed: no `1c fonts add` verb (REQ-101 "Not done"), no `box`/`container` merge (REQ-98 "not in
scope"), no grain/noise axis and the warped-perspective grids left as assets (REQ-103 Residual).
The three Case-2 supersessions (`config.view`, the always-residual form control, the per-kind
axis table) are each carried by a modified AC rather than absorbed silently. The untracked-site
caveat is honoured — no AC is written against xgd.dev's content.

## Ungrounded Stories

None. Every story claim maps to implemented code.

## Gaps (fix-loop input)

### Gap 1 — CRITICAL: AC-820's UAT fails; the AC's diagnostic claim is unevidenced

`tests/reconciliation-l1-interaction-and-motion.test.ts:363` —
`test_UAT_AC820_interaction_and_entrance_admit_typed_values_only` fails on **6 of its
hostile documents**:

```
a pseudo-class name smuggled in as a key: expected an error at
  '/root/interaction/hover' naming 'selector', got:
/root - Invalid input: expected false to be true
```
…and identically for `css`, a raw cubic-bezier on `interaction.transition.easing`,
a raw timing function on `reveal.easing`, a `keyframes` string on `reveal`, and an
undeclared `active` state.

The security half holds — every hostile document **is** rejected. The **diagnostic** half
does not: the node union collapses the failure to a bare `/root` error instead of naming
the offending field. AC-820 explicitly claims rejection "with a message naming the
offending field", and DOC-8 §6 / REQ-107 make the actionable error message the whole point
of the envelope for an AI author. Either the validator must locate the error inside the
node (report the failing branch's path rather than the union's), or AC-820 must be narrowed
to claim rejection only — but it cannot stand as written with a failing UAT.

Note this is a *stronger* claim than the FC-era test: `tests/req99-interaction-state.test.ts`
asserts only that the 10 hostile documents are rejected, and it passes. The story cycle
raised the bar and the implementation does not meet it.

### Gap 2 — CRITICAL: plan item 3's STORY-75 half is dormant — 4 pending ACs, zero UATs

`story-d5de22a5` (STORY-75) is one of plan item 3's two declared `target_story_ids`, but it
is **absent from the workflow's Stories list**, and the consequence is visible in the store:

| AC | status | UATs |
|---|---|---|
| AC-815 A band's captured box is the painted extent of its subtree, clamped to the canvas | `pending` | none |
| AC-816 Backdrops captured anywhere in the document, and excluded where they would report what is not painted | `pending` | none |
| AC-817 A painted background image is compared by mirrored basename | `pending` | none |
| AC-818 Module-invariant elements and the names they would source are excluded from capture and pairing | `pending` | none |

**83 of the 87 in-scope ACs are `active`; these exact four are the only `pending` ones**, and
their `updated_at` never moved past creation (01:46) while every other story's ACs were
activated at 01:59. STORY-75 has no report from this run (its newest is REPORT-1036, from a
prior cycle) — the UAT-generation and activation pass never visited it.

This is not a trivial omission. It is the **capture-side root cause of BUG-27** — the reason
`joyfulculinarycreations.com` reproduced ~80% wrong: the extractor was not looking. The fold
half (AC-812) is active and evidenced; the half that explains *why the manifest was empty* is
not. A developer reading only the active matrix would see backdrops being placed in the
background layer with nothing saying the capture indexes them document-wide, nothing saying a
collapsed 0px header keeps its subtree, and nothing saying `values-diff` compares images by
mirrored basename.

The behaviours **are** implemented and **are** tested — 13 UATs in
`tests/bug27-nested-backdrop-capture.test.ts` (`test_UAT_FC_BUG-27_nested_background_image_is_captured`,
`..._collapsed_header_subtree_is_captured`, `..._translucent_scrim_is_not_indexed_as_a_backdrop`,
`..._values_diff_matches_the_mirrored_asset_by_basename`, and 9 more), all passing. They were
simply never renamed to their AC numbers and the ACs never activated — precisely the step the
plan's own Observations section instructed the story cycle to perform ("the story cycle should
rename the TypeScript FC-named tests to their new AC numbers as it writes each AC").

**Remediation**: run the UAT-generation/activation pass over `story-d5de22a5`; map the 13
BUG-27 UATs onto AC-815/816/817/818 (they cover the four claims closely, including the three
deliberate backdrop exclusions); activate the four ACs.

### Gap 3 — MAJOR: STORY-86's AC-705 and AC-737 UATs contradict this bundle's own AC-733 supersession

Two pre-existing active ACs on `story-24098299` now fail, both because REQ-96 changed how a
captured form control folds — the exact change plan item 3 records as AC-733's supersession:

```
tests/reconciliation-3probe-gate-evaluator.test.ts:605
  test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel
  expected [ 'image', 'text' ] to deeply equal [ 'field', 'image', 'text' ]

tests/reconciliation-3probe-gate.test.ts
  test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance
  expected [ 'box','image','image','slot','text' ] to deeply equal [ 'box','image','image','text' ]
```

AC-737's UAT still asserts the fold emits a `field` residual — the behaviour AC-733 was
rewritten to say no longer happens. AC-705's UAT still asserts a leaf-kind set without the
`slot` the form now folds into. The matrix therefore holds active ACs whose evidence disagrees
about the same behaviour: AC-733 says a control binds to its module, AC-737's evidence says a
`field` residual is still produced. That is a divergence absorbed rather than reconciled, and
it is the failure mode this review exists to catch.

Note two `test_fix` cycles already ran on this branch (commits `f47a42a50`, `5ad2f6a2c`) and
did not resolve these.

**Remediation**: update AC-705 and AC-737's UATs to the post-REQ-96 fold shape (no `field`
residual; the form's `slot` leaf present), and restate AC-737's criterion if it names `field`
explicitly.

### Gap 4 — MINOR: AC-739 (story-e15a19ef, outside this review's story set) is broken by code in this bundle

```
tests/reconciliation-1c-astro-free-render.test.ts:166
  test_UAT_AC739_astro_container_created_only_for_module_pages
  InvalidDefinitionError: /pages/0/modules/0/slot:
    module 'gallery' must name the L1 slot it mounts into (available: none)
```
The rule at `packages/site-schema/src/schema.ts:593` reaches HEAD via `bf8131089`
("bind behavior modules to slots inside an L1 page"), a commit in this reconcile's range that
no plan item covers — a co-traveler that changed a validated contract. Out of the reviewed
story set, so not a primary trigger, but it is a matrix AC broken by code landing in this
bundle and it should either be fixed or explicitly attributed.

### Advisory — 4 FC-named UATs cannot pass in a clean worktree

`storage/references/` is gitignored (`.gitignore:146`) and absent, so these fail on ENOENT /
missing bytes rather than on behaviour:

- `tests/req96-control-composition.test.ts` — `..._gigabyte_fields_reproduce_the_measured_height_not_a_stylesheet_default`, `..._gigabyte_submit_recovers_its_per_width_position` (needs `storage/references/gigabytealchemy.ai/index/multistate.json`)
- `tests/bug17-fold-padding.test.ts` — `test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding`
- `tests/req101-font-registry.test.ts` — `..._shipped_registry_accounts_for_every_font_file_in_the_repo` (17 registered capture-derived files not on disk)

The REQ-96 measured result (GA field heights 50/50/146, submit per-width position) and the
REQ-101 backfill-completeness claim therefore have no reproducible evidence in this tree. Their
AC-named counterparts (AC-813, AC-860, AC-867) do pass on synthetic fixtures, so this does not
block the verdict — but environment-dependent UATs are weak evidence and worth noting.

## Plan Item Accounting

| Plan Item | Target Story | ACs produced | Status |
|-----------|--------------|--------------|--------|
| 1. L1 axis groups | story-d0a8cfad | AC-801..805, AC-725/726 restated | OK |
| 2. Leaf-control composition | story-179b8c06 + story-d0a8cfad | AC-806..811, AC-699/701 modified | OK |
| 3. Capture & fold fidelity | story-8acc338d **+ story-d5de22a5** | AC-812/813/814 + AC-733 modified; AC-815..818 created | **PARTIAL — STORY-75 half pending, unevidenced (Gap 2)** |
| 4. Interaction & motion | story-d2b5cb1c (new, STORY-90) | AC-819..828 | **PARTIAL — AC-820 UAT fails (Gap 1)** |
| 5. Texture | story-d0a8cfad | AC-829..832 | OK |
| 6. Responsive layout | story-3569e1a4 | AC-833..838 | OK (first ACs STORY-81 has ever carried) |
| 7. Navigation | story-2e4e2c45 (new, STORY-91) | AC-839..848 | OK |
| 8. Authored envelope | story-d0a8cfad | AC-849/850/851 | OK |
| 9. Cross-gate reconciliation | story-24098299 | AC-852..856 | OK for new ACs; **AC-705/AC-737 regressed (Gap 3)** |
| 10. Font provenance | story-8685be2d (new, STORY-92) | AC-857..868 | OK |
| 11. Site scaffolding | story-86c7c21b (new, STORY-93) | AC-869..876 | OK |
| 12. Enhancement gate | story-179b8c06 | AC-877/878 + AC-703 extended | OK |

All 12 plan items produced output. None silently dropped.

## Judgment Calls

- **Duplicate AC ids in `--related` output are a display artifact, not a defect.** AC-733, AC-701,
  AC-699, AC-725, AC-686, AC-687, AC-726, AC-698 and AC-703 each render twice in the children
  listing, in one case with both the old and new title. Inspecting the ticket store directly shows
  exactly **one** file per id, each carrying the **new** wording (AC-733 = "binds to its module
  instead", AC-701 = "every control painted by L1"). No contradictory pair is active. Not a finding.
- **xgd.dev site-content ACs correctly absent.** REQ-104 AC4 and REQ-103 AC6 are written against
  `storage/sites/xgd/**`, which the plan's untracked-site caveat excludes from capability surface.
  Acceptable omission.
- **REQ-107's triage criteria (AC4/AC5) not carried as ACs.** "Every `storage/sites/**` document
  passes or was fixed" is one-time migration activity, not durable capability. Acceptable.
- **REQ-101's absent `1c fonts add` verb.** Deliberate non-delivery recorded in the intent; STORY-92
  correctly claims only tracking and enforcement. Acceptable.
- **AC-838's envelope rules are grounded in code, not in REQ-104's text.** REQ-104 does not ask for a
  layout-track envelope check, but `validate.ts:500-516` implements strict ascent and static/widest
  agreement. Grounded-in-code-only where intent is silent — acceptable, and it strengthens the
  substrate's own invariant.

## Verdict

**FAIL.** The stories themselves are strong: they are faithful to the operator's stated intent,
they carry the supersessions explicitly rather than absorbing them, and every claim is grounded in
code. The failure is in evidence, and it is concentrated in three places:

1. AC-820's UAT fails — the interaction/motion envelope rejects hostile documents but does not name
   the offending field, so the AC as written has no passing evidence (Gap 1).
2. Plan item 3's STORY-75 half never left the drafting stage — AC-815/816/817/818 are `pending` with
   zero UATs, leaving BUG-27's entire capture-side root cause dormant in the matrix while 13 passing
   FC-named UATs sit unlinked (Gap 2).
3. This bundle's own AC-733 supersession broke AC-705 and AC-737, whose UATs still assert the
   pre-REQ-96 fold shape — two active ACs now contradict each other and one side is proven wrong by a
   failing test (Gap 3).

Suite state at review: **927 passed / 8 failed / 63 skipped**, of which 4 failures are AC-named UATs
(AC-820, AC-705, AC-737, AC-739) and 4 are FC-named UATs blocked by the gitignored
`storage/references/` tree.
