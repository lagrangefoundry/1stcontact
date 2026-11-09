---
uid: report-569fb9d5
id: REPORT-11694
type: report
title: 'Report: mode_override for report-d402710c'
created_by: xgd
created_at: '2026-11-09T04:24:23.120625+00:00'
updated_at: '2026-11-09T04:35:32.605759+00:00'
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
  granted_head: 7d5853ada0c745da74942d7efdb4e15d443feedc
  files_touched:
  - apps/control-app/src/builder/panel.js
  - tests/test_reconciliation_builder_flip_in_place.test.ts
  - tests/test_reconciliation_builder_page_carry.test.ts
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
diff --git a/apps/control-app/src/builder/panel.js b/apps/control-app/src/builder/panel.js
index 80e1ac862b..60024df461 100644
--- a/apps/control-app/src/builder/panel.js
+++ b/apps/control-app/src/builder/panel.js
@@ -81,8 +81,9 @@ export function createDisplayPanel(options = {}) {
   /** @type {Map<string, ModeSpec>} */
   const modes = new Map()
   /**
-   * One record per document mode: its frame, the URL that frame was last asked
-   * for, and whether what it holds is out of date.
+   * One record per document mode: its frame, the URL that frame holds (the one
+   * it was last asked for, or the one it arrived at by itself — see `follow`),
+   * and whether what it holds is out of date.
    *
    * @type {Map<string, { id: string, el: HTMLIFrameElement, src: string, stale: boolean }>}
    */
@@ -155,6 +156,7 @@ export function createDisplayPanel(options = {}) {
     // longer one element — and the announcement is only true of the frame the
     // operator can see.
     el.addEventListener('load', () => {
+      follow(rec)
       if (current?.id === id) emit('document', el.contentDocument)
       prime()
     })
@@ -164,6 +166,24 @@ export function createDisplayPanel(options = {}) {
     return rec
   }
 
+  /**
+   * Record the address the frame actually HOLDS, which is not always the one
+   * the pane sent it to: the operator may have followed a link inside it.
+   * `show` and `prime` compare against `rec.src`, so a record that only knew
+   * where the pane last pointed the frame would re-navigate one already holding
+   * the right page on the next flip, which is [[BUG-79]] by another route.
+   * A window that cannot be read, or the blank one a fresh frame starts with,
+   * leaves the record as it was.
+   */
+  function follow(rec) {
+    try {
+      const live = rec.el.contentWindow?.location?.href
+      if (typeof live === 'string' && live !== '' && live !== 'about:blank') rec.src = live
+    } catch {
+      /* cross-origin or detached: keep what the pane last asked for */
+    }
+  }
+
   /** Show this frame and hide every other. `null` hides them all (a mount mode). */
   function display(rec) {
     for (const f of frames.values()) f.el.classList.toggle(SHOWN_CLASS, f === rec)
diff --git a/tests/test_reconciliation_builder_flip_in_place.test.ts b/tests/test_reconciliation_builder_flip_in_place.test.ts
index c4f3400a8e..80bb40ba59 100644
--- a/tests/test_reconciliation_builder_flip_in_place.test.ts
+++ b/tests/test_reconciliation_builder_flip_in_place.test.ts
@@ -272,6 +272,36 @@ describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the View/Edit flip is in p
     expect(navsOf(editFrame())).toEqual([])
     expect(envLoads.get(viewFrame()) ?? 0).toBe(0)
     expect(envLoads.get(editFrame()) ?? 0).toBe(0)
+
+    // Separately: the reader follows a link inside View. The frame moves by
+    // itself (the pane re-points nothing), and Edit is primed at that page
+    // behind it.
+    const linked = await arrive(viewFrame(), 'draft', 'acme', 'contact', 'Contact page')
+    expect(viewFrame().getAttribute('src')).toBe(viewSrc)
+    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit', 'contact'))
+    const linkedEdit = await arrive(editFrame(), 'edit', 'acme', 'contact', 'Edit of contact')
+    await tick()
+    clearNavs()
+
+    // A round trip from there navigates neither channel: View already holds the
+    // page Edit was showing, so it is revealed, not re-pointed at it.
+    modeButton('edit').click()
+    expect(shown()).toBe(editFrame())
+    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'edit', 'contact'))
+    modeButton('view').click()
+    // Read before yielding: the observer hands its records to its callback at
+    // the next microtask, so a navigation is only observable synchronously.
+    expect(navsOf(viewFrame())).toEqual([])
+    expect(navsOf(editFrame())).toEqual([])
+    expect(viewFrame().getAttribute('src')).toBe(viewSrc)
+    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit', 'contact'))
+    await tick()
+    expect(shown()).toBe(viewFrame())
+    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'draft', 'contact'))
+    expect(viewFrame().contentDocument).toBe(linked.doc)
+    expect(editFrame().contentDocument).toBe(linkedEdit.doc)
+    expect(envLoads.get(viewFrame()) ?? 0).toBe(0)
+    expect(envLoads.get(editFrame()) ?? 0).toBe(0)
   })
 
   it('test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility', () => {
diff --git a/tests/test_reconciliation_builder_page_carry.test.ts b/tests/test_reconciliation_builder_page_carry.test.ts
index e11cd3f80c..85cc486f54 100644
--- a/tests/test_reconciliation_builder_page_carry.test.ts
+++ b/tests/test_reconciliation_builder_page_carry.test.ts
@@ -406,15 +406,22 @@ describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the page carried across a
 
     // A different offset in Edit, and back to View: the ordinary channel, the
     // same page, the new offset. The View frame was moved to `about` by the
-    // reader's link, not by the pane, so the pane now points it there and the
-    // page arrives with the offset carried from Edit.
+    // reader's link, not by the pane, and it still holds that page, so it is
+    // revealed in place (no re-point, no load) and the offset carried from Edit
+    // is applied to the very document the reader left.
     scrollTo(edit, 300)
+    clearNavs()
     modeButton('view').click()
+    // Read before yielding: the observer's records go to its callback at the
+    // next microtask, so a re-point is only observable synchronously.
+    expect(navsOf(viewFrame())).toEqual([])
+    expect(displayed()).toBe(previewUrl('acme', 'draft'))
+    await tick()
     expect(shown()).toBe(viewFrame())
     expect(app.panel.getSrc()).toBe(previewUrl('acme', 'draft', 'about'))
-    expect(navsOf(viewFrame())).toEqual([previewUrl('acme', 'draft', 'about')])
-    const back = await deliverRequested(viewFrame(), 'draft', 'acme', 'about', signInPage())
-    expect(back.scrolled).toEqual([300])
+    expect(envLoads.get(viewFrame()) ?? 0).toBe(0)
+    expect(viewFrame().contentDocument).toBe(view.doc)
+    expect(view.scrolled.at(-1)).toBe(300)
 
     // The rendered documents ship nothing to make this happen. The edit render
     // stays inert.
@@ -591,18 +598,21 @@ describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the page carried across a
     expect(modeButton('edit')).not.toBeNull()
 
     // View, on a page other than home. Edit opens the edit channel at that page.
-    await arrive(viewFrame(), 'draft', 'acme', 'about', plainPage())
+    const viewAbout = await arrive(viewFrame(), 'draft', 'acme', 'about', plainPage())
     await deliverRequested(editFrame(), 'edit', 'acme', 'about', plainPage())
     modeButton('edit').click()
     expect(shown()).toBe(editFrame())
     expect(app.panel.getSrc()).toBe(previewUrl('acme', 'edit', 'about'))
     expect(app.panel.getSrc()).not.toBe(previewUrl('acme', 'edit'))
 
-    // Back to View: the ordinary channel at that same page, not the root.
+    // Back to View: the ordinary channel at that same page, not the root. The
+    // View frame still holds that page, so it is revealed rather than re-pointed.
+    clearNavs()
     modeButton('view').click()
+    expect(navsOf(viewFrame())).toEqual([])
     expect(shown()).toBe(viewFrame())
     expect(app.panel.getSrc()).toBe(previewUrl('acme', 'draft', 'about'))
-    await deliverRequested(viewFrame(), 'draft', 'acme', 'about', plainPage())
+    expect(viewFrame().contentDocument).toBe(viewAbout.doc)
 
     // With Edit active, a different site opens that site's edit channel at its
     // root. Another site's page is not this page in another state.

```