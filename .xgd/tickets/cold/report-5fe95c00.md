---
uid: report-5fe95c00
id: REPORT-1329
type: report
title: 'UAT Coverage: 1c_capture_diff_fidelity'
created_by: xgd
created_at: '2026-08-05T23:15:25.053142+00:00'
updated_at: '2026-08-05T23:15:25.053142+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 7
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c_capture_diff_fidelity

**Result**: FAIL
**AC verdicts**: 34 pass, 5 fail, 0 deprecated, 0 needs_review (39 ACs)
**Story verdicts**: 1 pass, 4 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Every one of the 39 ACs carries a `test_UAT_AC<n>_*` test and **all execute and
pass** — verified this cycle, not assumed: `vitest run` over the nine AC-bearing
files → 9 files / 44 passed / 2 skipped (both skips are browser-gated
`test_UAT_FC_*` siblings, not AC UATs). So this is not a "missing test" report.

Every finding below is a test that **exists, passes, and cannot fail** when the
production line its AC names is deleted. Five ACs are covered by a test that
drops one level beneath the command the AC describes; two stories have a
behavioral promise with no AC at all. That is the "clean gate, different render"
condition this capability's own charter ("0 value-diffs ⟺ pixel-faithful")
exists to prevent — turned on the gate itself.

## Cumulative Intent Considered

Chronological ledger, reconstructed from `fields.intent_uid` / `fields.updated_by`
on the five stories and the intents their bodies cite. Consistent with the ledger
established this cycle at story level (`report-88eb3839` / REPORT-1326) and
narrowed at ac level (`report-728bd245`); nothing here required re-deriving it.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58 + REQ-59 + REQ-62 + REQ-61) | free_and_reconciled | 2026-07-17, main `7a42e182` | `intent_uid` of all five stories. REQ-58: rendered-text extent, composited surface fill, box border, duplicate-text pairing, the multi-viewport ladder + `--multi-viewport` diff, boolean-flag and `--json` follow-ups. REQ-59 gradient stop positions. REQ-62 panel/surface gradient capture+diff+authoring. REQ-61 `--size` on both diff commands + `responsive-diff` | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84) | free_and_reconciled | 2026-07-22, main `edeb1c2c` | REQ-63 typography/effect/media axes, border style, box-border on text runs. REQ-79 keeps `09fa7cf5` (aligned-crops `--sandbox` forwarding) and the fontLoad false-positive fix; REQ-79/84 pivot retired the semantic **layout** modules (incl. `text-block`) but preserved the capture/values-diff measurement spine | YES |
| BUNDLE-8 `bundle-cceaba25` (BUG-7, REQ-89, BUG-10, +) | free_and_reconciled | 2026-07-29, main `b1bd5b6b` | `updated_by` of STORY-75 and STORY-79. REQ-89 quiet bootstrap at source + Astro container only for behavior-module pages (`5dc46d0f`). BUG-10 list-marker capture gated on a painted marker box | YES |
| REQ-80 `request-7756b2e8`, REQ-65, REQ-69 | abandoned | 2026-07-17…19 | Per-band capture axis and two others; correctly absent from every AC | NO |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27 CSS background images / lazy media) | reconciling | 2026-08-05 | Imminent capture-side ask; no AC expected yet | imminent — not enforced here |

