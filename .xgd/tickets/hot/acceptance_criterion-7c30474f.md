---
uid: acceptance_criterion-7c30474f
id: AC-1591
type: acceptance_criterion
title: An invitation creates the person, the account, the ownership and the grant
  as one operation
created_by: xgd
created_at: '2026-09-04T05:52:20.399974+00:00'
updated_at: '2026-09-04T06:00:23.545660+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

Inviting an email address that is not yet known brings the whole set into existence in one
operation, and every record the login path will later look for is present afterwards:

- a **person** in the platform's own tenant, holding the invited email, active, recorded as
  invited and explicitly not yet seen;
- an **account** of their own, registered in the tenant registry as active — not merely an
  identifier written onto other records;
- an **ownership** joining that person to that account, in the owner role, live;
- a **grant** against that account, active, recorded as an administrative grant, with a
  start and with the end the invitation supplied (or no end when the invitation supplied
  none), and carrying both the account it admits to and the email it was made to.

The operation reports that it created a new person, and reports the account identifier it
created.

## Verification

Issue an invitation for an email address the system has not seen. Read every record back
from storage rather than from the operation's return value — an implementation that
reported what it intended to write would otherwise pass having written nothing. Assert the
person carries an invitation time and no first-seen time; that the ownership names the
reported account and the owner role; that the grant is active with the expected plan,
source, account and email; and that the account appears as an active tenant in the registry.