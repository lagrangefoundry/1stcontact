---
uid: acceptance_criterion-d9b95844
id: AC-2376
type: acceptance_criterion
title: The whole priming list — system prompt, landscape, purpose, how to search and
  the manual — sits before a single cache boundary declared at its end
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T05:11:22.278084+00:00'
updated_at: '2026-11-08T05:11:22.278084+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

Each of the session's priming lists declares **exactly one** cache boundary, and it is the **last** item. That holds for the order with a knowledge base and for the order without one. So every priming entry sits in the cached prefix:

- with a knowledge base: the role text, the product text, the landscape, the purpose, and how to search (which carries the grant-projected manual);
- without one: the role text, the product text and the manual.

Consequences, each observable:

- **The whole priming is one cached prefix.** The cache breakpoint handed to the model backend falls at the end of the assembled priming. It does not fall after the first text entry, which is where the framework's computed rule would put it without a declared marker. Nothing in the priming is re-sent uncached on each turn.
- **Nothing in the priming is volatile.** The landscape and the manual are assembled **once per session** and re-delivered, not re-read on every turn. Anything that changes within a session reaches the model through the per-turn reminder instead.
- **The boundary renders nothing.** The marker is a position, not text: the assembled priming contains no trace of it.

## Verification

Read the shipped configuration. Each priming list contains exactly one cache-boundary marker, at its last position, and the reminders contain none. Assemble a consultant session's priming with a knowledge base. The reported cache offsets cover the whole assembled priming (the last offset equals its length), and the volatile set is empty. Run one cold start and several turns while counting landscape-provider calls: the landscape is read once.
