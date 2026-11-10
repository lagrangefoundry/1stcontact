---
uid: report-0e2d770e
id: REPORT-12089
type: report
title: 'Report: blocked_by_handoff for report-4ada51a8'
created_by: xgd
created_at: '2026-11-10T01:15:18.471677+00:00'
updated_at: '2026-11-10T01:15:18.471677+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: report-4ada51a8
  rule: code_frozen
  evidence: |-
    The AC-2413 test already passes, so this second attempt needed no edits. My fix from the first attempt (commit `809ee44244`) is still in the file, and the full file passes 14 of 14 when I run it.

    - **The test file changed in between.** A later review step (commit `9260d85d6b`) added a separate AC-2594 test to `tests/reconciliation-marked-points.test.ts`, which is why it now holds 14 tests instead of 13. That commit left the AC-2413 test alone, and AC-2594 passes too.
    - **The "orphaned" flag most likely came from the test failing.** The AC-2413 ticket is active, linked to story-44d0a572, and describes what the test proves. So the AC and the story don't need changes. Now that the test passes, the criterion has evidence behind it again.
    - **The earlier failure was a jsdom limitation, not a bug in the code.** Leaving Edit mode briefly installs Marked Points into the View frame. jsdom gives a frame with a `src` an empty document with no root element, so that install crashed. The test now gives each frame the empty page a browser would have. It also checks that the View document carries no Marked Points flag and no overlay after leaving Edit, so it would still fail if leaving Edit stopped turning the mode off.

    No production code, AC or story was changed.

    ```yaml
    ## Assessment
    status: fixed
    tests:
      - test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click: pass
    fix_commit: 809ee44244
    upstream_changes: none
    notes: "Fix from the first attempt still in place and passing; full file 14/14. AC-2413 ticket is active and linked to story-44d0a572, so the orphan flag should clear now the test passes."
    ```
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-e83f68a4
  anchor_ticket: bundle-374f88d6
  resolution:
    ticket: REQ-229
    ticket_uid: request-4b5c10e9
    point: |-
      The AC-2413 test already passes, so this second attempt needed no edits. My fix from the first attempt (commit `809ee44244`) is still in the file, and the full file passes 14 of 14 when I run it.

      - **The test file changed in between.** A later review step (commit `9260d85d6b`) added a separate AC-2594 test to `tests/reconciliation-marked-points.test.ts`, which is why it now holds 14 tests instead of 13. That commit left the AC-2413 test alone, and AC-2594 passes too.
      - **The "orphaned" flag most likely came from the test failing.** The AC-2413 ticket is active, linked to story-44d0a572, and describes what the test proves. So the AC and the story don't need changes. Now that the test passes, the criterion has evidence behind it again.
      - **The earlier failure was a jsdom limitation, not a bug in the code.** Leaving Edit mode briefly installs Marked Points into the View frame. jsdom gives a frame with a `src` an empty document with no root element, so that install crashed. The test now gives each frame the empty page a browser would have. It also checks that the View document carries no Marked Points flag and no overlay after leaving Edit, so it would still fail if leaving Edit stopped turning the mode off.

      No production code, AC or story was changed.

      ```yaml
      ## Assessment
      status: fixed
      tests:
        - test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click: pass
      fix_commit: 809ee44244
      upstream_changes: none
      notes: "Fix from the first attempt still in place and passing; full file 14/14. AC-2413 ticket is active and linked to story-44d0a572, so the orphan flag should clear now the test passes."
      ```
    readings:
    - |-
      The AC-2413 test already passes, so this second attempt needed no edits. My fix from the first attempt (commit `809ee44244`) is still in the file, and the full file passes 14 of 14 when I run it.

      - **The test file changed in between.** A later review step (commit `9260d85d6b`) added a separate AC-2594 test to `tests/reconciliation-marked-points.test.ts`, which is why it now holds 14 tests instead of 13. That commit left the AC-2413 test alone, and AC-2594 passes too.
      - **The "orphaned" flag most likely came from the test failing.** The AC-2413 ticket is active, linked to story-44d0a572, and describes what the test proves. So the AC and the story don't need changes. Now that the test passes, the criterion has evidence behind it again.
      - **The earlier failure was a jsdom limitation, not a bug in the code.** Leaving Edit mode briefly installs Marked Points into the View frame. jsdom gives a frame with a `src` an empty document with no root element, so that install crashed. The test now gives each frame the empty page a browser would have. It also checks that the View document carries no Marked Points flag and no overlay after leaving Edit, so it would still fail if leaving Edit stopped turning the mode off.

      No production code, AC or story was changed.

      ```yaml
      ## Assessment
      status: fixed
      tests:
        - test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click: pass
      fix_commit: 809ee44244
      upstream_changes: none
      notes: "Fix from the first attempt still in place and passing; full file 14/14. AC-2413 ticket is active and linked to story-44d0a572, so the orphan flag should clear now the test passes."
      ```
    - '(none stated: the builder made no edits and gave no verdict; see evidence)'
    status: unsettled
    level: null
    decision: null
    quotes: []
    document: null
    consulted:
    - level: 1
      outcome: conflict
    - level: 2
      subjects:
      - request-4b5c10e9
      turns:
      - comment-c682c825#0
      - comment-c682c825#1
      - comment-c682c825#2
      - comment-c682c825#3
      - comment-c682c825#4
      - comment-c682c825#5
      - comment-c682c825#6
      - comment-c682c825#7
      outcome: silent
    - level: 3
      subjects:
      - epic-34760bf1
      turns:
      - comment-baba73ad#14
      - comment-baba73ad#15
      - comment-baba73ad#16
      - comment-baba73ad#17
      - comment-baba73ad#18
      - comment-baba73ad#19
      - comment-baba73ad#20
      - comment-baba73ad#22
      - comment-baba73ad#23
      - comment-baba73ad#24
      - comment-baba73ad#25
      - comment-baba73ad#26
      - comment-baba73ad#27
      - comment-baba73ad#28
      - comment-baba73ad#29
      - comment-baba73ad#30
      - comment-baba73ad#33
      - comment-baba73ad#34
      - comment-baba73ad#35
      - comment-baba73ad#36
      - comment-baba73ad#37
      - comment-baba73ad#38
      - comment-baba73ad#39
      - comment-baba73ad#40
      - comment-baba73ad#41
      - comment-baba73ad#42
      - comment-baba73ad#43
      outcome: silent
