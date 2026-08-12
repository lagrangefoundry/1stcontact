---
uid: report-63d4d81d
id: REPORT-1917
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-08-12T22:15:02.494410+00:00'
updated_at: '2026-08-12T22:18:27.163220+00:00'
completed_at: null
last_field_updated: title
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: request-8a132869
  anchor_uid: request-8a132869
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: —
**Anchor**: request-8a132869 (REQ-136), commit a1a43d2a / 94ba66626
**Stories Reviewed**: 4 — story-d0a8cfad (STORY-83), story-37a3921b (STORY-100), story-8acc338d (STORY-84), story-af36c2cb (STORY-98)

Intent fidelity is high, plan accounting is complete, and the fourteen **new** ACs
are backed by unusually strong evidence. The failure is confined to the plan's
seven `modify` entries: **every AC broadened to cover image framing kept the UAT it
had before.** For four of them the newly-claimed behaviour has no AC-named evidence
anywhere in the matrix — including AC-1027, the load-bearing safety claim the whole
ticket rests on.

## Intent Fidelity

Read first: the intent body (13.4k chars) and comment-28658562, the full design
chat. The operator asked for a non-destructive image editor (crop, colorize,
rotation, scaling) with editor/page parity, then chose "implement phase 1 and see
what it gets us" and added the shape question — circular, rounded, parallelogram,
random splat.

| Intent declaration | Story treatment | Verdict |
|---|---|---|
| No operation touches a file; every tool writes a typed L1 axis | AC-1027 (claim correct, evidence stale — see below) | Faithful in text |
| Pan-crop via `objectPosition`, pair-or-nothing | AC-1124, AC-1129 | Faithful |
| Typed `filter` on shared surface, renderer-fixed order | AC-1125, AC-1130 | Faithful |
| Per-function identity (the silent-failure trap) | AC-1126, AC-1134 | Faithful |
| All four shapes; blob deterministic in seed | AC-1127 | Faithful |
| Envelope bounds incl. interaction states (REQ-99 hole) | AC-1128 | Faithful |
| Editor/page parity asserted, not assumed | AC-1135 | Faithful |
| Fold carries pan + adjustment | AC-1133, AC-1134 | Faithful |
| Shape list carries what the node holds (union rule) | AC-1131 | Faithful |
| Bare picture reads back browser-painted values | AC-1132 | Faithful |
| Phase 2 (zoom, tint, background framing, drag, cache, sepia/invert in UI) | Not claimed anywhere | Correctly deferred |

**No silent divergence absorption.** The one code behaviour the intent body does not
mention — the fold clamping an over-ceiling value to the nearest expressible one
rather than dropping it — is explicitly documented in AC-1134 with its rationale,
and I verified it against `tools/generate/src/l1/fold.ts` (the `FILTER_FUNCTIONS`
table carries a per-function `max`; negative values are skipped). Grounded in code
where the intent is genuinely silent, and *stated* rather than absorbed. It does not
contradict the write path's refuse-never-clamp rule (AC-1121): folding a captured
page and answering an operator's new ask are different paths, and both stories say so.

