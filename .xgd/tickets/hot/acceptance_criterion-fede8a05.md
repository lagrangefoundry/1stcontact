---
uid: acceptance_criterion-fede8a05
id: AC-2127
type: acceptance_criterion
title: Two businesses driven through one server instance get separate chat hosts;
  a turn in one is invisible to the other
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:34.046744+00:00'
updated_at: '2026-11-01T10:26:34.046744+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When chat turns for business A and then business B are handled by the same server instance (isolate):
- B's turn runs against B's site store, ticket store, and project corpus, never A's cached ones
- A's turn appears neither in B's chat transcript nor in B's corpus, and the reverse also holds
- repeated turns within one business reuse that business's conversation state
- if building the chat host for a business fails, the failure is not cached. A later request for that business tries again and can succeed, and other businesses are unaffected.

## Verification
In one isolate, send a prompt under `/b/<A>/` then one under `/b/<B>/`. Assert that B's transcript and corpus contain nothing from A's turn and the reverse. Force one host build to fail, then assert that a following request for that business builds afresh.
