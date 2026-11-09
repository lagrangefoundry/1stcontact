---
uid: report-0712dc13
id: REPORT-11992
type: report
title: 'Report: mode_override for story-1500b111'
created_by: xgd
created_at: '2026-11-09T19:09:41.069624+00:00'
updated_at: '2026-11-09T19:20:30.792775+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: story-1500b111
  anchor_ticket: bundle-0881342c
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-d1a7a69b
  quality_mode: reconcile
  justification: REQ-220 is in scope and requires that the parser recognise the material
    file route with or without a /b/<id> prefix, that the modal can be closed and
    reopened, and that the name field receives renames from the change feed with the
    typing guard; the reference lacks all three, and its own material-name.js declares
    NAME_REQUIRED as the empty-name refusal that the required:true descriptor short-circuits.
    The tests are right and the builder code is wrong.
  files:
  - apps/control-app/src/builder/api.js
  - apps/control-app/src/builder/app.js
  - apps/control-app/src/builder/library.js
  - apps/control-app/src/builder/image-editor.js
  - apps/control-app/src/builder/material-name.js
  - apps/control-app/src/builder/modal.js
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/builder/api.js
    lines: 1739-1753
  - file: apps/control-app/src/builder/image-editor.js
    lines: 297-297
  - file: apps/control-app/src/builder/library.js
    lines: 832-835
  - file: apps/control-app/src/builder/library.js
    lines: 1374-1374
  - file: apps/control-app/src/builder/app.js
    lines: 1702-1705
  - file: apps/control-app/src/builder/material-name.js
    lines: 42-76
  external_cause: null
  planner_trust_boundary: false
  granted_head: 95e5349e2eac3903e94a747cad58694b9ea226e2
  files_touched:
  - apps/control-app/src/builder/api.js
  - apps/control-app/src/builder/app.js
  - apps/control-app/src/builder/image-editor.js
  - apps/control-app/src/builder/library.js
  - apps/control-app/src/builder/material-name.js
  - tests/reconciliation-library-role-correction.test.ts
  - tests/reconciliation-library-tab.test.ts
  unnamed_files_touched: []
  trust_boundary_touched: true
  trust_boundary_matches:
  - 'apps/control-app/src/builder/app.js: +      // EVERY EXIT — Close, Escape, the
    backdrop — reports here through the shell''s'
  - 'apps/control-app/src/builder/image-editor.js: +    // EVERY ROUTE OUT IS REPORTED
    — the Close button, Escape and the backdrop all'
  - 'apps/control-app/src/builder/library.js: +        // exit — the Close button,
    Escape, the backdrop — through one `close`'
  - 'apps/control-app/src/builder/library.js: -      // exit — the button, Escape,
    the backdrop — through one `close`, and this'
  trust_boundary_notes: []
  trust_boundary_mismatch: true
---

# Mode override granted: code_frozen

REQ-220 is in scope and requires that the parser recognise the material file route with or without a /b/<id> prefix, that the modal can be closed and reopened, and that the name field receives renames from the change feed with the typing guard; the reference lacks all three, and its own material-name.js declares NAME_REQUIRED as the empty-name refusal that the required:true descriptor short-circuits. The tests are right and the builder code is wrong.

Planner instructions for the batch:

