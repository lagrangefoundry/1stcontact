---
uid: report-4dffa7f4
id: REPORT-3749
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (uat) — attempt 7'
created_by: xgd
created_at: '2026-09-10T15:08:56.323362+00:00'
updated_at: '2026-09-10T15:08:56.323362+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: uat
  fixes_applied: 5
  progress_made: true
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (uat)

**Attempt**: 7
**Fixes applied this call**: 5
**Violations remaining**: 5
**Needs more work**: true

This call took the two workstreams the report named as priorities — **the
untouched file** (violations 8 + 9, fifth offence) and **the criterion with no
executable evidence anywhere** (violation 1, plus its cheap sibling violation
10) — and added the cheapest of the seven missing UATs (violation 6). All five
are landed and green.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1630 (`acceptance_criterion-2c02ca04`) | Authored `test_UAT_AC1630_pinned_box_content_overflow_is_reported` in `tests/reconciliation-3probe-gate-evaluator.test.ts`. Closes **violation 1** — the only criterion in this capability with no evidence of any kind. |
| 2 | uat-edit | AC-710 (`acceptance_criterion-beb4d907`) | Extended `test_UAT_AC710_probe_findings_are_diagnostic` (`tests/reconciliation-3probe-gate.test.ts`) with the **third** forced violation. Closes **violation 10**. |
| 3 | uat-edit | AC-691 (`acceptance_criterion-304cae4c`) | Rewrote `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` — both halves (a) and (b). Closes **violation 8**. |
| 4 | uat-edit | AC-689 (`acceptance_criterion-7785b92a`) | Enriched `signalsFor()` with a media element + a painted panel and asserted the multi-kind claim on the bundle's `l1.json`. Closes **violation 9**. |
| 5 | uat-add | AC-1629 (`acceptance_criterion-e8bcef98`) | Authored `test_UAT_AC1629_band_scrim_folds_onto_the_section_background_box` in `tests/reconciliation-l1-fold-full-language.test.ts`. Closes **violation 6**. |

### 1 — AC-1630, the third envelope violation (violation 1)

`test_UAT_AC1630_pinned_box_content_overflow_is_reported` drives the real
`evaluateLayout` / `offSampleProbe` / `contentRobustnessProbe` boundaries. It
covers AC-1630's Verification rule by rule:

- A 300px-wide pinned card (`geometry.keyframes[0].height = 40`) whose three
  16px runs stack to 66px. The card is 300px wide **by design**, so it never
  crosses even the 320px viewport edge — the horizontal clip cannot fire and
  stand in for the violation under test.
- Closes on **`toHaveLength(1)`**, exactly as the report's "notes for the editor"
  asked, plus `expect(clip.detail).not.toMatch(/exceeds viewport/)` and an exact
  `toBe('content height 66px exceeds pinned box height 40px')` — so the branch at
  `probes.ts:410` can no longer be deleted without reddening this test.
- `paths` asserted `toEqual(['0.0'])` — the offending node's index path, not the
  runs inside it.
- Ceiling raised above the content → no finding; a **height-less** keyframe → no
  finding, with a companion assertion that the interior really is still 66px tall
  (the pass is the absent ceiling, not a shrunken interior).
- Epsilon: 65px and 64px ceilings raise nothing (1px / 2px overruns under the
  default 2px epsilon), 63px raises one.
- **Off-sample probe**: a run visible only in `[450, 700)` — a band no ladder rung
  touches — so the document fits at all six captured widths and overflows only at
  500px, a width the capture never sampled. `pass === false`, one finding at 500,
  none at 900.
- **Content-robustness probe**: a card that just fits unperturbed (`scale: 1`
  passes) and overflows under the default 2.5× growth at **every** captured
  width, each with exactly one finding naming both magnitudes and the card's path.

The last two together close AC-706's and AC-707's delegated halves, which the
report flagged as info 17.

### 2 — AC-710's diagnostic contract (violation 10)

The existing clip assertion was `expect(clip.detail).toMatch(/\d+px/)`, which
either detail string satisfies. It is now `/\d+px exceeds viewport \d+px/`,
pinning it to the viewport-edge shape, and a **third** forced violation was added:
a pinned-box content overflow whose `detail` must match
`/content height \d+px exceeds pinned box height \d+px/`, whose `paths` are
`toHaveLength(1)` and `toEqual(['0.0'])`, and whose findings list is
`toHaveLength(1)` so no other violation can satisfy it. A closing assertion pins
all three shapes at once (`['overlap', 'clip', 'clip']`) and asserts the two clip
details differ.

The AC-729 ↔ AC-1133/1134 division the report asked for is preserved: AC-1630's
UAT is the rule-by-rule proof, AC-710's is the contract proof.

### 3 — AC-691, both halves (violation 8)

**(a) the height rule.** The `Headline` text leaf now asserts
`kfs.every((k) => k.height === undefined)` **and** `expect(kf).not.toHaveProperty('height')`
per keyframe — the text-leaf no-height invariant that had zero executable evidence
repo-wide. The fixture gained a media element and a painted panel (new `mediaElt`
/ `panelElt` builders), and each asserts `kf.height === Math.round(box.height)` at
every sampled width. A regression that started pinning text heights now reddens
this test, which matters because AC-707's robustness probe is only meaningful
while text height is natural.

**(b) the wrong branch.** A second run, `Standing Tagline`, holds `fontSizePx: 18`
at all three widths. The widest-sample assertion moved onto it
(`axes.fontSizePx === 18`) together with `expect(tagline.responsive?.fontSizePx).toBeUndefined()`
— the "no responsive track was emitted" half AC-691's Verification asks for. The
varying `Headline` remains in the fixture purely as the geometry carrier, with an
inline comment deferring its track behaviour to AC-1625.

