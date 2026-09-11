---
uid: acceptance_criterion-b1dc1e0b
id: AC-1632
type: acceptance_criterion
title: The shipped and scaffolded declarations restrict nothing, and a markdown file
  in the corpus is resolved whatever its frontmatter
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:17:31.298628+00:00'
updated_at: '2026-09-11T02:17:31.298628+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The shipped knowledge base declares an **unrestricted corpus**: it states no membership predicate at all, and neither does the declaration written into a tree that has none. The directory of exported documents is itself the boundary, so nothing re-applies the export's own selection when the corpus is read back.

The consequence is behavioural, not cosmetic: **a markdown file sitting in the corpus directory is resolved whatever its frontmatter.** A file with full frontmatter, a file with no fields block, and a file with no frontmatter at all are each readable as a document of the knowledge base and each reachable through it. A query-time predicate could only ever subtract, and the only thing it could subtract is a file whose frontmatter does not look the way the predicate expects — which is that file disappearing from the knowledge base with no error, the failure this pipeline is written against.

Both the shipped declaration and the one a fresh tree is given must be asserted, because a declaration is never written over an existing one: the two can drift apart with no error, and a scaffold that restricts what the shipped file does not would give a fresh checkout a quietly different knowledge base.

## Verification

Assert the corpus section of the declaration shipped in the repository states no restriction. Scaffold a declaration into an empty tree and assert the same of it. Then prove it behaviourally rather than structurally: place three markdown files in a corpus directory — one with full frontmatter, one carrying no fields block, one with no frontmatter at all — and assert all three resolve as documents of that knowledge base.
