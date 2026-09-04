---
uid: acceptance_criterion-c41d7279
id: AC-1522
type: acceptance_criterion
title: A host offers only the knowledge bases it can resolve, never an empty one it
  cannot
created_by: xgd
created_at: '2026-09-04T03:19:53.888885+00:00'
updated_at: '2026-09-04T03:19:53.888885+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

Each host offers only the knowledge bases it can actually resolve against the records it holds.

A host that carries the shipped design-document corpus and has no client records offers the
system knowledge base alone: the client's knowledge base is **not present** on that host — it is
not offered as searchable, it does not report itself as an empty corpus, and it contributes no
apology for a map that host will never build. Conversely, the host that holds a client's records
serves the client's knowledge base.

## Verification

Take the host that builds and serves the shipped design-document corpus, and ask which knowledge
bases it serves: exactly one, the system corpus. Search and priming from that host reference no
client corpus and produce no "0 documents" report for one. Take the client-serving host and
confirm it resolves the client's knowledge base against the client's own records. Both hold with
the single shared declaration in place, which declares both knowledge bases.
