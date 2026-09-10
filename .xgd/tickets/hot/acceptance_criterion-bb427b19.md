---
uid: acceptance_criterion-bb427b19
id: AC-1319
type: acceptance_criterion
title: A conversation is primed with the map and the operations manual, not with the
  documents, in that order
created_by: xgd
created_at: '2026-08-20T04:42:11.357745+00:00'
updated_at: '2026-09-10T22:02:09.122596+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
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

## Verification
With a built knowledge base, open a conversation and take a turn in it, then read
what the *model was actually sent* — not a priming assembled alongside the host
from the same inputs, which would pass whatever the host had wired. It contains
the map's territory headings and the document identifiers the map routes to; it
does not contain body text from those documents; the map appears before the
statement of the assistant's purpose, which appears before the operations manual;
and every tool that turn offered the model is named in that manual, so the
manual is demonstrably the projection of this session's grant.
