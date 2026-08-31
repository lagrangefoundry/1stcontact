---
uid: acceptance_criterion-89fefdc5
id: AC-1448
type: acceptance_criterion
title: A retained assembled draft never outlives nor is misattributed to its site,
  and never crosses the account barrier
created_by: xgd
created_at: '2026-08-31T16:37:50.343343+00:00'
updated_at: '2026-08-31T16:46:33.471266+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

An assembled draft retained between reads can never outlive, nor be misattributed to, the site it
describes.

- **Dropping a site drops what was retained for it.** After a site is dropped, a read for that slug
  reports *absent*; if a site is then created again under the same slug and written, the next read
  reports the new site's content and never the dropped site's. This is not incidental: a recreated
  site starts its write version again from the beginning, so a value left behind could be matched by
  a version comparison that is — correctly — only ever about writes.
- **A read that finds no site drops it too**, so a value cannot survive a site that disappeared by
  any route rather than by an explicit drop.
- **Two accounts holding a site of the same name never see each other's.** What is retained is
  identified by account *and* slug together, so the account barrier the handle establishes is not
  quietly undone by reuse between reads. Each account reads back its own content.

What is retained is bounded by construction: at most one value per account-and-site, replaced when
the site's write version moves rather than accumulated per version, so it cannot grow with the
number of edits made to a site.

## Verification

Seed a site and read its draft. Drop the site and read again: the read reports absent. Create the
site again under the same slug, write different content, and read: the assembled value differs from
the first read's and carries the new content.

Register two accounts and give each a site under the *same* slug with distinguishable content. Read
each account's draft through its own handle: each reports its own content, and the two assembled
values are not the same value.