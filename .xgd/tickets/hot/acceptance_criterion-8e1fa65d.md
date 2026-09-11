---
uid: acceptance_criterion-8e1fa65d
id: AC-1645
type: acceptance_criterion
title: A generated reference names its source in its body and states that it is rebuilt
  on every build
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:35.054922+00:00'
updated_at: '2026-09-11T02:36:35.054922+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

Each generated reference names the source its facts came from in the body of the
document itself, not only in its declared attributes, and states in the body that
it is rebuilt from that source on every build and that an edit made to it is lost.

Retrieval hands back passages, and a passage carries none of the document's
declared attributes — so a reader handed a fragment mid-conversation must still be
able to say where the fact came from, and an operator who wants a fact changed
must be told that editing the document is not how.

## Verification

Read each generated reference: near the top of the body it names its source in
prose and warns that the document is regenerated on every build and must not be
edited. Confirm the same source name appears both in the body and in the
document's declared attributes, so the two cannot disagree.