**Supersession handled correctly.** AC-1024 was properly restated from "returns
exactly two fields" to "**leads with** two fields, in this order", with the order
documented as load-bearing. I independently checked the plan's step-3b judgment that
AC-1028 and AC-1044 need no plan item, and **it is correct**: AC-1044's "an image
region's box is a single alt-text field" remains true, because the thirteen new
controls land in the property sheet, not the box, and AC-1044 already draws that
distinction explicitly ("a run that also exposes its typography in the sheet beneath
the box is still one field of words"). AC-981 likewise remains true.

## Behavior Inventory

31 behaviours across `packages/site-schema/src/l1/{schema,types,validate,edit}.ts`,
`packages/framework/src/l1/render.ts`, `tools/generate/src/l1/fold.ts` (+2605/-31).
All are documented by some story. The coverage map lists the load-bearing ones.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `objectPosition` typed pair, image leaf only | Covered | story-d0a8cfad | AC-1124 |
| 2 | `filter` on shared surface, every painting kind | Covered | story-d0a8cfad | AC-1125 |
| 3 | One `filter` declaration, renderer-fixed order | Covered | story-d0a8cfad | AC-1125, AC-1135 |
| 4 | Per-function identity emits nothing | Covered | story-d0a8cfad | AC-1126 |
| 5 | `parallelogram` + `blob` as renderer-built `clip-path` | Covered | story-d0a8cfad | AC-1127 |
| 6 | Blob deterministic in seed; vertex count a renderer constant | Covered | story-d0a8cfad | AC-1127 |
| 7 | Shape and rounding independent | Covered | story-d0a8cfad | AC-1127 |
| 8 | `filterAmount` envelope via `checkSurface`, base + interaction | Covered | story-d0a8cfad | AC-1128 |
| 9 | Thirteen controls after `src`/`alt`; order load-bearing | Covered | story-37a3921b | AC-1024 |
| 10 | Every image control bounded-int or closed-enum, none free-form | **Partial** | story-37a3921b | AC-1024 — claim added, no AC-named assertion |
| 11 | Pan writes typed pair; centre removes the axis | Covered | story-37a3921b | AC-1129 |
| 12 | Percentages projected over fractions | Covered | story-37a3921b | AC-1130 |
| 13 | Shape list union rule | Covered | story-37a3921b | AC-1131 |
| 14 | Bare picture answers with browser-painted values | Covered | story-37a3921b | AC-1132 |
| 15 | **Adjusting** bakes nothing — no file touched | **Partial** | story-37a3921b | AC-1027 — claim added, UAT still tests choosing only |
| 16 | Identity removes the axis; no empty bags (framing) | **Partial** | story-37a3921b | AC-1122 — claim added, UAT still typography-only |
| 17 | Out-of-range refused not clamped (image controls) | **Partial** | story-37a3921b | AC-1121 — claim added, UAT still typography-only |
| 18 | `foldObjectPosition` — default folds to nothing, unreadable is residual | Covered | story-8acc338d | AC-1133 |
| 19 | `foldFilter` — one fraction per spelling, per-function identity, clamp-to-ceiling, no `drop-shadow` | Covered | story-8acc338d | AC-1134 |
| 20 | Media element folds to image leaf carrying its framing | Covered | story-8acc338d | AC-729 text; substance proven by AC-1133/1134 |
| 21 | Shared group carries colour adjustment distinct from backdrop blur | Covered | story-d0a8cfad | AC-802 text; substance proven by AC-1125 |
| 22 | Edit channel paints identically to preview and published | Covered | story-af36c2cb | AC-1135 |

## Ungrounded Stories

None. No story claims behaviour that neither the intent nor the code supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. L1 substrate — framing/shape/colour axes and emission | story-d0a8cfad (STORY-83) | OK — "A picture's framing, shape and colour adjustment" section added |
| 2. Structured copy editing — a picture's framing on the one write path | story-37a3921b (STORY-100) | OK — "How a picture is seen" section added; the stale Out-of-scope deferral was withdrawn as planned |
| 3. The fold — captured pan and colour adjustment land | story-8acc338d (STORY-84) | OK — fold rules added |
| 4. Edit render channel — paint parity | story-af36c2cb (STORY-98) | OK — AC-1135 added |

No plan items dropped. All four `add` sets landed as AC-1124..AC-1135.

## Evidence Sufficiency (Step 5b)

**Verified by execution, because the pipeline did not.** The reconcile's own gates
are vacuous: scoped quality reports REPORT-1914, REPORT-1910 and REPORT-1908 all read
`pass (0 tests, 0 failed)` with an empty `suites` map, and both test-naming checks
reported "no test files modified since coding_red" despite four new reconciliation
suites being created on this branch. Nothing in the pipeline ran these UATs. I ran
them directly:

```
vitest run tests/reconciliation-l1-image-framing.test.ts \
  tests/reconciliation-copy-edit-image-framing.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts \
  tests/reconciliation-edit-render-paint-parity.test.ts \
  tests/test_UAT_FC_REQ-136_image_framing.test.ts \
  tests/reconciliation-copy-edit-typography.test.ts
→ Test Files 6 passed (6) · Tests 30 passed (30)
```

### The fourteen new ACs pass cleanly

AC-1124..AC-1135 were audited against every enumerated failure mode and none is
present. No `vi.mock` / `vi.fn` / `vi.spyOn` anywhere in the new suites; no
source-inspection assertions; entry is through the real `1c copy get|set` CLI
(`run([...argv, '--json'])`), the real renderer and the real validator. AC-1135
carries an explicit non-vacuity guard — it compares paint declarations across the
edit / preview / published channels **and then** asserts the adjustment is genuinely
in the output (`object-position: 30% 20%`, `saturate(0.4)`, `clip-path: polygon(`,
`rotate(12deg)`, exactly one `filter:` declaration) — so it cannot pass by comparing
two empty sets. AC-1127 asserts seed determinism both ways and refuses a smuggled
`points` key. This is above-bar work and is not what fails this review.

### FAIL — four broadened ACs whose new claims have no AC-named evidence

The plan's FC-evidence table (§"FC test evidence") assigned each FC test a "home" on
a modified AC. The AC text was modified; the test was never mirrored into an
`test_UAT_AC{N}_*` UAT. In each case below the AC's own UAT would pass **unchanged**
if the newly-claimed behaviour were deleted outright.

**1. AC-1027 (acceptance_criterion-0bc092af) — story-37a3921b — the headline**

This is the ticket's single load-bearing claim: *"no operation touches a file."*
Generalised from choosing to **"Choosing an image or adjusting how it is seen bakes
nothing"**, with Verification gaining *"Repeat for a framing, shape and colour
adjustment saved together, and assert the same: no file touched, no file added, and
the region's handle unchanged."*

`test_UAT_AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact`
(`tests/reconciliation-copy-edit-image-selection.test.ts:432`) performs exactly one
edit — `set(A_IMAGE, { src: BETA })` — a choose. No framing, shape or colour save is
exercised. Its own comment still calls framing *"the eventual home ... (crop, scale,
scrim, rotation)"*, which this commit made stale. The AC nonetheless carries
`uat_coverage: pass`.

