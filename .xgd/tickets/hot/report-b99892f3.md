---
uid: report-b99892f3
id: REPORT-2390
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-20T06:22:02.797419+00:00'
updated_at: '2026-08-20T06:22:02.797419+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Attempt 9. Both violations of `report-60445a46` are **genuinely closed** — I verified
the code, the AC body and the new test at source rather than taking the fix report
(`report-552e1877`) on trust. The single violation below is **new**, and it is the
first finding this capability has produced from the surface the last report named as
its residual risk and explicitly did not audit.

## Method

1. Re-derived the AC→test index mechanically: `grep -a` for every `test_UAT_AC<N>`
   under `tests/`, `tools/`, `packages/` (the `-a` matters — `fidelity.ts` and
   `builder.ts` carry NUL bytes and grep as binary), set-differenced against the 64
   ACs across the six stories. **Every one of the 63 non-deprecated ACs carries at
   least one AC-linked test; AC-637 (deprecated) correctly carries none.** The
   attempt-8 claim holds.
2. Verified the attempt-8 fixes landed: `selectMultiViewportPayload` exists
   (`fidelity.ts:542`), is wired at `index.ts:795` and re-exported at `:121`; the
   `§`+`padding` predicate is **gone** from `fidelity.ts` (grep returns nothing at
   either former site); AC-1288's body carries the REQ-73 retirement paragraph and a
   four-case Verification; `test_UAT_AC1289_clusters_takes_precedence_over_collapse_in_both_serialisations`
   exists at `req63-values-diff-coverage.test.ts:692`.
3. **Executed all 21 test files** carrying this capability's ACs — including
   `bug27-nested-backdrop-capture.test.ts`, which attempts 7 and 8 excluded. 160
   passed, 17 skipped, 0 assertion failures; `bug27` fails at the suite level (W1).
4. **Audited clause-by-clause the 26 older ACs on STORY-75 and STORY-79** that
   `report-60445a46` recorded as "confirmed linked and passing … but not read
   clause-by-clause; that is the unaudited surface." That audit is where V1 came
   from.
5. Swept every capability test file for browser-gating shape, to separate honest
   skips from vacuous passes.

## Cumulative Intent Considered

