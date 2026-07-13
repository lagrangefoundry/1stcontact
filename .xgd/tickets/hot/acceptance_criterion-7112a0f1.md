---
uid: acceptance_criterion-7112a0f1
id: AC-618
type: acceptance_criterion
title: Round-trip invariant holds over all block kinds
created_by: xgd
created_at: '2026-07-13T21:00:30.774171+00:00'
updated_at: '2026-07-13T21:00:30.774171+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
Serializing any styled-text document to its markup string and then parsing that markup back yields a document deep-equal to the normalized form of the original. For a document that is already normalized (no two adjacent inline runs within a block share identical formatting, and no two adjacent sibling lists share the same ordered-ness), the parsed result equals the original exactly. This holds for documents mixing every block kind — paragraph, heading, list, blockquote, code, table — nested to arbitrary depth, and for inline runs carrying dense per-run style overrides.

## Verification
Property test: generate arbitrary documents across all block kinds and nesting depths (500+ seeds), serialize then parse each, and assert the result deep-equals the normalized original; assert exact equality for the normalized subset.
