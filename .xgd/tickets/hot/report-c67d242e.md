---
uid: report-c67d242e
id: REPORT-12585
type: report
title: 'Fix reconciliation review: bundle-374f88d6'
created_by: xgd
created_at: '2026-11-11T02:25:38.782511+00:00'
updated_at: '2026-11-11T02:25:38.782511+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-374f88d6
  needs_more_work: true
  progress_made: true
---

## Stories created
None

## Stories modified
- story-b3de4571 (STORY-107). The evidence list now names the new browser UAT for AC-2572 in place of the stylesheet string match. Added the reconciliation decision "AC-2572 is proved by rendering, not by reading the stylesheet" (G2).
- AC-2572 (acceptance_criterion-ce27ecb1). Verification and UATs rewritten for the rendered measurement, with a reconciliation-decisions note citing report-4f7fbff8 G2.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None (no fc_orphan_check report exists for this anchor).

## Code changes
Test-only. No production code was edited.
- tests/reconciliation-assistant-picture-in-the-turn-browser.test.ts (new). It holds `test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane`. It runs `1c assets` and loads the builder's real chrome document (`chromeHtml()`, so the same stylesheets in the same order, `builder.css` included) in a real Chromium, with the entry module swapped for a harness. The harness mounts the real `createChatPanel` in a 380px column and replays assistant turns with a 3000x2000 and a 1000x4000 picture. The test asserts both pictures load and render with a non-zero size, neither is wider than its message or the pane, neither is taller than 260px, and each keeps its aspect ratio. The wide picture is held by the width bound and the tall one by the height bound. It skips visibly where no Chromium launches, like AC-2421.
- tests/reconciliation-assistant-picture-in-the-turn.test.ts. Removed the source-inspection AC-2572 test and the `readFileSync` of builder.css, and updated the header to point at the browser file.

## Outstanding: G1 needs a production-code exception (not actionable in this phase)
G1 (BUG-84) is a code defect. tools/generate/src/cli/push.ts:226 counts every 403 as `refusedByAccess`, and lines 239-242 then add Cloudflare Access credential advice to the import route's rights 403. Fixing it means editing push.ts: tell the rights 403 apart by its JSON body (`asset` field), name the asset and its bundle member, give no Access advice, and leave the 401, redirect, plain Access-403 and 409 paths unchanged. Code is frozen here, so it was not edited. The AC clause and UAT the review asks for in (b) and (c) were also not added: they would fail against the current code and turn the suite red. The planner needs to grant the rung-1 code_frozen override on tools/generate/src/cli/push.ts the review proposes in G1(a). Then the code fix, the AC-2588/2589 clause, the UAT (asset named and no "Cloudflare Access" for the rights 403; advice kept for a plain Access 403) and the RESOLVED note in story-aacb7060 can land together.

## Confidence
G2: high, provided the browser case runs at the gate. In a sandbox with no Chromium it skips visibly, by the same pattern as AC-2421. G1: not addressed, so the next review will fail on G1 until the override is granted and the fix lands.
