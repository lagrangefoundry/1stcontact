---
uid: report-eb125804
id: REPORT-3627
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 8
created_by: xgd
created_at: '2026-09-10T01:27:15.170543+00:00'
updated_at: '2026-09-10T01:27:15.170543+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 8
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

Both remaining actionable findings — the one violation (finding 1, AC-720) and the
one coverage warning (finding 3, AC-1612) — were closed the way the assessor's
Notes for the Editor said they could be: by *authoring* the browser-gated leg. The
Notes were right that neither was blocked. Findings 4 and 5 are `ac-edit` and the
report explicitly queues them for the next ac-level pass ("not for you"); finding 2
is an execution escalation with no matrix or test edit, and this call produced the
first hard diagnosis of *why* it cannot be discharged here (see below).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | Added Part B to `tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts` — `test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs`, an `it.runIf(browserOk)` leg driving the real `cmdRepro --sandbox` → real `cmdAlignedCrops --sandbox` chain and asserting a non-empty `areas` set plus both PNG halves of every pair on disk |
| 2 | uat-edit | AC-720 (same file) | Rewrote the file docstring: the "the commit's end-to-end check … is **manual**" concession the last six reports quoted is gone, replaced by the Part A / Part B split and the reason Part B must be browser-gated |
| 3 | uat-add | AC-1612 `acceptance_criterion-142808b6` (STORY-76) | New `tests/reconciliation-gradient-modern-colour-stops.test.ts` — three `it.runIf(browserOk)` legs covering the AC's three Verification clauses |
| 4 | uat-add | AC-1612 (fixtures) | New `tests/fixtures/capture/gradient-modern-stops.html` and `…-drift.html` — three surface panels and three text-fill wordmarks in `oklch()` / `color-mix()` / `#hex`, plus a drift twin differing only in one oklch stop colour |
| 5 | (field correction) | AC-1612 | `uat_coverage: missing` → `fail`. `missing` became literally false the moment the file above landed; `fail` is the same honest state AC-720 and AC-815 carry — a test exists and has never been observed green. Not a promotion, and `check_uat_coverage` still owns the field |

### What AC-720's new leg actually drives

`cmdAlignedCrops` has no injectable browser seam — it calls `playwright.chromium.launch()`
at `tools/generate/src/cli/aligned-crops.ts:199-200`, unlike `cmdDiff`/`cmdValuesDiff`
— so the finding was right that a browser-free end-to-end leg would need a
production change. The leg is therefore gated, and everything *around* the browser
is real and local: a reference bundle written into a temp dir (`writeL1` + a
`multistate.json` 1280px `rest` projection + a real `sharp`-generated
`screenshot-1280.png` large enough that `cropTo` cannot silently skip), a real
`cmdRepro(slug, { cwd, ref, sandbox: true })`, then the real command. It asserts
what the seam test structurally cannot see:

- the reproduction landed under `storage/sandbox/` and **nothing** exists under
  `storage/sites/` — so a render routed to `sites/` has no site to find;
- `areas.length > 0` — the AC's own closing observable, and the exact quantity the
  pre-fix bug drove to zero;
- `<name>-ref.png` **and** `<name>-ours.png` exist for every area, so both the
  reference screenshot and *our sandbox render* were actually cropped, not just
  bookkeeping rows returned.

No third-party host is contacted.

### What AC-1612's new file actually drives

The AC's premise is that `normalizeGradient` (`values-diff.ts:661`) reads only
`#rrggbb` / `rgb()`, so an unresolved stop list comes back **empty** and the
gradient captures as direction-only — both sides then record no stops and diff
clean. The fix is `hexifyGradient` (`capture/extract.ts:334`), which resolves each
stop token in-page through the canvas colour probe in `rgbaOf` before the list
crosses back. Legs:

1. `test_UAT_AC1612_oklch_stops_capture_non_empty_ordered_and_hex_on_both_kinds` —
   asserted once per gradient **kind** (they travel different code paths:
   `surfaceGradientOf` vs the `background-clip:text` branch at `extract.ts:1132`):
   stop list length 2 (not empty — the defect), every stop matching `/^#[0-9a-f]{6}$/`,
   painted **order** proven by channel dominance rather than exact bytes, and the
   offsets/direction surviving resolution untouched (`[0, 100]`, 135deg / 90deg).
2. `test_UAT_AC1612_modern_and_legacy_syntax_capture_stop_for_stop_identically` —
   the AC's syntax-independence clause, asserted **exactly**:
   `color-mix(in srgb, X 100%, Y 0%)` is X byte-for-byte (pure sRGB arithmetic, no
   gamut mapping) while being just as unreadable to the tool-side regex as `oklch()`,
   so its capture must equal the `#hex` twin's stop-for-stop. The hex twin is itself
   pinned to `[#3b82f6@0, #f97316@100]` so the pair cannot agree by both being empty
   — the precise failure mode the AC describes. The `oklch()` panel paints through a
   *lossy* space, so it is held to the same list within 2/255 per channel: enough for
   OKLCH→sRGB 8-bit rounding, far too tight for an empty or wrong-stop list.
