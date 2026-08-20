---
uid: report-a753fcc4
id: REPORT-2396
type: report
title: 'UAT Coverage: 1c Capture & Diff Fidelity'
created_by: xgd
created_at: '2026-08-20T07:02:20.127952+00:00'
updated_at: '2026-08-20T07:02:20.127952+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 1
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Capture & Diff Fidelity

**Result**: FAIL
**AC verdicts**: 62 pass, 1 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 5 pass, 1 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Attempt 10. One violation, newly found this attempt: **AC-657's test never runs the
command the AC is about.** It is not a carry-forward — every prior cycle recorded
STORY-79 as fully covered, including the clause-by-clause audits of attempts 9 and 10.

The attempt-9 violation (AC-815's vacuous `itA` wrapper) is **closed**, verified here
at source and by execution rather than taken from a fix report.

## Method

Everything below was re-derived from source and from an executed run; no prior
report's conclusion was adopted without independent checking.

1. **AC→test index rebuilt from scratch.** Walked every `.ts/.tsx/.mts/.js/.mjs`
   file outside `node_modules` for `test_UAT_AC<N>_`, reading files as **bytes**
   (several files in this repo carry NUL bytes and are skipped by a plain text
   grep). Set-differenced against the 64 ACs across the six stories.
   **All 63 non-deprecated ACs carry ≥1 AC-linked test; AC-637 (deprecated)
   carries none — correct.**
2. **Gating shape re-derived per AC.** Counted browser-gated versus plain runners
   per AC. **Every one of the 63 ACs carries at least one ungated test** — no AC
   is entirely skipped on a headless runner.
3. **Wrapper honesty verified at source.** Every `itB` in the repo is
   `it.runIf(browserOk)`. The one bespoke wrapper, `itA`
   (`bug27-nested-backdrop-capture.test.ts:98-101`), is now `it.runIf(browserOk)`
   too, and its `beforeAll` guard (`:81`) precedes `serveDir` (`:82`) — the shape
   whose absence took the whole file down in attempt 9.
4. **Executed the capability's 22 test files.** `22 passed | 172 tests passed |
   23 skipped | 0 failures | 8.82s`. All 23 skips are honest `it.runIf(browserOk)`
   on a runner with no Chromium; no `describe.skip` / `it.skip` / `.todo`.
5. **Anti-pattern sweep.** Scanned every test for source-text/AST stand-ins
   (`readFileSync` of a production module + `toContain('export …')`). Ten hits
   exist in this repo — **all** in files belonging to other capabilities
   (`req117-edit-loop`, `req115-builder-shell`, `reconciliation-builder-*`,
   `reconciliation-behavior-modules`, `reconciliation-copy-edit-gesture`). **None**
   in this capability's 22 files.
6. **Read tests at source, not just their names.** Read every AC's tests in
   STORY-79 (the CLI story), STORY-77 and STORY-78 in full, plus samples across
   STORY-75 (`bug22`, `bug25`, `reconcile-values-diff-fidelity`,
   `reconcile-values-diff-treatments`) and STORY-116 (`req63`). This read is what
   surfaced the violation.

## Cumulative Intent Considered

The full chronological ledger is established in the story-level alignment report
`report-afa769c6` (PASS) and the uat-level `report-3562dc75` (PASS) and is not
restated. Intents consulted directly this attempt, where an AC's own body was
ambiguous or where a coverage question turned on what the intent actually asked:

| Intent ID | Status | Asked / changed | Counts? |
|---|---|---|---|
| BUNDLE-ab9e0cb6 (REQ-58 / REQ-61 / REQ-44) | free_and_reconciled | Boolean-flag parsing, `--json` stdout hygiene, quiet bootstrap, size-aware + cross-size diffing, install preflight | YES — parent of STORY-79's and STORY-77/78's ACs |
| BUNDLE-15c1f647 | free_and_reconciled | Install-preflight contract (ENVIRONMENT / exit 6 / `--json` envelope) | YES — AC-1013–1017 |
| BUG-25 (`bug-fe8af80a`) | free_and_reconciled | Per-run geometry for a multi-line text element; leaves per-line-vs-per-node to design | YES — read because AC-1310's body is internally inconsistent (W1) |
| BUG-22 (`bug-3e3fabdb`) | free_and_reconciled | values-diff mis-attributes split text+box controls; phantom radius delta leads repair order | YES — parent of AC-1311 (W2) |
| BUG-15 / BUG-16 / BUG-24 | free_and_reconciled | Body-spanning band fallback / capture-time font settling / modern-syntax scrim capture | YES — AC-1315 / AC-1314 / AC-1316 |
| REQ-72 (`request-…`) | free_and_reconciled | In-browser resolution of gradient stop colours to hex | YES — AC-1307 (W4) |
| REQ-64 / REQ-76 | free_and_reconciled | Noise audit; `--clusters` cause roll-up | YES — STORY-116 |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | Would retire AC-739's Astro-container clause | Imminent, **not yet actual** — AC-739 stands (I2) |
| REQ-78 (`1c aligned-crops` meaning) | live, unstoried | The verb's own meaning | Deliberately **not** swept into CAP-63 per the capability's CLI ownership rule — bears on W3 |

No intent in the ledger retires any behavior an active AC still describes, and no
active AC's behavior is unsupported by intent. Hence **zero `needs_review` and zero
`deprecated` findings** this round; AC-637 was already correctly deprecated.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 (`story-d5de22a5`) — 21 ACs | bundle-ab9e0cb6, bundle-ee56a66e, bundle-4ff83a8b (BUG-15/16/22/24/25), request-859652ae | aligned — **pass** | Body matches intent. Tests drive `diffManifests` / `flattenSignals(extract(…))` / `EXTRACT_SCRIPT` — the real diff and capture engines — and assert **both** directions plus absent-field guards. W1 (AC-1310 body) and W2 (AC-1311 clause) are warnings, not gaps in the story's promise |
| STORY-76 (`story-82eb6908`) — 7 active + 1 deprecated | bundle-ab9e0cb6, request-0698bbdf, request-3cd338cd (REQ-72) | aligned — **pass** | AC-1308's four rules map one-to-one onto four headless tests. AC-637 correctly deprecated and carries no test. W4 carried forward |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61 size-aware half) | aligned — **pass** | Read in full. Every test drives a real command (`cmdValuesDiff`, `cmdDiff`, `run(argv)`) against real on-disk bundles, proves both directions, and the loud-failure ACs assert the message **and** that no artifact was written |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61 cross-size half) | aligned — **pass** | Read in full. All nine go through `runCli` / `run(argv)` at the CLI boundary and read the JSON, exit code and output an operator would see |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6, bundle-15c1f647 | aligned — **fail** | Body matches intent; the **evidence** does not carry it. Guarantee 2's first sentence — "a `values-diff` command run with `--json` prints exactly one well-formed JSON document to stdout" — is nowhere proven by running a `values-diff` command (V1). The other four guarantees are strongly evidenced; AC-1290 and AC-1016 in particular are the standard the rest should meet |
| STORY-116 (`story-aaddb221`) — 5 ACs | request-07d0e3e1 (REQ-64), request-3a11304d (REQ-76) | aligned — **pass** | AC-1286 drives `collapseMultiViewport` / `formatCollapsedReport` over real `diffManifests` output and asserts the compression is *stated* (both counts), not silent. AC-1285 proves reversibility by re-reporting the same bytes under a widened dial |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| V1 | violation | ac | AC-657 `acceptance_criterion-9c235ff1` (STORY-79) | uat-edit | **The test simulates the entry point instead of driving it, so it cannot distinguish a correct `run()` from a broken one.** AC-657's Criterion is command-level ("When a `values-diff` command (single-width or `--multi-viewport`) is run with `--json` …") and its Verification is explicit: "**Run a `values-diff --json` command** and capture stdout only." `test_UAT_AC657_json_is_exactly_one_parseable_document` (`reconciliation-1c-cli-output-hygiene.test.ts:53-94`) runs no command. It calls `withCleanStdout` directly around a **hand-written body** that prints three fake diagnostics and returns a literal `{matched: 3, unmatched: 0, deltas: []}`, then writes that literal to stdout itself — and asserts `expect(parsed).toEqual({matched:3,unmatched:0,deltas:[]})`, re-reading the literal written twelve lines above. Its own comment concedes the shape: "Faithful reproduction of run()'s `--json` path". What it proves is that `withCleanStdout` diverts stdout — which AC-658 and AC-659 already prove. What it does **not** prove is the composition the AC is about: that `run()` actually wraps the values-diff compute (`cli/index.ts:810`) and the multi-viewport compute (`:777`) in it, and then emits exactly one document (`:823`, `:794`). Delete either `withCleanStdout` call in `index.ts` and this test still passes green. No other test closes the hole: a repo-wide sweep found `test_UAT_FC_REQ-58_multiviewport_json_stdout_clean` (`req58-multi-viewport.test.ts:218`) to be the same helper-only shape, and the only end-to-end `runCli(['values-diff','demo','--json'])` (`reconciliation-1c-install-preflight.test.ts:422`) exercises the **refusal** path, which returns before any render and so has no chatter to keep off stdout — precisely the condition AC-657 exists for | Rewrite the test to drive the real CLI, using the `runCli` helper already proven in this repo (`reconciliation-responsive-diff.test.ts:103`, `reconciliation-1c-install-preflight.test.ts:415`): build a ref bundle plus an actual manifest as `reconciliation-size-aware-diff.test.ts` does, run `runCli(['values-diff', slug, '--ref', dir, '--json'])`, and assert `JSON.parse(stdout)` succeeds **and** yields the command's own diff document (fields read off the report, not a literal the test wrote), with no diagnostic strings on stdout. Repeat for `--multi-viewport --json`, which the Criterion names explicitly and nothing currently covers at command level |
| W1 | warning | ac | AC-1310 `acceptance_criterion-c1d7d6d6` (STORY-75) | ac-edit | **The AC body contradicts its own normative rule, the implementation, and its tests.** The Criterion's parenthetical reads "An element holding more than one run (**wrapped text**, or text split by a `<br>`) yields one run per text node", and the Verification instructs "assert **each yields one run per line**". `extract.ts:1097-1125` walks `SHOW_TEXT` and counts **per text node**, so a single text node wrapping across two lines is one run — and `bug25-multiline-run-geometry.test.ts:282-287` asserts exactly that in as many words. Executing the Verification as written would report a false defect. Not a violation: the normative rule ("one run per text node") is correct and every other Verification clause is proven (`:170` br-split → distinct boxes one line-height apart; `:188` single-run → element box; `:197` genuinely shared rect → identical boxes; `:211` line count 1 per run). BUG-25 is the source of the loose language and explicitly leaves the per-line-vs-per-node choice to design | Two edits to AC-1310 only; do **not** touch the tests. (a) Drop "wrapped text, or" from the Criterion parenthetical. (b) Re-state the Verification's first sentence as: "Capture a page containing an element split by a `<br>`; assert it yields one run per text node, each carrying its own rendered box … and assert a single text node that wraps across two lines remains **one** run whose glyph box spans both lines" — already proven at `bug25:282-287` |
| W2 | warning | ac | AC-1311 `acceptance_criterion-1e7d867f` (STORY-75) | uat-add | **One of AC-1311's six enumerated cases has no test.** The Criterion's last bullet — "A bundle captured before the `surface` record existed carries none, leaving the resolution inert" — and the Verification's closing sentence ("Diff a pre-`surface` bundle and assert the resolution emits nothing") are uncovered. The six tests at `bug22-split-control-surface.test.ts:109-178` cover the other five cases well, but every one builds manifests through `flattenSignals(extract(…))`, so `surface` is **always** present. Nothing exercises the legacy path — the backward-compatibility guard for every bundle captured before the record existed | Add one headless test beside the others: build the manifests as `:122` does, delete `surface` from every element before `diffManifests`, and assert no `shape` and no surface-attributed `size` row is emitted for `Subscribe`, and that the diff still completes — i.e. the resolution is inert rather than throwing or falling back to the label's zeros |
| W3 | warning | ac | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | ac-edit | **AC-720's end-to-end clause is unexercised, and arguably is not this capability's to own.** Its sole test (`reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33`) asserts `subRenderOptions(opts)` — a pure helper that *is* on the production path (`aligned-crops.ts:196`) — carries `sandbox`/`cwd`/`source` across three invocation shapes. That covers the AC's **mechanism** half well. Uncovered is the Criterion's first bullet and the Verification's last sentence: "End-to-end, `1c aligned-crops <slug> --sandbox` … emits a non-empty set of crop pairs from the sandbox build." Per the capability's own CLI ownership rule, the crop-pair *meaning* belongs to the verb's owning capability, not to CAP-63's mechanism story — and the capability body already records REQ-78 (`aligned-crops` meaning) as a cross-capability gap to file rather than a CAP-63 story edit | Trim the end-to-end crop-pair clause from AC-720's Criterion and Verification, leaving the store-routing mechanism the story owns and the test proves. File the end-to-end crop assertion against the capability that owns `aligned-crops` (tracked with REQ-78). Do **not** add the crop-pair UAT here |
| W4 | warning | ac | AC-1307 `acceptance_criterion-4ecfd679` (STORY-76) | — | Carried forward unchanged for a fourth cycle. `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` (`req72-gradient-capture.test.ts:202`) is `it.runIf(browserOk)` and skipped on this runner. It is the only assertion covering REQ-72's motivating case (`oklch()` / `color-mix()` stops); its three headless siblings (`:115`, `:131`, `:147`) stand in with `rgb()`. The gating is honest, the AC already carries an explicit `**Evidence gating.**` paragraph, and headless assertions exist — no matrix or test edit would fix it | No action. Confirm on a Chromium-provisioned runner |
| I1 | info | ac | AC-815 `acceptance_criterion-9ccc1de8` — the attempt-9 violation | — | **Closed, verified independently of the fix report.** `bug27:98-101` is now `it.runIf(browserOk)` with `browserOk` at module scope (`:66`), and the `beforeAll` guard (`:81`) precedes `serveDir` (`:82`). The new headless describe (`:244-303`) carries 5 plain `it` tests driving the real `EXTRACT_SCRIPT` under jsdom. The file executed clean in this attempt's run (12 passed / 6 skipped) where attempt 9 recorded a 180s hook timeout | none |
| I2 | info | ac | AC-739 `acceptance_criterion-fcf814b5` | — | Re-checked for the sixth cycle: REQ-148 (`request-7ae3c2cc`) is still `ready_to_reconcile`. Its retirement of the Astro-container clause remains imminent, not actual; AC-739 stands and its test (real `cmdRender` with `experimental_AstroContainer.create` spied) passes | none — revisit when REQ-148 reconciles |
| I3 | info | — | AC-738 `acceptance_criterion-c7e51d45` | — | Considered as a possible partial-coverage warning and **dismissed**. The Criterion names six verbs but the Verification deliberately scopes to one exemplar ("Run **a** non-rendering command (e.g. `1c help`)"); the test spawns the real `1c` binary for two (`help`, `list`) and asserts the warning on neither stream. The suppression is at a single origin point, so per-verb enumeration would add cost without evidence. Note the capability's "asserted entire" discipline applies to the *gated command set* (AC-1017) and the *boolean flag registry* (AC-1290) — both of which genuinely are asserted entire | none |
| I4 | info | ac | AC-1290 `acceptance_criterion-cf26bae1` | — | Worth naming as the evidence standard for this capability: it derives the boolean-flag set **from the CLI source** (`booleanFlagReadsInCliSource()`), asserts it equals the registry, and then proves the derivation is load-bearing by mutation — dropping each member in turn and requiring the comparison to go red (`req58-multi-viewport.test.ts:183-196`). AC-1016 is its peer, driving both `runCli` and the real binary. V1's fix should aim at this bar | none |

## Notes for the Editor

**One violation, one lever.** V1 is a single test rewrite in
`reconciliation-1c-cli-output-hygiene.test.ts:53-94`. Everything it needs already
exists in this repo: `runCli` (`reconciliation-responsive-diff.test.ts:103`) drives
`run(argv)` and captures stdout/exit code, and `reconciliation-size-aware-diff.test.ts`
shows how to build a ref bundle plus actual manifest on disk. Do not delete the
existing assertions about `withCleanStdout` — move them under AC-658, where the
helper's contract is the AC's actual subject, and let AC-657 carry the command-level
claim its Criterion makes.

**Cover `--multi-viewport --json` too.** AC-657's Criterion names both paths and the
two are separate call sites (`cli/index.ts:777`+`:794` versus `:810`+`:823`); the
multi-viewport one additionally routes through `selectMultiViewportPayload`. A
single-width-only test would leave half the Criterion in the same position it is in
now.

**The general pattern behind V1.** Three tests in STORY-79 (AC-657, AC-658, AC-659)
and one FC test all exercise `withCleanStdout` in isolation. For AC-658 and AC-659
that is right — the helper's contract *is* the AC's subject. For AC-657 it is not,
because the AC's subject is a command. When an AC's Criterion opens with "When a
`<verb>` command … is run", the evidence has to run that verb. Worth applying as a
read-across when the sibling capabilities that own `repro`, `l1-gate`, `colors` and
`deploy` are assessed — the CLI mechanism guarantees are shared, and this shape may
be shared with them.

**W1 and W3 are body edits; W2 is a single added test.** All three are cheap and
independent of V1, and none blocks the level on its own. W3 in particular should
*shrink* an AC rather than grow a test — the clause it names belongs to another
capability under this capability's own ownership rule.

**Not a stale-matrix round.** No AC or story body describes behavior a later intent
retired, and no active element is unsupported by intent, so there is nothing here for
the ac-deprecate or story-body-edit levers beyond W1/W3's wording trims.
