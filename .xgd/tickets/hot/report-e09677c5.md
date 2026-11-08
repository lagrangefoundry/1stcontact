---
uid: report-e09677c5
id: REPORT-11351
type: report
title: 'Fix reconciliation review: bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T08:04:58.022775+00:00'
updated_at: '2026-11-08T08:04:58.022775+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-c0301347
  needs_more_work: false
  progress_made: true
---

## Stories created
None.

## Stories modified
- story-7b1025b8 (STORY-146): new AC-2409 (acceptance_criterion-f8f76ace, active) replaces AC-2337. It carries over every unretracted clause: checkbox-gated Invite, read-only From display, Subject/Body prefilled from the template (default seeded on first open), read-only To-List with hover, `Send N`, one recipient per message, request `from` ignored. From is now the invite template's resolved sender (the template's `from`, else MAIL_FROM, per AC-2371).
- story-3cf3d57b: AC-2376 and AC-2377 set pending → active, now backed by AC-tagged UATs.

## ACs superseded
- AC-2337 (acceptance_criterion-c1839219), story-7b1025b8, authored by the REQ-199 invite flow. Set to status=superseded with superseded_by_uid=bundle-c0301347 (REQ-205 retracts the deployment-wide invite sender). Its UATs (test_UAT_AC2337_* in test_reconciliation_contacts_add_invite.workers.test.ts:646 and test_reconciliation_contacts_add_invite_tab.test.ts:214) are left untouched, as the supersession rule requires. This records the retraction rather than hiding it. New UATs were written for AC-2409 instead of renaming the old ones:
  - tests/test_reconciliation_contacts_add_invite.workers.test.ts: test_UAT_AC2409_the_invite_draft_prefills_the_template_and_each_recipient_gets_their_own_message_from_the_templates_sender. The draft's from and every sent message's from equal SEED_TEMPLATES.invite.from ('1st Contact <invite@1stcontact.io>'). A spoofed request `from` is ignored. One recipient per message, and the default template is seeded.
  - tests/test_reconciliation_contacts_add_invite_tab.test.ts: test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list.

## New AC-tagged UATs (evidence gaps)
- AC-2376: 5 tests added to tests/reconciliation-assistant-priming-delivery.test.ts (node host, real openSession/streamPrompt, model double only):
  - each_priming_order_declares_exactly_one_boundary_and_it_is_last: both orders checked, and no boundary in the reminders.
  - with_a_knowledge_base_the_whole_priming_is_one_cached_prefix: the span up to the last cache breakpoint equals the whole system text, and the reminder is outside it.
  - without_a_knowledge_base_the_whole_priming_is_one_cached_prefix: the same check for the corpus-free order.
  - the_boundary_renders_nothing: no marker text in either order.
  - landscape_and_manual_are_assembled_once_a_session_not_once_a_turn: km.landscape and km.mechanism are each read once over three turns, and every turn's priming is identical and wholly cached.
- AC-2377: see FC orphans below. Added assertions for every subject named in the AC and for the "work from the map, not from a title you think you remember" pointer. Every authored reminder entry is scanned for ids and titles, and a test checks that both declared orders carry the authored text that gets scanned.

## FC orphans renamed/deleted
- tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts was renamed (git mv) to tests/reconciliation-assistant-priming-names-no-documents.test.ts. All tests were renamed test_UAT_FC_BUG-65_* → test_UAT_AC2377_*, since the whole file is AC-2377 evidence.
- tests/test_UAT_FC_REQ-182_priming_is_configuration.test.ts was left in place. Its cache-boundary tests now have AC-2376 counterparts. No fc_orphan_check report exists for this anchor yet.

## Code changes
None to production code. Only test files changed (listed above).

## Override misjudgment (report-7519d965)
No matrix action is possible. The gate has already recorded the denial of code_frozen for batch 0 of story-4cabde9a (report-40bf3ba2). The REQ-146 edit was already reverted. The remaining systemText() helper in tests/support/scripted-model-client.ts is used by the AC-2378 UAT, so removing it would break active evidence. It is left for the planner's next rung.

## Confidence
Moderate to high for findings 1 and 2. The new UATs were not executed in this call, per instructions. One open risk: the AC-2376 prefix-equality assertion assumes the backend puts nothing uncached in the system blocks after the priming, which is what AC-2376 claims. Finding 3 is a process judgment that this fixer cannot change.
