---
uid: acceptance_criterion-84506ae8
id: AC-2101
type: acceptance_criterion
title: The awareness map is held out of the agreement check because the corpus resolver
  excludes it, and the packing step reports every document it exempted
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:04:51.480394+00:00'
updated_at: '2026-11-01T09:16:50.788380+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A document packed as corpus text that the **corpus membership predicate excludes** — the awareness map — is **exempt** from the agreement check: it is never reported as missing or stale and never causes a refusal.

- The exemption is **by property, not by name**: it is whatever packed markdown document the predicate declines to return, so any second document excluded the same way is exempt for the same reason, and one that stops being excluded is checked from then on.
- The exemption is **visible**. The application build's knowledge-base report line names every exempted document — by id, not as a count — with the note that it is primed, not indexed.
- A pack with no exempted documents adds nothing to that line.
- An exempt document never appears in a refusal's list of reasons.

## Verification

Build a fixture knowledge base with a map written after indexing; assert the agreement check passes and reports exactly the map as exempt. Assert the formatted report line for a build with the map exempt names it with "primed not indexed", and the line for a build with no exemptions does not carry that phrase. Assert a refusal listing missing/stale documents does not mention the exempted one.