**2. AC-1121 (acceptance_criterion-db9faa7b) — story-37a3921b**

Broadened from "The size control's range" to "every bounded control this surface
offers — a run's size, **and equally a picture's pan, corner rounding, turn, scale
and every colour adjustment**". Verification gained the whole image half ("Repeat
both halves on an image...").
Sole UAT: `test_UAT_AC1121_the_size_bound_binds_a_change_and_never_the_status_quo`
(`tests/reconciliation-copy-edit-typography.test.ts:546`) — exercises `fontSizePx`
only. **File not modified by this reconciliation.**

**3. AC-1122 (acceptance_criterion-66f57a24) — story-37a3921b**

Broadened to "how a run is set, **or how a picture is framed, shaped and
colour-adjusted**", with Verification gaining the image half (turn leaves other
parameters untouched; un-rotating removes the group rather than leaving it empty;
an identity save on a bare picture stays bare).
Sole UAT: `test_UAT_AC1122_a_typography_edit_writes_into_the_runs_parameters_and_a_no_op_produces_no_diff`
(same file, line 577) — exercises `textTransform` and `fontSizePx` only. **File not
modified.**

**4. AC-1024 (acceptance_criterion-8b6792de) — story-37a3921b**

Verification gained *"Assert every remaining field is either a bounded whole number
carrying both bounds or a closed pick carrying a non-empty option list, and that none
of them is a free-form string"* — the DOC-2 security claim the AC body now makes
("nothing on this surface can express a length, a colour function or a path").
`test_UAT_AC1024_*` was edited only to **relax** its pins (`toEqual` → `slice(0,2)` /
`toMatchObject`). It asserts nothing about the shape of the remaining eleven fields.

### Noted, not the failure basis — three ACs whose substance a sibling proves

AC-725, AC-802 and AC-729 were also broadened without their own UATs being touched
(`reconciliation-l1-language.test.ts`, `reconciliation-l1-shared-axis-groups.test.ts`,
`reconciliation-l1-fold-full-language.test.ts` — none modified). Unlike the four
above, their new claims **are** proven by AC-named UATs elsewhere in the matrix:
AC-802's "colour adjustment on every kind, distinct from backdrop blur" and
"image-only framing axis" by AC-1125 and AC-1124; AC-725's structured-typed-form and
per-function-identity claims by AC-1125/1126/1127; AC-729's "the leaf carries its
framing" by AC-1133/1134. The evidence is in the matrix, filed under the new sibling.
Worth tidying, not worth blocking on.

### Mitigating context

