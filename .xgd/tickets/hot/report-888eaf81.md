---
uid: report-888eaf81
id: REPORT-1754
type: report
title: 'UAT Coverage: Site Materials & Starting Point: Scaffold, Assets, Provenance
  & Palette'
created_by: xgd
created_at: '2026-08-10T08:18:30.288848+00:00'
updated_at: '2026-08-10T08:18:30.288848+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-b4ac88fc
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette

**Result**: PASS
**AC verdicts**: 36 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 4 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-69e94af9. Previous attempts: 3.

Evidence was **executed**, not only read. All five suites carrying this
capability's UATs were run in this worktree:
`npx vitest run tests/reconciliation-{site-asset-listing,font-provenance,colour-census-and-retrofit,scaffold-starter-l1,colour-palette-overlay}.test.ts`
→ **5 files passed, 39 passed | 1 skipped (40)**, 18.98s. The 40 tests are this
capability's 36 UATs plus AC-928…AC-931, which share the palette-overlay file but
belong to STORY-80 in CAP-70. The single skip is AC-871 (browser-gated — see the
warning); every other AC's UAT ran green.

## Cumulative Intent Considered

Four intents touch this capability, all `free_and_reconciled` (verified on the
tickets themselves, not inherited). No intent in the ledger retires a behaviour
any AC or story body still claims.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-101 (via BUNDLE-11) | bundle-ee56a66e | free_and_reconciled | 2026-07-26 → merged f9a415a8 | Font provenance record + `1c fonts check`: four violation kinds, three-state redistribution, distribution marker, advisory warnings, JSON form → STORY-92 | YES |
| REQ-102 (via BUNDLE-11) | bundle-ee56a66e | free_and_reconciled | 2026-07-26 → merged f9a415a8 | `1c new` seeds a complete valid L1 document; renders and screenshots unedited; repro replaces wholesale; one shape, no flag → STORY-93 | YES |
| REQ-114 (via BUNDLE-14) | bundle-0385746c | free_and_reconciled | 2026-07-31 → merged cd8f98c8 | L1 palette colour model + retrofit of existing sites; **retires the theme's colour token group** → STORY-97, and `updated_by` on STORY-93 | YES (one retirement, already absorbed) |
| REQ-118 | request-66e4c630 | free_and_reconciled | 2026-07-31 → merged b2b9208c | Union asset listing over declared registry + `draft/assets/`, one handle vocabulary, CLI + builder origin → STORY-102 | YES |

**The one retirement is already reflected.** REQ-114 deleted the theme colour
group outright. STORY-93's body restates the colour-provenance property against
the page's own layout document rather than the theme, and AC-873's UAT asserts
positively that `site.palette` and `theme.palette` are both absent and that the
surviving theme groups are exactly the six non-colour ones. No stale claim
survives anywhere in this capability.

**Imminent intents were checked and add nothing here.** REQ-128 (`bundled`)
reuses REQ-118's listing verbatim — "no new command, no new route, no editor
change" — so it neither extends nor retires STORY-102. REQ-130 (`bundled`) names
"generated assets", but its gap is that `add_asset` takes a file path and nothing
*writes bytes* — asset creation, which this capability's body places explicitly
out of scope ("Uploading, importing, converting or processing assets; the store
lists what exists"). REQ-130 also states that licensed binary fonts remain
REQ-101's and are deliberately excluded. Neither makes any story `incomplete`.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-102 (story-c46abfa6) | REQ-118 | aligned | Body's five in-scope claims map 1:1 onto AC-1018…AC-1023. Its two "known limitation" notes (upstream field component renders option text verbatim; the editing surface deliberately does *not* call the route) are declared as **deliberately unasserted**, not as promises — correctly so. |
| STORY-92 (story-8685be2d) | REQ-101 | aligned | Every in-scope clause has an AC. The body's three recorded divergences (invalid site definitions skipped by the reference join; commercial-use/self-host recorded but ungated; the pass line under-describing the pass) each say in the body that no criterion asserts them — a declared non-assertion, not a silent gap. |
| STORY-97 (story-5e7eb0c5) | REQ-114 (+ STORY-80 dependency) | aligned | Census → AC-939/940; two-pass derivation → AC-941/942/943; lossless-or-nothing → AC-944/945; naming → AC-946; re-runnable → AC-947; palette shape → AC-932. The body's two intent/observation notes (census reports 18/16 not the doc's frozen 17/15; two of four sites retrofit vacuously) are both pinned by tests rather than left as prose. |
| STORY-93 (story-86c7c21b) | REQ-102, updated by REQ-114 | aligned | The three "load-bearing beyond something exists" properties map to AC-872 (ladder), AC-873 (colour), AC-874 (flow); "one shape, no opt-in" to AC-875; wholesale import to AC-876; validates/renders/screenshots to AC-869/870/871. |

## Evidence Quality — how each AC was judged

Every one of the 36 UATs drives a **real entry point**. There is no structural
(source-text-scanning) test, no test asserting merely that a symbol exists, and
no internal component is mocked anywhere in this capability. The only test
doubles present are `console.log`/`console.error` spies and `process.chdir` — an
output-capture shim and a cwd shim, neither of which substitutes for the code
under test.

