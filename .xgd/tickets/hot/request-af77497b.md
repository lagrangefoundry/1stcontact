---
uid: request-af77497b
id: REQ-252
type: request
title: An email page shows its subject, and the page list says it is a message
created_by: EPIC-10
created_at: '2026-09-16T00:47:03.770642+00:00'
updated_at: '2026-09-16T01:47:57.443997+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  depends_on:
  - bug-af661441
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4884ca0d
  commits:
  - working_sha: 98be01b7f13d211f0a59b2f5e1e3b1a73976df2d
    reconcile_sha: null
    main_sha: null
  version: 0.2.213
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

## 5. How it was built

**Where the field lives, and why not somewhere else.** The builder has no page-properties
surface at all — page `title`, `path` and `seoMeta` are reachable only through the assistant —
so a subject field had nowhere to be put. Building a properties panel to hold one field would
have put the one thing an operator wants while looking at the message two clicks away from the
message, which is the "separate surface" §2 rules out. It is a **toolbar control in Edit mode**,
sitting directly after the page selector: the strip is where "which page" is already answered,
so "and what does it arrive as" is the next question without crossing anything else.

**Edit only, and message only.** The control is named from the `edit` mode's action list, which
is the same enforcement `mark-points` and `panels` get: View must behave exactly as published
(DOC-28 §7.1) and a box that writes to the draft is not that, so there is no channel in which
the field is present and inert. On a page that is not a message it hides itself rather than
showing a disabled box, for the reason the panel selector hides on a page with no modals — a
permanently empty control teaches an operator to stop reading that part of the strip.

**It draws from the listing the page control already holds.** `editPageList` puts the whole
`email` block on every message's row, so the field needs no request of its own and cannot show
a subject the control beside it disagrees about. It re-reads on the same two panel events, so
moving between pages moves the field with it.

**A new narrow write route: `POST /api/pages/subject`.** `/api/pages` says in as many words
that it is read-only and that adding a page or offering to is not its job, and that stance is
worth more than the path it is written at — so the write is a route of its own, named for its
reach, in the shape every other narrow write here already has (`/api/material/name`,
`/api/business/name`). It is a thin transport over `editPageUpdate`, the same command
`update_page` calls, so the placeholder rule, the refusal on a page that is not a message, and
the fallback below are applied once rather than restated for the chrome. A refusal comes back
as the `CommandError` envelope the router already renders at 400, and the control puts the
sentence on the box and restores the stored value rather than leaving the operator looking at
text that was not saved.

**AC-3 is enforced in the write, not in the readers.** Blank is not a subject somebody chose,
it is one they cleared, and nothing downstream turns it into anything — the envelope takes
`String(email.subject ?? '')` and the mail arrives with no subject line. So `emailBlockOf`, the
one place the block is assembled, falls back to the page title (and the page id when the title
is blank too), and whitespace counts as blank. That is what lets the interface show what will
be sent by showing what is stored: the field is refilled from the write's own answer rather
than from what was typed, so an operator who clears the box watches the title appear.

**The field follows a subject the operator did not change.** A subject rewritten in the
conversation reaches the box without a reload, which AC-1 requires of a surface that claims to
say what contacts are receiving — a confident wrong answer is worse there than no answer. The
listing is re-taken asynchronously, well after the panel event that provoked it, so the page
index grew an `onRefreshed` subscription and the field redraws from it. That is also what makes
the index a shared thing rather than the page selector's private one: two controls now read the
same rows, and "re-take the listing" and "redraw" can no longer be the same line in the one
control that did both. The toolbar's action context gained a `cleanup(off)` beside `subscribe`,
so a release that is not a panel subscription still gets the element's lifetime.

**AC-7 is a table, not a branch.** `labelOf` looks the row's `kind` up in a small map of
`{prefix, stranded}` — `web` is `{'', 'unreachable'}`, `email` is `{'Email: ', 'no form sends
it'}` — so a third kind is a row in that object rather than a second opinion about what a page
is, held in a control with no business having one. A kind this build has never heard of falls
back to the unmarked web shape: a page named without a claim, rather than a row labelled with a
word the client cannot read.

## 6. Test plan

- `tests/test_UAT_FC_REQ-252_email_subject.test.ts` (node) — the store side. A changed subject
  is what `emailPagesOf` reports, which is the reader the send walks the published pages with;
  a cleared one becomes the title, in the answer and in what goes out; the listing says a
  message is a message and why it has no link. Copy is read before and after a subject edit and
  is byte-identical (AC-8).
- `tests/test_UAT_FC_REQ-252_page_control.test.ts` (jsdom) — the real chrome, via
  `mountBuilder` with only the transport injected. Label prefixes and notes for all four cases
  including a web page and a message of the same title; an unknown kind; the field appearing
  for a message and for nothing else; the write carrying site, page id and subject; the answer
  redrawing the box; a refusal reported and not kept; a subject changed elsewhere reaching the
  box with nothing written; Edit-only.
- `tests/test_UAT_FC_REQ-252_subject_route.workers.test.ts` (workerd) — the wire. The route
  writes what the field sent, read back through the store; answers a cleared subject with the
  title; refuses a subject on a served page at 400.
- `tests/reconciliation-builder-workspace-origin.test.ts` gains a cacheability probe for the new
  route, which its own AC requires of every route the origin declares.