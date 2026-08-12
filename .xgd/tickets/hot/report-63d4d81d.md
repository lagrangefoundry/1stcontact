---
uid: report-63d4d81d
id: REPORT-1917
type: report
title: 'Reconciliation Review: REQ-136 image editor (ticket-ref)'
created_by: xgd
created_at: '2026-08-12T22:15:02.494410+00:00'
updated_at: '2026-08-12T22:15:02.494410+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: request-8a132869
  anchor_uid: request-8a132869
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: ticket-ref (anchor IS the intent)
**Surface**: —
**Anchor**: request-8a132869 (REQ-136)
**Stories Reviewed**: 4 — story-d0a8cfad (STORY-83), story-37a3921b (STORY-100), story-8acc338d (STORY-84), story-af36c2cb (STORY-98)

The failure is narrow and mechanical. Intent fidelity is excellent, plan
accounting is complete, and the twelve new ACs are backed by unusually strong
evidence. Three **pre-existing** ACs were broadened to claim image behaviour
without their own UATs being broadened to prove it. That is the whole of it.

## Intent Fidelity

Read first: the intent body (13.4k chars) and comment-28658562 (the full design
chat, including the operator's two turns). The operator asked for a non-destructive
image editor — crop, colorize, rotate, scale — with editor/page parity, then chose
"implement phase 1" and added the shape question (circular / rounded / parallelogram
/ random splat).

Every declared behaviour is faithfully represented:

| Intent declaration | Story treatment | Verdict |
|---|---|---|
| No operation touches a file; every tool writes a typed L1 axis | AC-1027 asserts it directly, per-control | Faithful |
| Pan-crop via `objectPosition`, pair-or-nothing | AC-1124, AC-1129 | Faithful |
| Typed `filter` group on the shared surface, fixed emission order | AC-1125, AC-1130 | Faithful |
| Per-function identity (the silent-failure trap) | AC-1126, AC-1134 | Faithful |
| All four shapes; blob deterministic in its seed | AC-1127 | Faithful |
| Envelope bounds incl. interaction states | AC-1128 | Faithful |
| Editor/page parity asserted, not assumed | AC-1135 | Faithful |
| Fold now carries pan + adjustment | AC-1133, AC-1134 | Faithful |
| Shape list carries what the node already holds | AC-1131 | Faithful |
| A bare picture reads back what a browser paints | AC-1132 | Faithful |
| Phase 2 items (zoom, tint, background framing, cache, sepia/invert in UI) | Not claimed anywhere | Correctly deferred |

**No silent divergence absorption found.** The one behaviour present in code and
absent from the intent body — the fold clamping an over-ceiling value to the
nearest expressible one rather than dropping it — is explicitly documented in
AC-1134 with its rationale, and verified against `tools/generate/src/l1/fold.ts`
(the `FILTER_FUNCTIONS` table with per-function `max`). Grounded in code where the
intent is genuinely silent, and *stated* rather than absorbed. It does not
contradict the write path's "refused, never clamped" rule (AC-1121); folding a
captured page and answering an operator's new ask are different paths, and both
stories say so.

**Supersession handled correctly.** The intent flagged five suites that pinned
"an image segment exposes exactly src + alt" as a deliberate intent conflict.
AC-1024 was properly restated from "returns exactly two fields" to "**leads with**
two fields, in this order", with the order documented as load-bearing (the modal
opens into the picker). AC-1044's "an image region's box is a single alt-text
field" was checked and remains **true** — the thirteen new controls land in the
property sheet, not the box, and AC-1044 already draws that distinction explicitly.
AC-981 is likewise still true.

## Behavior Inventory

