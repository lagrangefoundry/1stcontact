---
uid: report-3562dc75
id: REPORT-2394
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-20T06:51:01.867465+00:00'
updated_at: '2026-08-20T06:51:01.867465+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Attempt 10. The single violation of `report-b99892f3` (AC-815 had no substantive
UAT — both its tests sat behind a vacuous `itA` wrapper that reports PASS while
asserting nothing) is **closed, verified at source and by execution**, not taken
from the fix report. Its sibling warning W1 (the `serveDir`-before-`browserOk`
hook that took the whole file down) is closed with it.

No violation survives this attempt. The three warnings below are new (W1, W2) or
carried forward unchanged (W3); none blocks the level.

## Method

1. **Re-derived the AC→test index mechanically**, independently of every prior
   report: walked every `.ts/.tsx/.mts/.js` file outside `node_modules` for
   `test_UAT_AC<N>_`, recording file, line and the *runner shape* on each hit
   (`it`, `it.runIf`, `it.skip`, a local `itA`/`itB` wrapper). Set-differenced
   against the 64 ACs across the six stories.
   **All 63 non-deprecated ACs carry ≥1 AC-linked test; AC-637 (deprecated)
   carries none.**
2. **Re-derived the gating shape per AC**, because coverage-by-existence is what
   let the attempt-9 violation hide for nine cycles. For every AC I counted how
   many of its tests are browser-gated versus plain. **Every one of the 63 ACs
   now carries at least one ungated test** — no AC is entirely skipped on a
   headless runner.
3. **Verified the attempt-9 fixes at source.** `itA` in
   `bug27-nested-backdrop-capture.test.ts:98-99` is now
   `it.runIf(browserOk)`; `browserOk` is module-scope (`:66`); the hook guard
   `if (!browserOk) return` at `:81` sits **above** `serveDir(FIXTURES)` at
   `:82`. The same shape holds in `bug24:265`, `req72:48`, `bug16:92`,
   `bug25:101`. A repo-wide grep for the anti-pattern (`skip silently`,
   `if (!capture) return`) returns nothing.
4. **Executed all 22 test files** carrying this capability's ACs, in one run:
   **172 passed, 23 skipped, 0 failures, 9.28s.** `bug27` — the file that
   hard-failed at a 180s hook timeout in attempt 9 — now runs clean inside that
   total. Every skip is an honest `it.runIf(browserOk)` on a runner with no
   Chromium; no file contains `describe.skip` / `it.skip` / `.todo`.
