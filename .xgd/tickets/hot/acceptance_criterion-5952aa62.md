---
uid: acceptance_criterion-5952aa62
id: AC-1520
type: acceptance_criterion
title: The client's search index is stored privately, per account, and where nothing
  can serve it
created_by: xgd
created_at: '2026-09-04T03:19:44.569728+00:00'
updated_at: '2026-09-04T03:19:44.569728+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

The stored artefacts that a client's search index is made of live in the platform's private
store, under a key path belonging to that one client, and:

- are absent from the store the public internet is served from, so nothing can request them by
  URL;
- lie outside the key space in which client attachments are addressed, so no attachment address
  can name an index artefact and no index key can name an attachment;
- do not collide between two clients, and neither client's key path is a prefix of the other's.

This holds regardless of what the shipped design-document corpus does; the index for a client's
own knowledge is never carried inside the released application artefact.

## Verification

Index a client's corpus, then enumerate stored objects: the index artefacts are present in the
private store under that client's own path, and the public-serving store contains none of them.
Compare the index key path against the prefix under which client attachments are stored — neither
contains the other. Repeat for a second client and confirm the two paths are disjoint. Confirm the
released application artefact carries no client index.
