---
uid: acceptance_criterion-33f29429
id: AC-1303
type: acceptance_criterion
title: The map is generated from the corpus it describes, names its territories in
  the corpus's own words, and names any territory with no way in
created_by: xgd
created_at: '2026-08-20T04:17:08.039683+00:00'
updated_at: '2026-08-20T04:37:23.861104+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The map is **generated from the corpus it describes**, never assembled from fixed text: it divides the corpus into at least two named territories, each described in prose that uses the corpus's own vocabulary — a map built from constants would satisfy a mere existence check and would fail this one.

Each territory carries ways in that were validated by *the same search a reader uses*, over the same index and the same ranking; a territory for which no way in could be validated is **named** in the build's report rather than passed over silently.

## Verification

Build the map over a corpus of known, clearly separate subjects and assert: the reported territory count is at least two; the map's text contains subject words drawn from the documents rather than only structural boilerplate; the reported number of validated ways in is consistent with what the map records. Separately, build over a corpus containing a document no query reaches and assert its territory is reported as having no way in.