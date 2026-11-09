---
uid: report-0712dc13
id: REPORT-11992
type: report
title: 'Report: mode_override for story-1500b111'
created_by: xgd
created_at: '2026-11-09T19:09:41.069624+00:00'
updated_at: '2026-11-09T19:09:41.069624+00:00'
completed_at: null
last_field_updated: created_at
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
---

# Mode override granted: code_frozen

REQ-220 is in scope and requires that the parser recognise the material file route with or without a /b/<id> prefix, that the modal can be closed and reopened, and that the name field receives renames from the change feed with the typing guard; the reference lacks all three, and its own material-name.js declares NAME_REQUIRED as the empty-name refusal that the required:true descriptor short-circuits. The tests are right and the builder code is wrong.

Planner instructions for the batch:

Five failures, two causes. (1) Production, under the code_frozen override. (a) builder/api.js materialUidFromUrl must accept the material file route with or without a leading /b/<businessId> prefix (still refusing member= and foreign paths), as REQ-220 orders. (b) Every exit of the image modal (its Close button, Escape, backdrop) must clear the caller handle: library.js openPicture keeps editor and app.js openPictureFromChat keeps chatPicture set because image-editor.js wires its Close button and modal.js wires Escape/backdrop straight to shell.close, never through the wrapped close. Make the dialog report its own closing to the caller (e.g. an onClose the editor forwards from createModalShell) so the picture can be reopened from pane and chat. (c) In the library.js change-feed handler, an update for the open material whose row title differs must push the new title into the open detail name field (nameField.setName), the image alt and an open modal, unless the name cell is in edit mode (.fields-control-cell present), where the typed text wins and nothing is read. (d) Emptying the name must send nothing, put the previous name back and show NAME_REQUIRED against the field: the required:true on MATERIAL_NAME_FIELD makes mountFields refuse with its own word before onCommit can throw NAME_REQUIRED, so the module own contract never applies. (2) Tests only: the two AC-1718 tests in reconciliation-library-role-correction.test.ts and reconciliation-library-tab.test.ts expect editable fields [body, role]; AC-1718 now includes the Library name (title) on every material, so update those expectations (or delete a test whose claims the passing image-modal AC-1718 test already covers, keeping its other claims). All dependency tests must stay green.
