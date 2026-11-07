---
uid: report-8a166a9b
id: REPORT-11110
type: report
title: 'Report: mode_override for story-7b1025b8'
created_by: xgd
created_at: '2026-11-07T07:48:13.515480+00:00'
updated_at: '2026-11-07T07:48:13.515480+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-7b1025b8
  anchor_ticket: bundle-7988e925
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-72de7cec
  quality_mode: reconcile
  justification: REQ-199, an intent in this bundle's scope, states 'the selection
    clears only once something was sent' and lists 'every selected contact gets an
    outcome line, and the selection survives a send in which nothing was sent' among
    its acceptance points; AC-2339 encodes it and its UAT fails because people.js
    clears the selection unconditionally after every send. The test is right and the
    code is wrong; the change is confined to making that clear conditional.
  files:
  - apps/control-app/src/builder/people.js
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/builder/people.js
    lines: 1566-1602
  external_cause: null
  planner_trust_boundary: false
  granted_head: 04ce65ae31b087fd65dd62e55cbb88181a514bbf
---

# Mode override granted: code_frozen

REQ-199, an intent in this bundle's scope, states 'the selection clears only once something was sent' and lists 'every selected contact gets an outcome line, and the selection survives a send in which nothing was sent' among its acceptance points; AC-2339 encodes it and its UAT fails because people.js clears the selection unconditionally after every send. The test is right and the code is wrong; the change is confined to making that clear conditional.

Planner instructions for the batch:

Two different fixes in one batch. (1) PRODUCTION FIX, the only code change allowed: in apps/control-app/src/builder/people.js, the invite modal's Send handler (reference lines 1576-1580) calls selected.clear() and syncInvite() unconditionally after transport.invite returns. REQ-199 requires that 'the selection clears only once something was sent' and that 'the selection survives a send in which nothing was sent'. Make the clear conditional on at least one result having actually gone out, so an all-refused send leaves every row checked and Invite enabled. Keep the existing close-on-all-sent (BUG-318) and stay-open-on-any-refusal behaviour. Extend AC2339's tab UAT so the mixed send also asserts the selection is cleared when something was sent; at the moment a fix that never clears would pass. (2) TEST REALIGNMENT, tests only: the ACs are already rewritten to the new surface (AC-2169/1743/1744/2171/2172 at 07:21Z; AC-2173 and AC-2176 in this plan; AC-2175 is superseded). Read each AC body before touching its test. (a) Delete the AC2175 UAT in tests/reconciliation-identity-invite-control.test.ts: its AC is superseded and the Add-dialog behaviour it described is proven by AC2336. (b) In tests/reconciliation-identity-accounts.workers.test.ts and tests/reconciliation-identity-invite-provision-admission.workers.test.ts, replace every invitePerson(identityEnv(), scope, {email}) imported from people.ts, which no longer exports it, with addContact from people.ts, plus invitePeople from invites.ts where the AC needs the invited transition, using a recording mail port the way tests/test_reconciliation_contacts_add_invite.workers.test.ts does. (c) In all three workers files, replace postInvite(token, {email}) with the add route followed by the invite route posting {ids:[contactId]}. tests/test_reconciliation_contacts_add_invite.workers.test.ts already passes on the new surface: reuse its helpers and pattern rather than writing a third. Where that file already proves an AC (AC2169, AC1743, AC1744, AC2171, AC2172, AC2248, AC2253, AC2339), the old-file UAT is a stale duplicate and may be deleted. Where it does not (AC2170, AC2173, AC2176, AC2247, AC2257, AC1742, AC2115, AC2254, AC1745, AC1759, the 10 orphans), the old UAT must be moved onto the new surface and end green, because those ACs have no other evidence. (d) AC2173: assert per the rewritten AC. The invite writes no membership and no grant, an invitee with member_since null whose account owns no business is admitted with an EMPTY business set, not refused (REQ-203, identity.ts admit signingUp branch), provisioning then lists exactly that business, and a withdrawn membership still refuses no_membership. (e) AC2176: add, invite by id, provision, sign in, accept terms, exactly one business (accept does not provision a second, because ensureOwnBusiness is idempotent on tenants.owner_account_id), /account 200, provisioning route 404. (f) AC1745 and AC1759: once the import and invite plumbing is fixed, re-check their assertions against BUG-62 (commit d1cac8424d, 'a refusal that claims nothing ended, and says why in the log'). If the logged refusal shape changed, assert the reference shape the AC describes. Do not edit ACs. The .workers.test.ts suites need local port binding to run.
