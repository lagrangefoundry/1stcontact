---
uid: comment-7c0252be
id: COMMENT-8049
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T23:52:44.074748+00:00'
updated_at: '2026-11-08T23:52:44.074748+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a77d195a
  kind: note
---

I wrote 6 UATs for story-e214a00d in a new file, and all 6 pass. There's a catch: an older test for AC-2436 in `tests/test_reconciliation_l1_modals.test.ts` still checks the old rule and now fails. I didn't modify that file, as this step's rules require.

**The stale test.** `test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute` asserts the edit render has *no* dialog shell (`ed.querySelector('[data-l1-dialog]')` is null, and the edit CSS has no `l1-dlg`). REQ-215 amended AC-2436 to require the shell, role and overlay stylesheet in every channel. So the old test is wrong and the code is right. When run, it fails with a confusing `SecurityError: localStorage is not available for opaque origins` instead of a clear assertion message. The other 16 tests in that file pass. The fix-it loop needs to delete that test, or replace it with the new AC-2436 test. Until then two tests carry the AC-2436 name.

**Lint.** I couldn't run it: `npx eslint` tried to download eslint from the npm registry, and the sandbox blocked that host.

**Simulated scroll.** jsdom has no layout, so the tests set `window.scrollY` directly and record calls to `scrollTo`. That is how they check that scroll is applied before the scroll lock goes on.

```
UATs generated for story story-e214a00d (plan item 5 of 8)

Story: story-e214a00d
Test file(s) created:
  - tests/test_reconciliation_l1_modal_page_state.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/test_reconciliation_l1_modal_page_state.test.ts"
```

| Test | What it checks |
|---|---|
| `test_UAT_AC2436_…` (amended) | Edit and draft renders both have the shell, its id, `role`/`aria-modal`/`aria-label` and the same overlay rules. Only the edit render lacks the script and all five acting attributes. With no marker set, the panel lays out in flow and visible. |
| `test_UAT_AC2491_…` | `L1_INITIAL_PAGE_STATE` is no panel at offset 0. An untouched page reads as no panel open in both channels. After a reader opens a panel and scrolls, the read gives that panel's id and the rounded offset. Open panels are listed in document order, and a shell with no id is left out. |
| `test_UAT_AC2492_…` | On an edit document: scroll is applied first, and only when the page isn't already there. The ready, open and lock markers are set on exactly the named panels, and the named panel is laid out as a fixed overlay. Unknown names are ignored, no script or acting attribute is added, and a click does nothing. The empty state closes every panel but keeps the ready marker. |
| `test_UAT_AC2493_…` | On a draft document the page's own controls do the work: the opener opens, Close closes, and the scrim closes a panel with no Close. After each step, focus, the scroll lock and `aria-expanded` are correct. A panel already in the wanted state is left alone. A panel with `dismissOnBackdrop: false` stays open, and one with no opener isn't forced open. An id like `a"b]`, which would break a selector, still works. |
| `test_UAT_AC2494_…` | A state read in View reproduces in Edit, and a state read in Edit reproduces in View. The panel reopened in View has `aria-expanded="true"`. |
| `test_UAT_AC2495_…` | A rendered `account-chrome` sign-in panel, in both channels: it's never listed or read as an L1 panel. Its markup and presentation stay the same after applying a state naming the L1 panel, and after applying one naming the module's own element id. |

No runtime code, existing tests or tickets were changed.