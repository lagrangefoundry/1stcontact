---
uid: report-0ee58b8e
id: REPORT-11476
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T14:31:08.819319+00:00'
updated_at: '2026-11-08T14:31:08.819319+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-99
---

I wrote 3 UATs for STORY-99 (plan item 6 of 8). Two pass. The AC-2232 test fails because the code doesn't match the AC, so it needs the fix-it loop.

This bundle (BUG-70, BUG-71) touched three of the story's 49 ACs: it changed AC-2232 and added AC-2463 and AC-2464. Those are the ones covered.

| AC | Test | Result |
|---|---|---|
| AC-2232 | `test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry` | **Fails** |
| AC-2463 | `test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box` | Passes |
| AC-2464 | `test_UAT_AC2464_asset_build_emits_the_closed_framework_graph_verifies_it_and_refuses_a_tree_that_cannot_load` | Passes |

```
⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry:
    Three controls in the Contacts Invite dialog (.builder-people__subject,
    .builder-people__tolist, .builder-people__body) get their size from a literal
    `font-size: 13px` (apps/control-app/src/builder/builder.css, around line 2053)
    instead of var(--builder-control-font-size). The AC covers "the inputs and
    buttons of the Contacts dialogs" and says "None restates the size as a
    literal". It renders at the same 13px, but it breaks the one-place-to-define
    rule. Fix in the code: replace the literal with the token. Do not weaken
    the AC.

test_files_created:
  - "tests/reconciliation-builder-workspace-typography.test.ts"
  - "tests/reconciliation-builder-workspace-import-graph.test.ts"
```

Everything else in the AC-2232 test passes. That includes the mounted check of every builder control (each dialog was checked while open) and the token check for the toolbar buttons and link. It also covers matching every `builder-*` class to a rule, the Contacts filter row's shared padding, primary buttons in all three Contacts dialogs, and the source scan for controls that aren't mounted.

**For later steps:**
- **Lint:** ESLint wasn't run. It isn't installed in this worktree, and the sandbox blocked downloading it from npm.
- **Existing test is out of date:** the AC-2232 test already in `tests/reconciliation-builder-session-and-control-sizing.test.ts` follows the old Contacts flow, where Invite was a dialog button. The tab now has an Add dialog, and Invite opens on ticked rows with a "Send N" button. I didn't run that test or change it.
- **Leftover FC tests:** `tests/test_UAT_FC_BUG-70_*` and `tests/test_UAT_FC_BUG-71_*` still exist and pass. Review needs to rename or delete them so the FC orphan check passes.