**No intent in the ledger retires a behavior any active AC describes**, so zero
ACs are deprecated and zero are unsupported (needs_review = 0). The one place
intent touches an AC's wording is AC-637, whose *title* names the `text-block`
module the REQ-79/84 pivot deleted — its *behavior* (the shared resolver) is live
reconciled REQ-62 intent, so it stays active (finding 9, ac-edit, already open).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 `story-d5de22a5` | REQ-58 (T1/T5/T7/T14), REQ-63, REQ-79 (fontLoad), BUG-10 | aligned, **coverage gap** | 9/10 ACs substantively covered by `diffManifests`-driven UATs — exemplary. AC-631's *capture* half has no executing evidence (finding 5) |
| STORY-76 `story-82eb6908` | REQ-59, REQ-62 | aligned, **coverage gap** | Story declares capture of surface gradients in scope with a specific selection rule; no AC expresses it (finding 6) |
| STORY-77 `story-16f2793c` | REQ-61, REQ-58 (ladder) | **incomplete** | Both `--size` commands' actual-side legs unproven (findings 2, 4); the REQ-58 `--multi-viewport` ladder-diff mode is described by no story anywhere (finding 7) |
| STORY-78 `story-2c7069fe` | REQ-61 | aligned, fully covered | All 9 UATs drive `run(argv)` and assert on stdout/stderr/exit code. **The model for the rest of this capability** |
| STORY-79 `story-e15a19ef` | REQ-58 follow-ups, REQ-79 (`09fa7cf5`), REQ-89 (`5dc46d0f`) | aligned, **coverage gaps** | AC-738/739 are strong (real subprocess; container spy). AC-657 is self-referential (finding 1); AC-720's end-to-end clause is manual (finding 3) |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-657 `acceptance_criterion-9c235ff1` (STORY-79) | uat-edit | AC-657 claims a property of **the command** ("everything written to stdout is exactly one well-formed JSON document"); its Verification says "Run a `values-diff --json` command and capture stdout only". `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53-94`) never invokes `values-diff`: it calls `withCleanStdout` directly, **writes the JSON document itself** (`:77`) and parses what it just wrote (`:86`). Its docstring concedes it is a "faithful reproduction of run()'s `--json` path". Confirmed independently: `grep run(['values-diff'` over `tests/` → **no matches**; the real path is `tools/generate/src/cli/index.ts:491-506`. Add any second `console.log` to the values-diff case and stdout carries two documents, `\| jq` breaks, and this UAT stays green | Rewrite to `run(['values-diff', slug, '--ref', <bundle>, '--actual', <manifest>, '--json'])` with `process.stdout.write` captured at byte level (harness already at `…output-hygiene.test.ts:62-67`), then assert the **entire** captured stdout parses as one document equal to the report. Offline feasibility proven by AC-640 (`reconciliation-size-aware-diff.test.ts:138`) |
| 2 | violation | uat | AC-643 `acceptance_criterion-2ca1d9b9` (STORY-77) | uat-edit | AC-643 has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the same-width screenshot" — and its Verification demands both. `test_UAT_AC643_…` (`tests/reconciliation-size-aware-diff.test.ts:212-235`) asserts only the second: it passes `actualImagePath` (`:227`), which I confirmed takes the `if (!actualImage)` branch of `cmdDiff` out of play entirely (`tools/generate/src/cli/perceptual.ts:456-473`). The unexercised line is `viewport: opts.size` (`:467`) — the sole forwarding of `--size` to `cmdShot`. Delete it and `1c diff --size mobile` shoots at desktop, diffs against the 390px reference, and returns an all-red report while every AC here passes | Add a leg driving `cmdDiff` **without** `actualImagePath`: supply `slug` + a fake `driverFactory` (pattern: `tests/shot.test.ts:133`; `MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312`) and assert the driver's `screenshot` received `VIEWPORTS.tablet` |
| 3 | violation | uat | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | uat-edit (or ac-edit) | AC-720's Criterion bullet 1 and its Verification both close on an end-to-end observable: "a non-empty set of crop pairs is produced" from the sandbox build. `test_UAT_AC720_…` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33-75`) covers only the pure `subRenderOptions` seam, and the file's own docstring states the rest is **manual** (`:16-19`). The regression the AC exists to prevent is *defined by crop-pair emptiness*, which the seam test cannot observe — `subRenderOptions` can return a perfect object that a caller then ignores. The matrix currently advertises a one-time manual observation as evidence | Either (a) add a browser-gated end-to-end leg using the repo's `const itB = it.runIf(browserOk)` pattern (`tests/req62-gradient-panel.test.ts:34`), asserting a non-empty crop-pair set; or (b) if genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause from Criterion and Verification. Do not leave the AC asserting a manual check |
| 4 | violation | uat | AC-639 `acceptance_criterion-c6534e1a` (STORY-77) | uat-edit | Mirror of finding 2 on the values-diff side. AC-639's Criterion: "the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**". `test_UAT_AC639_…` (`…size-aware-diff.test.ts:109-132`) supplies the actual side as `actualManifestPath` (`:118`), bypassing the else-branch that carries `extractDraftManifest(opts.slug, …, viewport)` (`tools/generate/src/cli/fidelity.ts:167`) — verified. The reference-selection clause is proven precisely (`expectedSource`, `:124-125`); the render-at-viewport clause is unguarded. Weaker than finding 2 only in that AC-639's *Verification* text asks only for the reference leg — the Criterion still promises both | Same edit as finding 2, on `cmdValuesDiff`: drive with `slug` + fake `driverFactory` and assert the driver was sized to `VIEWPORTS[size]`. One session closes findings 2 and 4 together |
| 5 | violation | uat | AC-631 `acceptance_criterion-65b5ddd3` (STORY-75) | uat-add | AC-631's Criterion is "the surface colour **captured and compared** … is its effective rendered colour after compositing"; its Verification opens "**Capture** a fixture … and diff it". `test_UAT_AC631_…` (`tests/reconcile-values-diff-fidelity.test.ts:73-101`) owns only the compare leg — it hand-derives the blend from the compositing formula (`:86-87`) and feeds it in as fixture, so an alpha-dropping capture leaves it green. It cites its capture-leg owner honestly, `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` (`tests/req58-wrapper-treatments.test.ts:71`) — but that sibling is browser-gated (`itB = it.runIf(browserOk)`, `:32`) and **I confirmed it skips in this environment** (`vitest run tests/req58-wrapper-treatments.test.ts` → 5 passed, 3 skipped). So the capture half has no executing evidence here | Author an environment-independent capture UAT in the shape AC-711 already uses inside this same story (`tests/reconciliation-capture-list-marker.test.ts:59` runs the real `EXTRACT_SCRIPT` under jsdom): mount a translucent card over a tinted band, run `EXTRACT_SCRIPT`, assert the captured `surfaceFill` is the blended tint, not `#ffffff` |
| 6 | violation | ac | STORY-76 `story-82eb6908` (item 2, "Captured" leg) | ac-add | STORY-76 declares In scope "**capture** of stop positions and surface gradients" and states a specific, non-obvious selection rule: the nearest painting ancestor's surface gradient is recorded, "**skipping a text-fill gradient**" and "**stopping at the first opaque solid**". No AC covers it — AC-636 diffs manifests whose `surfaceGradient` arrives as fixture input, so it presumes the capture; AC-634/635 are text-fill stop positions; AC-637/638 are authoring/validation. Live code: `surfaceGradientOf` (`tools/generate/src/cli/capture/extract.ts:490-502`). Delete the `background-clip:text` guard and a wordmark's own glyph paint is recorded as its panel surface — every AC in this capability still passes. (Raised at ac level this cycle as `report-728bd245` finding 2; re-stated here because it is the story's own behavioral promise going unproven) | Author one AC under STORY-76: a run inside a gradient panel records that gradient while `surfaceFill` independently records the composited solid; a text-fill gradient is captured as the run's `gradient` and never as `surfaceGradient`; a gradient behind an opaque fill records none. Two REQ-62 UATs already exist as partial evidence (`tests/req62-gradient-panel.test.ts:157,172`) but are browser-gated — pair with finding 5's jsdom pattern so the evidence executes everywhere |
| 7 | violation | story | STORY-77 `story-16f2793c` | story-body-edit + ac-add | `1c values-diff <slug> --ref <bundle> --multi-viewport` — the reproduction-vs-reference **cell-for-cell ladder diff** REQ-58 (T2/A) landed — is expressed by no story in this capability and no story in the matrix. It is live and documented (`tools/generate/src/cli/index.ts:152` usage, `:456-484` dispatch/exit; `capture/bundle.ts:71,79` ladder persistence) and carries free-coding UATs (`tests/req58-multi-viewport.test.ts:78,192,236,274`). AC-656 pins only that the flag *parses* as boolean; STORY-75 puts ladder diffing out of scope; STORY-77 covers only `--size` (one width); STORY-78 is single-site `responsive-diff`. A merge artifact of the 2026-08-05 consolidation — each predecessor capability disclaimed it toward the other. (Also filed at story level as `report-88eb3839` finding 1; repeated here because it is a live capability with zero AC-level evidence) | Extend STORY-77's Description with the ladder-diff mode as its own numbered item (cell-for-cell pairing across the reference's persisted ladder, worst-cell-first report, loud missing cells, stale-reference terminal fail), add the matching clause to the capability Scope bullet 3, then author ACs — the `test_UAT_FC_REQ-58_multiviewport_*` UATs already exist to reference |
| 8 | warning | uat | AC-658 `acceptance_criterion-7f078026` (STORY-79) | uat-edit | Same shape as finding 1, one degree weaker — kept a **warning**, and the AC is marked `pass`, because the test drives the real `withCleanStdout` (no mocking, real production behavior) and the AC itself names that wrapper as the load-bearing mechanism. But `test_UAT_AC658_…` (`…output-hygiene.test.ts:100-132`) hand-writes the three diagnostics rather than running a command, so nothing proves the CLI still *wraps* the values-diff compute: remove `withCleanStdout(…)` at `tools/generate/src/cli/index.ts:491` and this test stays green while every render diagnostic lands on stdout | Fold into finding 1's fix — once the UAT drives `run(['values-diff', …])`, assert the stream split there. `withCleanStdout`'s own contract stays independently owned by AC-659, whose Verification correctly names the wrapper |
| 9 | warning | ac | AC-637 `acceptance_criterion-377af866` (STORY-76) | ac-edit | Coverage is sound — `test_UAT_AC637_…` (`tests/req62-gradient-panel.test.ts:69-83`) exercises the real `resolveSurfaceGradient` exactly as the AC's **body** specifies, so the AC is marked `pass`. The AC's **title** ("A text-block authored with a gradient panel renders a padded, rounded panel…") describes a render on a module the REQ-79/84 pivot deleted, and one STORY-76's own Out-of-scope explicitly disclaims. Already open as `report-728bd245` finding 1; recorded here so the editor does not read the `pass` verdict as "nothing to do on AC-637" | Retitle to match body and story, e.g. "An authored gradient value resolves via the shared resolver to a gradient surface fill; under-specified stops resolve to no fill". Do **not** deprecate — the resolver behavior is live reconciled REQ-62 intent |
| 10 | warning | ac | STORY-77 `story-16f2793c` (+ STORY-78) | ac-add | STORY-77's Technical Context states "a single deterministic reference cell is chosen per width (prefer the primary engine at rest)", but no AC pins it: AC-639 requires only that the reference come from the selected width, satisfied by *any* cell there. `selectProjectionAtWidth` (`tools/generate/src/cli/capture/values-diff.ts:2431-2442`) applies a three-tier fallback and its doc comment says "the diff and the responsive table both need one deterministic cell per width". A ladder holding hover/WebKit cells at a width could silently supply a hover-state reference with every AC green. Warning, not violation: the rule sits in Technical Context, not either story's In-scope list. Carried from `report-728bd245` finding 3 | Add one AC under STORY-77 (cited from STORY-78) pinning deterministic per-width cell selection: given a ladder with several cells at one width, the diff selects chromium-at-rest |