Consulted only where an upper layer was ambiguous (level=uat: ACs are the working
reference). The full ledger is in the story-level report `report-afa769c6` (PASS) and
is not restated.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | BUG-27: CSS background images / lazy media not captured — the parent of AC-815 / AC-816 / AC-817 | YES — read to confirm AC-815's behaviour is live intent, not legacy |
| REQ-73 (`request-859652ae`) | free_and_reconciled | 2026-07-18 | Change 2 retired the `§N` band-padding deltas | YES (retires) — **discharged this attempt**; the classifier rule is deleted and AC-1288 re-stated |
| REQ-76 (`request-3a11304d`) | free_and_reconciled | 2026-08-19 sweep | `--clusters` cause roll-up | YES — AC-1289's precedence clause now defended by a red-checked test |
| REQ-72 (`request-0698bbdf`) | free_and_reconciled | 2026-08-19 sweep | In-browser hexification of gradient stops | YES — AC-1307, 3 headless + 1 browser-gated (W2) |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-15 | Behavior modules render in workerd | imminent — **re-checked, still `ready_to_reconcile`**. AC-739's Astro-container clause stands; its test is live and passing |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — 21 ACs | bundle-ab9e0cb6, +5 incl. bundle-ee56a66e, request-859652ae | **20/21 aligned. AC-815 has no substantive UAT (V1).** AC-711–715 audited clause-by-clause this attempt: each enumerates its criterion's cases (differs → single delta at tier; matches → none; field absent → guarded) and is strong. AC-629–633, AC-817, AC-818 plain and passing |
| STORY-76 (`story-82eb6908`) — 7 active + 1 deprecated | bundle-ab9e0cb6, request-0698bbdf, request-3cd338cd | aligned — 7/7 covered; AC-1307 carries the oklch gating caveat (W2) |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61 size-aware half) | aligned — 8/8 covered, re-confirmed passing headlessly |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61 cross-size half) | aligned — 9/9 covered, re-confirmed passing |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6, bundle-15c1f647 | **aligned — 13/13, audited clause-by-clause this attempt.** AC-1013–1017 are exceptionally strong: AC-1014 drives three synthetic trees *plus* the byte-vs-timestamp oracle (`utimesSync`, `:348-353`); AC-1017 pins the gated set entire (`:527-536`) and proves an offline verb fails on its own terms (`:522`); AC-1013/1016 each carry a real-binary sibling (`runBinWithout`). AC-738 drives the real `1c` binary as a subprocess |
| STORY-116 (`story-aaddb221`) — 5 ACs | request-07d0e3e1, request-3a11304d | **aligned — 5/5.** Both prior violations closed and verified at source |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) + `tests/bug27-nested-backdrop-capture.test.ts:80` | uat-edit | **AC-815 has no substantive UAT.** Its only two tests — `test_UAT_AC815_collapsed_header_subtree_is_captured` (`:124`) and `test_UAT_AC815_offscreen_block_does_not_become_or_inflate_a_band` (`:137`) — are both built with the local `itA` helper at `:80-85`, which is a plain `it()` whose body is `if (!capture) return // Chromium unavailable — skip silently`. An `it()` that returns early **reports PASS**, so on any runner without Chromium AC-815 reads fully covered and green while asserting nothing. This is precisely the anti-pattern the repo states in its own words three files away, at `bug24-scrim-alpha.test.ts:260-262`: "`it.runIf`, not a wrapper that returns early: a wrapper reports PASS on a runner with no Chromium … A skip is honest; a vacuous pass is not." Attempt 7 fixed that wrapper in `bug24` and every other gated file in this capability now uses `it.runIf` — `bug27` is the sole survivor. It also breaks the standard attempt 8 recorded as discharged in its own I3 ("no AC in this capability is entirely skipped in a headless run"): AC-815 is. The sibling AC-816 shares the vacuous wrapper for its four Part-A tests but is **not** a violation — its four Part-B tests (`:213-239`) are plain `it` and run headlessly; AC-817 is fully headless. AC-815 alone has nothing behind it. Its `fields.uat_coverage` already reads `fail` | Two edits, both precedented in-repo. (a) Replace the `itA` wrapper with `it.runIf(browserOk)` (the `bug24:263` shape) so the skip is honest for both AC-815 and AC-816. (b) Give AC-815 headless coverage using the `extract(html, boxByClass)` harness at `req72-gradient-capture.test.ts:56-67`, which runs the real `EXTRACT_SCRIPT` under jsdom with `getBoundingClientRect` stubbed per class — exactly the shape AC-815's criterion needs, since every clause (band box = painted extent of subtree; clamped to canvas; off-canvas block yields no band; conventional band unchanged) is a geometry computation over stubbed rects. Assert the collapsed 0px header's band is boxed at its painted nav, that a `left:-33554430px` block yields no band and does not inflate one, and that a clipped overflow does not widen the band past the document |
| W1 | warning | coverage | `tests/bug27-nested-backdrop-capture.test.ts:65-70` | uat-edit | `bug27`'s `beforeAll` calls `serveDir(FIXTURES)` **before** testing `chromiumAvailable()`, so on a runner that cannot bind a local socket the hook does not degrade to a skip — it hard-fails. Observed here: `Hook timed out in 180000ms` plus an unhandled `Error: listen EPERM … 127.0.0.1`, suite reported FAILED, 180s of wall clock. `req58-multi-viewport.test.ts:326-330` shows the correct shape — `if (!browserOk) return` **before** `serveDir`. This is not merely cosmetic: it is the mechanism by which V1 survived nine attempts. Attempt 8 excluded this file from its run and recorded the reason as "`tests/bug27-*` **were not in this capability's AC set** and were not run" (`report-60445a46`, Method §3) — which is factually wrong: `bug27` carries AC-815, AC-816 and AC-817, all three on STORY-75. The unrunnable file was mistaken for an irrelevant one, and the only AC with no real evidence sat inside it | Guard the hook: move `if (!browserOk) return` above `serveDir(FIXTURES)`, hoisting `browserOk` to module scope as the other five gated files do. Fix in the same edit as V1 — they are the same file and the same root cause |
| W2 | warning | coverage | AC-1307 `acceptance_criterion-4ecfd679` (STORY-76) | — | Carried forward unchanged from `report-60445a46` W1. `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` (`req72-gradient-capture.test.ts:200`) is `it.runIf(browserOk)` and skipped in this runner, as in the previous two. It is the only assertion covering REQ-72's motivating case (`oklch()` / `color-mix()` stops); the three headless siblings stand in with `rgb()`, the one non-hex form jsdom resolves. Attempt 8 correctly declined to act: AC-1307 **already carries** an `**Evidence gating.**` paragraph recording exactly this, the gating is honest (`it.runIf`, not a vacuous wrapper), and the AC contributes real headless assertions. No matrix or test edit would fix it | No action. Confirm on a Chromium-provisioned runner. Distinguish this from V1: here the gating is honest and headless coverage exists; there it is vacuous and headless coverage is absent |
| I1 | info | coverage | attempt-8 fixes | — | Both prior violations verified closed **at source**, not from the fix report: `selectMultiViewportPayload` present and wired (`fidelity.ts:542`, `index.ts:795`, `:121`); the `§`+`padding` structural predicate deleted from both former sites; AC-1288's body re-stated with the REQ-73 retirement argument and a four-case Verification asserting *no* collapsed defect carries `§` text; the precedence test present and, per the fix report, red-checked by flipping the ternary | none |
| I2 | info | coverage | 63 non-deprecated ACs | — | AC→test index re-derived independently: every non-deprecated AC carries ≥1 AC-linked test; AC-637 (deprecated) carries none. 21 files executed: **160 passed, 17 skipped, 0 assertion failures**; the only suite-level failure is `bug27` (W1). The two `EPERM` / browser-probe failures attempt 8 recorded as environmental did not recur in the files it ran | none |
| I3 | info | consistency | AC-631, AC-639, AC-643, AC-657, AC-720 | — | These five carry a stale `fields.uat_coverage: fail` (they are 5 of the 12 flagged store-wide). I ran each by name under `--reporter=verbose`: all five execute and pass headlessly, plain `it`, no gating. The field is stale exactly as `report-68170dfc` I1 found — **but it was not stale for AC-815**, the sixth flagged AC in this capability, where it was correct. The field is unreliable as a filter in both directions; it is worth a look, never a verdict | none |
| I4 | info | — | AC-739 `acceptance_criterion-fcf814b5` | — | Re-checked for the fourth cycle running: REQ-148 (`request-7ae3c2cc`) is **still `ready_to_reconcile`** (2026-08-15). Its retirement of the Astro-container clause remains imminent, not actual; AC-739 stands and its test passes (three cases: raw-L1 page, empty starter, module page — container constructed only for the third) | none — revisit when REQ-148 reconciles |
| I5 | info | consistency | STORY-79, AC-711–715 | — | The 26 previously-unaudited older ACs were read clause-by-clause this attempt. 25 of 26 are substantive and clause-complete; several exceed their Verification (AC-1014's timestamp-vs-bytes oracle, AC-1013/1016's real-binary siblings proving the gate is *reachable* when a package is genuinely absent — a property in-process tests structurally cannot show). The unaudited surface named by the prior report is now audited | none |
| I6 | info | exclusivity | all 63 ACs | — | No exclusivity violations. The declared near-candidates are unchanged and deliberate: AC-656 vs AC-1290 (scope note in AC-656's body), and the AC-1286/1287/1288/1289 quartet partitioning collapse / derived-exclusion / repair-class / clustering over shared fixtures. AC-711's two tests are different shapes (axis-matrix diff vs list-marker capture), not duplicates | none |

## Notes for the Editor

**One violation, one file, one edit.** V1 and W1 are the same file and the same root
cause; fix them together. The remediation needs no new test *design* — both halves
are copy-the-shape from files already in this capability: `bug24:263` for the honest
gate, `req58:326-330` for the guarded hook, `req72:56-67` for the headless
extract harness.

**Why this took nine attempts to surface, and what it says about the method.** The
gap was not subtle — an AC whose entire evidence is a wrapper that passes without
asserting. It survived because every prior attempt derived coverage from the *name
index* (does a `test_UAT_AC815_*` identifier exist?) and confirmed it by *running the
suite*. Both checks returned green: the identifiers exist, and the file was never run
because it could not run. The one file that was structurally excluded was the one
holding the hole, and the exclusion was recorded with a justification that was simply
untrue. **A file that fails to run is not a file with no ACs — and the difference is
invisible to a name-index sweep.** Any future cycle should reconcile the set of files
it executed against the set of files carrying the capability's ACs, and treat a
discrepancy as a finding rather than a footnote.

**The residual risk profile has moved.** The last report predicted the next instance
would be "a clause inside a multi-clause criterion." It was not — the clause-level
audit it recommended came back essentially clean (I5), and the defect was instead a
*gating shape* in an unexecuted file. With the clause audit now done and the gating
sweep done, the remaining soft spot is genuinely the browser-gated tier: AC-1307
(W2) and the Part-A halves of AC-816/1314/1316, none of which any runner in this
environment has ever executed. Those are honest skips, not vacuous passes — but the
capability has never had positive evidence for them, and only a Chromium-provisioned
runner can change that.
