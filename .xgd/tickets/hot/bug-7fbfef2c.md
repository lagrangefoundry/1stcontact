---
uid: bug-7fbfef2c
id: BUG-318
type: bug
title: 'People tab: invite and provision dialogs stay open after success; provision
  defaults to the person''s name'
created_by: martin-github@westhead.me
created_at: '2026-10-31T18:18:10.279076+00:00'
updated_at: '2026-10-31T19:43:44.212415+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-eefc2111
  severity: medium
  commits:
  - working_sha: a9179a229b8f0cbf07ec97beb9d7e50704758ff9
    reconcile_sha: null
    main_sha: null
  - working_sha: e4e85199d7fb055765acd2021eab3b01462edca5
    reconcile_sha: null
    main_sha: null
  version: 0.2.713
  story_points: 2
---

## Symptom

1. **Invite** (People/Contacts tab → tick contacts → Invite → Send): after a send that worked, the dialog stays open and the Send button looks active again, so it reads as though nothing happened (or invites a second send).
2. **Provision a business** (a person's pane → Provision a business → Provision): after the business is provisioned the dialog stays open.
3. **Provision a business** prefills the business name with the account holder's own name (e.g. "Alice Smith"), which is not a sensible business name.

## Fix (behaviour)

- **Invite closes on full success.** When every selected contact's outcome is `sent`, the dialog closes. The per-contact report (one line per contact, REQ-199) is shown beside the list's Invite control instead of inside the dialog, so "did it go to everybody I ticked" is still answerable. When any outcome is `refused` or `failed`, or the request itself errors, the dialog stays open over the report exactly as before (REQ-186 / REQ-199: a refusal must be put in front of the operator, not closed over).
- **Provision closes on success.** When provisioning succeeds (including a first-draft test whose copy reaches `complete`), the dialog closes and the person's pane — which is redrawn to list the new business — shows the confirmation sentence ("X is provisioned." / "… and its discovery is copied.") in its "Add a business" section. On error, including an interrupted first-draft copy, the dialog stays open with the error and "Provision again to continue the copy." as before.
- **Default business name is "Unnamed business", made unique.** The Provision dialog prefills `Unnamed business`; if the person already operates a business with that name, it prefills `Unnamed business-1`, then `-2`, … — the first free one, compared case-insensitively with whitespace collapsed, the same scheme and comparison the Worker's `availableBusinessName` uses (REQ-237), so the prefilled name is not one the Worker would refuse. The operator can still edit it; a first-draft test still renames it to the source business's name when a source is picked (REQ-450).
- This supersedes REQ-450's previous expectation that the dialog stays open showing the completed progress bar after a successful first-draft copy.

Out of scope: the signup/onboarding default (`signupBusinessName`, the contact's display name) is unchanged.

## Why free-coded

Small UI fixes in one file (`apps/control-app/src/builder/people.js`).

## Test plan

`tests/test_UAT_FC_BUG-318_dialogs_close_on_success.test.ts` (jsdom, driving `createPeoplePanel`):
- an all-sent invite closes the dialog and the report lines appear beside the Invite control;
- an invite with a refusal keeps the dialog open over the report;
- a successful provision closes the dialog and the pane shows "… is provisioned.";
- the name field defaults to "Unnamed business", and to the first free "Unnamed business-N" when the person already operates those names.
Regression: REQ-186, REQ-188, REQ-199, REQ-450 dialog suites (REQ-450's completion test updated to expect the dialog closed).

-