All four failing claims **are** proven by executable, passing tests — in
`tests/test_UAT_FC_REQ-136_image_framing.test.ts`:
`..._an_out_of_range_ask_is_refused_and_no_edit_touches_the_asset` (line 377) covers
AC-1121's image half *and* AC-1027's adjusting half (it fingerprints the asset
directory around `{ grayscalePct, rotateDeg, shape }` and re-asserts the handle);
`..._a_framing_edit_disturbs_no_other_axis_and_invents_no_empty_bag` (line 344)
covers AC-1122's image half; `..._an_image_offers_framing_shape_and_colour_beside_the_picker`
(line 191) covers AC-1024's closed-control claim. FC suites are durable here — ten
persist, REQ-122 through REQ-136.

So this is a **traceability failure, not a regression hole**. The suite would catch a
break today. What is missing is the AC-linked evidence that is reconciliation's actual
deliverable — and the matrix link, not the FC file, is what a future planner reads.

### Remediation

Every needed assertion already exists in the FC suite; this is mirroring, not
authoring.

- **AC-1027** — extend `test_UAT_AC1027_*` with a framing/shape/colour save between
  the `assetFingerprint` calls, and drop the now-stale "eventual home of framing"
  comment. Highest priority: it is the ticket's central safety claim.
- **AC-1121 / AC-1122** — the typography file has no image fixtures, so add
  `test_UAT_AC1121_*` / `test_UAT_AC1122_*` cases to
  `tests/reconciliation-copy-edit-image-framing.test.ts`, which already carries
  `A_PLAIN` / `A_FEATHERED` / `A_PILL`. Mirror FC tests 6 and 7.
- **AC-1024** — add the field-shape loop (every field `string|integer|boolean|enum`;
  enums non-empty; integers carry `min` and `max`) from FC test 1. Do **not** weaken
  the clause instead — it is a DOC-2 claim and should gain evidence, not lose the claim.
- **AC-725 / AC-802 / AC-729** — optional. Either add a pointer to the sibling AC that
  carries the evidence, or leave as is.

Narrowing the four AC texts back is the alternative, but it is the wrong trade here:
the claims are true, they are the point of the ticket, and AC-1027's generalisation
from choosing to adjusting is the single most important sentence in this reconciliation.

## Judgment Calls

- **AC-1044 and AC-1028 given no plan item** — independently verified as correct, not
  an omission. Both texts remain true verbatim; only the tests over-asserted.
- **AC-981's stale parenthetical** ("exposes which image goes there and its alt text")
  — acceptable. Its load-bearing claim is that an image region is *not* one that
  exposes an empty field list, which is still true. Not material.
- **The fold's clamp-to-ceiling rule, absent from the intent body** — accepted.
  Grounded in code, documented with rationale in AC-1134, not in conflict with the
  write path. Stated, not absorbed.
- **AC-725 / AC-802 / AC-729 not counted toward the failure** — their new claims are
  proven by sibling AC-named UATs, so the matrix does hold behavioural evidence for
  them. Failing on attribution alone would be pedantry.
- **Vacuous quality reports** — flagged, not failed. A workflow-scoping defect rather
  than a story-coverage defect, and the tests do pass when run. Reported because it is
  why seven un-evidenced AC modifications reached review unflagged.
- **Phase 2 items** — correctly unplanned and unclaimed. Not a gap.

## Verdict

**FAIL.** Coverage gaps found. Four ACs — **AC-1027, AC-1024, AC-1121, AC-1122** —
were broadened to claim a picture's framing, shape and colour adjustment, each gaining
an explicit Verification clause requiring image evidence, while the UAT the matrix
links to each was left exercising the old, narrower subject. Each would pass unchanged
if the newly-claimed behaviour were deleted. AC-1027 is the material one: the ticket's
central "no operation touches a file" guarantee was generalised from choosing to
adjusting, and its UAT still performs only a `src` swap while carrying a comment that
describes framing as future work. The behaviour is proven in the durable REQ-136 FC
suite, so this is traceability rather than regression, and the fix is mirroring
assertions that already exist.

Everything else is sound: intent fidelity is high, no divergence was silently
absorbed, all four plan items produced substantive story content, the supersession of
the "exactly src + alt" pins was handled deliberately and correctly (including the two
ACs rightly left alone), and the fourteen new ACs are backed by real-entry-point,
unmocked, explicitly non-vacuous UATs — 30 tests passing on direct execution.
