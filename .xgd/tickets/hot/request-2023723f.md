---
uid: request-2023723f
id: REQ-263
type: request
title: 'email tickets: freeze the record of a sent message'
created_by: EPIC-3
created_at: '2026-09-16T21:58:48.359181+00:00'
updated_at: '2026-09-16T23:07:01.599907+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  epic_parent: ticket://lagrangefoundry/lagrange-framework/EPIC-3
---

## What this adds

An `email` ticket is the historical record of a message that went out. Its
content must not be editable after the fact — the record is the evidence, and
evidence that can be rewritten is not evidence.

This declares a write lock on the `email` type in `apps/control-app/src/tickets.ts`
so the store refuses those writes, rather than relying on nothing in the product
happening to issue one.

Depends on: `ticket://lagrangefoundry/lagrange-framework/REQ-160`, which adds the
mechanism to `@lagrangefoundry/ticketing`. This REQ is a type-pack declaration
over it — there is no new mechanism here.

## The declaration

```ts
email: {
  fields: { … },
  immutable: [
    {
      freeze: ['body', 'title', 'fields.*'],
      except: ['fields.status', 'fields.provider_id', 'fields.sent_at', 'fields.failure'],
      message: 'a message record is what was sent; it cannot be edited',
    },
  ],
}
```

Two things about that shape, both load-bearing:

**No `when`, so the content is frozen from create.** The record is written
before the provider is called (REQ-198), and what is written at that moment is
exactly what the operator composed and pressed send on. There is no window in
which editing the copy would be legitimate, so there is no predicate — the
content is write-once. A `when: "fields.status != queued"` was the obvious
alternative and is weaker for no gain: it would leave the copy editable in the
seconds before the provider answers, which is the one window in which an edit
would be invisible and wrong.

**The delivery lifecycle is in `except`, because it is not content.**
`fields.status`, `provider_id`, `sent_at` and `failure` are what the attempt and
the later webhooks return — `queued → sent` writes two of them, and a
`delivered` / `bounced` / `complained` webhook writes more, hours later. Freezing
them would break delivery tracking, which is the opposite of preserving the
record. Everything the operator decided — `subject`, `to`, `from`,
`template_key`, `template_uid`, `assets`, the rendered body — is frozen.

Note the predicate namespace matters here: `email`'s lifecycle lives at
`fields.status` and is a different thing from the ticket's own `status` column.
The sibling REQ specifies the explicitly-prefixed resolution that keeps those
two apart.

## What stays possible

- **Archiving a message record**, which is the erasure path and must not be
  blocked by a lock.
- **Commenting on one** — a comment is its own ticket, so an annotation about a
  message that bounced still lands.
- **Being referenced** by other tickets — inbound links live on the source.

## Test plan

UATs (`test_UAT_FC_<TICKET-ID>_*`) against the real store:

- a message is created at `queued`; a patch editing `subject` or the body is
  refused, carrying the declared message
- the same message takes the `queued → sent` patch (`status`, `provider_id`,
  `sent_at`) and a later `delivered` webhook patch
- a patch mixing a lifecycle field with a content field is refused whole — the
  lifecycle half does not land
- archiving a sent message succeeds
- a read of a message reports it as locked, so the UI can say so without
  attempting a write


## The specification

`ticket://lagrangefoundry/lagrange-framework/DOC-8` **§15 (Amendment —
2026-09-16)** is the authority for the mechanism this declaration sits on —
notably §15.1 on the explicitly-prefixed predicate namespace, which is what
keeps `email`'s `fields.status` distinct from the ticket's own `status` column.
