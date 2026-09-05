---
uid: request-b0abafbf
id: REQ-188
type: request
title: A member is someone who has signed up, not someone we invited
created_by: xgd
created_at: '2026-09-05T20:16:48.488771+00:00'
updated_at: '2026-09-05T20:16:48.488771+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5c5852f7
---

# A member is someone who has signed up, not someone we invited

## The change

Today the marker is `invited_at`: send the invite and the tab immediately calls
that person a **Member**. That describes what *we* did, not what *they* did.

The intended semantic is the other one. A person becomes a member when they can
actually log in — which means they have signed up, and signing up includes
accepting the terms. Until then they are a contact who has been invited.

So the population has **three** states, not two:

| State | Marker | Means |
| --- | --- | --- |
| **Contact** | `invited_at` null | known here; may become a member |
| **Invited** | `invited_at` set, `tos_accepted_at` null | asked; has not come |
| **Member** | `tos_accepted_at` set | signed up; may log in |

`tos_accepted_at` is the marker for the last state rather than `first_seen_at`,
because the two differ and the difference matters: `admit` stamps `first_seen_at`
on the first request that gets through the door, and `guardTerms` runs *after*
it. So `first_seen_at` means "reached the interstitial once" and
`tos_accepted_at` means "completed sign-up". Only the second is a fact about the
person having entered into anything, and only the second is a legal fact worth
being able to query.

## Why this is the better semantic

An invitation that was never answered is not a relationship. Someone emailed once
who never came back is, in every ordinary sense of the word, not a member — and
calling them one costs the operator the one thing this tab should tell them:
**who actually onboarded**. Two states collapse the funnel; three show it, and
the middle state is exactly the one worth acting on.

It also puts a legal fact where it can be seen. Terms acceptance is currently a
column nobody surfaces; making it the thing that defines membership means the
tab answers "who has accepted the terms" without a separate report.

## It amends [[DOC-42]], and the amendment is the work

This is a model change wearing a label change, and two sections say the old thing:

- **§4** defines member as *"may log in here — a `users` row in that tenant,
  invited"*. That is the capability reading, and it is what makes `invited_at`
  the marker. Under this ticket a member is someone who **has** logged in and
  completed sign-up, not someone who may.
- **§9** states *"`invited_at` is what `provisionInvite` sets and is the only
  marker distinguishing them today"*, and calls the invite the verb that moves a
  row across. The invite still moves a row — from contact to **invited** — but it
  no longer completes the journey.

Both need rewriting rather than leaving to rot, on this repository's usual rule
that the comments and docs are the design record. §4.1's second bullet —
*"nothing enforces contact versus member"* — is partly answered by this ticket
and should say what remains true.

## What does not change

- One table, one population, one row per person. Three states of a row, not three
  tables ([[DOC-42]] §9's falsifier stands).
- The invite is still a transition and still idempotent ([[REQ-186]]).
- `admit` is untouched. This ticket changes what the tab *calls* people and what
  the model *means*; it does not change who may sign in. The reason an invited
  person cannot currently log in at all is [[DOC-42]] §10.1's admitted-but-
  unentitled gap, which is a different ticket and is not fixed here.

## Acceptance

- a person with no `invited_at` shows as **Contact**
- a person with `invited_at` and no `tos_accepted_at` shows as **Invited**
- a person with `tos_accepted_at` shows as **Member**
- inviting someone moves them Contact → Invited and never straight to Member
- accepting the terms moves them Invited → Member with no operator action
- [[DOC-42]] §4, §4.1 and §9 are amended to describe the three states