Five failures, two causes. (1) Production, under the code_frozen override. (a) builder/api.js materialUidFromUrl must accept the material file route with or without a leading /b/<businessId> prefix (still refusing member= and foreign paths), as REQ-220 orders. (b) Every exit of the image modal (its Close button, Escape, backdrop) must clear the caller handle: library.js openPicture keeps editor and app.js openPictureFromChat keeps chatPicture set because image-editor.js wires its Close button and modal.js wires Escape/backdrop straight to shell.close, never through the wrapped close. Make the dialog report its own closing to the caller (e.g. an onClose the editor forwards from createModalShell) so the picture can be reopened from pane and chat. (c) In the library.js change-feed handler, an update for the open material whose row title differs must push the new title into the open detail name field (nameField.setName), the image alt and an open modal, unless the name cell is in edit mode (.fields-control-cell present), where the typed text wins and nothing is read. (d) Emptying the name must send nothing, put the previous name back and show NAME_REQUIRED against the field: the required:true on MATERIAL_NAME_FIELD makes mountFields refuse with its own word before onCommit can throw NAME_REQUIRED, so the module own contract never applies. (2) Tests only: the two AC-1718 tests in reconciliation-library-role-correction.test.ts and reconciliation-library-tab.test.ts expect editable fields [body, role]; AC-1718 now includes the Library name (title) on every material, so update those expectations (or delete a test whose claims the passing image-modal AC-1718 test already covers, keeping its other claims). All dependency tests must stay green.

## Diff