31 behaviours identified across `packages/site-schema/src/l1/{schema,types,validate,edit}.ts`,
`packages/framework/src/l1/render.ts` and `tools/generate/src/l1/fold.ts`
(+2605/-31 lines). All are covered; the coverage map below lists the load-bearing ones.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `objectPosition` typed pair, image leaf only, not hoisted to shared group | Covered | story-d0a8cfad | AC-1124 |
| 2 | `filter` on shared surface group, every painting kind | Covered | story-d0a8cfad | AC-1125 |
| 3 | One `filter` declaration, renderer-fixed order | Covered | story-d0a8cfad | AC-1125, re-asserted in AC-1135 |
| 4 | Per-function identity emits nothing | Covered | story-d0a8cfad | AC-1126 |
| 5 | `parallelogram` + `blob` compile to renderer-built `clip-path` | Covered | story-d0a8cfad | AC-1127 |
| 6 | Blob deterministic in seed; vertex count a renderer constant | Covered | story-d0a8cfad | AC-1127 |
| 7 | Shape and corner rounding independent | Covered | story-d0a8cfad | AC-1127 |
| 8 | `filterAmount` envelope, checked in `checkSurface` (base + interaction) | Covered | story-d0a8cfad | AC-1128 |
| 9 | Thirteen controls after `src`/`alt`, order load-bearing | Covered | story-37a3921b | AC-1024 |
| 10 | Pan writes typed pair; centre removes the axis | Covered | story-37a3921b | AC-1129 |
| 11 | Percentages projected over fractions | Covered | story-37a3921b | AC-1130 |
| 12 | Shape list carries the node's own shape (union rule) | Covered | story-37a3921b | AC-1131 |
| 13 | Bare picture answers with browser-painted values, not blanks | Covered | story-37a3921b | AC-1132 |
| 14 | No file touched by any control | Covered | story-37a3921b | AC-1027 |
| 15 | Identity removes the axis; no empty bags | **Partial** | story-37a3921b | AC-1122 — see Step 5b |
| 16 | Out-of-range refused not clamped; bound binds a change | **Partial** | story-37a3921b | AC-1121 — see Step 5b |
| 17 | Every image control bounded-int or closed-enum, none free-form | **Partial** | story-37a3921b | AC-1024 — see Step 5b |
| 18 | `foldObjectPosition` — default folds to nothing, unreadable form is residual | Covered | story-8acc338d | AC-1133 |
| 19 | `foldFilter` — one fraction per spelling, per-function identity, clamp-to-ceiling, no `drop-shadow` | Covered | story-8acc338d | AC-1134 |
| 20 | Edit channel paints identically to preview and published | Covered | story-af36c2cb | AC-1135 |

## Ungrounded Stories

None. No story claims behaviour that neither the intent nor the code supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. L1 substrate — framing/shape/colour axes and their emission | story-d0a8cfad (STORY-83) | Y — "A picture's framing, shape and colour adjustment" section added |
| 2. Structured copy editing — a picture's framing on the one write path | story-37a3921b (STORY-100) | Y — "How a picture is seen" section added |
| 3. The fold — captured pan and colour adjustment land | story-8acc338d (STORY-84) | Y — framing/adjustment fold rules added |
| 4. Edit render channel — parity | story-af36c2cb (STORY-98) | Y — AC-1135 added |

No plan items dropped.

## Evidence Sufficiency (Step 5b)

**Verified by execution, not by report.** The reconcile's own gates are vacuous
here — the three scoped quality reports (REPORT-1914, REPORT-1910, REPORT-1908)
all read "pass (0 tests, 0 failed)" with an empty `suites` map, and both test-naming
checks reported "no test files modified since coding_red" despite four new
reconciliation suites being created on this branch. Nothing in the pipeline
actually ran these UATs. I ran them directly:

```
vitest run tests/reconciliation-l1-image-framing.test.ts \
  tests/reconciliation-copy-edit-image-framing.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts \
  tests/reconciliation-edit-render-paint-parity.test.ts \
  tests/test_UAT_FC_REQ-136_image_framing.test.ts \
  tests/reconciliation-copy-edit-typography.test.ts
→ Test Files 6 passed (6) · Tests 30 passed (30)
```

