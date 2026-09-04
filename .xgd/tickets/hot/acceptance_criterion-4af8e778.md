---
uid: acceptance_criterion-4af8e778
id: AC-1514
type: acceptance_criterion
title: The built knowledge base is also an importable module, carrying both indexes,
  the corpus text, and each document's own last-changed time
created_by: xgd
created_at: '2026-09-04T02:46:18.671175+00:00'
updated_at: '2026-09-04T02:58:23.079649+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Once the knowledge base is built, it is also available as **an importable module** — the same corpus and the same two indexes as the on-disk tree, carried as values a runtime with no filesystem can hold. The module carries all three: the document index, the passage index (separate artefacts, not two modes of one), and the corpus text itself.

Two things make it *the same* knowledge base rather than a lossy copy:

- **The vectors survive the trip.** The index's binary payload is carried in a form a module can hold without passing through a text round trip, which would silently replace every invalid byte sequence and leave an index that still loads and no longer means anything. Whatever sidecar files the index is made of travel with it, so an index that grows another one is carried without anything being told about it.
- **Every document carries its own last-changed time.** Each document in the module is stamped with the stamp its own file carries, not with a single shared default applied to the whole corpus. The stamp is the ranker's own input, so a corpus stamped uniformly would be a *differently dated* corpus from the index it was built against — the two would disagree about how recent every document is, with nothing erroring and nothing saying so.

## Verification

Build a small corpus end to end through the release path with the embedding model stood in for, then read it back as the importable artefact and assert: both index directories are carried, file for file, under the index's own names; the vector payload round-trips byte-identically rather than through text; and the corpus text is carried whole. Give the corpus documents distinct last-changed times on disk, and assert each document in the module carries its own — not one value repeated, and not a default stamp.