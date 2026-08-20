---
uid: capability-45acba5e
id: CAP-100
type: capability
title: 'System Knowledge Base: The Corpus, Its Index & Its Generated Map'
created_by: xgd
created_at: '2026-08-20T04:14:21.909140+00:00'
updated_at: '2026-08-20T04:14:21.909140+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: system-knowledge-base
---

# System Knowledge Base: The Corpus, Its Index & Its Generated Map

The builder assistant's **domain knowledge** — what it knows about how this product is
designed and why — built from our own design documents as a **release artefact**.

It is the other half of "what the assistant knows". The control surface's generated
manual tells it what it can *do*; this capability tells it what the system *is*.

## What it is

- A **corpus**: the design documents, exported out of the ticket store into a directory
  of markdown that a document store reads. Derived, repeatably, on every build — never a
  second hand-maintained copy, because the drift would be silent and the knowledge base
  would confidently answer from a document nobody had updated in months.
- Two **indexes**: one over whole documents, one over passages. A design document is far
  too coarse a unit to hand back as an answer, so passage search is what makes a corpus
  of this size answerable at all.
- A **generated awareness map**: the corpus clustered into described territories, each
  with validated ways in. Generated and never hand-authored, because a map over a corpus
  spanning product, framework and process is exactly the artefact that goes stale unseen —
  and a stale map is worse than none, since it routes the agent confidently to the wrong
  place.

## Membership is opt-in, on the document

A document is in the knowledge base when it says so in its own frontmatter. Inclusion
rather than exclusion, deliberately: an exclusion list answers "what did we throw out",
which nobody asks; inclusion answers "what does the assistant know", which is the
question that matters and one a reviewer can settle by reading a single document. And it
**fails safe** — a document written tomorrow is outside the knowledge base until somebody
says otherwise, rather than reaching a client-facing agent the moment it is saved.

The flag lives on the document rather than in a list, because it is a fact about the
document and has to travel with it. A list drifts silently when a document is renamed or
retired, with nothing to notice.

## It is a release artefact, not tenant data

Read-only, byte-identical everywhere, changed by rebuilding the software rather than by a
per-tenant migration. Nothing at runtime can write to it. It sits above tenancy: it takes
the scope parameters like every other knowledge call, and does not vary by them.

## What is not here

**What a conversation does with it** — the session's knowledge surface, its priming and
its degradation when nothing is built — belongs to the assistant capability, not this one.
This capability ends at a built, current, searchable artefact on disk.
