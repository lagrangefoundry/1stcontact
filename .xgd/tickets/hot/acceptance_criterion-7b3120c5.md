---
uid: acceptance_criterion-7b3120c5
id: AC-1677
type: acceptance_criterion
title: Above the floor with a describer, the landscape is a clustered map of described
  territories
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:56.958539+00:00'
updated_at: '2026-09-11T03:47:56.958539+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

When a client's corpus has outgrown the listing budget and a describer is
available, the landscape is a **clustered map of territories**: the corpus is
grouped, each group is described in prose, and the result is published as the
client's single map.

The build reports the clustered form and the count of documents it covered, and
the published map is recognisable as an awareness map of the client's knowledge
base rather than a listing of every document.

## Verification

Open a client knowledge base with a listing budget of zero so any corpus is above
the floor, add several material documents, refresh the index, and build with a
describer that returns a fixed territory description. Assert: the build reports
the clustered form and a document count matching the corpus; the published map's
text carries the description the describer produced and identifies itself as an
awareness map of this knowledge base; and the described territories number fewer
than the documents, so the result is a grouping rather than a per-document list.
