---
uid: comment-65f2291b
id: COMMENT-8060
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-09T03:20:31.127839+00:00'
updated_at: '2026-11-09T03:20:31.127839+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0cf7c88
  kind: note
---

I wrote six UATs for story story-e674c60a, one for each new BUG-79 criterion (AC-2517 to AC-2522), and all six pass.

```
UATs generated for story story-e674c60a (plan item 1 of 1)

Story: story-e674c60a
Test file(s) created:
  - tests/test_reconciliation_builder_flip_in_place.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/test_reconciliation_builder_flip_in_place.test.ts"
```

| Test | Criterion |
|---|---|
| `test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel` | Switching away and back twice: each frame keeps the same document and address, with no `src` write and no `load` |
| `test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility` | Uses the real `builder.css`: the idle frame stays connected, has no `hidden` attribute, is not `display: none`, and is hidden by `visibility` with no pointer events. Exactly one frame carries `.builder-panel__frame`, and it is `panel.frame` |
| `test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not` | Edit is untouched until View loads, then pointed at the edit address. The first flip doesn't fetch. After a write, the stale Edit frame isn't fetched until it is shown |
| `test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it` | One announcement on reveal, with no load. The scroll offset carries over in both directions. The real framework edit bridge is bound to the revealed Edit document (hovering a segment highlights it). A load in a hidden frame is not announced |
| `test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others` | A write reloads the shown document through its own reload, not a new `src`, and leaves Edit alone. The next flip fetches Edit fresh. After following a link inside the frame, a write reloads the linked page |
| `test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel` | Changing site sends the shown frame to the new site at once, and the flip re-fetches Edit for the new site instead of showing the old one. After a `refresh()` with the slug unchanged, both channels are re-fetched before they are shown |

The tests mount the real builder (`mountBuilder`) with the real page-state module and edit bridge. The only things patched are browser features jsdom lacks: frame documents, scrolling, and its own iframe `load` events. A navigation counts only if a frame's `src` is written or jsdom fires a `load` on it.

Three things are left for the downstream steps:
- **The free-coded test file still exists.** I wasn't allowed to modify or delete existing tests, so `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts` is still there. The FC orphan check needs to delete it, since the new file covers all six of its tests.
- **AC-968 and AC-2496 (modified, not new) got no new tests.** They already have tests in `tests/reconciliation-builder-workspace-chrome.test.ts` and `tests/test_reconciliation_builder_page_carry.test.ts`, which the plan says were updated in the commit. I didn't re-run those suites.
- **Lint and type-check didn't run.** ESLint isn't installed here and the sandbox blocks fetching it from npm. No tsconfig covers `tests/`, so there's nothing for tsc to check either.