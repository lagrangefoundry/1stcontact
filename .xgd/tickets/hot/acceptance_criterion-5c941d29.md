---
uid: acceptance_criterion-5c941d29
id: AC-1796
type: acceptance_criterion
title: A client corpus small enough to list reaches the conversation listed in full
  and labelled complete
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:12.945549+00:00'
updated_at: '2026-09-14T06:52:08.182098+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

When the client's knowledge is small enough that a listing beats a summary, the
map the conversation is primed with names every document in it and says
explicitly that the listing is complete.

The label is not decoration: a short list read as "knowledge here is thin"
produces very different behaviour in front of a new client than the same list
read as "this is everything there is".

## Verification

Upload a single document to a site's knowledge, rebuild that client's map, and
confirm the rebuild chose the full-listing form. Open a conversation for the site
and take a turn. The context the assistant was given contains the uploaded
document's title and a statement that the corpus is small enough to be listed in
full.