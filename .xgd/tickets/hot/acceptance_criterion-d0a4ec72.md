---
uid: acceptance_criterion-d0a4ec72
id: AC-1504
type: acceptance_criterion
title: A change to a source appears in its reference on the next build, with no document
  edited by hand
created_by: xgd
created_at: '2026-09-04T02:26:48.252656+00:00'
updated_at: '2026-09-04T02:41:25.623065+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

A change to a source of truth appears in that source's reference on the next build, with no document edited by hand and no separate step to remember. Adding a component to the catalogue, changing a setting's permitted values, or adding an operation to the declared control surface each show up in the corresponding reference the next time the knowledge base is produced.

This is the whole reason a reference is generated rather than written: there is no state in which the reference and its source disagree that survives a build.

## Verification

Build the corpus, record the reference for a source, then change that source (add an entry, alter a permitted value set) and build again without touching any document in the corpus. Assert the reference now carries the change and that no authored document was modified to make it so.