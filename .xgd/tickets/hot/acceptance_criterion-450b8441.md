---
uid: acceptance_criterion-450b8441
id: AC-2474
type: acceptance_criterion
title: When nothing can embed, the project KB refuses by name, the system KB answers
  null, and a session still opens
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:09.505987+00:00'
updated_at: '2026-11-08T21:30:48.352106+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

When the deployment can reach no model at all (no binding declared and neither
REST credential set), each consumer degrades exactly as it did before the REST
transport existed:

- the **project knowledge base** refuses with the named not-configured error (see
  AC-1664), because a client's uploads that embed nowhere are invisible;
- the **system knowledge base** answers "no knowledge base" (null) and does not
  throw, because a builder that cannot answer a question about the design
  documents is still a builder;
- a **session** still opens with whichever knowledge bases it can reach, skipping
  the project half without raising.

## Verification

With no binding and no credential: assert that opening the project knowledge base
raises the not-configured error, that opening the system knowledge base returns
null without throwing, and that opening a session completes without throwing and
contains no project knowledge base.