| Story | Entry points driven | Anti-vacuity guards observed |
|---|---|---|
| STORY-102 | `run(['asset','list',…])` (the real CLI, argv in / envelope + exit code out) and the **real builder origin over HTTP** via `startBuilder`, plus the builder's own `fetchAssets` client | AC-1023 asserts the origin's list equals the CLI's list rather than equalling a constant; AC-1020 pins the off-site absolute-URL boundary; AC-1022 asserts empty-is-success separately so "no assets" cannot masquerade as a pass |
| STORY-92 | `cmdFontsCheck` against real on-disk workspaces and `run(['fonts','check'])`/`--json` for exit status and stream shape | AC-867 runs against the repo as it stands and asserts non-zero registered/usage/file counts — a pass that could have come from finding nothing is rejected; AC-864 asserts `PASS` is absent from output for all four record-integrity failures; AC-861 varies only the two gate inputs and covers all four cells |
| STORY-97 | the shipped `1c` launcher as a subprocess (for stdout/stderr/exit-status ACs) and `cmdColors`/`cmdColorsAssign`/`cmdRender`/`cmdRepro` (for definition and pixel ACs) | AC-944 proves byte-identical render **and** independently that `resolveL1Palette(converted) === original`; AC-945 proves all three refusal causes leave a byte-identical file tree via `hashTree`; AC-939 hashes both sites before and after to prove the census writes nothing; AC-932 asserts the site paints >0 colours before comparing multisets |
| STORY-93 | `cmdNew`/`cmdRender`/`cmdShot`/`cmdRepro`, plus `node tools/generate/bin/1c.mjs help` as a subprocess for the documented-usage half of AC-875 | Artifacts are read back **off disk** rather than recomputed from the scaffold function; AC-870 asserts on `<body>` specifically because the slug also appears in `<title>`, so a whole-document match would pass on an empty body; AC-876 asserts the *result* (seeded slug ≡ virgin slug) rather than the emptying mechanism |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-871 (acceptance_criterion-b17420aa) / `tests/reconciliation-scaffold-starter-l1.test.ts:177` | — (environment provisioning, not matrix drift) | AC-871's sole UAT is gated `itB = it.runIf(await chromiumAvailable())` and **skipped** in this worktree (confirmed by verbose run: `↓ test_UAT_AC871_fresh_site_shoots_without_hand_editing`). The criterion is therefore unproven *in this environment*. It is **not** a coverage gap: the AC's own body sanctions the gate ("Requires a headless browser; the check is gated on browser availability"), and the test is substantive when it runs — it drives `cmdShot` (render + serve + capture) and asserts the eight-byte PNG signature, not mere file existence | No matrix or test change. Provision the engine (`npx playwright install --with-deps chromium`) so a regression run proves AC-871 instead of skipping it |

**No violations. No needs_review.**

## Notes for the Editor

**`.xgd/uat_index.json` has no entry for `ac871`.** All 35 other ACs are indexed;
AC-871 is absent. This is a consequence of finding 1, not a separate defect: the
index is built by `UATIndexBuilder` from quality-report suite results, so an AC
whose only test has never appeared in a run never acquires an entry. Provisioning
chromium fixes both at once. Worth knowing because an index-only lookup for this
capability's evidence will report AC-871 as untested when the test in fact exists
and is sound.

**AC-932's test lives away from its siblings.** AC-932 is in
`tests/reconciliation-colour-palette-overlay.test.ts` (alongside AC-928…AC-931,
which belong to STORY-80 / CAP-70), while its nine sibling ACs are in
`…-colour-census-and-retrofit.test.ts`. The split is coherent — AC-932 is the
retrofit's palette-*shape* claim and sits with the palette-model tests — but a
file-scoped search for STORY-97's evidence will miss it.

**Forward dependency on the open ac-level alignment finding.** report-34f54ad3
(level=ac) proposes narrowing AC-932 to its one non-duplicated criterion (the
zero-colour vacuous retrofit over `1stcontact` / `harbor-cafe`), moving the
"materially smaller" and "colour-lossless" claims to AC-941 and AC-944 which
already own them. If that edit lands, AC-932's UAT must be narrowed in step: its
first loop (the two stored sites, the pinned 16→6 / 30→8 counts, the painted-colour
multiset comparison) becomes evidence for ACs it no longer belongs to, leaving
only the second loop — and the test name should change with it. Recorded here so
this level is not re-derived from scratch after the ac-level repair. **Coverage
passes as the matrix currently stands.**

**Guards that must not be simplified away.** Several UATs here defend explicitly
against vacuous passes: AC-867 asserts non-zero scan counts, AC-932 asserts the
site paints >0 colours before comparing, AC-947 asserts literals exist on arrival,
AC-939 hashes the site trees before and after to prove read-only, AC-870 asserts
on `<body>` rather than the whole document. Each of these would still pass if
deleted, and each is what stops the assertion beside it from being trivially true.
A well-meaning cleanup would hollow them out silently.
