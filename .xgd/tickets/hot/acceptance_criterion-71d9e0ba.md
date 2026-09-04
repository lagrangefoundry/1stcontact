---
uid: acceptance_criterion-71d9e0ba
id: AC-1500
type: acceptance_criterion
title: 'The shipped corpus is unrestricted: a file in the corpus directory is resolved
  whatever its frontmatter, and scaffold and declaration say so identically'
created_by: xgd
created_at: '2026-09-04T02:15:48.563838+00:00'
updated_at: '2026-09-04T02:15:48.563838+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The shipped knowledge base's corpus is **unrestricted**: once the export has written the corpus directory, the directory itself is the boundary, and a markdown file sitting in it is resolved as a corpus document **whatever its frontmatter says** — full frontmatter carrying the membership marker, frontmatter with no fields block, or no frontmatter at all.

Re-applying the export's own selection as a query-time predicate would be a build-time filter re-run as if it were a membership rule. It can only ever subtract, and the only thing it can subtract is a file whose frontmatter does not look the way the predicate expects — which then disappears from the knowledge base with no error and no warning.

The declaration the build actually uses and the declaration a fresh checkout is scaffolded with say this **identically**. Both are asserted rather than only the shipped one, because a build never overwrites an existing declaration, so the two can drift apart with nothing reporting it.

## Verification

Assert this behaviourally as well as structurally. Structurally: read both the declaration committed to this repository and the declaration scaffolded into an empty tree, and assert each declares the shipped knowledge base's corpus with no selection predicate at all. Behaviourally: place three markdown files in a corpus directory — one with full frontmatter carrying the membership marker, one with frontmatter but no fields block, one with no frontmatter whatsoever — and assert that resolving that knowledge base's corpus returns all three, the last being the case a query-time predicate drops silently.
