---
uid: request-2023723f
id: REQ-263
type: request
title: 'email tickets: freeze the record of a sent message'
created_by: EPIC-3
created_at: '2026-09-16T21:58:48.359181+00:00'
updated_at: '2026-09-17T03:24:09.798493+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0e43e7e5
  epic_parent: epic-d76e554a
  commits:
  - working_sha: 2a099a8ce165020bf46e2bea2cd96c0820bac52e
    reconcile_sha: null
    main_sha: null
  version: 0.2.232
  story_points: 2
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

- **Archiving a message record**, which is the erasure path ([[DOC-37]]) and
  must not be blocked by a lock. The engine does not gate `archive` at all, so
  this is a claim about the declaration not accidentally reaching it — a lock
  that made a business undeletable would be discovered far too late.
- **Commenting on one** — a comment is its own ticket, so an annotation about a
  message that bounced still lands.
- **Being referenced** by other tickets — inbound links live on the source.
- **The whole send path, unchanged.** `sendRecordedEmail`'s `queued → sent`
  update and `applyDeliveryEvent`'s webhook update are the two writes this must
  not break, and they are what the four exceptions are chosen to admit. Half of
  what the UATs assert is therefore what still works: a lock that also stopped
  delivery tracking would be the opposite of preserving the record.
- **The ticket's own `status` column and `links` are not frozen**, deliberately.
  Neither is content the operator composed — `links` on this ticket is our own
  bookkeeping, and an inbound reference was never reachable from here anyway.

## What this adds to the repository's typed surface

Three additions, each because something now reads what it names rather than
because the shape grew:

- **`Ticket.locked`** — the block a read carries when a rule matches, omitted
  entirely otherwise, so a type with no lock emits exactly the shape it always
  did. `except` is reported beside `frozen` because "something is locked" is not
  the answer a caller needs; it is asserted on a `query` as well as a `get`,
  since a listing is where a UI decides whether to offer an edit control at all.
- **`LockRule`**, and `immutable?` on `ProductTypePack.schema()` — so a surface
  answering "may this type be edited?" without a ticket in hand reads the rule
  off the pack rather than casting around the type it is otherwise checked by.
  The selector spellings are deliberately not narrowed to a union: the component
  checks them where the pack is constructed and names the bad one, and a union
  here would be a second copy of that check, free to fall behind it.
- **`TicketStore.archive`** — named because the archive claim above is asserted,
  and an assertion that has to cast around the type is one the type should have
  named instead.

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
  attempting a write — and the block rides on a listing too, while a type with
  no rule carries no `locked` key at all
- the shipped `sendRecordedEmail` and `applyDeliveryEvent` are driven
  end-to-end through the lock rather than a second copy of their sequence, so
  these are a regression test for the declaration and not a restatement of it
- the rule is read off `productTypePack()` itself, so dropping or moving the
  declaration fails loudly rather than silently ceasing to enforce

### The dependency has to be installed before these can pass

`@lagrangefoundry/ticketing` reaches this repository through the out-of-repo
shared store at `/Users/martin/lagrangefoundry/node_modules`, which `bin/install`
in the framework populates and nothing else updates. REQ-160 is `free_coded`
there but has not been installed, so the store's `TypePack` ignores an
`immutable` key it does not know — inertly, not loudly. Until an operator runs

    cd /Users/martin/lagrangefoundry/lagrange-framework
    python3 bin/install --lang js --component ticketing

the declaration is present and unenforced, and the six UATs that assert a
refusal or a `locked` block fail. The four that assert the declaration itself
and the send path still pass, which is the shape to expect.


## The specification

`ticket://lagrangefoundry/lagrange-framework/DOC-8` **§15 (Amendment —
2026-09-16)** is the authority for the mechanism this declaration sits on —
notably §15.1 on the explicitly-prefixed predicate namespace, which is what
keeps `email`'s `fields.status` distinct from the ticket's own `status` column.