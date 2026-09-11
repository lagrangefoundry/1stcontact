---
uid: acceptance_criterion-2a7a9d2b
id: AC-1291
type: acceptance_criterion
title: Building the knowledge base runs the whole pipeline in order and reports what
  it produced
created_by: xgd
created_at: '2026-08-20T04:16:32.869738+00:00'
updated_at: '2026-09-10T08:04:15.868146+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Asking to build the knowledge base runs the whole pipeline in one go — corpus, document index, passage index, awareness map, in that order — and reports what it produced: how many documents are in the index, how many of them were newly embedded on this run, how many passages the passage index holds, how many territories the map has, how many validated ways in those territories have between them, and which describing backend wrote the map's prose.

On success the tree afterwards holds a corpus of documents, a document index, a passage index and a map, and the report's document count matches the number of documents in the corpus.

The report covers **these** artefacts and no others. The fourth artefact — the same knowledge base packed as an importable module for a runtime with no filesystem — is not produced here and is not reported here: it is emitted by the build that assembles the deployable application, out of whatever this command last left behind, and is reported there. Running this command therefore leaves the packed module untouched, and an operator reading this report is reading the state of the tree rather than the state of a deployable.

## Verification

Drive the build end to end over a small corpus with the two external models (embedding and describing) stood in for, and assert every reported figure against the tree it left behind: the corpus files present, both index directories present, the map file present, and the reported territory count equal to the number of territories the map actually names. Assert the report names no packed-module figure, and that the build writes no such module.
