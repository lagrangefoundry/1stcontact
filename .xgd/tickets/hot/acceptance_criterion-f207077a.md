---
uid: acceptance_criterion-f207077a
id: AC-1418
type: acceptance_criterion
title: Publishing mints a revision, renders it and stores it with no filesystem on
  the path, driven identically from the builder and the command line
created_by: xgd
created_at: '2026-08-31T11:33:58.380274+00:00'
updated_at: '2026-08-31T11:46:20.931978+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

Publishing mints the site's next revision, renders it and writes it to shared
storage, with no filesystem anywhere on the path — the whole act runs inside the
edge runtime against the cloud store. The first publish of a site is revision 1
and each later one is the next number up; the change list the publish reports
names the store's own keys (the site record, each page, each asset) rather than a
filesystem's paths, and every path is reported as added on a first publish.

Publishing is driven identically from the builder and from the command line:
both produce the same store state from the same draft on the same store. There is
exactly one publish implementation and no second handler behind the builder's
publish route — the local transport no longer answers publish itself, and the
separate content-addressed deploy command it used to call no longer exists.

After a publish, the builder's site listing reports that revision as the site's
live one, where it previously reported that nothing was known.

## Verification

Import a site into the cloud store and publish it through the builder's publish
request, inside the Workers runtime, against a real database and object store.
Assert the response reports revision 1 as newly published; that the change list
names the site record and the page record as added; that the rendered entry
document and the frozen definition are both readable under that revision's
location; and that the site listing afterwards reports that revision as live.
Then publish the same draft on the same store by calling the publish the command
line uses and assert the resulting store state is identical. Confirm the builder's
publish route has no handler of its own besides the shared one, and that no deploy
command remains in the tool.