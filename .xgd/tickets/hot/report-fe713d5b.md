---
uid: report-fe713d5b
id: REPORT-1663
type: report
title: 'UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-08-07T23:56:30.586747+00:00'
updated_at: '2026-08-07T23:56:30.586747+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 7
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Result**: FAIL
**AC verdicts**: 29 pass, 3 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 1 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

CAP-71 holds two stories with 16 ACs each — STORY-84 (`story-8acc338d`, the fold)
and STORY-86 (`story-24098299`, the 3-probe gate + cross-gate reconciliation).
Every one of the 32 ACs has exactly one `test_UAT_AC<n>_*` test and **all 32 pass**
(re-run this session: 6 files, 32 tests, 1.18s). The evidence aesthetic is strong —
real entry points throughout (`foldToL1`, `cmdCapturePage`, `cmdRefold` via
`cli.run`, `renderL1Document`, `validateL1`, `sampleFidelityProbe`, `offSampleProbe`,
`contentRobustnessProbe`, `evaluateLayout`, `promoteToFlow`, `threeProbeGate`,
`cmdL1Gate`, `cmdGate`, `referenceCoverage`, `formatGateReport`), no internal
mocking, and no structural/AST-only stand-ins. **There is no `uat-add` gap at AC
level**: every failure below is a UAT that proves part of its AC and is silent on a
named clause of it, or a matrix element that must land before a UAT can trace to it.

**The previous round's single `needs_review` is resolved.** REPORT-1321
(2026-08-05) held STORY-84 at `needs_review` because BUNDLE-10's fold behaviours
were reconciled in the ticket store but **absent from the code**, so authoring UATs
would have meant testing an absent implementation. That is no longer true: this
session verified `responsiveTextTracks` (`fold.ts:605-639`, applied `:1745`),
`foldPadding`/`responsivePaddingTracks` (`fold.ts:550,655`),
`isSelfPaintingRun`/`chipAxes` (`fold.ts:939-944`), `barBandFills` (`fold.ts:1276`)
and the `section-band-*`/`card-*` hierarchy (`fold.ts:1472,1599`) are all live, and
each is covered by a `test_UAT_FC_BUG*` free-coded test. The operator decision is
therefore no longer needed — the matrix is simply behind the code, and the verdict
converts from `needs_review` to `stale` (finding 5): a definite, actionable
story-body-edit.

## Cumulative Intent Considered

Chronological ledger of intents touching this capability. Both stories carry
`intent_uid: bundle-31e474b9` (BUNDLE-7) and `updated_by: bundle-ee56a66e`
(BUNDLE-11) — BUNDLE-8 and BUNDLE-10 appear in neither attribution chain, which is
the structural origin of finding 5.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled | BUNDLE-7, 2026-07-22 | Framework pivot to L1; absolute-base reproduction (D1) | YES |
| REQ-83 | free_and_reconciled | BUNDLE-7, 2026-07-22 | capture→L1 fold (keyframes + oracle) + hint sidecar — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | BUNDLE-7, 2026-07-22 | End-to-end 3-probe gate — origin of STORY-86 | YES |
| REQ-66 | free_and_reconciled | earlier | `adopt-values` — retired by the L1 fold | YES (retired) |
| BUG-5 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Occurrence-identity fidelity pairing + idempotence | YES |
| BUG-6 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Fold signals residuals, never drops | YES |
| BUG-7 / BUG-8 / BUG-9 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Row tiling; half-open intervals; recursive promote | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Resource table; pixel-mover axes; full-language fold | YES |
| BUG-11 | free_and_reconciled | 2026-07-29 | Fold carries surfaceFill / surfaceGradient | YES |
| BUG-12 / BUG-13 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Font faces reach the table; CSS/section bg-images foldable | YES |
| **BUG-14** | free_and_reconciled | BUNDLE-10, 2026-08-05 | section-band → card → text hierarchy; **stop per-run boxing** | YES — findings 5, 7 |
| **BUG-17** | free_and_reconciled | BUNDLE-10, 2026-08-05 | Fold carries captured per-side padding onto leaves | YES — finding 5 |
| **BUG-18** | free_and_reconciled | BUNDLE-10, 2026-08-05 | Keyframe the numeric type axes per width, not widest-only | YES — findings 5, 6 |
| **BUG-19** | free_and_reconciled | BUNDLE-10, 2026-08-05 | Full-bleed **bar** fill seeds a band (footer/nav strip) | YES — finding 5 |
| **BUG-20 / BUG-21** | free_and_reconciled | BUNDLE-10, 2026-08-05 | Chip run carries its own surface on its text leaf; padded controls | YES — finding 5 |
| BUG-23 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Asset handles bound to the bundle mirror; unmirrored = hard fail | YES — finding 5 |
| REQ-88 | free_and_reconciled | BUNDLE-10, 2026-08-05 | `1c repro` / `1c l1-gate` / `1c refold` | YES (partly — see Notes) |
| REQ-93 | free_and_reconciled | BUNDLE-10, 2026-08-05 | L1 pages host behavior modules in slots (`forms.json` seam) | YES |
| BUG-27 | free_and_reconciled | BUNDLE-11, 2026-08-06 | CSS bg-images/lazy media uncaptured; backdrop edges are section edges | YES |
| REQ-94 | free_and_reconciled | BUNDLE-11, 2026-08-06 | Cross-gate reconciliation, perceptual floor, coverage, named causes | YES |
| REQ-96 | free_and_reconciled | BUNDLE-11, 2026-08-06 | L1 `control` node — fold binds controls to module seams | YES |
| BUG-25 | free_and_reconciled | 2026-08-05 | Multi-line runs must not share one box | YES (CAP-63 owns the acceptance) |
| REQ-114 | free_and_reconciled | 2026-08-07 | L1 palette colour model | out of scope (CAP-70) |
| REQ-82/84/85, REQ-97–107 | free_and_reconciled | various | L1 schema / renderer / validator / axis vocabulary | out of scope (CAP-70) |
| REQ-63, REQ-15/16/22/24 family | free_and_reconciled | various | Capture & values-diff axes | out of scope (CAP-63) |

