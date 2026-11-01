---
uid: acceptance_criterion-29fd0b50
id: AC-2166
type: acceptance_criterion
title: A PLATFORM_ADMINS holder can operate the 1st Contact business on a database
  with no membership row for them; admission seeds the owner membership and the platform_operator
  flag as separate rows, idempotently, and emptying the var removes neither
created_by: xgd
created_at: '2026-11-01T17:59:07.265676+00:00'
updated_at: '2026-11-01T18:21:35.571137+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
The `PLATFORM_ADMINS` deployment variable is a comma-separated list of email addresses, compared case-insensitively. When an address it names is admitted:
- it is admitted and can operate the 1st Contact business even if the database held no user row, no membership and no grant for them beforehand. It is not refused `no_user` or `no_membership`.
- admission leaves behind, as separate facts: a user row, an active `owner` membership on the 1st Contact business, an open-ended active grant on that business (written only if no active grant already covers it; an existing dated grant is not replaced), and the `platform_operator` flag on the user, which is set even on a user row that existed before. No starter site is created.
- the holder is then admitted by the same checks as anyone else. A user who is suspended is still refused, and the seed does not override that.
- admitting the holder repeatedly writes nothing further: one user row, one membership on the 1st Contact business, at most one seeded grant.
- after the variable is emptied, the holder is still admitted as owner of the 1st Contact business and still carries `platform_operator`. The rows are not removed.
- an address the variable does not name is refused exactly as before. Nothing is created for it.

The variable ships empty, and empty means nobody. It is declared both at the top level of the deployment configuration and in the production environment (which inherits no variables), with an empty value in each.

## Verification
On an empty identity database with `PLATFORM_ADMINS` naming an address (in different case), admit it. Assert `ok`, a selectable 1st Contact business with role `owner`, and `platform_operator` set. Admit again and assert one membership row. Empty the variable, admit, and assert that ownership and the flag remain. Admit an unnamed address and assert a refusal with no row written. Statically assert that the deployment configuration declares `PLATFORM_ADMINS = ""` at the top level and for production.