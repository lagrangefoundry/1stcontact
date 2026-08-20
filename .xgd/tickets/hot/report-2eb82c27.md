---
uid: report-2eb82c27
id: REPORT-2453
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-08-20T14:29:28.637652+00:00'
updated_at: '2026-08-20T14:29:28.637652+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-2049c9ec (CAP-71)
Stories: STORY-84 (story-8acc338d), STORY-86 (story-24098299) — both `story_kind: upgrade`
Active ACs: 42 · ACs with a `test_UAT_AC<n>_*` UAT: **42** · without: **0**

**Test execution evidence (this session, 2026-08-20 07:22 PDT).**

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts --reporter=verbose
→ Test Files 9 passed (9) · Tests 42 passed (42) · 0 skipped
```

Coverage was re-derived independently of the prior report rather than inherited: the 42
active AC numbers were extracted from the ticket store and matched against every
`test_UAT_AC<n>_*` symbol in `tests/`. All 42 resolve, each to exactly one test, and no AC of
this capability appears in the repository's multi-hit set — so there is no intra-capability
exclusivity duplicate either.

**The prior cycle's violation is closed and independently verified.** report-028c1de3 filed
one violation (two unasserted clauses of AC-1352) and one warning (three unasserted clauses
of AC-1351). Attempt 8 (report-de34d8f0) closed both in
`tests/reconciliation-l1-fold-measured-axes.test.ts` (+125/-1, commit 9009ded4f — the only
file the fix touched; no production code changed). Each repaired clause was re-derived here
against `tools/generate/src/l1/fold.ts` rather than taken on the fix report's word — see the
ledger. The three warnings below are new observations about assertion *strength* and
*placement*, not evidence holes: every behaviour named in every AC of this capability is
asserted by at least one test that bites.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference; the `ac` cycle passed at 2026-08-20
13:19 (report-34a49913, 0 violations) and the `story` cycle at 12:33 (report-47677418).
Intent was consulted only to confirm nothing asserted has been retired. The three ticketed
intents were re-read from the store this session and their statuses re-verified.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) — REQ-63/79/82/83/84 +2 | `free_and_reconciled` (verified) | created 2026-07-22, main @ edeb1c2c | Originating intent for both stories: capture → fold → render → gate | YES |
| BUNDLE-11 (bundle-ee56a66e) — BUG-27/REQ-94/96/97/98 +10 | `free_and_reconciled` (verified) | created 2026-08-05, main @ f9a415a8 | Widened STORY-86 (`updated_by`): cross-gate verdict, control composition | YES |
| REQ-136 (request-8a132869) | `free_and_reconciled` (verified) | created 2026-08-12, merged @ a23c4c51 | Widened STORY-84 (`updated_by`): image framing + colour adjustment (AC-1133/AC-1134) | YES |
| REQ-88 (free-coded, reconciled into main) | reconciled | — | nowrap threshold, viewport-height probe, content column, column anchor, padding track, surface attribution, form labelling | YES |
| REQ-96 (free-coded, reconciled into main) | reconciled | — | control composition; a captured control binds to its module seam, not the residual channel | YES |
| BUG-13/14/17/18/23/24 (free-coded, reconciled into main) | reconciled | — | section background, surface hierarchy, fold padding, responsive text axes, repro local assets, scrim alpha | YES |

No retired, abandoned or deprecated intent bears on this capability's UAT layer; nothing in
the 42 passing tests asserts behaviour intent has withdrawn.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689, AC-690, AC-692, AC-693, AC-695, AC-696 → their UATs | BUNDLE-7 | aligned |
| AC-691 → `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | BUNDLE-7, BUG-18 | aligned, with a placement note — the text-leaf half, the widest-sample base and the varying/uniform track pair are all asserted (`reconciliation-l1-fold.test.ts:351-384`); the Verification's image-leaf and box-leaf height-pinning half is asserted in AC-729's and AC-730's UATs instead → warning 1 |
| AC-694 → `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | BUNDLE-7 | aligned, with an environment note — the emission half runs offline; the Verification's parent-layout / real-breakpoint half is behind `chromiumAvailable()`, which is **false** in this environment → warning 2 |
| AC-705, AC-708, AC-709, AC-724 → their UATs | BUNDLE-7 | aligned (carried from report-028c1de3's line-by-line pass; re-run green) |
| AC-706, AC-707, AC-710 → their UATs | BUNDLE-7 | aligned — the shared pinned-container fixture asserts the off-sample overrun, the pinned-vs-unpinned magnitudes and the diagnostic `clip` naming respectively |
| AC-729…AC-733 → their UATs | BUNDLE-7, BUG-14, REQ-88, REQ-96 | aligned — AC-729 pins `kf.height === 300` at every ladder width (`reconciliation-l1-fold-full-language.test.ts:166-168`), AC-730 pins `kf.height === 120` (`:276-278`) |
| AC-734…AC-737 → their UATs | BUNDLE-7, BUG-14, REQ-96 | aligned |
| AC-812, AC-813, AC-814 → their UATs | BUNDLE-7 | aligned |
| AC-852…AC-856 → their UATs | BUNDLE-11 (REQ-94) | aligned |
| AC-1133, AC-1134 → their UATs | REQ-136 | aligned |
| AC-1345…AC-1350 → their UATs | BUG-17, BUG-23, BUG-24, REQ-88, REQ-96 | aligned |
| AC-1351 → `test_UAT_AC1351_column_anchors_are_fitted_per_axis_with_cap_track_and_refusals` | REQ-88 | **now aligned** — prior warning 2 closed. All six Verification paragraphs are asserted: the residual-inset consequence at the unsampled 767 (`:964-972` — left edge on the column origin, right edge inside the viewport, no `clip` finding), and the two-distinct-extents guard with its discriminating two-extent contrast (`:906-924`). The plausible-share render half is asserted but does not discriminate → warning 3 |
| AC-1352 → `test_UAT_AC1352_probe_pair_folds_a_measured_snapped_height_response` | REQ-88 | **now aligned** — prior violation 1 closed, both clauses re-derived here against production code (below) |

**Independent re-derivation of the two repaired AC-1352 clauses** (the fix report's mutation
evidence was not taken on trust; `fold.ts` was read, not modified):

- *Attribution rule 2 — a card inherits its representative row's response.* `fold.ts:1687-1688`
  is `const cardResponse = rows.map((r) => r.viewportResponse).find(Boolean); if (cardResponse)
  geometry.viewportResponse = cardResponse`. The test now asserts
  `responseOf(cardWith(doc, '#f4f0ea'))?.yFactor === 1` against
  `responseOf(cardWith(doc, '#ffe9c7')) === undefined`. `cardWith` bottoms out in
  `nodeWith(...).find(pred)!` — a missing card makes `responseOf` throw rather than pass, so
  neither assertion can go vacuous on an absent node, and the pair separates *inheritance*
  from *cardhood*. Deleting 1687-1688 leaves the positive assertion reading `undefined`.
- *The band-disagreement refusal.* `fold.ts:1574` gates on
  `first && responseSamples.every((s) => s.y === first.y && s.height === first.height)`. Traced
  through `snappedTop` and the content-bottom clamp (`fold.ts:1516-1540`) for the new
  `threeSectionPage` fixture: with a uniform 580px content height every rung's content bottom
  clears the `H+300` edge, so every band closes on `H+600` (a 2x edge) → samples
  `{y:1, height:1}` throughout → `{ yFactor: 1, heightFactor: 1 }`. With 280px at 320/375 the
  narrow rungs' content bottom falls short of `H+300` and they close on the 1x edge → samples
  `{y:1, height:0}` at 320/375 against `{y:1, height:1}` above. `responseSamples` is therefore
  **non-empty and genuinely disagreeing** — the refusal is exercised in the true direction, not
  reached by the empty-samples path. Weakening the guard to `if (first)` would emit
  `{ yFactor: 1 }`, exactly the mutation failure attempt 8 recorded.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-691 (acceptance_criterion-304cae4c) | uat-edit | AC-691's Verification names two assertions its own UAT does not make: "For a folded image leaf and a folded box leaf, assert every keyframe carries a height equal to the captured box height." `test_UAT_AC691_*` (`tests/reconciliation-l1-fold.test.ts:326-385`) asserts only the negative text-leaf half (`kf.height` undefined, `:364`). The positive half is asserted, with bite, by neighbouring UATs of the same capability — AC-729 at `tests/reconciliation-l1-fold-full-language.test.ts:166-168` (`kf.height === 300` at every ladder width) and AC-730 at `:276-278` (`kf.height === 120`). Not a violation: the behaviour is protected, the clause is merely proven under a different AC's name, so AC-691's own test under-states its criterion | Add to `test_UAT_AC691_*` an image or box leaf in the same fixture and assert `kf.height` equals the captured box height at every keyframe — or, if the split is deliberate, trim AC-691's Verification to the text-leaf clause and let AC-729/AC-730 own the height-pinning half |
| 2 | warning | consistency | AC-694 (acceptance_criterion-c8dd43d2) | uat-edit | The substantive half of `test_UAT_AC694_*` is dark in a browserless environment. `tests/reconciliation-l1-fold.test.ts:459` early-**returns** on `!(await chromiumAvailable())`, so the three assertions AC-694's Verification actually names — `real.mediaBreakpoints` contains 600 (`:477`), `flexChild.parentLayout.justifyContent === 'space-between'` (`:482`), percent sizing on a real child (`:484`) — never execute here. Confirmed empirically this session: `npm test -- tests/capture.test.ts` reports `1 passed / 8 skipped`, i.e. `chromiumAvailable()` is false. What survives offline asserts the FakeDriver's canned payload rather than the code: `hints.mediaBreakpoints` is the literal `[640, 1024]` declared at `:137` and `expect(...).toEqual([...].sort(...))` is trivially true for it, while `parentLayout` and `parentId` are hard-coded `null` at `:141-146`, so no parent-layout, ancestry, position-mode or sibling-repetition clause of the Criterion is exercised at all without a browser. Filed as a warning, not a violation: the AC's Verification inherently requires a real engine, the test gates on it honestly (the repo's documented idiom, `tests/reconciliation-1c-cli-output-hygiene.test.ts:223`), and two prior uat cycles blessed it on the same evidence | Prefer `it.skipIf(!browserOk)` (the pattern already used in `tests/capture.test.ts`, `bug25-*`, `bug27-*`) over a silent early `return`, so a browserless run reports the gap as a skip instead of reading green; and give the offline half one assertion that is not the fixture echoed back — e.g. drive `captureStructuralHints` over a DOM the fake driver did not pre-answer, or assert a derived field the FakeDriver does not supply |
| 3 | warning | consistency | AC-1351 (acceptance_criterion-186df008) | uat-edit | The plausible-share clause's render half is asserted but cannot fail. `tests/reconciliation-l1-fold-measured-axes.test.ts:892-898` evaluates the refused run at 600/900/1150 and asserts its width lies in `[lo-1, hi+1]` where `lo=200, hi=500` from the ladder samples. With `NARROW.maxWidthPx = 400`, `extentOf` is already capped at 400 for every width >= 768, so the *anchored* value the clause warns against — `2.5 x extent - 500` — evaluates to exactly 500 at all three probe widths and sits **inside** the same envelope. The assertion therefore passes identically whether or not the anchor was refused, and cannot witness the "kilometres wide" extrapolation it narrates. The clause is still covered — `anchorOf(...)?.width` `toBeUndefined` (`:887`) is the discriminating assertion and does bite — so this is assertion strength, not an evidence hole | Either probe a width where the two models diverge (an uncapped `ColumnShape`, or a width above the ladder's top rung where the steep coefficient runs away), or assert the laid width against the interpolated keyframe value directly rather than against an envelope both models satisfy |
| 4 | info | coverage | AC-1345…AC-1352 | — | Carried forward from report-028c1de3 finding 3, still true: these eight AC-named UATs **mirror** rather than re-home their free-coded sources (`tests/bug24-scrim-alpha.test.ts`, `bug17-fold-padding.test.ts`, `bug23-repro-local-assets.test.ts`, `req88-form-labelling-and-submit.test.ts`, `req88-viewport-relative-and-nowrap.test.ts`). Recorded so a future cycle does not read the pairing as accidental exclusivity drift — the FC suites are the free-coded intents' own regression chain | none |
| 5 | info | — | AC-689, AC-691, AC-694 | — | These three ACs still carry `fields.uat_coverage: fail` while the other 39 carry `pass`. The flag is stale: all three have a passing `test_UAT_AC<n>_*` (verified by name-match and by execution this session), and the `ac` cycle passed at 13:19. The field is written by the structural-health pass, not by this check, and this check is read-only | none — will clear when the structural pass re-runs |
| 6 | info | — | `tests/req88-form-labelling-and-submit.test.ts` | — | Carried forward from report-028c1de3 finding 4: two FC UATs fail in this sandbox with `Error: listen EPERM ... 0.0.0.0` from `tools/generate/src/cli/serve.ts:54`. Suites binding `127.0.0.1` explicitly pass, so this is the sandbox denying a wildcard bind, not a defect. Touches no AC-named UAT of this capability | none |

## Notes for the Editor

**This level passes.** The single violation that gated the previous eight attempts is closed,
and I verified it against production code rather than against the fix report's summary: both
`fold.ts:1687-1688` (card response inheritance) and `fold.ts:1572-1579` (band-disagreement
refusal) are now protected by assertions whose false direction is genuinely reachable. The
prior warning on AC-1351 is likewise closed — all six of its Verification paragraphs now have
assertions.

**The three warnings do not gate the level and share one shape**: an AC clause that *is*
proven somewhere, but not in the place or with the force its own AC implies. None of them is
an unprotected line of production code, which is the bar the previous cycle correctly set for
a violation. If a future cycle picks them up, warning 2 is the most worth taking — not
because the AC-694 behaviour is wrong, but because a browserless run currently reports it
green rather than skipped, which is the failure mode that hides regressions rather than
surfacing them.

**No `code-issue` is filed and none is warranted.** Every behaviour named in every AC of this
capability is implemented and, as of attempt 8, asserted.

**Metadata observation (not a finding, carried forward twice now).** AC-1345…AC-1352 still
carry no `intent_uid`, so the free-coded intents they reconcile (REQ-88, BUG-17, BUG-23,
BUG-24) are not machine-traceable from the AC. That is an `ac`-level attribute and the `ac`
cycle has passed; on record only.