No intent in the ledger retires an AC wholesale, so **no AC is deprecated**. BUG-14
and BUG-18 retire *clauses inside* AC-731 and AC-691 while leaving each AC's
headline behaviour active — those are `ac-edit`, not `ac-deprecate` (findings 6, 7).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (fold) | REQ-79, REQ-83, REQ-90/91/92, REQ-96, BUG-6, BUG-11, BUG-12, BUG-13, BUG-27 | **stale** | Aligned through BUNDLE-8 and for BUNDLE-11's own intents. Body still describes the **retired** per-run backing-box model (BUG-14) and only-geometry-is-keyframed (BUG-18), and is silent on BUG-17 padding, BUG-19 bar bands, BUG-20 chip self-surface, BUG-23 mirror binding — all verified live in `fold.ts` this session. Fix = one story-body-edit pass (finding 5). |
| STORY-84 (fold) | BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-23 | drifted | Behaviour shipped + free-coded-tested (`tests/bug14…`, `bug17…`, `bug18…`, `bug19…`, `bug20…`, `bug23…`), but traced to no AC. |
| STORY-86 (gate) | REQ-86, REQ-94, BUG-5, BUG-7, BUG-8, BUG-9, BUG-27 | aligned, **not fully covered** | Every reconciled gate intent is expressed by an AC and proven by a substantive UAT. The body's own three-way envelope claim is only two-thirds enumerated by ACs (finding 4). One warning-level self-reference (finding 10). |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-691 (`acceptance_criterion-304cae4c`) | uat-edit | AC-691's criterion turns on a **height** split — "a box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height" — and its Verification names both halves. `test_UAT_AC691` (`tests/reconciliation-l1-fold.test.ts:256-290`) asserts keyframe `at`/x/y/width and `axes.fontSizePx`, and **makes no height assertion at all**. Verified this session: `grep` over `tests/` finds no assertion anywhere in the repo that a text leaf's keyframes omit height. The distinction is live (`fold.ts` `buildGeometry(withHeight)`) and load-bearing — AC-707's content-robustness probe grows text runs, which is only meaningful because text height is natural. If a regression pinned text heights, all 32 UATs would still pass. **Third filing** (REPORT-1320 violation 1, REPORT-1662 violation 1); `tests/reconciliation-l1-fold.test.ts` unchanged since 2026-07-22. | In `test_UAT_AC691`, assert `kfs.every((k) => k.height === undefined)` for the `Headline` text leaf, and extend the fixture with one media element and one painted panel, asserting each of their keyframes carries `height` equal to the captured box height. Land together with finding 6's AC rewrite. |
| 2 | violation | ac | AC-689 (`acceptance_criterion-7785b92a`) | uat-edit | AC-689 requires the document be "emitted in the **full** L1 language, not text alone", and its Verification asks to "fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". `test_UAT_AC689` (`:207-231`) drives the real `cmdCapturePage`, but `signalsFor()` (`:107-133`) carries exactly one text run with `items: []`, `fields: []`, `images: []` — so the folded document has one leaf kind and the REQ-92 clause is never exercised. The four assertions present cover only the REQ-83-era criterion. Nearest coverage (`…full-language.test.ts:330`) belongs to AC-731 and runs on `foldToL1` directly, not the capture path AC-689 governs. **Third filing** (REPORT-1320 violation 2, REPORT-1662 violation 2). | Add a media element and a painted panel to `signalsFor()`, then assert the `l1.json` read back from the bundle carries `new Set(children.map((n) => n.kind)).size > 1`. |
| 3 | violation | ac | AC-694 (`acceptance_criterion-c8dd43d2`) | uat-edit | AC-694's Verification is entirely inside a branch that does not run here. `test_UAT_AC694` gates parent-layout / justify-content / percent-unit / real-breakpoint assertions behind `if (!(await chromiumAvailable())) return` (`:364`) — **verified false in this worktree this session** via a direct probe, so the test completes in 191ms with the branch skipped. On the always-run path `FakeDriver.query(HINTS_SCRIPT)` returns the test's own `CANNED_HINTS` (`:135-153`), so the hint extractor — the thing AC-694 is about — is bypassed; the two surviving assertions (breakpoints ascending, some node `widthUnit === 'percent'`) restate that fixture. Three of the six criterion dimensions (ancestry `parentId`, `position` mode, `repeatCount`) are asserted on **neither** path, and `CANNED_HINTS.parentLayout` is `null`. As executed, this UAT cannot distinguish a correct extractor from a broken one. **Re-raise of REPORT-1320 warning 3 / REPORT-1662 warning 3, escalated to violation here** because the coverage lens asks whether the AC's behaviour has executable evidence, and it has none. | Enrich `CANNED_HINTS` (non-null `parentLayout`, a child with a real `parentId`, a `position`, a `repeatCount` > 1) and move the per-node **contract** assertions onto the always-run canned path, leaving only extraction *accuracy* engine-gated. Do **not** repair by deleting the skip — Chromium genuinely cannot launch on this runner. |
| 4 | violation | story | STORY-86 (`story-24098299`) | ac-add + uat-add | The story body states the evaluator "reports envelope violations (sibling overlap, horizontal clip beyond the viewport, and **pinned-box content overflow**)" — three classes, all supported by REQ-86 and live in code (`probes.ts:405-416`, docstring `:429-433`; content overflow is emitted as `kind: 'clip'` with the distinct detail `content height Npx exceeds pinned box height Mpx`). **No AC states the third class**, so `test_UAT_AC710` exercises only overlap (`3probe-gate.test.ts:654-660`) and the viewport-edge clip (`:664-670`), and `grep` over `tests/` finds no assertion of the pinned-box overflow detail anywhere. This is the story-level coverage rule: a body claim intent supports that no AC/test addresses. **Third filing** (REPORT-1319 finding 1, REPORT-1658 finding 1). | `ac-add` under STORY-86: a pinned box/container whose flowed children's natural content height exceeds its keyframe height yields a `clip` finding naming the path and the two heights. Then `uat-add` a `test_UAT_AC<new>` constructing exactly that document and asserting the detail string and path. |
| 5 | violation | story | STORY-84 (`story-8acc338d`) | story-body-edit | Story body is behind the BUNDLE-10 fold wave in six places, verified against code this session: (a) "each node carries its authored axes, a geometry keyframe per sampled width" contradicts BUG-18 — `responsiveTextTracks` (`fold.ts:605-639`, applied `:1745`) keyframes fontSizePx/lineHeightPx/letterSpacingPx per width; (b) "every run whose surface differs from the band … gets a backing box emitted before the content" is the flat per-run model BUG-14 explicitly retired ("stop per-run boxing") — code groups rows into `section-band-*` (`:1472`) and `card-*` (`:1599`) with section-edge clamping; (c) padding is absent from the body though BUG-17 shipped `foldPadding` (`:550`) + `responsivePaddingTracks` (`:655`); (d) BUG-19's bar-band rule (`barBandFills`, `:1276`) is unstated; (e) BUG-20's chip self-surface (`isSelfPaintingRun`/`chipAxes`, `:939-944`) is unstated — the body's text-leaf bullet lists only typography + pixel-movers; (f) BUG-23's mirror binding + hard failure is unstated. **This supersedes REPORT-1321's `needs_review`**: on 2026-08-05 the code lacked these behaviours; today it has them and each carries a `test_UAT_FC_BUG*` test, so the operator decision is discharged and this is ordinary matrix drift. | One pass over the "The fold emits the full language" section, not six edits: restate surface reconstruction as section-band → card → text with bar-band seeding and section-edge clamping; add the per-width responsive scalar tracks alongside geometry; add padding; add the fused text+chip surface case; state that asset-bearing axes bind to the bundle mirror and an unmirrored handle is a hard failure. Downstream `ac-add`s follow (padding, chip, responsive track, mirror binding). |
| 6 | violation | ac | AC-691 (`acceptance_criterion-304cae4c`) | ac-edit | Distinct from finding 1. AC-691's closing sentence — "A node's authored typography axes are taken from its **widest present sample** (the desktop rendering)" — is verbatim the behaviour BUG-18 (free_and_reconciled) was filed to remove. The UAT asserts `axes.fontSizePx === 44`, which still holds only because the widest keyframe equals the scalar, so the shipped per-width track is invisible to the matrix. **Blocks finding 1**: the AC must be correct before its UAT is rewritten. Re-raise of REPORT-1658 finding 2 / REPORT-1662 info 6. | Replace the widest-sample sentence: a numeric type axis that varies across the ladder folds to a per-width scalar track; one that does not stays single-valued. Then extend `test_UAT_AC691` to assert the track (fixture already varies 24/32/44 at 320/768/1280). |
| 7 | violation | ac | AC-731 (`acceptance_criterion-6a5e0eec`) | ac-edit | AC-731's Criterion still specifies the retired per-run model — "Every run whose composited surface differs from that band … folds an **additional backing box leaf** carrying that fill/gradient and **the run's geometry**" — and its Verification clause "runs on that fill emit no backing box" is **not assertable as worded**, because band runs now do produce a shared full-bleed band box. The UAT is already correct against code (`…full-language.test.ts:333-351`: one `section-band-*` + two `card-*` for five runs, with an in-test comment naming BUG-14) and passes; the AC is what is stale. Coverage verdict stays `pass` — this is matrix repair, not a UAT gap. Re-raise of REPORT-1658 finding 3 / REPORT-1662 info 5. | Rewrite the Criterion as band-and-card reconstruction (dominant fill and BUG-19 bar fills seed bands; rows whose surface differs group into card boxes; all backing boxes precede content), and rewrite the Verification to match the assertions the UAT already makes. |
| 8 | warning | ac | AC-812 (`acceptance_criterion-fd94d9ab`) | uat-edit | AC-812's layering clause has two halves — the backdrop sits behind the band's text runs **and after the section-background boxes it is a peer of**. `test_UAT_AC812` proves the first half twice (leaf index before the first text leaf, and `id=` before `Nested Hero` in the rendered HTML) and asserts nothing about the backdrop's position relative to the band boxes, though the same fixture materialises them as `heroBands` (`seams-and-refold.test.ts:160-163`). The rule is live (`fold.ts` child order `[...bandNodes, ...sectionBgNodes, ...backdropNodes, …]`) and load-bearing: absolutely-positioned siblings with no z-index paint in source order, so a backdrop emitted before its band would have the band's opaque fill paint over the photograph. | One assertion: `expect(leaves.indexOf(backdrop)).toBeGreaterThan(Math.max(...heroBands.map((b) => leaves.indexOf(b))))`. |
| 9 | warning | ac | AC-736 (`acceptance_criterion-76d9ee68`) | ac-edit | AC-736 exempts "a painted surface leaf — a childless box carrying a card/panel/section fill" from the overlap check. The code is narrower: only **fold-synthesized** surfaces are exempt (`isSynthesizedSurfaceId` → `section-band-*` / `section-bg-*` / `card-*`), while a captured standalone `box-*` still participates — deliberately, per the comment at `probes.ts:462-467`. `test_UAT_AC736` asserts the code's narrower rule and passes, so coverage is `pass`; only the AC wording is loose. | Tighten the AC to "a **fold-synthesized** backing surface (`section-band-*` / `section-bg-*` / `card-*`)"; the UAT then needs no change. |
| 10 | warning | story | STORY-86 (`story-24098299`) | story-body-edit | Since the 2026-08-05 rebalance merged CAP-73 into CAP-71, STORY-86 lives in CAP-71 — but its Out-of-scope still names "the fold itself, including which residuals it emits (**CAP-71**)" and its Dependencies name "Plan item 2 — Capture → L1 Fold (**CAP-71**)", so the story reads as excluding and depending on its own capability. No coverage effect. Carried from REPORT-1657 finding 8. | Re-point both references at STORY-84. |

