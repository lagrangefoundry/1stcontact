---
uid: acceptance_criterion-f8c7ce1b
id: AC-1233
type: acceptance_criterion
title: Removing an entry that is in use is refused naming the count, enforced where
  the write happens against any client, and cannot be overridden
created_by: xgd
created_at: '2026-08-20T01:20:05.265004+00:00'
updated_at: '2026-08-20T01:20:05.265004+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

Removing an entry that anything references is refused, and the refusal:
- reports a conflict and **names how many places use it**, in the same number a read reports;
- states the next step — that deciding what each use becomes comes first;
- is enforced where the write happens, so a request that arrives with no client-side check at all
  (a browser tab acting on a count it read before the site changed, or any direct request to the
  origin) is refused identically, and answers with a client-error status rather than a server
  failure;
- cannot be overridden: no flag or option supplied alongside the removal makes it succeed.

After the refusal the entry and every reference to it are still present, and the site definition
is byte-unchanged.

## Verification

Seed a site with an entry referenced three times. Attempt the removal directly at the origin
route, bypassing any client, and assert: a client-error status, a conflict code, a message naming
the count of three, and the site definition unchanged with the entry and all three references
intact. Repeat from the command line, including an attempt with an override-looking flag
appended, and assert it fails too.
