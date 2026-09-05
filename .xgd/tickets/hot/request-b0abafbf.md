---
uid: request-b0abafbf
id: REQ-188
type: request
title: A member is someone who has signed up, not someone we invited
created_by: xgd
created_at: '2026-09-05T20:16:48.488771+00:00'
updated_at: '2026-09-05T20:37:49.244533+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
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
## What landed

The three states are derived from the two markers the schema already carries, and
the derivation has exactly **one** definition — `apps/control-app/src/builder/
people-state.js`, a module with no imports, exporting `CONTACT`, `INVITED`,
`MEMBER`, the ordered `PERSON_STATES` and `stateOf`. It is a module of its own so
that the one rule is reachable from both sides of the seam: the browser panel that
draws the label, and a test running in workerd against real rows. Two derivations
would be two answers free to disagree about who is a member, which is exactly the
wrong shape for the one place a legal fact is surfaced. `builder/people.js`
re-exports it rather than keeping a copy.

Consequences of the relabel, on the surfaces that carried the old semantic:

- **The facet offers all three states**, built from `PERSON_STATES` rather than a
  hand-written list, so a state a row can display can never be one the filter
  cannot select. Filtering to **Invited** is what makes "who did I ask who never
  came" an askable question — the reason the middle state is worth having.
- **The invite dialog stops promising a membership the button cannot confer.**
  The outcome sentence reads *"… is invited"* / *"… was already known here, and is
  now invited"*, and the hint says no message is sent, that they are marked as
  invited here, and that they become a member when they sign in and accept the
  terms. An operator reads that sentence and nothing else, so leaving it saying
  "member" would have kept the old model alive in the only place it is seen.
- **The design record in `people.ts` and `builder/people.js` is rewritten**, on
  this repository's rule that the comments are the design record: the invite is
  documented as the verb that makes an *invitee*, and `tos_accepted_at` rather
  than `first_seen_at` is documented as the membership marker, with the reason.
- **Two REQ-186 UATs are adjusted** where they pinned the old label — one asserted
  the tab read `['Member', 'Member']` after an invite and now asserts
  `['Invited', 'Invited']`; two test names that said "as a member" no longer do.
  The invite's own behaviour is unchanged, and the origin case additionally
  asserts the invite stamps no acceptance.

## Test plan

`tests/test_UAT_FC_REQ-188_membership_states.workers.test.ts` — inside workerd
against a real D1 with the deployed migrations, driving **both transitions through
real routes**: `POST /api/people/invite` with an owner's real Access token, and
`POST /api/terms/accept` with the person's own. Nothing stamps `tos_accepted_at`
by hand on the path under test, because the claim is that signing up is what makes
a member. Cases: a never-invited row is Contact; inviting makes Invited and stamps
no acceptance; accepting the terms makes Member with no operator call between the
assertions; and a session that reaches the interstitial and stops has
`first_seen_at` set, `tos_accepted_at` null, and is still Invited — which is why
the marker is the second column and not the first.

`tests/test_UAT_FC_REQ-188_membership_states.test.ts` — the panel mounted against
the real `webui` components, with only the HTTP call doubled. Cases: three rows
read Contact / Invited / Member; the facet reaches each of the three and clears
back to everyone; inviting a contact moves the row to Invited and the sentence
says so without saying "member"; the row becomes Member after the terms are
accepted out there, with no control on the tab touched; the hint promises no
membership; and the panel's `stateOf` is the same function the workers suite
asserts against real rows.

Regression scope: the REQ-186 invite suites (both), REQ-170 people, REQ-169 terms
and REQ-167 identity — 64 tests, all passing.