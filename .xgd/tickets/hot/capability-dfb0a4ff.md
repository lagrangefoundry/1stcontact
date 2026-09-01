---
uid: capability-dfb0a4ff
id: CAP-106
type: capability
title: 'Client Material Store: What A Site Is Made From, As Tickets'
created_by: xgd
created_at: '2026-09-01T23:55:53.160898+00:00'
updated_at: '2026-09-01T23:55:53.160898+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: client-material-store
---

The site store holds *sites*. This holds everything a site is made **from**.

A client's material — the documents they upload, the background the assistant fetched on
their behalf, the capture bundles it re-maps a design from, the brief recording what was
decided, and the conversations that decided it — is a second body of platform memory with
its own shape. It is not page definitions and it is not published bytes: it is a corpus,
accumulated over the life of an account, queried across rather than rendered.

This capability owns that corpus as **tickets**: a record with a type, a title, structured
fields carrying rights and provenance, a body, comments and attachments, held in the
platform's database and scoped so that a handle can only ever see one account's material.
It owns the store the tickets live in, the vocabulary of types they come in, and the place
their attached bytes are kept — deliberately a place the Worker serving the public internet
has no binding for, because a client's brand guidelines and positioning papers are the
opposite kind of object from a published asset.

The schema is not authored here. It belongs to the shared ticketing component, and this
capability's obligation is to apply it and to keep provably in step with it rather than to
fork a copy of it.

What this capability is NOT: the assistant's conversation behaviour (it only homes the
sessions), the ingestion that creates material, the Library surface that lists it, or the
knowledge base built over it.
