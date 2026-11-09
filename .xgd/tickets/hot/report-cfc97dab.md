---
uid: report-cfc97dab
id: REPORT-11681
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T03:44:35.159153+00:00'
updated_at: '2026-11-09T03:44:35.159153+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e674c60a
  parent_report_uid: report-6d5e88e9
  batch_index: '0'
---

I rewrote the page-carry suite onto the per-frame harness the planner asked for. All 12 tests in scope now pass: AC2496–AC2499, AC1029 and AC1036 in the page-carry suite, plus AC2517–AC2522 in the flip-in-place suite, which I didn't touch. I changed no production code and added no skip or xfail markers.

**The old harness was the problem.** It patched `contentWindow` and `contentDocument` on only the frame shown at mount, and handed every document to that frame. Since BUG-79 the View and Edit channels each have their own frame. So the carry's scroll offset and open panel were applied to an Edit document the test never looked at. AC2498 only passed because it was reading that unpatched frame.

**What changed in `tests/test_reconciliation_builder_page_carry.test.ts`:**
- **Every frame is modelled.** Both frames show their own delivered document. jsdom's own `load` events are counted and stopped, and a watcher records every time the pane sets a frame's `src`.
- **Documents go to the frame that asked for them.** A new `deliverRequested` helper first checks the frame is pointed at exactly that channel address. A link the reader follows inside the frame is delivered with no `src` change.
- **Priming is modelled.** After View loads, the hidden Edit frame is pointed at the same page in the edit channel and its document is delivered there.
- **A switch to a frame already at the right page is a reveal.** The tests assert the frame holds the same document object, nothing re-pointed it and no load fired. The carried offset (640), the open `signin-panel` and the panel selector are then checked on that revealed document.
- **A switch to a frame holding a different page re-points that one frame.** The tests assert the navigation, then deliver the page.
- **The post-save reload is a real write.** `postSaveReload` calls `app.panel.reloadDocument()`, checks the shown document reloaded itself exactly once with no `src` change, then delivers the newer page to that same frame. Going back to View after a write re-points the View frame, because the write left it out of date.

Every assertion the ACs require is still there: offsets 640 then 300; the panel open in Edit, after the reload, and back in View with `aria-expanded="true"`; the selector's labels and order; picks that apply with no reload; and no control on a page with no panels.

**AC-2496 needed a correction.** It said every switch navigates neither channel. In its own verification scenario the reader reaches `about` through a link in View, so the View frame is no longer at the address the pane gave it. Switching back to View therefore re-points that one frame, and the carried offset is applied when the page arrives. I updated the AC body and its verification steps through `xgd ticket update` to say this. AC-2497 and AC-2499 already match the code, so I left them alone.

The repo has no eslint and no root tsconfig, so the only compile check is vitest's own transform, and it passed.

```yaml
## Assessment
status: fixed
blocked_by: null
```