---
uid: acceptance_criterion-76a505ce
id: AC-1531
type: acceptance_criterion
title: A small corpus is listed in full, says it is complete, and emphasises nothing
created_by: xgd
created_at: '2026-09-04T03:36:42.624249+00:00'
updated_at: '2026-09-04T03:46:51.163582+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

While the listing of a client's documents fits inside the configured character budget, the landscape
built for that client is a **complete listing**, not a summary:

- every document in the corpus is named in it, each identified well enough to ask for
  (its own identifier and what kind of record it is), and none is omitted or grouped away;
- it states in words that this is a complete listing of everything there is — not a summary of the
  corpus and not a sample of it — and gives the number of documents it covers;
- nothing in it is marked for emphasis, because an emphasised term in a landscape is read as a
  search route proven to retrieve what it names, and a listing has proven no route;
- the build reports itself as the listing form rather than the clustered form;
- it is produced with no description capability supplied at all, so the ordinary case for a new
  client costs no model call.

## Verification

Against a client with a small number of documents whose listing fits the budget, build the landscape
with no description capability supplied. Observe the reported form is the listing form and the
reported document count matches the corpus; observe every document's title appears in the body;
observe the body states it is a complete listing and that this is everything there is; observe no
emphasis markers occur anywhere in the body.