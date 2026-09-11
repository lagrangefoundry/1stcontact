---
uid: acceptance_criterion-924d1362
id: AC-1646
type: acceptance_criterion
title: Asking in words what a component supports returns a passage from the generated
  reference
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:39.452893+00:00'
updated_at: '2026-09-11T02:51:25.979906+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

A question asked in ordinary words about what a component supports is answered
from the generated reference: searching the built knowledge base for such a
question returns the generated component reference among its results, and the
passage handed back is the one carrying both the component asked about and the
setting asked about.

Nothing in the question names a document, a filename or a source — the asker does
not know the reference exists, and does not have to. This is the criterion the
whole capability exists for: the generated reference has to be reachable through
the same retrieval path as an authored document, or it is a file on disk that
changes nothing about what the assistant knows.

## Verification

Build the knowledge base over a corpus that includes the generated references,
then search it with a natural-language question about a setting that only the
component catalogue carries ("does the carousel component support autoplay"). The
results include the generated component reference, and its returned passage
contains both the component name and the setting name. Rank is not asserted — the
claim is that the reference answers the question, and pinning an ordering against
a test embedder would be evidence about the embedder rather than about the corpus.