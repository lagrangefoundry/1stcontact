---
uid: acceptance_criterion-bb427b19
id: AC-1319
type: acceptance_criterion
title: A conversation is primed with the map and the operations manual, not with the
  documents, in that order, on either host
created_by: xgd
created_at: '2026-08-20T04:42:11.357745+00:00'
updated_at: '2026-09-04T03:03:16.156872+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
What a conversation is primed with, when a knowledge base is built, is a map of
what the corpus contains and the means to pull the rest — never the document
bodies. The primed text names the corpus's territories and, for each, where to
start reading; it does not carry the prose of the documents it describes. Its
order is load-bearing: the map first, then what this assistant is here to do,
then the projected manual of the operations it was actually granted last, so the
last thing read is the thing done first and the corpus is reached through this
session's real grant rather than through a sentence written by hand about what it
might have. Adding documents to the corpus therefore does not grow the primed
context.

This holds on the deployed host as well as on the operator's own machine. A
conversation taken in the deployed runtime, against the corpus that travelled
with the release, is primed with the same map in the same order — so a session
that is offered the knowledge operations there is also told there is something to
find, rather than being handed a search it has no reason to reach for.

## Verification
With a built knowledge base, inspect the priming a conversation is opened with:
it contains the map's territory headings and the document identifiers the map
routes to; it does not contain body text from those documents; and the map
appears before the statement of the assistant's purpose, which appears before the
operations manual.

Repeat inside the deployed runtime against a corpus carried in the release
artifact: take a turn, and what the model was given for that turn contains the
map's territory headings and the identifiers it routes to, contains no body text
from the documents behind them, and offers the knowledge operations beside the
site operations in the same turn.
