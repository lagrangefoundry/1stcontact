---
uid: acceptance_criterion-038a6f21
id: AC-1305
type: acceptance_criterion
title: The declaration is what the build actually uses, is never overwritten by a
  build, and a missing declaration is refused by name
created_by: xgd
created_at: '2026-08-20T04:17:10.740286+00:00'
updated_at: '2026-08-20T04:17:10.740286+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The declaration is the thing actually in force, not a document describing what the build separately decides. Every declared value — the knowledge base's prompt, its ranking weight, and the predicate that says which documents belong to it — is what the build and the reader use, so editing the declaration changes what gets built and how it ranks.

The declaration is **authored data**: it is written once when absent so a fresh checkout can build without hand-writing a file, and a build never overwrites an existing one. A tuned prompt or an adjusted weight survives every rebuild.

A tree that declares no knowledge base under the expected name is refused with a message naming what *is* declared, rather than silently building nothing.

## Verification

Write a declaration with a distinctive prompt, a non-default weight and a stated membership predicate; bind the knowledge base and assert all three come back as declared. Run a build and assert the declaration file is byte-identical afterwards. Bind against a declaration naming a different knowledge base and assert the failure names both the expected name and the declared ones.
