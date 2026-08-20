---
uid: acceptance_criterion-24fae61d
id: AC-1058
type: acceptance_criterion
title: Every operation the assistant is offered is granted, takes no site, and reaches
  no path
created_by: xgd
created_at: '2026-08-10T08:36:02.679145+00:00'
updated_at: '2026-08-20T04:43:38.553406+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The operations the assistant is offered are exactly those its grant allows.
None of them reads, writes or searches the operator's filesystem, and none of
them accepts a site as a parameter — so acting on a site other than the one its
conversation was opened for is not a mistake available to it. Where a system
knowledge base is built, the corpus-reading operations it gains are no exception:
they reach documents by knowledge-base name and document identifier, never by
path, and they too take no site. Its priming names the site it is working on and
is assembled from the operations it was actually granted, including a stated
account of what deliberately has no operation, so it can answer for an absent
capability rather than discover it by failing.

## Verification
Run a turn and inspect what the assistant was given: the offered operations
include the site-changing and site-reading ones, include no file-reading,
file-writing or file-searching operation, and none declares a site parameter —
including any knowledge operations present, which declare a knowledge-base name
or a document identifier and no path. Its priming names the site under work,
describes what it can do, and carries a stated "not available" section.
