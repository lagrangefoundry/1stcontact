---
uid: acceptance_criterion-dead3c88
id: AC-1304
type: acceptance_criterion
title: The map is kept out of the corpus it describes, and is retrievable as that
  knowledge base's awareness report
created_by: xgd
created_at: '2026-08-20T04:17:09.433631+00:00'
updated_at: '2026-08-20T04:17:09.433631+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The generated map is **not a member of the corpus it describes**: resolving the knowledge base's corpus returns exactly the exported documents and never the map. Otherwise each rebuild would cluster the previous build's map and the knowledge base would slowly fill with descriptions of its own descriptions.

The map is nevertheless **retrievable as the knowledge base's awareness report** through the ordinary lookup — by kind and by which knowledge base it belongs to — with no second, file-shaped path that only a shipped knowledge base would use.

## Verification

After a full build, resolve the knowledge base's corpus and assert it equals exactly the set of exported documents with the map absent. Then look the map up as the awareness report for that knowledge base and assert it is found, that it declares itself an awareness report, and that it names the knowledge base it describes.
