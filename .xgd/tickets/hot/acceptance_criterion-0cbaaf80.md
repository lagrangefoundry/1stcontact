---
uid: acceptance_criterion-0cbaaf80
id: AC-2100
type: acceptance_criterion
title: A document present in a manifest under an older version than the corpus file
  counts as skew and is refused the same way
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:04:49.866528+00:00'
updated_at: '2026-11-01T09:04:49.866528+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A corpus document that **is** present in the index manifests, but under a **different version** from the one the corpus file carries, counts as **stale** and refuses the pack exactly as a missing one does — non-zero exit, nothing about the knowledge base written, the document named.

- The version compared is the document's last-changed stamp; the corpus and both manifests must carry the **same** value. Any difference is stale — an older manifest stamp (the index was built before the document changed) and equally any other mismatch, because either way the vectors were built from text the corpus no longer holds.
- The refusal lists stale documents under their own `STALE` heading (ranked by vectors built from text they no longer have), separately from missing ones, so the operator can see which state each document is in.
- Rebuilding the indexes clears the finding: after a rebuild the same document is neither missing nor stale.

## Verification

Build a fixture knowledge base, then rewrite one indexed document so its file stamp moves past the manifest's. Assert the agreement check reports that document as stale and not as missing, and that the refusal text carries the `STALE` heading and the document id. Re-run both index passes and assert the document is no longer stale.
