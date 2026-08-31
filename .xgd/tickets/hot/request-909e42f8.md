---
uid: request-909e42f8
id: REQ-164
type: request
title: 'Corpus export correctness: doc_kind filter, unrestricted shipped corpus, exhaustive
  listing'
created_by: xgd
created_at: '2026-08-31T20:33:32.231166+00:00'
updated_at: '2026-08-31T20:33:32.231166+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  depends_on:
  - REQ-827
  auto_merge_back: true
  needs_review: false
---

# Corpus export correctness: the `doc_kind` filter, an unrestricted shipped corpus, and exhaustive listing

## Why these are one ticket

Three small changes to `1c kb export` / `1c kb build` that share a single failure
mode: **each one silently produces a smaller corpus than intended.** No error, no
warning — just an index that builds, works, and is missing documents. The symptom
surfaces much later as *"the assistant doesn't seem to know about that"*, several
artifacts downstream of the cause.

They also cannot land separately without leaving a window where the export is
wrong. [[REQ-158]] cannot produce a corpus anyone should trust until all three
are done.

## 1. The export filter reads `doc_kind`, not `system_kb`

[[DOC-39]] §3.3 settles membership as **`doc_kind: system_kb`** — a kind rather
than a boolean, because a flag invites *"this architecture document is **also** a
system document"*, which is the category error [[DOC-39]] §3.1 exists to prevent.

State of play: the `system_kb: true` boolean has already been cleared from all 38
doc tickets, and four documents have been chosen for reclassification — DOC-33
(Consultation Playbook), DOC-35 (Personas, Modes & Registers), DOC-31
(Differentiation Audit) and DOC-17 (Design Lessons Log). They are a *starting*
corpus flagged for rewriting, not the finished set: all four were written for us
rather than for the AI ([[DOC-39]] §3.5).

**Blocked on xgd REQ-827**, which adds `system_kb` to the `doc_kind` enum — the
enum is closed and defined in xgd source, so the value cannot be set until it
ships.

## 2. The shipped KB's corpus becomes unrestricted

Today the KB config re-applies `type=doc AND fields.system_kb=true` **at query
time**, against a directory where everything already matched by construction. It
is a build-time filter being re-run as if it were a membership rule, and it is
most of why this looked like more mechanism than it is ([[DOC-39]] §3.3).

At runtime the distribution *is* the corpus: a directory of markdown served
through the ticket interface by a read-only store. So `corpus: {}`.

Leaving the predicate in place has a real cost beyond redundancy — a file placed
in the corpus directory without the expected frontmatter is silently invisible.

## 3. `readDocTickets` must list exhaustively

```js
const raw = execFileSync('xgd', ['ticket','list','--type','doc','--view','--json'], …)
return (JSON.parse(raw).items) ?? []      // takes page one, ignores next_cursor
```

`xgd ticket list` pages at 50. There are 38 doc tickets. At 50 the export begins
dropping documents with no error and no warning — the JSON envelope carries
`next_cursor`, and this consumer never looks at it.

xgd REQ-825 has landed and added an exhaustive affordance; use it rather than
hand-rolling a cursor loop.

## Why the count is close enough to matter

38 of 50. Two more documents than we have and the corpus starts shrinking
silently — and this line of work adds documents.

## Acceptance

- The export selects exactly the doc tickets carrying `doc_kind: system_kb`, and
  the four named documents carry it.
- The shipped KB declares an empty corpus; a markdown file placed in the corpus
  directory is indexed regardless of its frontmatter.
- `readDocTickets` returns every matching ticket, asserted against a fixture
  larger than one page.
- `1c kb status` reports a document count that matches the number of tickets
  carrying the marker — so a truncated export is visible rather than inferred.

## Depends on

xgd **REQ-827** (the `doc_kind` enum value) for part 1. Parts 2 and 3 are
independent of it and of each other, but shipping them apart leaves the export
wrong in a different way each time.
