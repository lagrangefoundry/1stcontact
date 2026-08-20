---
uid: report-5b3fe8e5
id: REPORT-2398
type: report
title: 'Fix UAT Coverage: 1c Capture & Diff Fidelity — attempt 7'
created_by: xgd
created_at: '2026-08-20T07:21:04.178229+00:00'
updated_at: '2026-08-20T07:21:04.178229+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-aa030c83
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix UAT Coverage: 1c Capture & Diff Fidelity

**Attempt**: 7
**Fixes applied**: 6
**Violations remaining**: 0
**Needs more work**: false

Every finding with a resolution category was actioned: V1 (uat-edit), W1 (ac-edit),
W2 (uat-add), W3 (ac-edit, paired with the story-body edit it implies). W4 is a
no-action carry-forward by the assessor's own reading and is untouched.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-657 (`acceptance_criterion-9c235ff1`) | Rewrote `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts`) to run the real command. Builds a real reference capture bundle plus a real actual manifest on disk, invokes `run(['values-diff','--ref',…,'--actual',…,'--out',…,'--json'])`, and reads stdout as **bytes**. Asserts the whole stream parses as one document; that the document is the command's own (deep-equal to the report the same run wrote through `--out`, a file the test never touches); `expectedSource`/the seeded `color` delta; exit code 1 |
| 2 | uat-add | AC-657 | Added `test_UAT_AC657_multi_viewport_json_is_exactly_one_parseable_document` — the half of the Criterion nothing covered. Creates a real starter site, writes a real one-rung reference ladder, and runs `values-diff <slug> --multi-viewport --ref … --json` end-to-end (the command does its own render + serve). Asserts one parseable cell matrix, one cell per reference width, and clean stdout |
| 3 | uat-add | AC-1311 (`acceptance_criterion-1e7d867f`) | Added `test_UAT_AC1311_a_pre_surface_bundle_leaves_the_resolution_inert` (`tests/bug22-split-control-surface.test.ts`) for the sixth enumerated case, which had no test. Strips `surface` from a `flattenSignals` manifest and diffs both a pre-`surface` reference against a current reproduction and a wholly legacy pair. Headless, passes |
| 4 | ac-edit | AC-1310 (`acceptance_criterion-c1d7d6d6`) | Dropped "wrapped text, or" from the Criterion parenthetical and re-stated the Verification's first sentence to "one run per **text node**", plus the positive clause that a single wrapping text node stays **one** run whose glyph box spans both lines (already proven at `bug25-multiline-run-geometry.test.ts:282-287`). Tests untouched, as instructed |
| 5 | ac-edit | AC-720 (`acceptance_criterion-72db61ca`) | Trimmed the end-to-end crop-pair clause from both Criterion and Verification, leaving the store-routing mechanism the story owns and its test proves. Added a short scope note citing the capability's CLI ownership rule and REQ-78 |
| 6 | story-body-edit | STORY-79 (`story-e15a19ef`) | Paired with #5: guarantee 3 claimed `aligned-crops --sandbox` "emits its crop pairs from it". Trimmed to the routing claim and recorded that the crop-pair meaning is the owning capability's. Everything else preserved verbatim |

Field updates: `AC-657.uat_coverage` → `pass`; `STORY-79.uat_coverage` → `pass`.

## Verification

- `tests/reconciliation-1c-cli-output-hygiene.test.ts` — 4 passed, 1 skipped (the
  serve-gated multi-viewport test, see below).
- `tests/bug22-split-control-surface.test.ts` — 7 passed.
- Regression sweep over the capability's neighbouring files —
  `reconciliation-1c-astro-free-render`, `reconciliation-1c-aligned-crops-sandbox-routing`,
  `reconciliation-1c-install-preflight`, `req58-multi-viewport`, `bug25-multiline-run-geometry`,
  `reconciliation-size-aware-diff`, `reconciliation-responsive-diff`, `req35-values-diff-noise`:
  **10 files, 70 passed, 8 skipped, 0 failures.**
- `tsc --noEmit --strict` over both changed test files: clean (two type gaps the
  first pass surfaced in the new fixture — `Section.fields`, `Theme.subScales` —
  were fixed).

**The new AC-657 test is load-bearing, proved by mutation.** With `withCleanStdout`
removed from the single-width call site (`tools/generate/src/cli/index.ts:810`), the
test goes **red** (`expected '' to contain 'dependencies optimized'` — the diversion
never happens, so nothing reaches stderr, and the seam-timeline assertions fail too).
The production edit was reverted immediately (`git checkout --`); `git status` shows
only the two test files modified. This is the AC-1290 bar the report named.

**How the composition is proved without simulating it.** The test observes the seam
rather than reproducing it: an accessor on `process.stdout.write` records the moment
the command diverts stdout and the moment it restores it, and the three real Vite /
Astro diagnostics are written *through the alias the command itself installed*, at
that moment. So the assertions are: the command diverted stdout for its compute,
wrote nothing to stdout while diverted, restored it, and only then emitted the
document. `console.log` is re-pointed at `process.stdout` for the run — restoring the
wiring node gives the real binary, which vitest replaces with its own Console. The
old hand-written body, the literal report and the `toEqual` against that same literal
are gone.

## Deviations from the report's suggested edits (both deliberate)

| Finding | Assessor suggested | What was done, and why |
|---|---|---|
| W2 | "assert no `shape` and no surface-attributed `size` row is emitted for `Subscribe`" | The no-`size` half is asserted. The no-`shape` half would **fail against the implementation**: with `surface` absent, `values-diff.ts:2116` resolves `surface` to `null`, so `actRadiusPx` falls back to `act.borderRadiusPx` (0) and the legacy `radius 8px → 0px` row fires — which is exactly what "inert" means (the BUG-22 resolution does nothing; the pre-BUG-22 own-axis comparison is unchanged). The test asserts that instead: diff completes, **no** delta carries a `surface`-attributed label, no surface `size`/`position` row, and the legacy `shape` row still present. Verified by execution |
| V1 (multi-viewport half) | Cover `--multi-viewport --json` at command level | Done, but **gated**. `--multi-viewport` renders the draft and serves it over loopback before projecting it; this runner's sandbox denies `listen` (`EPERM: operation not permitted 0.0.0.0`, raised from `serve.ts:54` — the first attempt hung to a 180s timeout). The test is gated on an environment probe (`canServeLocally()`), the same honest-gating discipline as `chromiumAvailable()`/`itB`, and carries an explicit `**Evidence gating.**` note. AC-657 keeps an **ungated** command-level test (#1) on every runner, so no AC is entirely skipped headless. Confirm the gated one on a runner that may bind a port |

## Code Edits

None retained. The only production-file change was the temporary mutation described
above, reverted in the same turn and confirmed by `git status`.

## needs_review Items Forwarded

None — the report recorded zero `needs_review` findings.

## Notes for the next assessment

- **W4 (AC-1307) is untouched**, per the report's "No action. Confirm on a
  Chromium-provisioned runner."
- **The read-across the report flagged is now available.** The pattern "when an AC's
  Criterion opens with *when a `<verb>` command … is run*, the evidence has to run
  that verb" now has a worked instance in this repo, harness included
  (`runCliRaw` in `tests/reconciliation-1c-cli-output-hygiene.test.ts`), reusable by
  the sibling capabilities that own `repro`, `l1-gate`, `colors` and `deploy`.
- **AC-1311's own `uat_coverage` stays `pass`** — it was already passing; the added
  test closes the enumerated case that had no evidence rather than a coverage failure.
