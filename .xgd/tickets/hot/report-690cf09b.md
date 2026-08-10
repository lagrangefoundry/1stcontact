---
uid: report-690cf09b
id: REPORT-1784
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-10T09:45:34.965650+00:00'
updated_at: '2026-08-10T09:45:34.965650+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-b3de4571
---

Only the new test file — no runtime code, no existing tests touched.

```
UATs generated for story story-b3de4571 (plan item 8 of 8)

Story: story-b3de4571
Test file(s) created:
  - tests/reconciliation-beyond-l1-authoring.test.ts

Tests written: 15
Tests passed: 15
Tests failed: 0

test_files_created:
  - "tests/reconciliation-beyond-l1-authoring.test.ts"
```

**Coverage** — one UAT per AC, AC-1095 → AC-1109, no gaps or extras. Verified against the naming regex (`^test_UAT_AC\d+_\w+$`): 15 names, 0 violations. `tsc --noEmit` is clean for the file; co-running with `test_UAT_FC_REQ-130_beyond_l1.test.ts` and `reconciliation-site-asset-listing.test.ts` passes 38/38, so the `process.chdir` in the CLI helper doesn't leak.

**Boundaries used** — the bound Toolbox the assistant is actually handed (`createL1Toolbox`), `1c`'s argv entry point (`run`), the draft on disk, and the rendered bytes from `cmdRender`. The surface declaration and grant files are read directly for AC-1108. Nothing internal is mocked.

**One finding worth recording for the review step.** Five ACs assert on the *text* of a refusal — AC-1098 ("names what the catalog does hold"), AC-1099 ("naming the seams it needs"), AC-1100 ("names the offending field… plus a pointer to read the kind's contract"), AC-1103 ("a message saying what may be passed"), AC-1107 ("a hint showing an acceptable name"). That detail is **not** observable at the assistant's boundary: the Toolbox replaces every refusal with a fixed per-code coaching string from `l1-surface.json` (`errors[].message`), so the model never sees the field name. The detail *is* produced and *is* observable in the CLI's `{ok:false,error}` envelope. I tested both halves — refusal plus no-write at the Toolbox, message detail at the CLI — rather than weakening the assertion. This looks deliberate rather than a defect, but it means "the refusal names the field" is true of the system, not of the assistant's view of it.

**One AC clause I could not prove, stated plainly.** AC-1096's second half wants a top-level scalar write refused "with a hint naming the group-plus-object form". That hint lives in `editConfigSet`'s `scoped && !isMapping(merged)` branch, which no external boundary can currently reach: the Toolbox rejects a non-object `settings` at its param check first, and the CLI's `config set` makes `key` mandatory (`requireArg` rejects `''`), so `scoped` is never true there. The branch is defence in depth. I assert what is reachable — the write is refused, the refusal says an object is required, and `site.json` is byte-identical — and did not assert the unreachable hint text. If the reviewer considers that clause load-bearing, it needs a code change to expose the branch, not a test change.