## Notes for the Editor

**Findings 1, 2 and 4 are third filings.** All three were raised on 2026-08-05
(REPORT-1320 violations 1–2, REPORT-1319 finding 1), re-raised on 2026-08-07
(REPORT-1662 violations 1–2, REPORT-1658 finding 1), and re-confirmed here.
`tests/reconciliation-l1-fold.test.ts` has not been touched since 2026-07-22, so no
repair has been attempted on findings 1–2. This is the reason the capability has
failed five cycles; two of the three repairs are a few lines each.

**Order the work — three of these repairs are blocked by another.** Findings 6 and
7 (`ac-edit`) must land before findings 1 and the AC-731 UAT follow-up, or the UAT
would encode a fixed bug. Finding 4 needs its `ac-add` before its `uat-add`, or the
test traces to no matrix element. Finding 5 (`story-body-edit`) is the parent of the
downstream `ac-add`s for padding / chip surface / responsive track / mirror binding.
Suggested sequence: **5 → 6, 7 → 1, 2, 3, 8 → 4**.

**Findings 1–2 land in one file.** Both are `tests/reconciliation-l1-fold.test.ts`:
AC-691 needs one `toBeUndefined`-style assertion plus a media element and a painted
panel in its fixture; AC-689 needs the same two elements added to `signalsFor()`.
The fixture work is shared.

