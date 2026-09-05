---
uid: request-b0abafbf
id: REQ-188
type: request
title: A member is a contact who can sign in, and the pipeline is a separate axis
created_by: xgd
created_at: '2026-09-05T20:16:48.488771+00:00'
updated_at: '2026-09-05T23:06:58.435646+00:00'
completed_at: null
last_field_updated: title
status: free_coded
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5c5852f7
  commits:
  - working_sha: 59b983957f142d56c8923519209e29c599f60a68
    reconcile_sha: null
    main_sha: null
  version: 0.2.75
---

# A member is a contact who can sign in, and the pipeline is a separate axis

Revised 2026-09-05 against [[DOC-44]]. An earlier draft of this ticket described a
single three-value progression, Contact → Invited → Member. The correction it was
making survives; the shape does not, and [[DOC-44]] §3 says why.

## What was wrong before this ticket

The marker is `invited_at`: send the invite and the tab immediately calls that
person a **Member**. That describes what *we* did, not what *they* did. An
invitation nobody answered is not a relationship, and calling it one costs the
operator the only thing that list should tell them — **who actually onboarded**.

## What was wrong with the earlier fix

It replaced two states with three on one line. [[DOC-44]] §3 establishes that
these are **independent axes**, not stages:

- **Access** — *Member*: this contact can sign in.
- **Pipeline** — *Lead* → *Invited* → …: where the relationship stands.

They are not the same question and neither implies the other. Someone invited who
never signed up is `Invited` and not a member. Someone who signed up is a member
and is still somewhere on the pipeline. A future customer who never signs in is
neither — which the one-line model could not represent at all.

## The change

**Two axes, two values each for now.**

| Axis | Value | Marker |
| --- | --- | --- |
| Access | **Member** | `tos_accepted_at` set |
| Access | *(not a member)* | `tos_accepted_at` null |
| Pipeline | **Lead** | the initial value of every contact |
| Pipeline | **Invited** | set by the invite ([[REQ-186]]) |

**`tos_accepted_at`, not `first_seen_at`.** The two differ and the difference is
the point: `admit` stamps `first_seen_at` on the first request that gets through
the door, and `guardTerms` runs *after* it. So `first_seen_at` means "reached the
interstitial once" and `tos_accepted_at` means "completed sign-up". Only the
second is a fact about the contact having entered into anything, and only the
second is a legal fact worth being able to query.

**The pipeline stage is a stored value, not derived from timestamps.**
[[DOC-44]] §4: deriving works for two values and turns every later stage into a
new column plus an invisible ordering rule. `invited_at` stays and records
**when**; the stage records **whether**.

**Contact is not a value on either axis.** It is the entity ([[DOC-44]] §2). A row
with nothing else true is a `Lead`.

## What this does not do

- **No access restrictions and no role vocabulary.** Punted ([[REQ-194]]).
- **No later pipeline stages.** `Lead` and `Invited` are what exist; the rest are
  named when there is something to name them against ([[DOC-44]] §7).
- **Nothing to the Customer axis.** [[DOC-44]] §3 defines it and §7 records that
  it has nothing to read until there is a payments table.
- **`admit` is untouched.** This changes what a contact is *called* and what the
  model *means*; it does not change who may sign in. That an invited contact
  cannot currently sign in at all is [[DOC-42]] §10.1's admitted-but-unentitled
  gap, and is a different ticket.

## It amends the docs, and that is part of the work

- **[[DOC-42]] §4** defines member as *"may log in here — a `users` row in that
  tenant, invited"*, which is the capability reading and is what makes
  `invited_at` the marker. A member is now a contact who **has** signed up.
- **[[DOC-42]] §9** — *"contact and member are one population in two states"* and
  *"`invited_at` … is the only marker distinguishing them"*. One population, yes;
  two states on one line, no.
- **§4.1's** *"nothing enforces contact versus member"* is partly answered and
  should say what remains true.

## Acceptance

- a contact whose `tos_accepted_at` is set reads as **Member**; one without does
  not, whatever else is true of them
- a contact begins at pipeline stage **Lead**
- inviting a contact moves them to **Invited** and never to Member
- accepting the terms makes a contact a Member with no operator action, and does
  not change their pipeline stage
- the pipeline stage is read from its own stored value, not inferred from which
  timestamps are set
- the two axes are independently representable: an invited non-member, a member
  who was never invited, and a Lead who is neither, all exist and all display
  correctly
- [[DOC-42]] §4, §4.1 and §9 are amended to describe the axes
