---
uid: story-bb91191c
id: STORY-130
type: story
title: 'The client''s own knowledge: a private, tenant-scoped corpus the assistant
  can search'
created_by: xgd
created_at: '2026-09-04T03:18:34.083583+00:00'
updated_at: '2026-09-04T03:32:03.516015+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-7cf24564
  story_kind: feature
  story_points: 3
---

## Story

**As a** business owner working with the builder assistant,
**I want** everything I have given the platform — our conversations, the material I uploaded, the reference sites captured for me, and the brief recording what we decided — held as one private, searchable body of knowledge belonging to my account,
**so that** the assistant answers from what it knows about *my* business rather than about websites in general, and nothing it learns about me is reachable by anyone else.

## Description

This is the tenant-scoped half of the platform's knowledge model. [[CAP-100]] is the other half:
our own design documents, identical for every client, built once at release time. This capability
is the client's own corpus — different for every account, written continuously, and confidential.

**In scope** (this story):

- The corpus itself: the account's conversations, material, references and brief, drawn from the
  account's own records rather than from any shipped document set, and **tenant-wide** — a record
  attached to one of the client's sites, or to none, is part of the same corpus. The account is a
  hard barrier; a site is only a filter.
- The isolation guarantee at both layers: an account's search reaches its own records only, and
  the derived index is partitioned by account as strictly as the records are.
- Index residency: the index is a derivative of confidential client material, so it is stored
  privately, never in the store from which the public internet is served, and outside the key
  space that client attachments are addressed in.
- Freshness economics: the index is brought up to date incrementally, embedding only what has
  changed, which is what makes keeping it current affordable on every write.
- One declaration for both knowledge bases, used as written, with each host offering only the
  knowledge bases it can actually resolve.
- The landscape record: publishable and retrievable for an account from the first build onward.

**Out of scope**:

- *What* drives the refreshes, and what the landscape says at each corpus size — the two triggers
  and the enumeration floor are the sibling story from this same intent.
- Assembling the landscape into a conversation's priming, the per-turn delta channel and the
  change-feed operation — REQ-160 owns these, and this intent explicitly defers to it. The
  behavioural end of "ask a question answerable only from this document" is proved here only as
  far as it can be: the document is indexed and search returns it.
- Ingestion — how bytes become a material record — REQ-163.
- The site source adapter ([[DOC-38]] §8.3): a later corpus member. Nothing here assumes it
  present or absent.

## Technical Context

- Specification: [[DOC-39]] §3, §4 and §7, and [[DOC-38]] §8. The intent states that DOC-39 is the
  specification and that this work must not re-decide anything DOC-39 settles.
- Tenancy is bound once, into the handle, and never passed per call ([[DOC-10]] §4.1, §4.3) — the
  same rule the tenant ticket store already states. That is why no acceptance criterion here can
  be satisfied by a correctly-passed scope argument: the scope must be unreachable, not merely
  correct.
- Index residency deliberately does **not** inherit the system knowledge base's decision. The
  system index ships inside the release artefact because it is identical for everyone; this one
  differs per account and is written continuously, so it goes behind the persistent-storage
  implementation of the same seam.
- The embedding model is the same one the system corpus is indexed with, so build-time and
  query-time vectors are comparable by construction. Two models would not produce an error — they
  would produce plausible-looking nonsense.
- Related capabilities: [[CAP-100]] (the shipped design-document corpus and its generated map),
  [[CAP-106]] (where the client's material and reference records live), [[CAP-90]] (the per-site
  assistant conversations that become the `chat` half of this corpus).

## Reconciliation Decisions

- **A never-indexed account is an ordinary starting state** (decided at reconciliation,
  2026-09-03): the intent describes the index as a change-feed consumer but says nothing about the
  state before the first pass. The landed code reads a missing index artefact as "nothing there"
  rather than as a failure, so the first upload on a fresh account is an ordinary build from
  empty. Formalized rather than deferred, because the alternative — the first client action on a
  new account being an error — is the single most visible failure this capability could have.
  Formalized as the first-index criterion.
- **Missing host configuration is a named refusal, not a silent empty corpus** (decided at
  reconciliation, 2026-09-03): the intent records that the embedding binding was added to both
  halves of the host configuration, but never states what happens where it is absent. The landed
  code refuses to open the knowledge base at all, naming the missing binding and both places it
  must be declared. Formalized because an unconfigured host that returns no search results is
  indistinguishable from a client who has given us nothing yet — a silent smaller-corpus failure
  of exactly the kind this bundle's sibling intent exists to eliminate.
- **One landscape record per account, replaced wholesale** (decided at reconciliation,
  2026-09-03): the intent states that the landscape record's type had to be declared so the first
  build would validate, but does not state the record's lifecycle. The landed code keeps one
  record per knowledge base and replaces its body on every rebuild. Formalized because "recycled
  in place" is what makes a rebuild honest — regenerated, never patched — and what lets anything
  holding a reference keep pointing at the current map.

No contradiction was found between the intent and the landed code for this story. (The intent
does record one supersession — its own proposed enumeration budget, overruled by [[DOC-39]] §7 —
but that governs the landscape floor, which is the sibling story.)

## Dependencies

None.

## Story Points

3