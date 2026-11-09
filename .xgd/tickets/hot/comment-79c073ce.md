---
uid: comment-79c073ce
id: COMMENT-8067
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T04:55:46.485087+00:00'
updated_at: '2026-11-09T04:55:46.485087+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9c6c00b0
  kind: note
---

Both tests in this batch already passed on the current tip, and all seven builder suites now pass (53 tests), including the two FC suites run by path.

**The earlier fix is already committed.** The `follow(rec)` change in `panel.js`, the test changes for AC2496 and AC2517, and the AC-2496 and AC-2517 ticket updates are all in the history. I made no further change to `panel.js` this pass.

**What was still failing:** a new test, `test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame`. The review commit `400f4325ca` added it, and it's inside this batch's test scope. It had the same harness trap I hit last pass. Edit is primed inside the load that `arrive` fires. By the time `await arrive(...)` resumes, the test observer's empty callback has already taken the recorded `src` writes. So `navsOf(editFrame())` came back `[]` even though the panel did point Edit at `other/edit`.

**The fix, test file only:** in `tests/test_reconciliation_builder_flip_in_place.test.ts`, the test now checks Edit's `src` attribute directly. It must read acme's edit address before View's new document arrives, and `other/edit` afterwards; View must still read `other/draft`. That is how the shared `mountBothLoaded` helper already checks priming. If priming were removed, Edit would stay on acme's address and the test would fail, so the check still proves the behaviour. This test's AC needs no change: it describes what the code does.

Lint still isn't run here, because eslint isn't installed and the sandbox blocks the npm registry.

```yaml
## Assessment
status: fixed
batch_failures:
  test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset: pass (fix already committed)
  test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel: pass (fix already committed)
additional_in_scope_fix:
  test: test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame
  file: tests/test_reconciliation_builder_flip_in_place.test.ts
  cause: "navsOf read after await arrive(); MutationObserver callback consumes records at the microtask, so a real prime read as []"
  change: "assert the frames' src attributes before/after the arrival instead of navsOf"
production_code_changed: false
verification:
  - "npx vitest run on 7 builder suites incl. both FC suites by path: 53/53 pass"
  - "lint not run: eslint unavailable offline (npm registry blocked by sandbox)"
```