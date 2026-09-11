---
uid: acceptance_criterion-3f0182e4
id: AC-1742
type: acceptance_criterion
title: A newly invited account owns one starter site whose published address cannot
  collide with another account's
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:29.920626+00:00'
updated_at: '2026-09-11T06:28:29.920626+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A newly invited account owns exactly one site, with one page carrying editable
starter content, so a person arriving for the first time finds something to edit
rather than an empty account and no way to create a site. The site's published
address is unique to that account by construction: published addresses are
claimed across the whole platform, so two accounts provisioned the same way can
never be refused for claiming the same address.

## Verification

Issue an invite, then list the sites belonging to the reported account: assert
exactly one, and that its starter page contains the starter heading. Issue a
second invite and assert the two accounts' starter sites carry different
published addresses, so neither could refuse the other's publication.
