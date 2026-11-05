---
uid: report-abd0c68a
id: REPORT-11050
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:49:55.210066+00:00'
updated_at: '2026-11-05T20:49:55.210066+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `apps/control-app/src/mail.ts`: code file, UU (2c). Both sides already send the body as `html`. The two hunks were comment-only and mutually exclusive, so incoming won both: the expanded `Message.body` doc and the `html AND NOT text` comment. The non-conflicting docstring change ("the invite said") was kept. Flagged for post-merge review per enrichment.
- `apps/control-app/src/people.ts`: code file, UU (2c). There were three hunks in `addContact`. (1) Existing-contact branch: incoming wins, so nothing is written for an existing contact except the courtesy name; HEAD's invite UPDATE and `contact.invited` event are gone. (2) Account comment: integrated (2c.3b). Incoming's scope is kept, and HEAD's REQ-194 notes on one account per contact and the null account name are kept as well. HEAD's "two events" paragraph was dropped because the code it described is gone under incoming. (3) INSERT: incoming wins, `pipeline_stage = PIPELINE_LEAD` with no `invited_at`. Flagged for post-merge review.
- `tests/test_UAT_FC_REQ-196_mail.workers.test.ts`: UAT test, UU. The single hunk was comment-only; incoming wins and its REQ-199 comment was restored. The assertion `html:` is identical on both sides.
- `tests/test_UAT_FC_REQ-186_invite.workers.test.ts`: UAT test, UU. The helper is named `seedLead`, the incoming name that all its callers use. Its body is `return seedContact(identityEnv(), {..., displayName})`, which is HEAD's current `tests/support/contact.ts` shape: it returns the id and writes the name via `writeName` itself. So it does what incoming's `id = await seedContact(...); writeName(...); return id` did. No test function was deleted.

## Incoming changes preserved

I checked `git diff --cached 73302982b0` on the four files. The only remaining differences from the incoming commit are:
- HEAD's own non-conflicting edits (people.ts doc comments, setPersonRecord comment, removed `updated_at` UPDATE)
- HEAD's REQ-194 account comment lines, which add to incoming's text
- the `seedLead` body using HEAD's `seedContact(displayName)` API, which does the same thing as incoming's body

All incoming behaviour is present: addContact creates a Lead, writes nothing for an existing contact, and records a single `contact.created` with `via: 'add'`; the mail adapter uses `html` with incoming's comments; the test uses the `seedLead` rename.

## Verification

`tsc --noEmit -p apps/control-app` reported no errors in the touched files. Every error it reported was a missing `./generated/*` module from the sparse checkout. The workers tests could not run here because the sandbox denies local port binding (listen EPERM).
