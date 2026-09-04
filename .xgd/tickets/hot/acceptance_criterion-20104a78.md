---
uid: acceptance_criterion-20104a78
id: AC-1501
type: acceptance_criterion
title: The document listing the export reads is exhaustive, and a truncated listing
  is refused by name rather than silently shortening the corpus
created_by: xgd
created_at: '2026-09-04T02:15:53.914425+00:00'
updated_at: '2026-09-04T02:22:08.345854+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The document listing the export reads is **exhaustive**: it asks the ticket store for every matching document rather than for a page of them, and every matching document reaches the corpus however many there are — including past the store's default page boundary.

Asking is not enough on its own, so the answer is **checked**. A listing that comes back truncated anyway — an older tool on the path, a flag that has stopped meaning what it meant — is **refused by name**: the export fails loudly, saying that a truncated listing arrived, how many documents it carried, and that the request was for all of them. It never shortens the corpus to whatever arrived. A quietly shorter corpus is the exact failure this rule exists to prevent: there is no error, no warning, and the symptom surfaces much later and several artefacts downstream as an assistant that does not know a thing it should.

## Verification

Export against a document store deliberately **larger than one page** — a store that fits in a page passes this vacuously, which is how the original defect survived — and assert every matching document reaches the corpus, none dropped at the page boundary. Assert the request itself asks for the whole store rather than a page. Then assert both answers to that request: a store that returns everything is accepted, and a store that returns a truncated listing regardless of what was asked causes the export to fail with a message naming the truncation, rather than producing a short corpus.