---
uid: acceptance_criterion-51835b53
id: AC-1422
type: acceptance_criterion
title: A second account cannot publish over a slug another account has claimed, and
  the live site is untouched
created_by: xgd
created_at: '2026-08-31T11:34:16.349163+00:00'
updated_at: '2026-08-31T11:46:20.401890+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

A published address belongs to the account that published it first. The claim is
made by the stored record's own uniqueness — the address is the primary key of a
claim table, so the database refuses the second claim rather than application
code remembering to check — and it is taken before any byte of the revision is
written.

Two accounts may each own a draft site with the same slug, because the draft side
carries the account in every key. Publishing is where that stops: a second
account publishing over a slug another has claimed is refused with an error that
names the address as already in use by another account and says to rename and
publish again. The refusal costs the claiming account nothing — the live site
serves the same bytes it served before, and the refused account's own revision
log stays empty. This is what makes it safe for the public URL grammar to carry
no account at all.

## Verification

Publish a site under one account, and record the bytes its published revision
serves. Create a second account, give it a draft site with the same slug, and
publish it. Assert the publish is refused with an error naming the address as
taken; that the first account's published bytes are byte-for-byte what they were;
and that the second account's revision log holds nothing.