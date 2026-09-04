---
uid: acceptance_criterion-1f4f81e4
id: AC-1502
type: acceptance_criterion
title: Every declared source of truth produces a reference document in the corpus,
  each named in the build report
created_by: xgd
created_at: '2026-09-04T02:26:39.799204+00:00'
updated_at: '2026-09-04T02:41:25.977414+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

Building the knowledge base places one generated reference document in the corpus for every source of truth the product declares — today three: the components a site can use, the vocabulary a page is written in, and what can be changed and how. The set is complete or the build is not: a source that produced no reference is a source the assistant will be silently unable to answer about.

Each generated document is named individually in the command's report, not merely counted, because a generated document has no ticket behind it — an operator who cannot find one in the ticket store needs to be told it was produced rather than sent looking.

## Verification

Build the corpus into an empty tree. Assert the corpus directory contains exactly one reference document per declared source (the whole set, asserted as a set rather than by sampling one member), and that the command's report names each of them. Repeat after removing the corpus directory to confirm the set is produced from nothing rather than found.