---
uid: report-dd5fd786
id: REPORT-2361
type: report
title: Fix 1c Capture & Diff Fidelity (story) — attempt 10
created_by: xgd
created_at: '2026-08-20T04:15:53.208014+00:00'
updated_at: '2026-08-20T04:15:53.208014+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: story
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (story)

**Attempt**: 10
**Fixes applied this call**: 7
**Violations remaining**: 0
**Needs more work**: false

Both findings are addressed: violation 1 (`--assign` unregistered) and warning 2
(the pinned literal cannot detect the drift class that produced it). Warning 2
was the durable half — it is fixed rather than deferred, because it is the reason
the violation recurred instead of closing at attempt 9.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue | `tools/generate/src/cli/args.ts:40` | Added `'assign'` to `BOOLEAN_FLAGS` (now 14 members) |
| 2 | code-issue | `tools/generate/src/cli/args.ts:11-30` | Registry doc comment now states the enumeration rule: every truthiness form counts, and evidence derives the set from source rather than restating it |
| 3 | uat-edit | `tests/req58-multi-viewport.test.ts` — `test_UAT_FC_REQ-58_boolean_flag_set_is_pinned_entire` | Added `'assign'` to the pinned literal; the parameterised `..._never_swallows_the_slug` UAT now covers `--assign` automatically |
| 4 | uat-add | `tests/req58-multi-viewport.test.ts` — `test_UAT_FC_REQ-58_boolean_flag_set_is_derived_from_the_cli_source` | New UAT + `booleanFlagReadsInCliSource()` helper: parses `cli/index.ts`, classifies every `flags.x` / `flags['x']` read, and asserts the derived boolean set **equals** `BOOLEAN_FLAGS`. Closes warning 2 |
| 5 | story-body-edit | STORY-79 (`story-e15a19ef`) §1 | Names `colors --assign <slug>` alongside the other verb instances; replaces "pinned as a set" with the derived-from-source discipline, and states why a self-pinned literal stays green in exactly the failure mode that occurs |
| 6 | story-body-edit | STORY-79 Technical Context | Dropped the point-in-time "it is now complete" claim. Records both drift episodes (six flags, then `--assign` via bare `if (flags.assign)`) and states that completeness is a standing test result, not a body claim |
| 7 | ac-add | AC-1290 (`acceptance_criterion-cf26bae1`) | New AC carrying the derived-set discipline the revised story now asserts, with the truthiness-form list and the exclusion rule for `typeof`-guarded / parser-fed reads. `uat_coverage: pass` — satisfied by the UAT in row 4, so no coverage gap is opened |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/args.ts` | 11-30, 40 | `cli/index.ts:987` reads `if (flags.assign)`; `--help` at `:313` documents `--assign` as a bare toggle. Absent from `BOOLEAN_FLAGS`, `parseArgs` (`args.ts:49-56` pre-edit numbering) takes the value branch, so `1c colors --assign <slug> --names …` leaves `rest = []` and `requireSlug` (`:1337-1341`) throws `Missing required <slug>` — the REQ-58 signature the capability's scope §5 forbids CLI-wide. Assessor categorised this `code-issue`; the capability's CLI ownership rule keeps flag *mechanism* here even though the `colors` verb's meaning is CAP-89's |
| `tests/req58-multi-viewport.test.ts` | helper ~94-128; literal 132-148; new UAT 150-160 | See verification below |

### Verification performed

- `vitest run tests/req58-multi-viewport.test.ts` → **20 passed, 2 skipped**, 0 failed.
- **The new UAT was proved load-bearing, not merely green.** With `'assign'`
  temporarily removed from the registry while `if (flags.assign)` stayed in the
  CLI, the derived UAT fails with `Received + "assign"`. That is precisely the
  case the literal-pinned UAT stays green on, so warning 2's "likely to recur a
  third time" is now blocked by a test rather than by a sweep.
- The derivation was tuned against a real false positive rather than assumed
  correct: an early rule matched `if (flags.channel !== undefined && …)` and
  wrongly classified `channel` as boolean. The `if` rule now requires the read to
  be the *entire* condition (`if (flags.x)`), and `channel` correctly falls out
  as value-taking. Derived set == registry == 14 names.
- Regression check on the verb that carries the flag:
  `vitest run tests/reconciliation-colour-census-and-retrofit.test.ts
  tests/reconciliation-colour-retrofit-shade-model.test.ts` → **21 passed**.
  Existing `--assign` invocations were already followed by another `--` flag, so
  they parsed to `true` before and still do.
- `tsc --noEmit -p tools/generate/tsconfig.json` reports one error, in
  `cli/builder.ts:337`. Confirmed **pre-existing** by stashing `args.ts` and
  re-running: identical error. Untouched by this call; noted for the operator,
  not introduced here.

## Notes for the Assessor

- Finding 1's suggested edit is applied in full, including its second clause
  (soften STORY-79's "is now complete"). The story now asserts the invariant and
  the discipline that maintains it; the count lives in the test.
- **The registry is complete against the CLI as it stands**, and — unlike attempt
  9 — that is a machine-checked statement rather than the result of a grep.
  `cli/index.ts` and `cli/args.ts` are the only files under `tools/generate/src`
  that read flags at all; the helper scans `cli/index.ts` via a `CLI_SOURCES`
  list, so a future flag-reading CLI file is a one-line addition there.
- Findings 3-6 are info and required no action: attempt 9's repairs re-verified,
  REQ-150 still `free_coding`, BUNDLE-19 still `reconciling` with no CAP-63-scope
  member, capability body reads current.
- Finding 5's referral stands and is out of scope here: **BUG-5
  (`bug-5b7153d2`) should be filed against CAP-71**, not this capability.

## needs_review Items Forwarded

None. No finding this attempt was categorised `needs_review`.
