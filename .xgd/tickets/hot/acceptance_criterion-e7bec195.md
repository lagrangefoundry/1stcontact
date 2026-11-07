---
uid: acceptance_criterion-e7bec195
id: AC-2334
type: acceptance_criterion
title: A page carrying account chrome is served naming the visitor's session state;
  a missing, unreadable, expired or foreign-host cookie reads as signed out, and the
  reader writes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T06:56:53.536814+00:00'
updated_at: '2026-11-07T06:56:53.536814+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

A published page that carries the account chrome is served naming the visitor's
current state: signed out, signed in, or signed in as someone who operates at least
one business. The page's published bytes already hold every state; the serving side
changes only which state the chrome root names. Signed out is the identity — an
anonymous request receives the page exactly as published.

The session is read only to choose that state. No content is gated, and nothing
else on the page varies by who is looking. Whether the visitor operates a business
is a fact about the person (any active membership), never about the site or
business being served.

The visitor reads as signed out when any of these hold: the request carries no
session cookie; the deployment names no session cookie; the cookie was not issued
for the request's host — the host must equal the configured cookie domain or be a
subdomain of it, so a cookie presented on a customer's own domain, on a
look-alike suffix, or on a deployment with no configured cookie domain is ignored;
the session is unknown or expired; or the session read fails for any reason
(including a deployment with no session tables). Reading a session never writes
anything.

## Verification

Publish a page carrying the account chrome. Request it with no cookie and assert
the bytes equal the published bytes and name the signed-out state. Request it with
a live session for a person with no membership and assert it names signed in; with
a live session for a person holding an active membership and assert it names signed
in with the builder link. Present the same live session cookie on a host outside the
configured cookie domain (and on a look-alike suffix host) and assert signed out.
Request with an expired session, and against a store whose session read throws, and
assert signed out. Assert the session store records no write across all requests.
