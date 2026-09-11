---
uid: acceptance_criterion-aa55ad5c
id: AC-1647
type: acceptance_criterion
title: The built knowledge base is packed as an importable module carrying both indexes
  and the corpus, with each document keeping its own stamp
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:56:34.314358+00:00'
updated_at: '2026-09-11T02:56:34.314358+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The built knowledge base is also available as an **importable module** — the same knowledge base expressed as values a runtime with no filesystem can hold, so the query path has no disk and no network on it at all.

It carries **both** indexes and the corpus itself:

- the document index and the passage index, each whole — the vectors and every sidecar the index writes beside them. One without the other would leave the knowledge base technically present and practically useless, since a whole design document is far too coarse a unit to hand back as an answer.
- the corpus text, keyed by the same filename a citation resolves to, including the generated awareness map, so a cold session can be primed as well as answered.
- **nothing but documents.** The index files sit inside the corpus directory on disk; they must not arrive as documents of their own.

The vectors travel in a text encoding that survives a module intact, never through a character round trip — a round trip replaces every invalid byte sequence and corrupts the index into one that still loads.

And **every document carries its own last-changed stamp**, not a shared default. The failure this prevents is silent: a bundled reader stamps everything with the epoch unless it is told otherwise, while the build's own reader takes each file's modification time — so a stamp-free packing hands the runtime a corpus dated 1970 against an index built against one dated today. Nothing errors; the two halves simply disagree about how recent every document is, and that is the ranker's own input.

## Verification

Build a small knowledge base end to end over a couple of documents plus a map, with the embedding model stood in for, then read it back as values. Assert both indexes are present and non-empty and that the document index's sidecar names a document that was indexed; assert the vector payload is in the text encoding rather than raw or re-encoded; assert the corpus is keyed by document filename, includes the map, contains a document's own text, and contains nothing that is not a markdown document. Assert every document's stamp parses as a real time and is not the epoch default.
