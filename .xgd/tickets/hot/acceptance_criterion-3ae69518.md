---
uid: acceptance_criterion-3ae69518
id: AC-1295
type: acceptance_criterion
title: A document is in the knowledge base by carrying the knowledge-base kind, and
  the retired boolean is not membership
created_by: xgd
created_at: '2026-08-20T04:16:45.054659+00:00'
updated_at: '2026-09-04T02:15:14.656961+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A document is in the knowledge base when its ticket carries the knowledge-base **kind** — a single-valued marker in the document's own classification, matched exactly. Every other state is out:

- the ticket carrying a different document kind
- the ticket carrying no kind at all
- the ticket carrying no fields at all
- the ticket carrying the **retired boolean opt-in** this pipeline used before, in any shape it ever had — `true`, the text `"true"`, or the number `1`

The retired boolean is **not membership and is not honoured at all**. It is replaced, not extended: there is one membership rule rather than two, because honouring both would put a document in front of a client-facing assistant on a marker nobody maintains any more, and would leave two answers to "is this document in".

Membership fails safe in the same direction it always did: a document carrying some other kind, or none, is out until somebody says otherwise.

## Verification

Assert the membership decision directly across the whole spread of field shapes — the membership kind, a different kind, an absent kind, no fields at all, and the retired boolean in each of its plausible spellings — and assert the integration half against the real document store: the set of documents the export produced is exactly the set the rule selects, no document silently added and none silently dropped, and no excluded document has a file in the corpus.