**Finding 3 has an environmental root cause — do not repair it by relaxing the
test.** `chromiumAvailable()` returns false in this worktree (verified directly this
session). The right repair is to split the AC's contract from its accuracy: the
sidecar's per-node shape can be asserted on the canned path, and only the extractor's
computed values need a real engine. If the operator can provision Chromium on the
regression runner, that closes the accuracy half properly and is the better fix.

**Nothing in this capability needs a new UAT authored from scratch except finding 4.**
Every other repair is an edit to an existing, already-substantive test or to a matrix
element. The 2026-08-05 UAT-generation pass is the quality bar to hold the edits to:
AC-813 checks the control rebase against the *retained oracle* rather than restating
numbers; AC-814 sha256-fingerprints every file in the bundle to prove "rewrites only
what the fold derived"; AC-852/856 prove browser-free ordering with a driver factory
that throws; AC-855 asserts `size === 5` over both the verdict and next-step sets.

**Out-of-scope pointer, recorded not counted.** REPORT-1657 finding 7 notes that
REQ-88's `1c repro` (`tools/generate/src/cli/repro.ts`) is expressed by no story in
the 25-story matrix — its siblings are covered (`cmdRefold` ← AC-814, `cmdL1Gate` ←
AC-708). That is a matrix-shape question (story-add) above this assessment's level,
so it is not counted among the seven violations here; it does belong in the same
STORY-84 editing pass if the operator places it in CAP-71.

**Verification performed.** All 32 UATs executed in this worktree
(`regression-5096fbee`): 6 files, 32 passed, 1.18s, none skipped at `it()` level.
`chromiumAvailable()` probed directly → false. Read and checked against their ACs:
`test_UAT_AC689/690/691/692/693/694/695/705/710/812/854`. Read in source:
`probes.ts:395-490` (three envelope classes, synthesized-surface exemption),
`fold.ts` (`responsiveTextTracks`, `foldPadding`, `chipAxes`, `barBandFills`,
`section-band-*`/`card-*` builders). `grep` over `tests/` confirmed zero assertions
of text-leaf keyframe height omission and zero assertions of the pinned-box overflow
detail string. `tests/bug14|17|18|19|20|23*.test.ts` confirmed present and named
`test_UAT_FC_BUG*` (intent-traced, not AC-traced).
