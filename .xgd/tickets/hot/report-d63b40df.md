---
uid: report-d63b40df
id: REPORT-2399
type: report
title: 'UAT Coverage: 1c Capture & Diff Fidelity'
created_by: xgd
created_at: '2026-08-20T07:32:34.386951+00:00'
updated_at: '2026-08-20T07:32:34.386951+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 0
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Capture & Diff Fidelity

**Result**: PASS
**AC verdicts**: 63 pass, 0 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 6 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Attempt 8. **Zero violations, zero needs_review — the level clears.** The attempt-7
violation (V1, AC-657's test simulating the entry point instead of driving it) is
closed, verified here at source and by execution rather than taken from the fix
report. Four warnings remain, none blocking; two are new this round, two are
carry-forwards.

## Method

Everything below was re-derived from source and from an executed run. No prior
report's conclusion was adopted without independent checking.

1. **AC→test index rebuilt from scratch.** Walked all 352 `.ts/.tsx/.mts/.js/.mjs`
   files outside `node_modules` for `test_UAT_AC<N>_`, reading each as **bytes**
   (several files in this repo carry NUL bytes and are skipped by a plain text
   grep). Set-differenced against the 64 ACs across the six stories.
   **All 63 non-deprecated ACs carry ≥1 AC-linked test; AC-637 (deprecated)
   carries none — correct.**
2. **Gating shape re-derived per AC**, by walking back from each test-name line to
   its runner token. **Every one of the 63 active ACs carries at least one
   ungated test** — no AC is entirely skipped on a headless runner.
3. **Executed all 22 of the capability's test files**, in three batches:
   **22 files passed | 173 tests passed | 24 skipped | 0 failures.**
4. **Skip honesty and anti-pattern sweep over those 22 files.** No
   `it.skip`/`describe.skip`/`.todo`, no `.only`, no `vi.mock`, and no
   source-text/AST stand-ins (`readFileSync` of a production module +
   `toContain('export …')`). All gating is `it.runIf(<environment probe>)`, plus
   two `it.skipIf(!HAVE_GA_ORACLE)` in `req96-control-composition` that belong to
   another AC's FC tests, not to this capability's AC-linked evidence.
5. **Read tests at source.** Read in full: `reconciliation-1c-cli-output-hygiene`
   (the attempt-7 rewrite), `bug22-split-control-surface` (the attempt-7 addition),
   `reconcile-gradient-first-class`, `reconcile-values-diff-fidelity`,
   `req72-gradient-capture`, `req62-gradient-panel`, `req35-values-diff-noise`,
   `bug15-values-diff-l1-flat-dom`, `reconciliation-capture-list-marker`, and the
   probe half of `bug16-webfont-load-before-extract`. Outlined and spot-read
   `req63-values-diff-coverage`, `bug24-scrim-alpha`, `bug27-nested-backdrop-capture`,
   `req96-control-composition`, `reconciliation-size-aware-diff`,
   `reconciliation-responsive-diff`. This read is what surfaced W1 and W2.
6. **Verified the attempt-7 fixes at source, not from the fix report** — see the
   next section.
7. **Grounded the one live supersession question in the code**, not in the ticket
   alone: `grep` for the branch REQ-148 would delete (W3).

## Verification of the attempt-7 fixes

| Fix | Verified |
|---|---|
| AC-657 rewrite (V1) | `reconciliation-1c-cli-output-hygiene.test.ts:246-290` now drives the real `run(argv)` dispatcher over a real on-disk ref bundle + actual manifest, parses **the whole stdout stream** as one document, deep-equals it to the `--out` report the same run wrote (a file the test never touches), and reads the divert→compute→restore seam timeline. The hand-written body, the literal report and the `toEqual` against that literal are gone. Mutation-sensitive by construction: if the command never diverts, the chatter is never written and the stderr assertions fail |
| AC-657 multi-viewport add | `:292-366`, gated on a real `canServeLocally()` socket probe with an explicit `**Evidence gating.**` note. AC-657 retains an **ungated** command-level test, so the AC is not headless-skipped |
| AC-1311 pre-surface add (W2 of attempt 7) | `bug22-split-control-surface.test.ts:171-208`. Strips `surface` from a `flattenSignals` manifest and diffs both a pre-`surface` reference and a wholly legacy pair. Asserts inert means **unchanged** — the legacy `shape` row still fires — rather than silenced. Headless, passes |
| AC-1310 body edit (W1 of attempt 7) | The Criterion parenthetical now reads "text split by a `<br>`" (the "wrapped text, or" clause is gone) and the Verification asserts one run **per text node**, plus the positive clause that a single wrapping node stays one run. The AC no longer contradicts `extract.ts` or `bug25:282-287` |
| AC-720 body edit (W3 of attempt 7) | The end-to-end crop-pair clause is gone from both Criterion and Verification; a scope note cites the capability's CLI ownership rule and REQ-78. What remains is exactly the store-routing mechanism `subRenderOptions` proves |
| STORY-79 body edit | Guarantee 3 now ends "…is the `aligned-crops` verb's own meaning, owned by the capability that owns the verb rather than by this CLI-mechanism story." Paired correctly with the AC-720 trim |

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`; REQ-58 + REQ-59 + REQ-62 + REQ-61) | free_and_reconciled | 2026-07-17 | Boolean-flag parsing, `--json` stdout hygiene, gradient stop positions + panel surface gradients, size-aware and cross-size diffing | YES — parent intent of STORY-75/76/77/78/79 |
| REQ-64 (`request-07d0e3e1`) | free_and_reconciled | 2026-07-17 | The noise audit — the false-positive sibling of REQ-63's coverage audit | YES — parent of STORY-116 |
| REQ-73 (`request-859652ae`) | free_and_reconciled | 2026-07-18 | Adjacent-gap axis; retires section band vertical-padding comparison | YES — AC-1312 / AC-1313 |
| REQ-72 (`request-3cd338cd`) | free_and_reconciled | 2026-07-18 | In-browser resolution of gradient stop colours to hex | YES — AC-1307 |
| REQ-76 (`request-3a11304d`) | free_and_reconciled | 2026-07-18 | `--clusters` cause roll-up with dispositions | YES — AC-1289 |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | `aligned-crops --sandbox` store routing | YES — AC-720 |
| BUNDLE-8 (`bundle-cceaba25`; incl. REQ-89) | free_and_reconciled | 2026-07-29 | Bootstrap quiet at source; conditional Astro container | YES — AC-738 / AC-739 |
| BUNDLE-10 (`bundle-4ff83a8b`; BUG-15/16/22/24/25) | free_and_reconciled | 2026-07-29 | Body-spanning band fallback, capture-time font settling, surface-bearing box, modern-syntax scrim, per-text-node run geometry | YES — AC-1315 / 1314 / 1311 / 1316 / 1310 |
| REQ-114 (`request-0698bbdf`) | free_and_reconciled | 2026-07-31 | L1 palette colour model; retires the module-level palette-role alias | YES — AC-638 / AC-1309 (literal-only stops) |
| BUNDLE-11 (`bundle-ee56a66e`; BUG-27, REQ-96 …) | free_and_reconciled | 2026-08-05 | Nested backdrop capture; module-invariant exclusion | YES — AC-815 / 816 / 817 / 818 |
| BUNDLE-16 (`bundle-15c1f647`; REQ-44) | free_and_reconciled | 2026-08-07 | Install preflight (resolution + drift, ENVIRONMENT / exit 6 / `--json` envelope) | YES — AC-1013–1017 |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-15 | Removes Astro from the module render path; §5 **explicitly supersedes AC-739** | Imminent, **not yet actual** — see W3 |

No **reconciled** intent in the ledger retires any behavior an active AC still
describes, and no active AC's behavior is unsupported by intent. Hence zero
`needs_review` and zero new `deprecated` findings; AC-637 was already correctly
deprecated (REQ-84 removed the semantic layout modules that carried the
gradient text-block panel) and correctly carries no test.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 (`story-d5de22a5`) — 21 ACs | bundle-ab9e0cb6, bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e, request-859652ae | aligned — **pass** | All 15 numbered items in the body map onto ACs; no orphan behaviour either way. Tests drive `diffManifests`, `flattenSignals(extract(…))` and the real `EXTRACT_SCRIPT`, assert both directions, and carry absent-field guards. W1 (AC-818) and W2 (AC-1314) are enumerated-clause gaps, not gaps in the story's promise |
| STORY-76 (`story-82eb6908`) — 7 active + 1 deprecated | bundle-ab9e0cb6, request-0698bbdf, request-3cd338cd | aligned — **pass** | Read in full. AC-1308's four rules map one-to-one onto four headless `EXTRACT_SCRIPT` tests; AC-1309 drives the real `resolveSurfaceGradient` including the under-specified and non-literal drop paths. AC-637 correctly deprecated. W4 carried forward |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61 size-aware half) | aligned — **pass** | Every test drives a real command (`cmdValuesDiff` / `cmdDiff`) against real on-disk bundles; the four loud-failure ACs assert the message content and the re-capture guidance |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61 cross-size half) | aligned — **pass** | All nine go through `runCli` / `run(argv)` at the CLI boundary and read the JSON, exit code and output an operator would see |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6, bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | aligned — **pass** | Body matches intent and the evidence now carries it: guarantee 2's command-level claim is proven by running the command (the attempt-7 rewrite). Guarantee 3's body/AC pair was trimmed in step with the ownership rule. W3 concerns guarantee 4's future, not its present |
| STORY-116 (`story-aaddb221`) — 5 ACs | request-07d0e3e1 (REQ-64), request-3a11304d (REQ-76) | aligned — **pass** | AC-1285 proves the layer property the story leads with — same bundle, dial moved, different report, capture bytes byte-identical before and after — and proves reversibility by re-reporting. AC-1286/1287/1288/1289 are covered by 15 tests over the real `collapseMultiViewport` / `selectMultiViewportPayload` path |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| W1 | warning | ac | AC-818 `acceptance_criterion-66cf5953` (STORY-75) | uat-add | **Two of AC-818's four Verification clauses have no test, and the fixture is missing one of the three invariant kinds the Criterion names.** The sole test (`req96-control-composition.test.ts:325-352`) runs the real `EXTRACT_SCRIPT` and proves the capture-side half well: only the genuine control survives, and the hidden label does not source the accessible name (`nameSource === 'placeholder'`). Uncovered: "assert every reference control pairs one-to-one with its counterpart with no offset" and "assert no repro-only object comes from the invariant set" — both diff-level claims, and the AC's stated motivation ("`values-diff` therefore never pairs against one"). No test runs `diffManifests` over an invariant-bearing form. The fixture also carries only a hidden label and a honeypot; the **widget mount** the Criterion names is absent from it (`.contact-form__turnstile` appears only in a module-CSS test at `:139`, which belongs to another capability's concern). Kept a warning rather than a violation because the pairing claim is a strict corollary of the capture claim the test does prove, and because it is the same shape as attempt 7's W2 (AC-1311's uncovered enumerated case), which was also a warning | Extend the existing test, or add one beside it: put a `.contact-form__turnstile` mount marked `data-fc-invariant` into the fixture, build a reference manifest holding the same controls **without** the invariant elements, run `diffManifests`, and assert every reference control pairs 1:1 in order and `unmatched === 0` — i.e. no repro-only object comes from the invariant set |
| W2 | warning | ac | AC-1314 `acceptance_criterion-629184ba` (STORY-75) | uat-add | **AC-1314's bounded-wait clause has no test — gated or ungated.** The Criterion states it normatively ("Every wait is **bounded**, so a face that genuinely 404s or times out cannot hang the capture; it stays unresolved and is honestly reported `fontLoaded: false`") and the Verification instructs "Capture a page referencing a face whose URL 404s and assert the capture completes within its bound and reports `fontLoaded: false` for that run rather than hanging." None of AC-1314's six tests does this. The `.invalid` host at `bug16-webfont-load-before-extract.test.ts:97` is used in the *positive* direction — to prove the mirror rewrite is what makes the face load — not to exercise an unresolvable face. The honest-`false` half **is** covered headlessly (`:175-231`, a supplied `FontFaceSet` answering "not loaded"); it is the *boundedness* half that has no evidence. Note the AC's own `**Evidence gating.**` paragraph does not list this clause among the gated items, so it is not an acknowledged gap | Add one test capturing a fixture whose `@font-face` src 404s against the local fixture server (the server already returns 404 at `:69`), asserting the capture resolves rather than hanging and that the affected run reports `fontLoaded: false`. Gate it `itB` if it needs a real engine, and extend the AC's `**Evidence gating.**` paragraph to name it — or, if the bound is enforced by an exported helper, prove it headlessly there |
| W3 | warning | ac | AC-739 `acceptance_criterion-fcf814b5` (STORY-79) | ac-deprecate (deferred) | **REQ-148 §5 names AC-739 as superseded, and REQ-148 sits in the "imminent" status bucket — but the behavior is still live in this tree, so deprecating now would strip evidence from shipping code.** REQ-148 (`request-7ae3c2cc`, `ready_to_reconcile`, 2026-08-15) removes Astro from the module render path entirely, making the render path Astro-free "full stop" rather than "unless a page needs Astro", and lists `the needsAstro branch in renderSiteFiles` among the deletions. Grounded in the code rather than the ticket: `tools/generate/src/render/render.ts:264` still reads `const needsAstro = site.pages.some((p) => p.modules.length > 0)`, and its test passes. REQ-148's commits carry `reconcile_sha: null` and `main_sha: null`. Flagging this explicitly rather than carrying it as a silent info note (as the previous six cycles did), because the strict reading of the status table would have it deprecated today | **No action this round.** When REQ-148 reconciles: mark AC-739 `status: deprecated`, link REQ-148, and rewrite its UAT to the stronger invariant (no Astro anywhere on the render path) as §5 directs. Re-check at the next assessment |
| W4 | warning | ac | AC-1307 `acceptance_criterion-4ecfd679` (STORY-76) | — | Carried forward unchanged for a fifth cycle. `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` (`req72-gradient-capture.test.ts:202`) is `it.runIf(browserOk)` and skipped on this runner; it is the only assertion covering REQ-72's motivating case (`oklch()` / `color-mix()` stops), because jsdom returns modern-colour-space tokens verbatim. Its three headless siblings (`:115`, `:131`, `:147`) stand in with `rgb()` and are substantive. The gating is honest and the AC documents it | No action. Confirm on a Chromium-provisioned runner |
| I1 | info | ac | AC-657 `acceptance_criterion-9c235ff1` — the attempt-7 violation | — | **Closed, verified independently of the fix report** (see the verification table above). The rewritten test drives the real dispatcher and reads stdout as bytes; the AC-1290 bar the previous report set is met |
| I2 | info | — | AC-637 `acceptance_criterion-377af866` | — | Re-confirmed correctly deprecated with `status: deprecated` **and** `uat_coverage: deprecated`, carrying zero tests. REQ-84 removed the semantic layout modules that carried the gradient text-block panel; `req62-gradient-panel.test.ts:26-30` records the supersession in its header comment |
| I3 | info | — | 22 test files | — | Executed this round: **173 passed, 24 skipped, 0 failures.** Every skip is an `it.runIf` on a genuine environment probe (`chromiumAvailable()`, `canServeLocally()`) on a runner with no Chromium and no socket-bind permission |

## Notes for the Editor

**Nothing blocks this level.** All four findings are warnings; the capability
aggregate is `pass` and every AC and story verdict already carried the value this
assessment independently arrived at, so no matrix field changed except the
capability aggregate itself (`fail` → `pass`).

**W1 and W2 are the same shape, and it is the shape worth watching in this
capability.** Both are ACs whose Criterion enumerates several cases or mechanisms
and whose Verification enumerates several assertions, where the evidence covers the
load-bearing ones and quietly drops one or two. Attempt 7's W2 (AC-1311's
pre-`surface` case) was the same, and the fix for it was a single test. The
capability's own discipline — "the gated command set is asserted **entire**",
"the boolean flag registry is derived from source, not restated" — is the answer
to this pattern where an AC's enumeration is the point; AC-1290 and AC-1017 are the
two ACs that already meet it, and they are the model.

**W3 needs an operator decision eventually, not an edit now.** It is the only place
where the strict status-table reading ("a later intent with reconciled *or
imminent* status retired the behavior → deprecate the AC") and the state of the code
disagree. The disagreement resolves itself the moment REQ-148 reconciles; until
then, deprecating AC-739 would leave a live, passing, shipping branch
(`render.ts:264`) unevidenced. Whoever assesses this capability next should re-run
that one `grep` rather than re-reading the ticket.

**W2 has a second, cheaper resolution than a new test.** If the bound on the
web-font barrier is not reachable without a real engine, the honest fix is to extend
AC-1314's existing `**Evidence gating.**` paragraph to name the boundedness clause
alongside mechanisms (a) and (b) — the AC already models exactly that disclosure,
and an acknowledged gated gap is a different thing from a silent one.

**Not a stale-matrix round.** No AC or story body describes behavior a reconciled
intent retired, and no active element is unsupported by intent, so there is nothing
for the ac-deprecate or story-body-edit levers beyond W3's deferred item.
