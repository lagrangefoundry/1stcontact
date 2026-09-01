---
uid: request-da60b61b
id: REQ-169
type: request
title: 'Terms of service: accepted before the builder loads'
created_by: xgd
created_at: '2026-09-01T00:51:21.466375+00:00'
updated_at: '2026-09-01T00:51:21.466375+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 1
  auto_merge_back: true
  needs_review: false
---

# Terms of service: accepted before the builder loads

## The gap

External people are about to be onboarded and there is nothing recording what
they agreed to. [[DOC-40]] §4 puts acceptance between login and the builder;
[[REQ-167]] provides the `tos_version` and `tos_accepted_at` columns to record it.

## The version is the point, not the timestamp

A timestamp alone says *when* someone clicked and not *what they clicked*.
Acceptance stamps a **version identifier** — `2026-09-01`, a date string — so
that months later the terms in force at acceptance can be identified from the
row.

Bumping the constant re-prompts everyone whose `tos_version` does not match. A
UAT changes the version and asserts an already-accepted user is prompted again.

## The interstitial

After a successful login ([[REQ-167]] step 5) and before any builder asset is
served, a user whose `tos_version` does not match the current constant is served
the terms and an accept control. Acceptance writes both columns and continues to
where they were going.

**It blocks the builder, not just the chrome.** The Access gate's own lesson
([[REQ-147]]) applies: bytes served before the check are bytes served to someone
who has not passed it. Asset requests from an unaccepted session are refused,
not merely un-navigated-to.

Declining is not a state. There is no "no" button that records a refusal —
declining is closing the tab, and the account is simply never entered.

## The text

**Lorem ipsum for now**, with real text to follow. This is deliberate and is not
a placeholder to be forgotten: the mechanism is what is being built and the
copy is a content dependency with its own lead time. The text lives in one
constant beside the version so that supplying it later is an edit and not a
search.

## Not in scope

Privacy policy acceptance as a separate act, re-acceptance flows for material
changes, and per-jurisdiction variants.
