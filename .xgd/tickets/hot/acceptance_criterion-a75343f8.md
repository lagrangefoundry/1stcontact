---
uid: acceptance_criterion-a75343f8
id: AC-2096
type: acceptance_criterion
title: Searching for words deep inside a document still finds that material by its
  own uid, while the material's listed description is the digest
created_by: xgd
created_at: '2026-11-01T03:16:53.116105+00:00'
updated_at: '2026-11-01T03:16:53.116105+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

Moving a document's text out of its body costs **no retrieval depth**.

- Once the ingestion returns, a search for a phrase that appears only deep inside the document's
  text — not in its digest, title or filename — returns a passage hit for that material.
- The hit identifies the **material itself** by its own identifier, never the text comment that
  holds the words.
- The material-level listing and index read the **digest**: the material's listed description is
  the digest, and the text comment does not appear as a material, a listing entry or a
  member of the material-level index of its own.
- Material with no text comment is indexed exactly as before.

## Verification

Ingest a long document whose digest (from a stubbed describer) and title do not contain a
distinctive phrase placed far into its text. Without any further rebuild, search the client's
knowledge base for that phrase and assert a passage hit whose parent identifier is the material's
uid, not the comment's. Read the material-level listing and assert the material's entry shows the
digest, and that no entry exists for the comment.