**The boundary the report drew is honoured**: no track assertion was added to
`test_UAT_AC691`. The positive track case stays for AC-1625's own UAT (violation
2, next iteration). The negative assertion here is discriminating — the fold does
emit `node.responsive.fontSizePx` for a varying axis, as
`tests/bug18-responsive-text-axes.test.ts:98` shows.

### 4 — AC-689, the full-language clause (violation 9)

`signalsFor()`'s band had `fields: []`, so its folded document could only ever
hold text leaves and BUNDLE-8's clause was structurally unexercisable. It now
carries two `RawField`s (a new local `rawField` builder, matching the one in
`…seams-and-refold.test.ts:342`):

- a media element (`a11yRole: 'img'`, `objectFit`, `intrinsicAspect`, a
  **relative** `src: '/img/storefront.jpg'` so no mirroring or network is
  implied), and
- a painted panel (`surfaceFill: '#e5e7eb'`, `borderRadiusPx: 8`), 240px wide so
  it stays a standalone panel rather than being read as a full-bleed backdrop.

The UAT then asserts on the `l1.json` **read back from the bundle** — the
`cmdCapturePage` path AC-689 is about, not a direct `foldToL1` call — that
`new Set(leafKinds(l1.root)).size > 1` and that the set contains `text`, `image`
and `box`. The three named-kind assertions are what make it fail loudly rather
than degrade quietly if a kind stops folding.

### 5 — AC-1629, the band scrim (violation 6)

`test_UAT_AC1629_band_scrim_folds_onto_the_section_background_box` consolidates
the four `test_UAT_FC_BUG-24_*` shapes against AC-1629's Verification and adds
the clause none of them close:

- Both axes on **one** box: `toHaveLength(1)` on the section-bg boxes **and** on
  the document's leaves, so a second scrim node would fail.
- The veil as captured (`toEqual(VEIL)`), plus two negative-space assertions the
  BUG-24 tests do not make: no `opacity` axis and no `surfaceFill` axis is
  synthesised from it — the scrim's alpha is not confused with element opacity.
- Render: `#0206184d` layered above the photograph.
- Both negative controls (scrim-without-image folds; neither-folds-no-box, with
  `leavesOf(plain)` empty).
- **New — each axis read from the widest sampled width that carries it**: a band
  painting image + veil at 320/375/768 and only a *different* veil
  (`WIDE_VEIL`) at 1024/1280/1440. The image survives (read from 768) while the
  overlay comes from 1440, which is only possible if the axes are read
  independently; reading both off the widest entry would drop the photograph
  entirely. The mirror case (image only at the wide rungs) is asserted too.

## Verification

All seven AC-traced files for this capability were executed in this worktree:

```
npm test -- tests/reconciliation-l1-fold.test.ts \
  tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts \
  tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
```

**7 files, 36 tests, all passing** (1.06s) — up from the 34 the assessor ran.
The two new tests are the delta; nothing regressed, including the four other
tests in `reconciliation-l1-fold.test.ts` that share the enriched `signalsFor()`.

## Code Edits (if any)

None this call. Every mutation is a test edit; no production source was touched.

## Field Updates

**`uat_coverage` was deliberately NOT set on AC-1629 or AC-1630.** That field is
owned by `check_uat_coverage` / `fix_uat_coverage`; setting it here would be
this fix loop asserting a verdict the assessor is about to compute from the tests
themselves. The tests are landed and green — the coverage verdict should follow
from them, not precede them. Flagging for the operator in case this workflow
expects otherwise.

Neither AC's `status` was moved off `pending` either: all five findings resolved
this call were categorised `uat-add` / `uat-edit`, and REPORT-3747's reading that
`pending` is authorship state (not retirement) makes a status flip out of scope
for a uat-level repair.

## Remaining Work

**5 violations remain, all of them the `uat-add` consolidation jobs from
workstream A**, in the order I plan to take them:

| # | AC | Consolidates from | Clause the FC tests do not close |
|---|---|---|---|
| 2 | AC-1625 (`acceptance_criterion-ee8ba69f`) | `bug18-responsive-text-axes.test.ts:91-131`, `req88-…:532` | the varying-vs-constant padding side on one element; widest-keyframe-equals-scalar identity. **Also owns the positive responsive-track case deliberately left out of AC-691 this call.** |
| 3 | AC-1626 (`acceptance_criterion-1e5570ac`) | `bug17-fold-padding.test.ts:85,94` | geometry keyframes unchanged by the padding fold |
| 4 | AC-1627 (`acceptance_criterion-96ccb3ce`) | `req88-viewport-relative-and-nowrap.test.ts:331,350,363,590,609` | a node unaffected by viewport height carrying **no** response |
| 5 | AC-1628 (`acceptance_criterion-3bce83ba`) | `req88-l1-repro-pipeline.test.ts:101,123,159`; `bug23-repro-local-assets.test.ts:88-167` | node-count parity; localized-handle count equals handles rewritten |
| 7 | AC-1631 (`acceptance_criterion-12581128`) | `req88-viewport-relative-and-nowrap.test.ts:188,215,240,261,282` | must assert the **fold's** derivation only — not CAP-70/STORY-83's wrapping floor |

The four warnings (11 AC-694 sidecar dimensions, 12 AC-812 peer half, 13 AC-729
union-on-one-leaf, 14 AC-729/AC-733 duplication) are unaddressed. 13 and 14 edit
the same test and pair naturally; I will take them alongside the AC-1625 work
unless the violations consume the iteration.

## needs_review Items Forwarded

None. Every finding this call had an unambiguous resolution category and an
unambiguous AC body to grade against.
