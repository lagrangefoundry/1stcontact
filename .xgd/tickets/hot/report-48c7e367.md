---
uid: report-48c7e367
id: REPORT-3670
type: report
title: Fix Platform Build, Deploy & Live-Origin Verification (uat) — attempt 1
created_by: xgd
created_at: '2026-09-10T05:20:26.253708+00:00'
updated_at: '2026-09-10T05:20:26.253708+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-5d07b533
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Platform Build, Deploy & Live-Origin Verification (uat)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

Finding 1 (the report's only violation) was a wording overreach, exactly as the assessor
characterised it: AC-1426 and STORY-119 attributed the import-chain naming to `bin/build`, which
does not do it. Corrected in all three places that carried the sentence, plus the UAT's own name
and comments, which reproduced the same misattribution. Finding 2 was `info` with resolution
category "none" and needed no action.

## Verification of the finding before acting

- `bin/build:102` — the typecheck stage is `pnpm -r build`; `apps/control-app/package.json:7`
  defines that package's `build` as `tsc --noEmit`.
- `grep -rln "import chain\|shortest chain\|typeProgram" bin tools apps packages` → no matches.
  No walker exists in production; nothing composes a chain.

So the build's observable outcome is "names the offending module", and the chain is the UAT's own
`typeProgramOf`/`chainTo` instrument. The criterion now says so. No production code was written —
the assessor's explicit warning ("manufacturing it is production work no intent in this ledger
asks for") was honoured.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1426 (acceptance_criterion-f82419a7) | Title and body restated. The build's outcome is now "fails naming the module it cannot type", stated with the explicit note that it prints no chain and nothing in the repo composes one. The type-program walk from each Worker entry point and its shortest-chain report are restated as the criterion's **own instrument**, with the existing non-vacuity guard (reaches known modules, follows ≥1 type-only edge) attached to it. The rationale paragraph — bundler erases a type-only import, `tsc` does not, so a runtime-import guard is structurally blind — kept verbatim. Verification section rewritten to describe what the UAT actually drives. |
| 2 | story-body-edit | STORY-119 (story-d5167ced) | Three passages corrected together, so the matrix does not pass through a state where the AC and its story disagree: (a) Description § "Build — and one refusal a bundle graph cannot see" — "walking every import the typechecker does and naming the import chain that got there" → the typecheck fails naming the module it cannot type, with the chain reconstructed by the verifying check, not printed by the build; (b) **In scope** bullet "naming the chain" → names the module, chain is the walk's report; (c) **Reconciliation Decision 4** — its placement call (a build criterion of this story, not a Worker-portability one) left standing as sound, with a dated correction recording that "names the import chain" was wrong about what the build emits, citing `tsc --noEmit`, the absent walker, and REQ-149's own framing of the walk as a UAT/repository property rather than a `bin/build` feature. |
| 3 | uat-edit (alignment only) | `tests/reconciliation-platform-build-order-and-private-surface.test.ts` | No assertion changed. The test name `..._fails_the_build_naming_the_chain` and the section comment "and the refusal names the chain" carried the same misattribution being corrected, so: renamed to `test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain` (still `test_UAT_AC1426_*`, still unique), and the comment now states that the chain is the instrument's report while the build's typecheck names only the offending module. |

## Code Edits (if any)

None this call. No production file was touched.

## Test Run

`npm test -- tests/reconciliation-platform-build-order-and-private-surface.test.ts`
→ **1 file passed, 3 tests passed** (4.89s). The `wrangler` EPERM log-file errors in the output are
a sandbox artifact of this worktree, not a test failure.

## needs_review Items Forwarded

None.

## Note for the assessor

The UAT test name changed. The prior name appears in the historical records report-baa6d6ef,
report-8b7b0181 and comment-865a6145; the `AC1426` prefix is unchanged, so index matching on the
AC number is unaffected.
