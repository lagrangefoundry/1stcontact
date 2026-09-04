---
uid: acceptance_criterion-2a7a9d2b
id: AC-1291
type: acceptance_criterion
title: Building the knowledge base runs the whole pipeline in order and reports what
  it produced
created_by: xgd
created_at: '2026-08-20T04:16:32.869738+00:00'
updated_at: '2026-09-04T02:46:13.569263+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Asking to build the knowledge base runs the whole pipeline in one go — corpus, document index, passage index, awareness map, in that order — and reports what it produced: how many documents are in the index, how many of them were newly embedded on this run, how many passages the passage index holds, how many territories the map has, how many validated ways in those territories have between them, and which describing backend wrote the map's prose.

On success the tree afterwards holds a corpus of documents, a document index, a passage index and a map, and the report's document count matches the number of documents in the corpus.

**A command that reports what it produced has to have produced it first.** The same holds of the command that writes the generated artefacts the assistant is shipped with: every figure in its report describes work that has actually finished and landed on disk by the time the report is printed. A report of empty or unnamed artefacts alongside a successful exit is a failure of this criterion, not a cosmetic one — it is a build that says it succeeded and wrote nothing, and everything downstream of it is then built against artefacts that are not there.

## Verification

Drive the build end to end over a small corpus with the two external models (embedding and describing) stood in for, and assert every reported figure against the tree it left behind: the corpus files present, both index directories present, the map file present, and the reported territory count equal to the number of territories the map actually names.

Separately, run the command that writes the generated artefacts and assert its report against the tree: every artefact the report names exists on disk with the content the report describes, and no reported field is empty or unnamed while the exit says success.
