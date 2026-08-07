---
uid: comment-ac08dfb2
id: COMMENT-750
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-07T03:21:51.879001+00:00'
updated_at: '2026-08-07T03:21:51.879001+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8625c0d7
  kind: note
---

All 5 UATs pass. Here's what I did and why the boundaries differ per AC.

**Coverage check first.** The story has 12 ACs; seven already have UATs in existing reconciliation files (AC-656/657/658/659 in `reconciliation-1c-cli-output-hygiene.test.ts`, AC-720 in `reconciliation-1c-aligned-crops-sandbox-routing.test.ts`, AC-738/739 in `reconciliation-1c-astro-free-render.test.ts`). The five uncovered ACs are the BUNDLE-16 install-preflight set (AC-1013…AC-1017), so this file covers exactly those.

**One thing worth knowing about the test boundaries.** I first drove all five through the real CLI entry point `run()` from an isolated temp cwd. Three failed — not because the gate is wrong, but because vitest sets `NODE_PATH` to pnpm's hoisted store, so `playwright` and `sharp` resolve from *any* directory. The resolution fault therefore cannot be staged through the real resolver without mutating the process's module paths. I split accordingly:

- **Resolution faults** (AC-1013 naming, AC-1015 both-faults, AC-1017 per-command scoping) go through `assertInstall`/`checkInstall` with an injected resolver — the exact calls dispatch makes, against synthetic trees.
- **Lockfile faults** are decided from files alone, so AC-1016's full contract (`ENVIRONMENT`, exit 6, `{ok:false,error:{code,message,hint}}` under `--json`, same message in both modes) runs end-to-end through `run()` for real.
- AC-1013's "ahead of the command's own work" clause also runs through `run()`: `1c shot demo` leaves the workspace byte-for-byte unchanged and stdout empty, which would fail if the gate moved behind the command switch.

AC-1014 pins the byte-inequality oracle explicitly — a snapshot touched to a newer mtime with identical bytes is not drift.

```
UATs generated for story story-e15a19ef (plan item 6 of 6)

Story: story-e15a19ef
Test file(s) created:
  - tests/reconciliation-1c-install-preflight.test.ts

Tests written: 5
Tests passed: 5
Tests failed: 0

test_files_created:
  - "tests/reconciliation-1c-install-preflight.test.ts"
```

Regression scope run alongside (42 tests, all passing): `req44-install-preflight`, the three sibling `reconciliation-1c-*` files, `req11-structured-edit`, `reconciliation-responsive-diff`, `naming`.

One handoff note for the review stage: `tests/req44-install-preflight.test.ts` still carries `test_UAT_FC_REQ-44_*` tests, which the FC orphan gate will need to rename or delete. Its assertions are now duplicated under AC names in the new file, so deletion is the likely resolution — I left it untouched since this prompt forbids modifying existing test files.
