---
uid: report-f1f3f4ec
id: REPORT-2456
type: report
title: 'UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-08-20T14:59:17.230319+00:00'
updated_at: '2026-08-20T14:59:17.230319+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Result**: PASS
**AC verdicts**: 42 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories: STORY-84
(`story-8acc338d`, the fold) with **26** ACs and STORY-86 (`story-24098299`, the
3-probe gate + cross-gate reconciliation) with **16** — **42** in total, all
`status: active`, `kind: behavior`. No intent in the ledger retires any of them,
so there are no `deprecated` verdicts and no `needs_review`.

This cycle closes the sequence. Both violations REPORT-2606a5ba raised were
repaired by REPORT-847c35d9, and both repairs were **verified here by reading
the tests and running them**, not taken on the fixer's word.

## Method — executed, not inferred

1. **The suite was run.** All nine AC-named files, together:

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 9 passed (9) · Tests 43 passed | 1 skipped (44) · Duration 1.19s
```

   The +1 pass over the previous cycle's 42 is AC-705's new mounted-channel UAT;
   the 1 skip is AC-694's real-engine half (warning 1). Supporting free-coded
   suites were run too — `bug13`, `bug14`, `bug19`, `bug20`, `bug21`,
   `req88-viewport-relative-and-nowrap`, `req88-surface-attribution`
   → **7 files passed, 69 passed | 4 skipped**. AC-731's evidence rests on these.

2. **The AC↔UAT index was rebuilt from source.** `.xgd/uat_index.json` is still
   **empty** (`{"acs": {}}`, 67 bytes, mtime Aug 19) — the prompt's Step-1b lookup
   returns `[]` for all 42 ACs and must not be trusted. The mapping was rebuilt by
   walking `tests/` for `test_UAT_AC(\d+)_` and joining to the 42 AC numbers read
   from the ticket store. **All 42 resolve**; AC-694 and AC-705 resolve to two
   tests each (see notes).

3. **The intent statuses were re-read live**, not carried over from the previous
   report's ledger.

4. **Independent re-derivation, not a re-read of the last report.** The two
   repaired tests were read in full; the story bodies were walked clause by clause
   against the AC set to look for behaviour no AC carries; and the six
   lowest-assertion-density UATs were read on the theory that a weak test hides
   where the assertion count is thinnest.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) — REQ-63/79/82/83/84 +2 | `free_and_reconciled` | 2026-07-22, main @ `edeb1c2c` | Originating intent for both stories: capture → fold → render → gate; oracle retention; hint sidecar; dissolves `adopt-values` | YES |
| BUNDLE-11 (`bundle-ee56a66e`) — BUG-27/REQ-94/96/97/98 +10 | `free_and_reconciled` | 2026-08-05 | Widened STORY-86: cross-gate verdict, perceptual floor, reference coverage, named causes; `control` composition | YES |
| REQ-136 (`request-8a132869`) | `free_and_reconciled` | 2026-08-12 | Widened STORY-84: non-destructive framing + colour adjustment as typed L1 axes (AC-1133 / AC-1134) | YES |
| REQ-88 (free-coded, reconciled) | reconciled | — | nowrap threshold, viewport-height probe, content column + per-axis anchors, padding tracks, surface attribution, form labelling | YES |
| REQ-92 / REQ-96 (free-coded, reconciled) | reconciled | — | full L1 language; a captured control binds to its module seam instead of taking the residual channel | YES |
| BUG-5/6/7/8/9 (free-coded, reconciled) | reconciled | — | occurrence-index pairing; typed residuals; row tiling; half-open intervals; recursive region-aware promotion | YES |
| BUG-13/14/17/18/19/20/21/23/24 (free-coded, reconciled) | reconciled | — | section background; band→card hierarchy; fold padding; responsive text axes; full-bleed bar; pill + padded-control self-painting run; repro local assets; scrim alpha | YES |

**No intent retires any AC or clause of this capability.** The top three were
re-read from the live store this session and all three are `free_and_reconciled`.
No AC body has been edited since the previous coverage assessment — every AC's
`updated_at` in the 14:39 batch is a `uat_coverage` field write
(`last_field_updated: uat_coverage`), not a body change — so the previous cycle's
clause-by-clause reading of the AC text remains current, and this cycle's work was
to verify the two repairs and to re-derive the story bodies against the AC set.

## Verification of the two repairs

**AC-705 — the `mounted` channel (was violation 2).** Closed, with bite.
`test_UAT_AC705_slot_covered_oracle_text_is_diverted_to_the_mounted_channel`
(`tests/reconciliation-3probe-gate.test.ts:550-600`) drives the real entry points
— `foldToL1` → `evaluateLayout` → `oracleBoxes` → `sampleFidelityProbe`, nothing
mocked. It states its setup **as assertions** so the fixture cannot rot into a
no-op (exactly one `slot` emitted; no reproduced text leaf carries the submit
words; the oracle *does* carry them as one `text` sample per ladder width; that
sample's box centre lies inside the seam rect). It then asserts the positive
(`mounted` = one entry per width, `residuals`/`unmatched` empty, `pass === true`)
and — the discriminator the finding asked for — moves the same oracle words clear
of every slot with the reproduced document untouched, and asserts they become
`unmatched` with `pass === false` and `mounted` empty. That pair is what proves
the diversion is keyed on the slot rect rather than on the text. The stated
failure mode ("a regression deleting the diversion leaves all 42 UATs green") no
longer holds.

**AC-694 — the hint sidecar (was violation 1).** Scope closed; execution split by
environment. The single silently-skipping test is gone, replaced by two:

- `test_UAT_AC694_capture_writes_the_advisory_hint_sidecar_into_the_bundle`
  (`:522-543`) runs everywhere and no longer claims to prove the extractor. It
  asserts what a driver seam genuinely can: `cmdCapturePage` writes `hints.json`,
  `readHints` round-trips it losslessly, and — the AC-695 half — `readL1` carries
  no `hints` property, so nothing merges the sidecar into the render path. The
  previous assertions there (ascending breakpoints, a percent unit) were correctly
  dropped: they read straight back out of `CANNED_HINTS`.
- `test_UAT_AC694_structural_hints_report_ancestry_layout_units_and_breakpoints`
  (`:544-648`) is `it.skipIf(!browserOk)` — the idiom the finding prescribed — and
  covers **all eight** Criterion dimensions against a real engine, each with a
  discriminator rather than a presence check (ancestry chains to `body` and
  terminates; three position modes on one page; `repeatCount` 2/2/1 so a
  parent-child-count bug would read 3; `gap: '40px'` proving the computed value
  won over the `24px` base; grid tracks in the authored 1fr:2fr ratio; flex-only
  axes nulled on the grid parent and vice versa; `percent` surviving on a
  px-resolved `width: 50%`; breakpoints 600 **and** 1200).

**AC-691 (was warning 3).** Closed — the fixture gained an image leaf and a
painted box leaf with distinct captured heights per width, and every keyframe now
pins height as well as x/y/width. The Verification's positive half is reached.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (fold) | BUNDLE-7, REQ-88, REQ-92, REQ-96, REQ-136, BUG-6, BUG-13, BUG-14, BUG-17…BUG-21, BUG-23, BUG-24 | **pass** | Body walked clause by clause: full language → AC-689/729/730/731/732/812/1345; responsive scalar tracks → AC-691 + AC-1346; viewport-height probe → AC-1352; nowrap → AC-1347; content column and per-axis anchor → AC-1350/1351; seams + derived config → AC-813/1348; materialization → AC-1349; offline re-fold → AC-814; hint sidecar → AC-694/695; typed residual → AC-733; `adopt-values` supersession → AC-696; keyframes/interpolate-snap/visibility → AC-691/692/693; oracle retention → AC-690; framing + adjustment → AC-1133/1134. No behaviour left uncarried |
| STORY-86 (gate + cross-gate) | BUNDLE-7, BUNDLE-11 (REQ-94), REQ-88, REQ-96, BUG-5, BUG-7, BUG-8, BUG-9 | **pass** | Body walked the same way. The clause worth naming: the body's **two** overlap-exempt leaf kinds. The backing surface is in AC-736's title; the **slot** exemption is not, and would be the natural place for an uncarried clause to hide. It is not uncarried — AC-736's Criterion states it ("Inert placeholder slots are likewise excluded from the overlap check — and likewise remain subject to the horizontal-clip check") and `test_UAT_AC736_*` asserts both halves at `…evaluator.test.ts:452-487`, including the clip finding naming the slot's own path. The third fidelity channel (`mounted`) is now carried; the evaluator's responsive-scalar track is stated in the body as explicitly *not* a probe axis and needs none |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac | AC-694 | (operator / environment) | AC-694's real-engine half **cannot execute in this worktree** and reports as `skipped`. Chromium is present as `chromium_headless_shell-1234` / `chromium-1234` while the pinned Playwright wants `-1228` — a version skew, not a missing install. `playwright install` would fix it but needs network egress, which this sandbox denies. Graded `pass`, not a violation: the assertions cover every Criterion dimension, the skip is now *declared* rather than a silent green (which is what the finding asked for), and the cause is environmental rather than a test-authoring gap. Re-opening it as a violation would spin a loop no fix workflow can close from inside the sandbox | No editor action. **Operator item**: run `playwright install chromium` on a networked runner and execute `tests/reconciliation-l1-fold.test.ts` once to confirm the eight assertions. Until then AC-694's extractor dimensions are written-but-unexecuted |
| 2 | warning | ac | AC-731 | uat-edit (declined, sanctioned) | AC-731's full-bleed-bar and self-painting-run clauses are proven by `tests/bug19-fold-bar-band-fill.test.ts`, `bug20-chip-self-surface.test.ts` and `bug21-control-surface-outset.test.ts` rather than by `test_UAT_AC731_*` itself, so the attribution is off even though the behaviour is protected. The fixer declined re-attribution on the previous assessor's own stated alternative, because duplicating those fixtures into the AC-named test would violate the one-authoritative-location rule. Confirmed sound: all three suites were **run this session and are green** (69 passed / 4 skipped across seven supporting files), so a regression in either clause goes red | None required. If the split ever needs to be legible from the AC alone, trim AC-731's Verification to what its own UAT reaches and cite the three `bug*` suites as its evidence set — do **not** duplicate the fixtures |

## Notes for the Editor

- **`.xgd/uat_index.json` is empty and has been for at least three cycles**
  (67 bytes, `{"acs": {}}`, mtime Aug 19). The prompt's prescribed Step-1b lookup
  silently returns `[]` for every AC, which reads identically to "no test exists".
  Any future cycle must rebuild the mapping by walking `tests/` for
  `test_UAT_AC(\d+)_`. An assessor that trusts the file would fail all 42 ACs.
- **Two ACs now have two dedicated tests each** — AC-694 (offline half +
  browser-gated half) and AC-705 (fidelity pairing + the mounted channel). A sweep
  that assumes one test per AC will under-count both.
- **A naive index build over-counts AC-1133 / AC-1134.** A *comment* at
  `tests/reconciliation-l1-fold-full-language.test.ts:86`, inside AC-729's test,
  names `test_UAT_AC1133_*` and `test_UAT_AC1134_*` to point at their real siblings
  in `reconciliation-l1-fold-framing-and-adjustment.test.ts`. A regex sweep reads
  those as two extra test definitions. The comment is correct and useful; the
  index builder is what should anchor on a definition (`it(`/`test(`) rather than
  on any occurrence of the symbol.
- **The lowest-assertion-density UATs were read and are sound**, so no cycle
  should re-flag them on count alone. AC-692 makes two assertions in 27 lines and
  they are exactly the interpolate/snap discrimination over a two-node fixture that
  breaks if the classifier goes constant; AC-724's five assertions run inside a
  per-width loop over the whole ladder and carry the idempotence identity plus
  three-occurrence per-occurrence fidelity; AC-708's ten prove non-vacuity in both
  directions (base fails, base+overlay passes). Density is not the signal here.
- **The cross-gate suite is not over-mocked**, which is the failure mode its shape
  invites. `test_UAT_AC852_*` drives `cmdGate` and then the CLI itself
  (`cli.run(['gate', …])`) with real perceptual and values computation over real
  PNG and manifest fixtures; the only seams used are the offline `--actual-image` /
  `--actual-manifest` flags the `diff` and `values-diff` verbs already expose in
  production. The browser-free-first ordering is proven by a `neverDriver()` whose
  call count is asserted to be 0 — including on the manifestless-bundle path, so
  the hard error genuinely precedes any browser launch.
- **Field writes.** All 42 ACs and both stories already carried the verdict this
  assessment reaches (`uat_coverage: pass`), written by the previous fix cycle and
  independently confirmed correct here, so they were left as-is rather than
  rewritten with identical values — 42 no-op ticket commits would be churn. The
  capability aggregate was the one field that changed: `fail` → `pass`.
