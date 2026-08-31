---
uid: acceptance_criterion-84f710e2
id: AC-1386
type: acceptance_criterion
title: A store handle sees exactly one account's sites, and no storage operation takes
  an account
created_by: xgd
created_at: '2026-08-31T09:47:21.316896+00:00'
updated_at: '2026-08-31T10:04:14.348258+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

A store handle is obtained for exactly one account and can see nothing outside it, for the whole
life of the handle.

Given two accounts that each hold a site under the same name, with different definitions, pages
and assets:

- Each handle reports its own account's definition, pages and assets for that name.
- Neither handle lists the other's site among the account's sites.
- A write through one handle changes only that account's site; the other account's definition,
  pages, assets and version are unchanged afterwards.

**No storage operation takes an account as an argument.** Reading, writing, listing and assembling
are all answered by the handle alone. Reaching a second account requires obtaining a second
handle.

Making a site exist, listing an account's sites, and dropping a site with its bytes are the
store's own administrative operations, and they are scoped to the handle's account in the same
way: a handle cannot create, list or drop anything in another account.

## Verification

Obtain two handles for two different accounts. Create a site with the same name under each, with
distinguishable content. Read and list through each handle and observe that neither sees the
other's content. Write through one and re-read the other to confirm it is untouched, including its
version. Confirm that the operations for reading, writing and assembling accept only a site name
and a change — never an account — so that supplying the wrong account at a call site is not
expressible.