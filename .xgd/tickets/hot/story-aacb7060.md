---
uid: story-aacb7060
id: STORY-143
type: story
title: 'Site-Asset Promotion: Only Material The Client May Publish Reaches Their Public
  Site'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:02:09.778452+00:00'
updated_at: '2026-09-11T05:13:44.354730+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-20802191
  story_kind: feature
  story_points: 2
---

## Story

**As a** client of the caretaker platform, **I want** a file I meant for my website to land in
my site's asset library the moment I hand it over — and anything I gave the platform only to
read to be incapable of getting there at all — **so that** my own pictures are usable on my
pages straight away, and nothing I do not hold the rights to is ever published under my own
domain.

## Description

Putting a piece of the client's material into a site's asset library is the single most
damaging action available in the platform: it takes something private and makes it servable to
the public internet under the client's own domain, which is how third-party copyright gets
published by accident. This story is the gate in front of that action, and the act itself.

The gate is a property of the material's own rights record, not of which surfaces happen to be
wired: material whose record does not permit republishing cannot be promoted by any caller,
and no caller can assert its way past it, because the decision is read from the record rather
than from an argument. Material the client handed over marked "just for you to read" therefore
cannot reach a published site at all — it is refused mechanically rather than merely not
routed.

Promotion is a **copy across the storage boundary**, not a reference to the private bytes. The
site's asset library and the client's private material live in separate stores precisely
because one of them is reachable by the public internet and the other is not; a promoted asset
is a second copy that lives on the public side, while the original stays private. That copy is
the act: taking something private and making it publishable is a real decision, and the byte
copy is that decision made honest.

Two properties protect what is already live. Promotion **never overwrites** an asset already on
the site — a picture the visitor sees today cannot be silently replaced by a client dropping a
second file of the same name — so a free name is chosen and the name actually used is reported
back. And a promotion that cannot complete **does not lose the file**: by the time placement
runs the material is already stored, described and findable, so a failure to place is reported
as a named placement failure on an otherwise successful hand-over rather than as "your upload
failed", which would be both untrue and unrecoverable.

**In scope**: the rights gate, the byte copy into the site's asset library, free-name selection
and the reported name, the immediate placement of a file handed over for a selected site, and
what the client is told when placement fails.

**Out of scope**, each covered by its own story: the ingestion pipeline that creates the
material and its bytes (STORY-140); how the file is described (STORY-141); the declared field
vocabulary the rights record is written in, including the role the client supplies (STORY-128);
the browser overlay whose two areas are where a client states what a file is for; and what a
site's asset library contains and how it is listed (STORY-102).

## Technical Context

- The two stores are separate on purpose (architecture policy: R2 for blobs, with the public
  site served from its own store). The client's material store is one the Worker serving the
  public internet holds no binding for. A site asset that merely pointed at the private bytes
  would therefore be unresolvable — and making it resolve would mean granting the public
  Worker reach into the private store, which is the disclosure the boundary exists to prevent.
  The copy is a consequence of that boundary, not a convenience.
- Promotion goes through the site asset store's ordinary write path (CAP-88 / STORY-102), so a
  promoted asset lands by the same route an operator import or an edit lands one, under one set
  of rules about names.
- The rights record promotion reads is written at ingestion from provenance and never from a
  question put to the client (STORY-140, STORY-128). The rights question is answered once,
  where it can be answered, and the dangerous action is forbidden outright instead.
- Reading the material's own bytes goes through the account-bound handle, so promotion cannot
  address another account's bytes even with a correctly-formed key (STORY-127).
- The intent shipped this gate deliberately ahead of any caller — "implement the function with
  its refusal now, so REQ-161 wires a surface to something already safe" — which is why the
  refusal is observable both on its own and through the platform's material entry point.

## Reconciliation Decisions

- **Promotion copies the bytes rather than referencing them** (decided at reconciliation,
  2026-09-10): REQ-163's decisions section says promotion "writes a `site_assets` row pointing
  at the existing blob". The same ticket's own "What was built" section withdraws that with its
  reason — the public site's asset reads resolve against the public store alone, so a row
  pointing into the private store would not resolve, and making it resolve would hand the
  public Worker a binding on the private bucket. The later passage is the operator correcting
  the earlier one, so the criteria assert a copy. Stated as an observable property (the asset
  reads back from the site, the material remains private) rather than as a storage mechanism,
  so a reimplementation that honours the boundary another way still satisfies it.

- **Material with no bytes attached is refused** (decided at reconciliation, 2026-09-10): the
  intent names only the rights refusal. The landed gate also refuses a material that has no
  file attached to it, saying there is nothing to publish. Formalized as an AC because the
  alternative — an asset appearing in the site's library with no bytes behind it — is a broken
  picture on a live page, and because it is the same failure the pipeline's ordering property
  exists to make unobservable.

- **The reported placement failure names no platform secret** (decided at reconciliation,
  2026-09-10): the intent asks only that a failure be "reported in the envelope rather than
  turned into a 500". The landed path also scrubs the reason before it leaves the platform.
  Formalized as a clause of the failure criterion, because this is the one shape that looks
  like it escapes the origin's redaction guarantee — a successful response carrying a message
  from a caught failure — so leaving it unasserted would leave the guarantee with a hole
  exactly where it is least obvious.

## Dependencies

STORY-140 (Ingestion) — promotion reads a material record and its bytes, which ingestion
creates. Plan item 7.

## Story Points

2