---

# Builder blocked by `code_frozen`

**Evidence**: The AC-2413 test already passes, so this second attempt needed no edits. My fix from the first attempt (commit `809ee44244`) is still in the file, and the full file passes 14 of 14 when I run it.

- **The test file changed in between.** A later review step (commit `9260d85d6b`) added a separate AC-2594 test to `tests/reconciliation-marked-points.test.ts`, which is why it now holds 14 tests instead of 13. That commit left the AC-2413 test alone, and AC-2594 passes too.
- **The "orphaned" flag most likely came from the test failing.** The AC-2413 ticket is active, linked to story-44d0a572, and describes what the test proves. So the AC and the story don't need changes. Now that the test passes, the criterion has evidence behind it again.
- **The earlier failure was a jsdom limitation, not a bug in the code.** Leaving Edit mode briefly installs Marked Points into the View frame. jsdom gives a frame with a `src` an empty document with no root element, so that install crashed. The test now gives each frame the empty page a browser would have. It also checks that the View document carries no Marked Points flag and no overlay after leaving Edit, so it would still fail if leaving Edit stopped turning the mode off.

No production code, AC or story was changed.

```yaml
## Assessment
status: fixed
tests:
  - test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click: pass
fix_commit: 809ee44244
upstream_changes: none
notes: "Fix from the first attempt still in place and passing; full file 14/14. AC-2413 ticket is active and linked to story-44d0a572, so the orphan flag should clear now the test passes."
```

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)

## Intent resolution (resolution ladder)

Unsettled: nobody decided this point. Cite `"unsettled"` as the level in an `intent_basis`.
