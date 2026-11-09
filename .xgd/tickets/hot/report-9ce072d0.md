---
uid: report-9ce072d0
id: REPORT-12000
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-09T19:29:09.273398+00:00'
updated_at: '2026-11-09T19:29:09.273398+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_conformance
  subject_uid: story-1500b111
  findings:
  - item: 5
    reason: 'planner misjudged trust boundary: trust_boundary_mismatch is true because
      the planner declared planner_trust_boundary false while the production diff
      matches the trust-boundary patterns; the escaping is preserved and now tested
      (test_UAT_AC2556_a_name_carrying_markup_stays_inert_text_through_the_feed_the_modal_and_the_chat_opener),
      but the mismatch alone fails this item.'
    added_lines:
    - '      // EVERY EXIT — Close, Escape, the backdrop — reports here through the
      shell''s'
    - '    // EVERY ROUTE OUT IS REPORTED — the Close button, Escape and the backdrop
      all'
    - '        // exit — the Close button, Escape, the backdrop — through one `close`'
    - '      if (shownImg) shownImg.alt = next || row.filename || '''''
    absent_tip_lines:
    - '"planner_trust_boundary": false'
    - '"trust_boundary_mismatch": true'
    files:
    - apps/control-app/src/builder/app.js
    - apps/control-app/src/builder/image-editor.js
    - apps/control-app/src/builder/library.js
  mode_override_uid: report-0712dc13
  parent_report_uid: report-d1a7a69b
  batch_index: 0
  attempt: 1
---

# Override conformance

- Item 1: PASS. unnamed_files_touched is empty; every production file touched (api.js, app.js, image-editor.js, library.js, material-name.js) is named in `files`.
- Item 3: PASS. The changes carry out REQ-220 as the planner stated: materialUidFromUrl accepts the material file route with or without the /b/<business> prefix and still refuses member= and foreign paths; every exit of the modal reports through onClose so the picture can be reopened from the pane and the chat; a rename on the change feed reaches the name field, the alt text and an open modal unless the name cell is being edited; required:true is dropped so the module's NAME_REQUIRED refusal applies. The AC-1718 expectations now include `title`.
- Item 4: PASS. The diff stays within the planner's points (a) to (d) and the AC-1718 test edits it asked for; the added AC-2556 test is test-only.
- Item 5: FAIL, planner misjudged trust boundary. trust_boundary_mismatch is true. Every trust_boundary_matches entry is a comment line ('Escape' in prose), but the mismatch fails the item mechanically. Escaping is preserved: renamed() writes through setName and the img.alt property, never markup. It is asserted by test_UAT_AC2556_a_name_carrying_markup_stays_inert_text_through_the_feed_the_modal_and_the_chat_opener (pane field, alt, list, modal close/reopen, chat opener, and that window.__pwned stays unset). The builder cannot change this item; the next plan must declare trust_boundary true.
- Item 6: PASS. Rung 1, no file outside `files` edited, and no added behaviour beyond what REQ-220 and the planner's instructions demand.

1 override audited, 1 touched a trust boundary.