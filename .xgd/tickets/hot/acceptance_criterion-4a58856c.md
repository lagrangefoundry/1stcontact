---
uid: acceptance_criterion-4a58856c
id: AC-1633
type: acceptance_criterion
title: The document listing is exhaustive past the store's default page, and a truncated
  envelope is refused by name
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:17:39.039891+00:00'
updated_at: '2026-09-11T02:30:28.425372+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The export reads **every** document in the store, not the first page of them. The store pages its answers by default and reports the remainder in the envelope it returns; a reader that takes the items and stops takes page one and calls it the corpus, with no error and no warning. The export therefore asks for the whole store rather than for a page.

Asking is not enough on its own, so the envelope that comes back is **checked as well as asked for**. If an answer arrives carrying a continuation — a cursor, or a truncation marker — despite the request for everything, the export **fails loudly and names the affordance** that should have prevented it, reporting how many items it did receive and saying that the corpus would otherwise be silently short. It does not proceed with the short list. An envelope that carries no continuation is accepted as complete, whether it holds one page or many.

The failure is a refusal rather than a warning because every other failure this pipeline guards against has the same shape: a corpus quietly smaller than intended, with the symptom appearing much later and several artefacts downstream.

## Verification

Export against a store holding more documents than a single default page, and assert every document past the page boundary reaches the corpus — a fixture smaller than one page passes vacuously, which is how this class of failure survives. Assert the request made to the store asks for the whole store rather than a page. Against a store that returns a truncated envelope regardless, assert the export fails, that the message names the affordance and the count received, and that no short corpus is written. Against a store whose complete answer fits in one page, assert it is accepted.