```diff
diff --git a/apps/control-app/src/builder/api.js b/apps/control-app/src/builder/api.js
index afc907068b..b54cec8a7f 100644
--- a/apps/control-app/src/builder/api.js
+++ b/apps/control-app/src/builder/api.js
@@ -697,7 +697,11 @@ export function materialUidFromUrl(src) {
   } catch {
     return null
   }
-  if (url.pathname !== '/api/material/file') return null
+  // WITH OR WITHOUT THE BUSINESS SCOPE ([[REQ-220]]). `materialFileUrl` forms its
+  // address through `scoped()`, which prefixes `/b/<business>` whenever a business
+  // is selected — every real session — so a parser that knew only the bare route
+  // would refuse the very addresses the builder itself writes into the chat.
+  if (!/^(?:\/b\/[^/]+)?\/api\/material\/file$/.test(url.pathname)) return null
   // A MEMBER NAMES ONE FILE INSIDE A CAPTURE ([[REQ-166]]), and a capture is not
   // a picture the editor opens — so a URL that addresses one is declined here
   // rather than resolved to a uid the editor would then have to refuse.
diff --git a/apps/control-app/src/builder/app.js b/apps/control-app/src/builder/app.js
index aa99d0ed1f..11302c1fe5 100644
--- a/apps/control-app/src/builder/app.js
+++ b/apps/control-app/src/builder/app.js
@@ -548,12 +548,12 @@ export function mountBuilder(root, options = {}) {
       recipe: item.edits ?? [],
       host: shell.element,
       transport: { saveName: saveMaterialName, saveRecipe: saveMaterialRecipe },
+      // EVERY EXIT — Close, Escape, the backdrop — reports here through the shell's
+      // one `close`, so the picture can be opened from the chat again.
+      onClose: () => {
+        chatPicture = null
+      },
     })
-    const closed = chatPicture.close
-    chatPicture.close = () => {
-      chatPicture = null
-      closed()
-    }
   }
 
   const chat = createChatPanel({
diff --git a/apps/control-app/src/builder/image-editor.js b/apps/control-app/src/builder/image-editor.js
index 9716ed716d..5a8ba36be7 100644
--- a/apps/control-app/src/builder/image-editor.js
+++ b/apps/control-app/src/builder/image-editor.js
@@ -121,6 +121,7 @@ export function mountImageEditor(spec) {
     host = null,
     transport,
     onSaved = () => {},
+    onClose = () => {},
     measure = null,
   } = spec
 
@@ -146,7 +147,13 @@ export function mountImageEditor(spec) {
   const shell = createModalShell({
     host,
     title: name || 'Picture',
-    onClose: () => detachDragListeners(),
+    // EVERY ROUTE OUT IS REPORTED — the Close button, Escape and the backdrop all
+    // end in the shell's one `close`, so the caller learns the dialog is gone
+    // however the client left it, and can open the picture again.
+    onClose: () => {
+      detachDragListeners()
+      onClose()
+    },
   })
 
   // THE BOX IS WHAT WIDENS THE PANEL. `builder.css` keys the wide panel on the
diff --git a/apps/control-app/src/builder/library.js b/apps/control-app/src/builder/library.js
index f3ffa9c0aa..bd7eb67548 100644
--- a/apps/control-app/src/builder/library.js
+++ b/apps/control-app/src/builder/library.js
@@ -626,16 +626,14 @@ export function createLibraryPanel(options = {}) {
         // rename in the dialog has to reach the pane's own box and the row in
         // the list, or the client closes the modal onto the old name.
         onSaved: (saved) => adoptSaved(saved),
+        // A DIALOG THAT CLOSES ITSELF STILL HAS TO SAY SO. `modal.js` routes every
+        // exit — the Close button, Escape, the backdrop — through one `close`
+        // whose `onClose` the editor forwards here, so the pane learns the editor
+        // is gone however the client left it, and the picture can be reopened.
+        onClose: () => {
+          editor = null
+        },
       })
-      // A DIALOG THAT CLOSES ITSELF STILL HAS TO SAY SO. `modal.js` routes every
-      // exit — the button, Escape, the backdrop — through one `close`, and this
-      // is how the pane learns the editor is gone rather than holding a handle
-      // to a dialog that has left the document.
-      const closed = editor.close
-      editor.close = () => {
-        editor = null
-        closed()
-      }
     }
 
     // DESTROYED WITH THE DETAIL, because it owns an in-flight fetch and possibly
@@ -764,6 +762,23 @@ export function createLibraryPanel(options = {}) {
      * component expresses edit mode by replacing its read cell with a control
      * cell, which is where the fact actually lives.
      */
+    /**
+     * A name that changed elsewhere, arriving on the change feed ([[REQ-220]]).
+     *
+     * THE TITLE TRAVELS ON THE EVENT'S ROW, so unlike the description it needs no
+     * read: it is pushed into the pane's field, the picture's alt text and an open
+     * modal. EXCEPT WHILE THE CLIENT IS TYPING A NAME — the cell, not `isDirty()`,
+     * for the reason `reload` gives — when what they type wins.
+     */
+    function renamed(title) {
+      if (nameHost.querySelector('.fields-control-cell')) return
+      const next = title ?? ''
+      nameField?.setName(next)
+      editor?.setName(next)
+      const shownImg = view.querySelector('.builder-library__image')
+      if (shownImg) shownImg.alt = next || row.filename || ''
+    }
+
     async function reload() {
       // AND THE NAME BOX COUNTS ([[REQ-220]]). `setValues` rebuilds a read cell,
       // so a background re-describe landing while somebody is half-way through
@@ -852,7 +867,7 @@ export function createLibraryPanel(options = {}) {
       // it. Before this line the pane is still fetching its first copy, and a
       // body event arriving in that window needs no help: the fetch already in
       // flight will bring the new text.
-      openItem = { uid: row.uid, reload }
+      openItem = { uid: row.uid, reload, renamed }
     })()
 
     return {
@@ -1102,6 +1117,12 @@ export function createLibraryPanel(options = {}) {
     }
     if (!change.row) return
 
+    // THE NAME, WHICH THE EVENT DOES CARRY ([[REQ-220]]). Read before the patch
+    // below, because the row object is shared with the open detail and would
+    // already hold the new title by the time anything compared it.
+    const previousTitle = at === -1 ? undefined : all[at].title
+    const titleMoved = at !== -1 && 'title' in change.row && change.row.title !== previousTitle
+
     if (at === -1) {
       // NEWEST FIRST, which is `listMaterial`'s own order — so a material that
       // arrives by event lands where the same material would have landed had the
@@ -1117,6 +1138,8 @@ export function createLibraryPanel(options = {}) {
     }
     apply()
 
+    if (titleMoved && openItem?.uid === change.uid) openItem.renamed?.(change.row.title)
+
     // THE DESCRIPTION, WHICH THE EVENT COULD NOT CARRY. See `reload`: the log
     // records that a body moved and never what it now says, so the one open
     // detail re-reads and every other material costs nothing.
diff --git a/apps/control-app/src/builder/material-name.js b/apps/control-app/src/builder/material-name.js
index 029cdd4cec..e764f49bda 100644
--- a/apps/control-app/src/builder/material-name.js
+++ b/apps/control-app/src/builder/material-name.js
@@ -42,7 +42,10 @@ import { mountFields } from '@lagrangefoundry/webui-fields'
 export const MATERIAL_NAME_FIELD = Object.freeze({
   name: 'title',
   label: 'Name in your Library',
-  required: true,
+  // NOT `required: true`, deliberately. The component's own required check refuses
+  // an empty box in ITS word before `onCommit` runs, so the client would never see
+  // NAME_REQUIRED below — the one sentence that says why a name matters. The
+  // refusal is this module's, in `onCommit`, and the origin's.
 })
 
 /** Said when the box is emptied — the origin refuses it, and so does the copy. */
diff --git a/tests/reconciliation-library-role-correction.test.ts b/tests/reconciliation-library-role-correction.test.ts
index 926a93fbf5..bb58a622f4 100644
--- a/tests/reconciliation-library-role-correction.test.ts
+++ b/tests/reconciliation-library-role-correction.test.ts
@@ -322,10 +322,11 @@ describe.skipIf(!WEBUI_INSTALLED)('AC-1718 — the description, and on an upload
     const blank = await open(panel, 'undescribed')
     expect(blank.querySelector('.builder-library__status')!.textContent).toMatch(/Nothing has read this yet/i)
 
-    // EDITABLE FIELDS: upload → description and role; fetched/captured → description only.
-    expect(editableFields(blank).sort()).toEqual(['body', 'role'])
+    // EDITABLE FIELDS: upload → name, description and role; fetched/captured →
+    // name and description only (the Library name is on every material, REQ-220).
+    expect(editableFields(blank).sort()).toEqual(['body', 'role', 'title'])
     for (const uid of ['fetched', 'captured']) {
-      expect(editableFields(await open(panel, uid)), uid).toEqual(['body'])
+      expect(editableFields(await open(panel, uid)).sort(), uid).toEqual(['body', 'title'])
     }
 
     // SHOWN RENDERED, not as markers.
diff --git a/tests/reconciliation-library-tab.test.ts b/tests/reconciliation-library-tab.test.ts
index bc77c96361..abb5720495 100644
--- a/tests/reconciliation-library-tab.test.ts
+++ b/tests/reconciliation-library-tab.test.ts
@@ -277,12 +277,13 @@ describe.skipIf(!WEBUI_INSTALLED)('AC-1718 — the description is the one editab
       /Nothing has read this yet/i,
     )
 
-    // ON AN UPLOAD EXACTLY TWO FIELDS OF THE PANE ACCEPT EDITING: THE DESCRIPTION
-    // AND *What it is for* (REQ-213). Counted across the WHOLE detail — the rights
-    // block is on this pane too, and a count taken inside the description block
-    // alone would pass whatever the rights block did.
+    // ON AN UPLOAD EXACTLY THREE FIELDS OF THE PANE ACCEPT EDITING: *What it is
+    // for* (REQ-213), the Library name (REQ-220) and the description — in pane
+    // order. Counted across the WHOLE detail — the rights block is on this pane
+    // too, and a count taken inside the description block alone would pass
+    // whatever the rights block did.
     const editableRows = [...detail.querySelectorAll('.fields-row.is-editable')]
-    expect(editableRows.map((row) => row.getAttribute('data-field'))).toEqual(['role', 'body'])
+    expect(editableRows.map((row) => row.getAttribute('data-field'))).toEqual(['role', 'title', 'body'])
     const rightsEditable = [...detail.querySelectorAll('.builder-library__rights .fields-row.is-editable')]
     expect(rightsEditable.map((row) => row.getAttribute('data-field'))).toEqual(['role'])
     expect(detail.querySelector('.builder-library__description .fields')).toBeTruthy()

```
