---
uid: report-a77d195a
id: REPORT-11445
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T13:14:19.030638+00:00'
updated_at: '2026-11-08T13:14:19.030638+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-e214a00d
---

⚠️ TESTS FAILING — downstream fix-it loop required

I wrote 17 UATs for story story-e214a00d, one per acceptance criterion (AC-2426 to AC-2442). 16 pass and 1 fails because the code doesn't match its AC. I didn't change any runtime or existing test code.

Failures:
  - test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is: the code diverges from the AC (a regression, not a test bug). The AC says a panel that declares `reveal` carries no reveal marker and no pre-state rule. The renderer does leave out the panel's pre-state and transition rules (`packages/framework/src/l1/render.ts:2594`, guarded by `!isDialog`). But it still adds the `l1-rv` reveal class to the panel element (`render.ts:2210`, which checks only `!state.edit` and not `isDialog`). So the scroll observer still picks up the panel. The likely fix is to also skip that class when the node is a panel, at `render.ts:2210`. The rest of this test passes, including the reveal on a node inside the panel.

Checks I couldn't complete:
- **Lint:** eslint isn't installed in this worktree, and `npx` couldn't download it because the sandbox blocks registry.npmjs.org.
- **Type-check:** `tsc --noEmit -p .` reported no errors for this file. I didn't confirm the tsconfig actually includes `tests/`, so that may not mean much.

UATs generated for story story-e214a00d (plan item 2 of 8)

Story: story-e214a00d
Test file(s) created:
  - tests/test_reconciliation_l1_modals.test.ts

Tests written: 17
Tests passed: 16
Tests failed: 1

test_files_created:
  - "tests/test_reconciliation_l1_modals.test.ts"