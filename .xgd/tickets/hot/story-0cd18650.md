---
uid: story-0cd18650
id: STORY-161
type: story
title: 'Terms of Service Gate: An Admitted Person Accepts The Current Terms Before
  Anything Behind Them Is Served'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:04.792559+00:00'
updated_at: '2026-11-01T10:46:00.728464+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-94dbe947
  capability_uid: capability-3606e35b
  story_kind: feature
  story_points: 2
---

## Story
**As a** person admitted to the 1st Contact builder, **I want** to be shown the terms of service currently in force, and to accept them, before any part of the builder is served to me, **so that** there is a durable record of exactly which version of the terms I agreed to and when, and so that nobody uses the builder without having agreed to the current terms.

## Description
Sits between admission (login + entitlement) and business scope resolution ([[DOC-40]] §4, [[REQ-169]]). Acceptance belongs to the **person**, not to a business, so it is checked once an admission exists and before a business is chosen.

In scope:
- A current terms **version** (a date string, currently `2026-09-01`) and the terms **text** (deliberately lorem ipsum, with real copy to follow), each held in one place so replacing the copy is an edit, not a search.
- The check compares the person's recorded accepted version with the current version. It is not a "has ever accepted" check, so a person who never accepted and one whose accepted version is out of date are the same case. Bumping the version prompts everyone again.
- Navigations from a person who has not accepted are answered with the terms and an accept control **at the requested URL**. Every other request (assets, module scripts, images, API calls) is refused with 403 and a plain-text explanation. The gate blocks the builder, not just the chrome ([[REQ-147]]'s lesson).
- Accepting records both the version and the acceptance time, then reloads the same URL, which now answers normally.
- Acceptance can only be posted as JSON, so a cross-site form cannot forge it.
- The terms stay readable at `/terms` after acceptance, showing the acceptance date instead of the control.
- The terms page and refusals are never cached or indexed.
- The loopback dev-open mode has no admission, and therefore no terms check.

Out of scope (per REQ-169): privacy policy acceptance as a separate act, re-acceptance flows for material changes, per-jurisdiction variants, and the real terms copy.

## Technical Context
- Placement is the security property: the check runs in the same block as the Access gate and admission, before scope resolution, before any store handle, and before any route is matched. No route can be reached by an unaccepted session. The only exceptions are the accept endpoint and the terms page. A business-prefixed URL (`/b/<id>/...`) is gated the same way as its unprefixed path.
- The record lives on the person's user row (`tos_version`, `tos_accepted_at`, the columns REQ-167 provides). Both are written together on every acceptance, and re-accepting moves the timestamp forward.
- The page is self-contained, with inline styles and inline accept script, because the session it is served to is refused every asset.
- Related: CAP-103 Access gate (REQ-147) and admission (REQ-167/REQ-178/REQ-184, plan item 4). Plan item 4 modifies the "invited and entitled person reaches the builder" AC, which now also requires accepted terms. That change is owned there, not here.
- FC evidence: `tests/test_UAT_FC_REQ-169_terms.workers.test.ts` (workerd, real D1, real RS256 Access tokens, recognisable assets binding).

## Reconciliation Decisions
- **Navigation detection** (decided at reconciliation, 2026-11-01): REQ-169 says unaccepted *asset* requests are refused but does not define how a page navigation is told apart from a sub-resource. The code (and the operator's own "What was built" section) treats a GET/HEAD with `Sec-Fetch-Dest: document`, or an `Accept` that names `text/html`, as a navigation. A wildcard `Accept` and anything unrecognised are refused. Formalized as the "non-navigation requests are refused" AC because failing closed is the right direction for a gate.
- **Accept endpoint method** (decided at reconciliation, 2026-11-01): intent is silent on non-POST requests to the accept endpoint. The code answers 405 plain text and records nothing. Formalized in the content-type AC, since both are "acceptance cannot be recorded except by a JSON POST".
- **Accept response shape** (decided at reconciliation, 2026-11-01): intent is silent on the success response. The code answers 204 with no body, and the page reloads. Formalized in the stamping AC.
- **Dev-open skips the check** (decided at reconciliation, 2026-11-01): REQ-169's body states this in "What was built". It is formalized as its own AC so the coupling to the dev-open predicate is regression-protected.

No contradictions between intent and code were found.

## Dependencies
- Plan item 4 (Admission after DOC-42). The terms check runs on an existing admission.

## Story Points
2