**The twelve new ACs (AC-1124..AC-1135) pass Step 5b cleanly.** Audited for the
enumerated failure modes and none is present: no `vi.mock` / `vi.fn` / `vi.spyOn`
anywhere in the new suites; no source-inspection assertions; entry is through the
real `1c copy get|set` CLI (`run([...argv, '--json'])`) and the real renderer /
validator, not internal functions. AC-1135 in particular carries an explicit
non-vacuity guard — it compares the paint declarations across edit / preview /
published channels **and then** asserts the adjustment is genuinely present
(`object-position: 30% 20%`, `saturate(0.4)`, `clip-path: polygon(`,
`rotate(12deg)`, exactly one `filter:` declaration), so the criterion cannot pass
by comparing two empty sets. AC-1127 asserts seed determinism both ways
(`outline(7) === outline(7)`, `outline(7) !== outline(8)`) and refuses a smuggled
`points` key. This is above-bar work.

### FAIL — three ACs whose claims outgrew their evidence

Each of these is a **pre-existing** AC that this reconciliation broadened to cover
image framing, adding an explicit new clause to its Verification section, without
extending the AC-named UAT that the matrix points at. In each case the linked UAT
would pass **unchanged** if the newly-claimed behaviour were removed entirely.

**1. AC-1121 (acceptance_criterion-db9faa7b) — story-37a3921b**

Broadened from "The size control's range" to "every bounded control this surface
offers — a run's size, **and equally a picture's pan, corner rounding, turn, scale
and every colour adjustment**". Verification gained: *"Repeat both halves on an
image: seed a picture whose corner rounding is outside the control's range... then
ask for a colour adjustment, a pan and a scale outside their ranges and assert each
is refused naming its bound, with the stored draft byte-for-byte unchanged."*

Sole covering UAT: `test_UAT_AC1121_the_size_bound_binds_a_change_and_never_the_status_quo`
(`tests/reconciliation-copy-edit-typography.test.ts:546`). It exercises `fontSizePx`
only — the file was not modified by this reconciliation. Delete every image bound
check and this test still passes.

**2. AC-1122 (acceptance_criterion-66f57a24) — story-37a3921b**

Broadened to "how a run is set, **or how a picture is framed, shaped and
colour-adjusted**". Verification gained: *"Repeat on an image carrying several
parameters this surface does not expose: change its turn and assert every other
parameter, including its edge treatment, is untouched; return the turn to its
identity and assert the group holding it is gone rather than left empty; and
re-save a picture that declares no parameters at all with every control at its
identity..."*

Sole covering UAT: `test_UAT_AC1122_a_typography_edit_writes_into_the_runs_parameters_and_a_no_op_produces_no_diff`
(same file, line 577). It exercises `textTransform` and `fontSizePx` only. No image
assertion.

**3. AC-1024 (acceptance_criterion-8b6792de) — story-37a3921b**

