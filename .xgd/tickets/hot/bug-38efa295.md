---
uid: bug-38efa295
id: BUG-52
type: bug
title: An expired session renders as a working, empty account
created_by: xgd
created_at: '2026-09-05T19:10:55.261370+00:00'
updated_at: '2026-09-05T19:10:55.261370+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
---

# An expired session renders as a working, empty account

## What happens

When the caller's session lapses, every route answers 401 — correctly. The
builder client then **swallows all three of the calls it makes on load** and
draws a builder that looks fine and contains nothing:

| Call | Worker | `api.js` does |
| --- | --- | --- |
| `/api/businesses` | 401 | `return { account: null, businesses: [] }` (`api.js:147`) |
| `/api/status` | 401 | `return { ai: true, message: null }` (`api.js:123`) |
| `/api/sites` | 401 | throws, and `app.js:724` `.catch(() => [])` discards it |

So the switcher is empty, the avatar has no account behind it, the site list is
empty, and the assistant reports itself healthy. Nothing anywhere says *you are
signed out*. **There is no 401 handling in the client at all** — no reauth path,
no banner, no distinct state. Verified 2026-09-05 against a running stack with a
deliberately expired token.

## Why it is a bug rather than a rough edge

An expired session is **indistinguishable from a deleted account**. That is the
exact failure this codebase has already rejected once: [[REQ-178]] refused to drop
lapsed businesses from the switcher because *"a business that silently vanishes
is indistinguishable from a deleted one, which is the wrong thing to tell someone
whose card expired"*. The same sentence applies here with a worse subject — not
one business missing, but every business, the account, and the sites.

The person most likely to hit it is mid-edit, and what they are shown invites
exactly the wrong response: an empty builder reads as data loss, and the obvious
reaction to apparent data loss is to start re-creating things.

## Production is not milder

Behind real Cloudflare Access the Worker is not even reached: Access answers the
lapsed cookie itself, redirecting to its login origin. A top-level navigation
therefore recovers on its own, but a background `fetch` gets a cross-origin
redirect it cannot follow and **rejects** rather than returning 401 — landing in
the same `catch`es above. The symptom is identical and the diagnosis is harder,
because there is no status code to find in the network panel.

## Two failures, and they are separable

1. **Auth failure is swallowed.** Three call sites turn "refused" into "empty" or
   "healthy". A 401 — and a fetch rejection that may be a redirect to an identity
   provider — must be a distinct outcome, never a default value.
2. **There is no way back.** Even correctly reported, the client offers nothing:
   no reload prompt, no reauth, and no preservation of unsaved editor state
   across the round trip.

## Required behaviour

- an authentication failure is never rendered as data; the client tells the
  person their session ended, in those terms
- unsaved builder state survives whatever recovery is offered
- an actively-engaged person is **not** interrupted at all — see below

## The renewal requirement

Being denied mid-session is not acceptable for someone actively working. A
renewal policy for active sessions is the fix direction, and it is a design
question rather than a defect: it spans the Cloudflare Access application's
session duration, the identity provider's own re-auth friction, and what the
client does as expiry approaches. Recorded here so this bug is not closed by
merely reporting the failure more politely; scoped separately once that policy is
agreed.

Note that this deployment re-runs `admit` on **every** request, so app-level
revocation (`users.status`, membership, entitlement) is already immediate and
does not depend on the Access session being short.

## Acceptance

- with an expired session, the builder reports that the session ended and does
  not draw an empty account
- `/api/businesses`, `/api/status` and `/api/sites` no longer convert 401 into a
  default value
- a rejected fetch that may be an identity-provider redirect is treated as an
  authentication failure, not a transport error
- unsaved editor state is still present after recovery
