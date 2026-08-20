---
uid: comment-e2cd0012
id: COMMENT-1254
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T04:16:10.991474+00:00'
updated_at: '2026-08-20T04:16:10.991474+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dd5fd786
  kind: note
---

Attempt 10 complete — 7 mutations, both findings closed.

**Violation 1 — `--assign` unregistered.** Reproduced the fault against the source before fixing: `cli/index.ts:987` reads `if (flags.assign)`, the name was absent from `BOOLEAN_FLAGS`, so `parseArgs` took the value branch and `1c colors --assign <slug> …` died at `requireSlug` with REQ-58's exact `Missing required <slug>`. Registered `'assign'` in `tools/generate/src/cli/args.ts` and added it to the pinned literal; the parameterised slug-preservation UAT picks it up automatically.

**Warning 2 — the evidence couldn't detect its own drift class.** This was the reason the finding recurred rather than closed, so I fixed it in the same call. New UAT `test_UAT_FC_REQ-58_boolean_flag_set_is_derived_from_the_cli_source` parses `cli/index.ts`, classifies every `flags.x` / `flags['x']` read across all truthiness forms (`=== true`, bare `if`, negation, `Boolean()`, short-circuit, ternary), and asserts the derived set equals the registry.

I proved that UAT is load-bearing rather than just green: with `'assign'` temporarily pulled from the registry while the CLI read stayed, it fails with `Received + "assign"` — the exact case the old literal-pinned test passes. Tuning it also surfaced a real false positive: an early rule classified `channel` as boolean from `if (flags.channel !== undefined && …)`; the `if` rule now requires the read to be the whole condition.

**Matrix edits.** STORY-79 §1 now names `colors --assign <slug>` and asserts the derived-set discipline; the Technical Context bullet drops the point-in-time "is now complete" claim in favour of both drift episodes and a standing test result. Added AC-1290 to carry that discipline, backed by the new UAT so no coverage gap opens.

**Verification:** `req58-multi-viewport.test.ts` 20 passed / 2 skipped; the two colour-retrofit suites that invoke `--assign` 21 passed. `tsc` reports one error in `cli/builder.ts:337` — confirmed pre-existing by stashing my change and re-running, so it's not from this work but is worth the operator's attention.

Report: REPORT-2361 (`report-dd5fd786`), `needs_more_work: false`. One referral unchanged from the assessor's finding 5: BUG-5 belongs to CAP-71, not this capability.