## Notes for the Editor

**One pattern accounts for findings 1–5, and two edits close four of them.** In
every case the UAT tests a seam one level below the command its AC names, leaving
the wiring between CLI and seam unguarded — and the wiring is a **single line**:

- `tools/generate/src/cli/index.ts:491` — `withCleanStdout(…)` around the values-diff compute (findings 1, 8)
- `tools/generate/src/cli/perceptual.ts:467` — `viewport: opts.size` → `cmdShot` (finding 2)
- `tools/generate/src/cli/fidelity.ts:167` — `viewport` → `extractDraftManifest` (finding 4)
- the `subRenderOptions` → `cmdRender`/`startServe` handoff (finding 3)

Delete any one and the whole capability stays green. Findings 2 and 4 are the
same edit on the two size-aware commands; findings 1 and 8 are the same edit on
the values-diff CLI path.

**Every ingredient already exists in the repo. No new infrastructure, and no test
needs to become browser-dependent.** `MarkerScreenshotDriver`
(`…size-aware-diff.test.ts:312`) for a fake `BrowserDriver`; `tests/shot.test.ts:133`
for viewport-forwarding assertions; the byte-level stdout harness
(`…output-hygiene.test.ts:62-67`); the `runCli`/exit-code harness
(`reconciliation-responsive-diff.test.ts:74-90`); and the jsdom + `EXTRACT_SCRIPT`
capture pattern (`reconciliation-capture-list-marker.test.ts:59`) for findings 5
and 6, which are the same underlying gap — capture-side ancestor-walk rules whose
only evidence is browser-gated and skips where Chromium is absent (confirmed
skipping this cycle).

**STORY-78 is the model to copy.** All nine of its UATs drive the command through
`run(argv)` and assert on the stdout/stderr/exit code the user actually sees —
the only story here with zero findings. Where an AC describes *command* behaviour,
the CLI boundary is the correct test boundary; the seam is right only when the AC
itself names the seam, as AC-656 and AC-659 do (both correctly aligned).

**Do not make the diff-engine UATs heavier.** AC-629…AC-636 and AC-711…AC-715
are exemplary: they drive the real exported `diffManifests` — the same code path
the CLI runs — assert the differ / match / absent-one-side legs of every axis,
pin severities, and stay deterministic and sub-second. Nothing about them should
change. The problem is exclusively at the CLI-to-seam boundary and on the
capture side.
