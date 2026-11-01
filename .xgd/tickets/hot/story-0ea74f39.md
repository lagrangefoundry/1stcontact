---
uid: story-0ea74f39
id: STORY-165
type: story
title: 'Contacts tab: every contact sits on two independent axes — access (Member)
  and pipeline stage (Lead → Invited)'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:04:34.983161+00:00'
updated_at: '2026-11-01T20:04:34.983161+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-39edf66d
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 2
---

## Story
**As a** business operator reviewing my contacts, **I want** each contact to show separately whether they have signed up (access) and where our relationship stands (pipeline stage), and to filter on each on its own, **so that** I can see who actually onboarded and ask "who did I invite who never came" and "who signed up that I never asked".

## Description
REQ-188 (final shape, commit 50e9454, revised 2026-09-05 against DOC-44 §3–§4). It replaces both the old two-state Contact/Member label, which used `invited_at` as its marker, and the interim single line Contact → Invited → Member (59b9839). **That interim three-state line is superseded and is not encoded here.**

A *contact* is the entity, not a value. Each contact is placed on two independent axes:

| Axis | Value | Meaning |
| --- | --- | --- |
| Access | **Member** | the contact has accepted the terms (completed sign-up) |
| Access | **Not a member** | everything else |
| Pipeline | **Lead** | initial value of every contact |
| Pipeline | **Invited** | set by the operator's invite (REQ-186) |

In scope:
- Access is taken from terms acceptance. Reaching the terms interstitial (first_seen) does not make someone a Member.
- Pipeline stage is a stored value, defaults to Lead, and is never inferred from timestamps at read time.
- The invite sets the stage to Invited. It never changes access, and it keeps the original invite timestamp.
- Accepting the terms makes a contact a Member and leaves their stage unchanged.
- One-time migration of existing rows (`invited_at` set → Invited, otherwise Lead). The seeded platform operator is written at Invited.
- The Contacts tab list draws a stage label on every row and a Member badge only on members. It offers two independent facets (stage, access) that combine.
- Stylesheet classes name the axis (stage / access / facet), never one of its values.

Out of scope (REQ-188 "What this does not do"):
- Access restrictions or role vocabulary (REQ-194).
- Pipeline stages beyond Lead/Invited.
- The Customer axis.
- Any change to who `admit` lets sign in. That an invited contact cannot currently sign in is DOC-42 §10.1, a different ticket.

## Technical Context
- Capability CAP-114 (Accounts, Membership & Entitlement).
- Builds on STORY-146 (invite as an owner-gated transition; plan item 2). This story owns only the invite's effect on the two axes. Owner gating, update-not-insert, no grant/membership and the no-mail disclosure belong to STORY-146.
- Builds on STORY-163 (Contacts tab read; plan item 3), which owns the list, the detail table and general styling.
- STORY-164 (plan item 4) owns the detail panel's locked observed fields, now labelled "Pipeline" and "Access", which replaced BUG-54's single "state" field.
- Terms acceptance itself (the interstitial and its write) is STORY-161. This story asserts only that acceptance flips access and leaves the stage alone.
- One shared derivation of both axes is used by the browser panel, by the server's people read model and by tests in workerd. Labels and filtering come from that single rule, so the screen and the API cannot disagree about who is a Member.
- The stored stage column has no CHECK constraint, because the set of stages is meant to grow through code changes (DOC-44 §4, §7).

## Reconciliation Decisions
- **An unrecognised stored stage displays as its own value, not as Lead** (decided at reconciliation, 2026-11-01): REQ-188 is silent on this. The landed code falls back to Lead only when no stage is stored, and shows any unknown stage under its own name, so that a newer server's stage is never silently misreported as a lead. This is formalized because "the stage is read from its own stored value" would be false if unknowns collapsed to Lead. Formalized in the AC on stored (not inferred) stage.
- **Re-inviting keeps the original invite timestamp; inviting a Member is a no-op on access, not an error** (decided at reconciliation, 2026-11-01): REQ-188 "How it lands" states this but does not list it under Acceptance. Formalized in the invite AC, because the second press is the case where a derived or overwritten stamp would falsify history.
- **Facet labels and values** (decided at reconciliation, 2026-11-01): REQ-188 requires two facets but does not name their options. The landed facets are "Any stage" / Lead / Invited and "Anyone" / Member / Not a member, built from the declared stage and access sets. These are formalized as the observable contract.
- **The DOC-42 §4 / §4.1 / §9 amendment is not an AC** (decided at reconciliation, 2026-11-01): REQ-188 lists it under Acceptance, but it is a documentation change with no runtime behaviour a UAT can observe. It is tracked as an intent obligation, not as a matrix criterion.
- **No code/intent contradictions found.** The landed code (50e9454) matches every REQ-188 acceptance bullet. REQ-186's "appears in that tab as Member" and REQ-189's "three-state" wording are earlier text that REQ-188 explicitly supersedes, so they are not contradictions.

## Dependencies
- Plan item 2: STORY-146 (Invite)
- Plan item 3: STORY-163 (Contacts tab read)

## Story Points
2
