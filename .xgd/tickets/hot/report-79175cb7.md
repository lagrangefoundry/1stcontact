---
uid: report-79175cb7
id: REPORT-11703
type: report
title: 'Report: mode_override for report-d402710c'
created_by: xgd
created_at: '2026-11-09T04:54:51.180089+00:00'
updated_at: '2026-11-09T05:00:24.376533+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: report-d402710c
  anchor_ticket: bug-00de1faf
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-d2b30b1e
  quality_mode: reconcile
  justification: 'Rung 1, intents. BUG-79: a frame navigates only when what it shows
    is genuinely out of date, never for a mode switch, and the first flip is in place
    as well as every one after it. show()/prime() compare against rec.src, the address
    the pane last set, so after the operator follows a link in View a flip back re-navigates
    a frame that already holds the right page: the BUG-79 symptom. AC-2496 paragraph
    3 and its UAT absorbed this, and only the code can satisfy the intent; the tip
    is not ahead (045c153c96 is the latest panel.js commit).'
  files:
  - apps/control-app/src/builder/panel.js
  rung: 1
  tip_evidence: null
  external_cause: null
  planner_trust_boundary: false
  granted_head: 7b603cb87acfa321d53db7a2ca2179efdde1e059
  files_touched:
  - tests/test_reconciliation_builder_flip_in_place.test.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

Rung 1, intents. BUG-79: a frame navigates only when what it shows is genuinely out of date, never for a mode switch, and the first flip is in place as well as every one after it. show()/prime() compare against rec.src, the address the pane last set, so after the operator follows a link in View a flip back re-navigates a frame that already holds the right page: the BUG-79 symptom. AC-2496 paragraph 3 and its UAT absorbed this, and only the code can satisfy the intent; the tip is not ahead (045c153c96 is the latest panel.js commit).

Planner instructions for the batch:

Gap G1 from the reconciliation review: a View/Edit flip re-navigates a frame that already holds the operator page whenever the operator followed a link inside it, because panel.js show() and prime() compare the target with rec.src, the address the pane last set, and rec.src never follows the frame. Fix it in panel.js: on every frame load, record the frame live address in rec.src from rec.el.contentWindow.location.href (try/catch, ignore about:blank). A frame already at the target is then revealed with no navigation and announced through emit(document). Change nothing else (staleness, reloadDocument, setSite/refresh, visibility classes). Rewrite AC-2496 paragraph 3 so a frame is re-pointed only when the page it actually holds differs from the operator page, and update its Verification to match. In test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset the switch back to View must assert navsOf(viewFrame()) is [], no load fired, viewFrame().contentDocument is view.doc, and view.scrolled ends at 300. Add a follow-a-link-then-round-trip case to test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel. Also run tests/test_UAT_FC_REQ-215_panel_control.test.ts and tests/test_UAT_FC_BUG-79_flip_in_place.test.ts by path; their hyphenated names are missed by -k.

## Diff

```diff
diff --git a/tests/test_reconciliation_builder_flip_in_place.test.ts b/tests/test_reconciliation_builder_flip_in_place.test.ts
index 5391bbdd60..4439c9ef04 100644
--- a/tests/test_reconciliation_builder_flip_in_place.test.ts
+++ b/tests/test_reconciliation_builder_flip_in_place.test.ts
@@ -536,10 +536,14 @@ describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the View/Edit flip is in p
     // View's new-site document arrives. Before any flip, the idle Edit frame —
     // still holding acme's edit page, a different address — is primed at
     // other's edit page behind it.
+    // Asserted on the attribute: the prime runs inside the load `arrive`
+    // dispatches, and the observer hands its records to its callback at the
+    // microtask `await` yields, so `navsOf` would read empty here either way.
+    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit'))
     await arrive(viewFrame(), 'draft', 'other', '', 'View of other')
     expect(shown()).toBe(viewFrame())
-    expect(navsOf(editFrame())).toEqual([previewUrl('other', 'edit')])
-    expect(navsOf(viewFrame())).toEqual([])
+    expect(editFrame().getAttribute('src')).toBe(previewUrl('other', 'edit'))
+    expect(viewFrame().getAttribute('src')).toBe(previewUrl('other', 'draft'))
 
     // The primed document arrives while hidden; the flip then reveals it in
     // place, holding other's edit document and never acme's.

```