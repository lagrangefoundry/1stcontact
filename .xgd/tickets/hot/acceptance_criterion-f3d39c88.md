---
uid: acceptance_criterion-f3d39c88
id: AC-1636
type: acceptance_criterion
title: A generated reference asserts its own knowledge-base membership, derived from
  the declaration rather than fixed
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:35:32.610497+00:00'
updated_at: '2026-09-11T02:51:27.360459+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

Each generated reference asserts its own membership of the shipped knowledge
base, and what it asserts is derived from that knowledge base's declaration
rather than fixed in advance: the document declares the type the corpus predicate
asks for and carries whatever field values that predicate requires, so it is a
member under the predicate in force at build time — including a predicate that
asks for nothing at all.

Alongside that, every generated reference declares that it is generated and names
the source it came from, and declares itself a document written for the assistant
rather than an internal engineering record.

A document exported from a ticket satisfies the predicate by carrying the
ticket's own fields; a generated document has no ticket, so if it does not
satisfy the predicate itself it is written, indexed, and never retrieved.

## Verification

Declare a system knowledge base whose corpus predicate asks for one document type
and one field value, generate the references, and read each document's declared
attributes: the declared type is the one the predicate asks for, the required
field carries the required value, the document declares itself generated and
names a source, and it declares itself a document for the assistant. Then declare
a *different* predicate — a different type and a different field — regenerate, and
observe the documents now satisfy the new predicate and no longer carry the old
field, with nothing edited by hand.