Verification gained: *"Assert every remaining field is either a bounded whole number
carrying both bounds or a closed pick carrying a non-empty option list, and that
none of them is a free-form string."* This is the security-relevant claim the AC
body now makes ("nothing on this surface can express a length, a colour function or
a path, so widening what an operator can say here never widens what can be smuggled
through").

`test_UAT_AC1024_*` (`tests/reconciliation-copy-edit-image-selection.test.ts`) was
updated only to relax its exhaustive pins (`toEqual` → `slice(0,2)` / `toMatchObject`).
It asserts nothing about the shape of the remaining eleven fields.

### Mitigating context (why this is small, not systemic)

All three behaviours **are** proven by executable, passing tests — in
`tests/test_UAT_FC_REQ-136_image_framing.test.ts`:

- `..._an_out_of_range_ask_is_refused_and_no_edit_touches_the_asset` (line 377) covers
  AC-1121's image half exactly: refusals on `saturatePct: 500` / `objectPositionXPct: 140`
  / `scalePct: 1` with byte-identical draft, plus the `cornerRadiusPx: 9999` pill
  sentinel surviving a re-save reporting only `alt` changed.
- `..._a_framing_edit_disturbs_no_other_axis_and_invents_no_empty_bag` (line 344) covers
  AC-1122's image half exactly: rotate leaves the feather and fill untouched,
  un-rotating removes `transform` outright, identity save on a bare picture leaves
  `axes` undefined and the draft byte-identical.
- `..._an_image_offers_framing_shape_and_colour_beside_the_picker` (line 191) covers
  AC-1024's closed-control claim: every field is `string|integer|boolean|enum`, enums
  non-empty, integers carry both `min` and `max`.

And FC suites are durable in this repo — ten of them persist, from REQ-122 through
REQ-136. So there is no regression hole in practice; the suite would catch a break.
What is missing is the **traceable AC-linked evidence** that is reconciliation's
actual deliverable: an AC whose linked UAT cannot fail on half its claim is the
precise case Step 5b exists to catch, and the matrix carries that link forward long
after this ticket closes.

### Remediation (small, mechanical, already written)

The needed assertions exist verbatim in the FC suite. For each of the three, either:

- **(preferred)** extend the AC-named UAT with the image half — mirror
  `test_UAT_FC_REQ-136_an_out_of_range_ask_is_refused...` into `test_UAT_AC1121_*`,
  `..._a_framing_edit_disturbs_no_other_axis...` into `test_UAT_AC1122_*`, and the
  field-shape loop into `test_UAT_AC1024_*` (note the image fixtures live in a
  different suite than the typography ones, so the first two may be cleaner as
  additional `test_UAT_AC1121_*` / `test_UAT_AC1122_*` cases inside
  `tests/reconciliation-copy-edit-image-framing.test.ts`, which already has the
  fixtures); **or**
- narrow the three ACs' bodies and Verification sections back to what their UATs
  actually prove, and let AC-1129..AC-1132 carry the image-side claims.

Do **not** weaken AC-1024's free-form-control clause — it is a DOC-2 security claim
and should gain evidence, not lose the claim.

## Judgment Calls

- **AC-981's stale parenthetical** ("an image region... exposes which image goes
  there and its alt text") — omitted as acceptable. Its load-bearing claim is that
  an image region is *not* one that exposes an empty field list, which remains true;
  the parenthetical is now incomplete but not false. Not material.
- **The fold's clamp-to-ceiling rule, absent from the intent body** — accepted.
  Grounded in code, explicitly documented with rationale in AC-1134, and not in
  conflict with the write path's refuse-never-clamp rule. Stated, not absorbed.
- **Vacuous quality reports** — flagged, not failed. The 0-test scoped reports are a
  workflow-scoping defect, not a story-coverage defect, and the tests do pass when
  run. Reported here because it is why this gap reached review unflagged.
- **Sepia/invert in L1 and the fold but absent from the editor** — correctly recorded
  as a phase-2 deferral in the intent, and no story claims them as exposed. Not a gap.

## Verdict

**FAIL.** Coverage gaps found. AC-1121, AC-1122 and AC-1024 had their claims
broadened to cover a picture's framing, shape and colour adjustment, each gaining an
explicit Verification clause requiring image evidence, while the UAT the matrix links
to each was left exercising typography (or, for AC-1024, relaxed without replacement).
Each of those UATs would pass unchanged if the newly-claimed behaviour were deleted.
The behaviour is proven elsewhere — in the durable REQ-136 FC suite — so this is a
traceability failure rather than a regression hole, and the remediation is to mirror
assertions that already exist.

Everything else in this reconciliation is sound: intent fidelity is high, no
divergence was silently absorbed, all four plan items produced substantive story
content, the supersession of the "exactly src + alt" pins was handled deliberately
and documented, and the twelve new ACs are backed by real-entry-point, unmocked,
explicitly non-vacuous UATs — 30 tests passing on direct execution.