5. **Audited clause-by-clause the surface the prior report named as residual**:
   STORY-77 and STORY-78 (17 ACs), which every previous attempt confirmed as
   "covered and passing" but never read. Both files drive real command entry
   points (`cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, `run(argv)` at the CLI
   boundary) with substantive per-clause assertions — no structural/AST
   stand-ins. Also read the newer pending set on STORY-75/76 (AC-1307–1316) and
   STORY-116's AC-1285, which the clause-by-clause pass of attempt 9 did not
   reach (it covered the 26 *older* ACs). W1 and W2 came out of that read.

## Cumulative Intent Considered

Consulted only where an upper layer was ambiguous — at level=uat the AC body is
the working reference. The full ledger lives in the story-level report
`report-afa769c6` (PASS) and is not restated. Three intents were opened this
attempt:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-25 (`bug-fe8af80a`) | free_and_reconciled | — | Per-run geometry for a multi-line text element; acceptance = "no two runs share an identical `renderedTextBox` unless the source elements genuinely occupy the same rect" + per-line line-count | YES — read because AC-1310 is internally inconsistent (W1). The intent offers **two** candidate shapes (per-line runs vs one run with its breaks) and does not mandate either; the implementation's per-text-node rule satisfies its acceptance list |
| BUG-22 (`bug-3e3fabdb`) | free_and_reconciled | — | values-diff mis-attributes split text+box controls — phantom radius delta leads the repair order | YES — parent of AC-1311 (W2) |
| BUG-16 / BUG-24 / BUG-15 | free_and_reconciled | — | Capture-time font settling / modern-syntax scrim capture / L1-flat-DOM band fallback | YES — parents of AC-1314 / AC-1316 / AC-1315; each AC carries an explicit `**Evidence gating.**` paragraph and real headless assertions |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — 21 ACs | bundle-ab9e0cb6, bundle-ee56a66e, bundle-4ff83a8b (BUG-15/16/22/24/25), request-859652ae | **aligned — 21/21.** AC-815's violation is closed: 5 new headless UATs (`bug27:251-303`) drive the real `EXTRACT_SCRIPT` under jsdom, and the 2 browser tests now skip honestly. AC-1310 carries W1 (AC body, not the tests); AC-1311 carries W2 (one uncovered clause of six) |
| STORY-76 (`story-82eb6908`) — 7 active + 1 deprecated | bundle-ab9e0cb6, request-0698bbdf, request-3cd338cd | aligned — 7/7. AC-1308's four rules map one-to-one onto four headless tests; AC-1307 carries W3 |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61 size-aware half) | **aligned — 8/8, read clause-by-clause this attempt.** Each test drives a real command and proves both directions (selected width flags the reflow / the same run at desktop reports clean; the loud-failure ACs assert the message *and* that no artifact was written) |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61 cross-size half) | **aligned — 9/9, read clause-by-clause this attempt.** All nine run through `run(argv)` at the CLI boundary and read the JSON/human output and exit code the user would see |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6, bundle-15c1f647 | aligned — 13/13. Audited clause-by-clause in attempt 9; re-confirmed executing and passing here |
| STORY-116 (`story-aaddb221`) — 5 ACs | request-07d0e3e1, request-3a11304d | aligned — 5/5. AC-1285 re-read at source this attempt: it proves reversibility by re-reporting the *same bytes* under a widened dial and asserting both capture files are unchanged |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| W1 | warning | consistency | AC-1310 `acceptance_criterion-c1d7d6d6` (STORY-75) | ac-edit | **The AC body describes per-line splitting for wrapped text; the code and its own tests do per-text-node and assert the contrary.** The Criterion's parenthetical reads "An element holding more than one run (**wrapped text**, or text split by a `<br>`) yields one run per text node", and the Verification instructs: "Capture a page containing an element split by a `<br>` **and an element that wraps across two lines**; assert **each yields one run per line**". `extract.ts:1097-1125` walks `SHOW_TEXT` and counts runs **per text node** (`runCounts.set(owner, …)`), so a single text node that wraps across two lines is one run measured off the element — and `bug25-multiline-run-geometry.test.ts:282-287` asserts exactly that, in as many words: "A single text node that WRAPS is still one run whose glyph box spans its lines — capture does not split per line". Executing the Verification as written would report a false defect. Not a violation: the AC's **normative** rule ("one run per text node") is correct and every other Verification clause is covered — `:170` (br-split → distinct boxes one line-height apart), `:188` (single-run element → element box), `:197` (elements genuinely sharing a rect → identical boxes), `:211` (line count 1 per run). BUG-25 (`bug-fe8af80a`) is the source of the loose language: it describes the joyful hero as text that "wraps across lines" when it is `<br>`-split, and explicitly leaves the per-line-vs-per-node choice to design | Two edits to AC-1310 only; do **not** touch the tests. (a) Drop "wrapped text, or" from the Criterion parenthetical, leaving "an element holding more than one run (e.g. text split by a `<br>`, or interleaved inline children)". (b) Re-state the Verification's first sentence as: "Capture a page containing an element split by a `<br>`; assert it yields one run per text node, each carrying its own rendered box … and assert a single text node that wraps across two lines remains **one** run whose glyph box spans both lines." That last clause is already proven at `bug25:282-287` |
| W2 | warning | coverage | AC-1311 `acceptance_criterion-1e7d867f` (STORY-75) | uat-add | **One of AC-1311's six enumerated cases has no test.** The Criterion's last bullet — "A bundle captured before the `surface` record existed carries none, leaving the resolution inert" — and its Verification's closing sentence ("Diff a pre-`surface` bundle and assert the resolution emits nothing") are uncovered. The six tests in `bug22-split-control-surface.test.ts:109-178` cover the other five cases well (records `self` true/false with the bearing box's radius `:109`; no phantom `shape` `:122`; the surface-geometry defect *is* reported `:132`; a genuinely squared backing box still reports `shape` `:145`; both-sides-self unaffected `:157`; no per-run band noise `:171`) — every one of them builds manifests through `flattenSignals(extract(...))`, so `surface` is always present. Nothing exercises the legacy path, which is the backward-compatibility guard for every bundle captured before the record existed | Add one headless test beside the others: build the reference/reproduction manifests as `:122` does, then delete `surface` from every element (`for (const e of m.elements) delete e.surface`) before `diffManifests`, and assert no `shape` and no surface-attributed `size` row is emitted for `Subscribe` and that the diff still completes — i.e. the resolution is inert rather than throwing or falling back to the label's zeros |
| W3 | warning | coverage | AC-1307 `acceptance_criterion-4ecfd679` (STORY-76) | — | Carried forward unchanged from `report-b99892f3` W2 and `report-60445a46` W1. `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` (`req72-gradient-capture.test.ts:202`) is `it.runIf(browserOk)` and skipped on this runner, as in the previous three. It is the only assertion covering REQ-72's motivating case (`oklch()` / `color-mix()` stops); its three headless siblings (`:115`, `:131`, `:147`) stand in with `rgb()`. The gating is honest, the AC already carries an `**Evidence gating.**` paragraph recording exactly this, and headless assertions exist — no matrix or test edit would fix it | No action. Confirm on a Chromium-provisioned runner |
| I1 | info | coverage | AC-815 `acceptance_criterion-9ccc1de8` — the attempt-9 violation | — | **Closed, verified independently of the fix report.** `bug27:98-99` is `it.runIf(browserOk)`, `browserOk` hoisted to `:66`; the hook guard at `:81` precedes `serveDir` at `:82`; and the new headless describe at `:244-303` carries 5 plain `it` tests driving the real `EXTRACT_SCRIPT` under jsdom with per-class rects stubbed — the collapsed band boxed at its painted subtree, the subtree reaching the manifest, a clipped overflow not widening the band past the document, an off-canvas block yielding no band, and a conventional band unchanged. The file executed here in the 22-file run with 12 passed / 6 skipped, where attempt 9 recorded a 180s hook timeout and a FAILED suite | none |
| I2 | info | coverage | 63 non-deprecated ACs | — | AC→test index re-derived from scratch (walking source, not trusting prior reports): every non-deprecated AC carries ≥1 AC-linked test **and ≥1 ungated test**. 22 files executed in one run: **172 passed, 23 skipped, 0 failures**. All 23 skips are `it.runIf(browserOk)` on a runner with no Chromium; no unconditional skip or `.todo` exists in any of these files | none |
| I3 | info | consistency | `xgd ticket list --filter "fields.uat_coverage=fail"` | — | **The list index is stale and disagrees with the tickets.** The filter still returns AC-720, AC-657, AC-643, AC-639, AC-815 and AC-631 as `fail`, but `xgd ticket get` on each returns `uat_coverage: pass` with an `updated_at` of 2026-08-20T06:38–06:39 — the attempt-9 field flips did land. Per-ticket reads are authoritative; the filtered list lags. Worth an operator's attention only because a gate keying off the index rather than the tickets would keep this capability failing regardless of the matrix | none — a reindex, not a matrix edit |
| I4 | info | consistency | AC-1313 `acceptance_criterion-78655f6e`, `req63-values-diff-coverage.test.ts:850-852` | — | AC-1313's "still captured" half is asserted against a manifest the test itself literally constructs (`expect(ours.sections?.[0].paddingTopPx).toBe(96)` re-reads the literal written three lines above), so that clause is tautological rather than evidenced. It is **not** a finding: the claim is true in production — `extract.ts:1182` and `:1423` both record `paddingTopPx` / `paddingBottomPx` on every band — and the AC's substantive half (the *comparison* is retired; `textAlign` and element-level padding are unaffected) is genuinely proven across four tests (`:260`, `:282`, `:838`, `:857`) | none |
| I5 | info | — | AC-739 `acceptance_criterion-fcf814b5` | — | Re-checked for the fifth cycle: REQ-148 (`request-7ae3c2cc`) is still `ready_to_reconcile`. Its retirement of the Astro-container clause remains imminent, not actual; AC-739 stands and its test passes | none — revisit when REQ-148 reconciles |
| I6 | info | exclusivity | all 63 ACs | — | No duplicate-scenario pairs. Where an AC carries several tests they partition its criterion's cases one-to-one (AC-1308's four rules → four tests; AC-1311's five covered cases → five tests; AC-1312's four clauses → four tests). Where an AC spans two files (AC-711 in `reconcile-values-diff-treatments` and `reconciliation-capture-list-marker`) the shapes differ — diff-side versus capture-side — which the check explicitly permits | none |

## Notes for the Editor

**Both warnings are cheap and independent.** W1 is an AC-body edit with no test
change; W2 is a single added test with no AC change. Neither blocks the level, so
they can be taken opportunistically or deferred.

**On W1's shape.** The temptation will be to "fix" `bug25:282-287` to match the
AC's Verification. That would be backwards: the test matches `extract.ts` and
matches BUG-25's acceptance list, and the intent explicitly declined to mandate
per-line splitting ("two candidate shapes, to be decided in design"). The AC
inherited the intent's loose description of a `<br>`-split hero as text that
"wraps across lines". Edit the AC.

**The blind spot that produced nine attempts is now closed twice over.** Attempt 8
enumerated ACs and missed that a file carrying three of them was unrunnable;
attempt 9 found the vacuous wrapper but reported `bug27` as its sole survivor when
`req36` and `req47` carried it too — invisible to an AC-name index because their
tests are named `test_UAT_FC_REQ-*`. The durable check is not an AC sweep but a
**shape** sweep: grep all of `tests/` for `skip silently` / `if (!capture) return`
(returns nothing now), and per-AC count *ungated* tests rather than tests. Both are
run above and both are clean; a future attempt should re-run the shape sweep rather
than re-deriving the AC index alone.

**Residual, unactionable.** 23 browser-gated tests never execute on a Chromium-less
runner: the Part-A halves of AC-816/AC-1310/AC-1314/AC-1316 and the single AC-1307
oklch case. Every one of those ACs also carries headless assertions over real entry
points, and each AC records its split in an `**Evidence gating.**` paragraph, so the
matrix does not overstate its evidence. Confirming that tier needs a provisioned
runner, not a matrix or test edit.
