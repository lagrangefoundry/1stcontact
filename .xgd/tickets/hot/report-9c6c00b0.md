---
uid: report-9c6c00b0
id: REPORT-11695
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T04:29:00.673102+00:00'
updated_at: '2026-11-09T04:29:00.673102+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-d402710c
  parent_report_uid: report-d2b30b1e
  batch_index: '0'
---

Both failing tests pass now: `test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset` and `test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel`. All seven builder suites pass (52 tests), including the two FC suites run by path as the planner asked. I could not run lint: `npx eslint` isn't installed here and tried to download it, and the sandbox blocked `registry.npmjs.org`. The gate will need to lint.

**Code fix (`apps/control-app/src/builder/panel.js`, the one file the exception allows).** The panel judged whether a frame already showed the right page by `rec.src`, which is the address the pane last sent it to. After the operator followed a link in View, a flip back re-pointed a frame that was already on the right page. That is the BUG-79 symptom by another route.
- On every frame load, a new `follow(rec)` now sets `rec.src` from the frame's real address (`contentWindow.location.href`). It does nothing for `about:blank` or a window it can't read.
- A frame already on the operator's page is now shown with no navigation, and the panel still announces its document.
- Staleness, `reloadDocument`, `setSite`/`refresh` and the visibility classes are unchanged.

**Tests.**
- **AC2496:** switching back to View now asserts no `src` write and no load, that the frame still holds `view.doc`, and that `view.scrolled` ends at 300.
- **AC2517:** a new case follows a link to `contact`, checks Edit is primed at `edit/contact`, then flips Edit and back to View and asserts neither frame navigates, loads, or changes document.
- **AC1029** (same file, not in this batch): the fix made it fail. It expected View to be re-pointed at `about` on the way back; it now asserts View is shown as-is with the same document. What it checks, the address the pane reports, is unchanged, so AC-1029's text didn't need editing.
- **A harness trap I worked around:** the test observer's empty callback swallows recorded `src` writes at the next microtask. So `navsOf` returns `[]` after any `await` whether or not a navigation happened. My new no-navigation checks run before any `await`.
- **Mutation check:** with the `follow(rec)` call commented out, AC2496, AC2517 and AC1029 all fail at the expected assertions. With it restored, all pass.

**Tickets.**
- **AC-2496:** paragraph 3 now says a frame is re-pointed only when the page it actually holds differs from the operator's page. The Verification now requires showing the frame in place with no `src` write and no load, and checks the document and the carried offset.
- **AC-2517:** now covers flipping after following a link. I also fixed its stale reference-UAT path.

I made one more edit outside the batch, in an existing assertion: the Edit-side check in AC2496 above my change also reads `navsOf` after an `await tick()`, so it can't catch a navigation. I left it as it was because it's outside this batch. The `envLoads` and same-document checks next to it still cover that step.

```yaml
## Assessment
status: fixed
files_changed:
  - apps/control-app/src/builder/panel.js   # authorised code_frozen exception
  - tests/test_reconciliation_builder_page_carry.test.ts
  - tests/test_reconciliation_builder_flip_in_place.test.ts
tickets_updated:
  - AC-2496
  - AC-2517
verification:
  - "npx vitest run on 7 builder suites incl. both FC suites by path: 52/52 pass"
  - "mutation: follow(rec) commented out -> AC2496, AC2517, AC1029 fail; restored -> pass"
  - "lint not run: eslint unavailable offline (npm registry blocked by sandbox)"
```