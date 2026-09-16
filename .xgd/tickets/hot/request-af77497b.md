---
uid: request-af77497b
id: REQ-252
type: request
title: An email page shows its subject, and the page list says it is a message
created_by: EPIC-10
created_at: '2026-09-16T00:47:03.770642+00:00'
updated_at: '2026-09-16T00:47:03.770642+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  depends_on:
  - bug-af661441
  auto_merge_back: true
  needs_review: false
---

# An email page shows what it is, and what it will arrive as

Two things an operator cannot see about a message today: its subject line, and — from the page
list — that it is a message at all.

## 1. What is true today

**The subject exists and only the assistant can reach it.** [[REQ-247]] put it on the page —
`email: { subject, placeholders }` — and the AI surface reads and writes it: `add_page` and
`update_page` take `subject` (*"what a recipient sees in their inbox before they open it"*),
and `describe_page` returns it. The builder does not show it anywhere, so the operator can
neither read the subject their contacts are receiving nor change it. The XGD message goes out
as *"Your two XGD papers"* and nothing in the interface says so.

**The page list knows the kind and does not say it.** `editPageList` returns `kind` on every
entry, deliberately — *"a listing that named the kind of some pages and not others would read
as a property some pages have"* — and the human-readable form even distinguishes the two
unreachability notes (`no form sends it` versus `nothing links to it`). The toolbar's page
control throws all of that away: `labelOf` uses the title, falls back to slug then id, and
appends only `— unreachable`.

So a message sits in the list looking like an ordinary page nothing links to, which is exactly
the state an operator is invited to treat as a mistake and fix by adding a link — the thing
they must never do to a message.

## 2. The change

**The subject is visible and editable where the page is edited**, beside the copy rather than
behind a separate surface. It is the first thing a recipient reads and the one part of the
message that is not in the body.

**The page control names an email page as one.** `Email: Your two XGD papers` rather than
`Your two XGD papers — unreachable`. The kind is already on the row; this is a label that
reads it.

**An email page's note says why it has no address.** `editPageList` already computes the right
sentence — a message is unreachable because no form sends it, not because nothing links to it.
Saying "unreachable" flatly about a message misdescribes a page that is working correctly.

## 3. What this does not touch

The placeholder rule is unchanged: whatever the message declares must stay in the copy, and an
edit that would remove it is refused. Editing the subject is subject to the same rule if a
token ever appears in one.

This is about the builder's own surfaces. The AI surface already carries both facts and needs
nothing.

Whether an email page can be *rendered* in the preview at all is [[BUG-94]], and this ticket
assumes that is fixed — there is little point labelling a page in a list that cannot be opened.

## 4. Acceptance criteria

1. An operator can read an email page's subject line in the builder without using the
   assistant.
2. An operator can change it, and the next message sent carries the changed subject.
3. A subject is never silently empty: a message with none falls back to the page title, and the
   interface shows what will actually be sent rather than a blank field.
4. The page control names an email page as a message, distinguishably from a web page with the
   same title.
5. A web page's label is unchanged.
6. An email page is not described as "unreachable" in the flat sense a web page is; what it
   says is that no form sends it, and a message a form *does* send is not marked at all.
7. The label reads the `kind` the listing already returns rather than re-deriving it, so a
   third kind needs no second opinion about what a page is.
8. Changing the subject does not touch the copy, and editing the copy does not touch the
   subject.