3. `test_UAT_AC1612_a_differing_modern_syntax_stop_is_reported_on_each_kind` — two
   **real captures** through `diffManifests`: the drift page's oklch gradients turn
   green where the reference turns orange, identical in direction, offsets, stop
   count and text. Asserts a `surfaceGradient` delta and a `gradient` delta, plus a
   no-false-delta control on the four unchanged hex/color-mix runs.

The file header states which siblings it does not duplicate: `req62-gradient-panel`
and `reconcile-gradient-first-class` (AC-634/635/636/638) author every fixture in
`#hex` — entirely inside the syntax the parser could always read;
`reconciliation-surface-gradient-selection` (AC-1611) covers ancestor selection under
jsdom, also in `#hex`; `req52-oklch-colour` covers modern colour resolution for the
scalar `color` axis only, never for a stop list.

## Verification run

`npm test -- tests/reconciliation-gradient-modern-colour-stops.test.ts tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts tests/req62-gradient-panel.test.ts tests/reconcile-gradient-first-class.test.ts tests/reconciliation-surface-gradient-selection.test.ts tests/bug27-nested-backdrop-capture.test.ts`

→ **5 files passed, 1 skipped; 22 tests passed, 14 skipped, 0 failed.** Every new
file compiles, every import resolves, and the four new browser-gated legs report
SKIPPED rather than green-over-nothing. No previously-passing test changed state.

## Code Edits

None this call.

## Finding 2 — the Chromium escalation, now diagnosed rather than restated

The last three reports have asked "can this loop run on a host with Chromium?"
without a cause. This call probed it directly (`playwright.chromium.launch()` out of
`tools/generate`, `DEBUG=pw:browser`) and there are **two independent blockers**,
neither of which is "no browser is installed":

1. **The macOS sandbox denies Chromium's Mach bootstrap.** The binary launches and
   dies immediately:
   `FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS. bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.<pid>: Permission denied (1100)`
   → `<process did exit: exitCode=null, signal=SIGTRAP>`. This is the seatbelt
   profile refusing the Mach port registration Chromium needs before it can start a
   renderer. No flag combination, browser build or `PLAYWRIGHT_BROWSERS_PATH` fixes
   it from inside the sandbox.
2. **A version pin mismatch, secondary to (1).** `~/Library/Caches/ms-playwright/`
   holds `chromium-1234` / `chromium_headless_shell-1234`, but the repo's
   `playwright@1.61.1` pins build **1228**, so the default resolution fails before it
   even reaches (1) with "Executable doesn't exist … chromium_headless_shell-1228".
   `npx playwright install` would fix this pin — but `npx` is denied in this session
   and the sandbox's network allowlist is empty, so the download cannot happen here
   either.

Consequence for the assessor: `chromiumAvailable()` is `false` in this environment
for a **hard, named** reason, not an incidental one. The eleven pre-existing
browser-gated tests plus the four added this call are correctly authored and
correctly skipping. Finding 2's ask — "run this capability's suite once on a host
with Chromium" — remains the only way AC-815's four assertions, AC-720's new leg and
AC-1612's three legs get observed, and it cannot be discharged by this loop under
this sandbox. That is an operator/runner action, not a matrix or test defect.

Also please **do not re-file the EPERM `listen(2)` failures** (the previous report's
finding 7); the same restriction is still in force here, and the same
`.wrangler/logs` EPERM appears on every run for the same reason.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| Capability body, cluster-2 note | "STORY-124's Technical Context says 'Filed under CAP-102 (1c Capture & Diff Fidelity)' … will keep surfacing until a step permitted to edit story content corrects it to CAP-63" | **Already repaired — no action.** Read live this pass: `story-080c6036` line 70 now reads "Filed under CAP-63 (1c Capture & Diff Fidelity)". It is the *capability* body's recorded-defect note that is now stale. Editing a capability body is outside this step's remit, so it is forwarded rather than done |
| AC-1610, AC-1605 (findings 4, 5) | Verification sentences overreach their own Criterion | None from me — the report queues both for the next **ac-level** pass and instructs this step not to "fix" the tests to match the overreaching text. Left untouched deliberately |
| Chromium runner (finding 2) | "can this loop run on a host with Chromium?" | Yes/no from the operator, now with a named cause: the sandbox denies Chromium's Mach bootstrap port (1100), and the pinned playwright build (1228) is absent from a cache that holds 1234 with no network to fetch it |
