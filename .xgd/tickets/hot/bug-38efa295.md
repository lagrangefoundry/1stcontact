---
uid: bug-38efa295
id: BUG-52
type: bug
title: An expired session renders as a working, empty account
created_by: xgd
created_at: '2026-09-05T19:10:55.261370+00:00'
updated_at: '2026-09-05T19:26:10.768111+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
---

# An expired session renders as a working, empty account

Scope: what a **reload** does. The larger question — not being denied mid-session
in the first place, and how a session renews — is deliberately **not here**. It is
[[REQ-187]], and this bug must not be closed by answering it.

## What happens

When the caller's session has lapsed, every route answers 401 — correctly. The
builder client then swallows all three of the calls it makes on load and draws a
builder that looks fine and contains nothing:

| Call | Worker | `api.js` does |
| --- | --- | --- |
| `/api/businesses` | 401 | `return { account: null, businesses: [] }` (`api.js:147`) |
| `/api/status` | 401 | `return { ai: true, message: null }` (`api.js:123`) |
| `/api/sites` | 401 | throws, and `app.js:724` `.catch(() => [])` discards it |

The switcher is empty, the avatar has no account behind it, the site list is
empty, and the assistant reports itself healthy. Nothing says *you are signed
out*. **There is no 401 handling in the client at all.** Verified 2026-09-05
against a running stack with a deliberately expired token.

## Why it is a bug rather than a rough edge

An expired session is **indistinguishable from a deleted account**. That is the
exact failure this codebase rejected once already: [[REQ-178]] refused to drop
lapsed businesses from the switcher because *"a business that silently vanishes
is indistinguishable from a deleted one, which is the wrong thing to tell someone
whose card expired"*. The same sentence applies here with a worse subject — not
one business missing, but every business, the account and the sites at once.

The person most likely to hit it is mid-edit, and an empty builder reads as data
loss. The obvious response to apparent data loss is to start re-creating things.

## Production is not milder

Behind real Cloudflare Access the Worker is not reached: Access answers the
lapsed cookie itself, redirecting to its login origin. A top-level navigation
recovers on its own, but a background `fetch` gets a cross-origin redirect it
cannot follow and **rejects** rather than returning 401 — landing in the same
`catch`es above. The symptom is identical and harder to diagnose, because there
is no status code to find in the network panel.

## A valid stored token must survive a reload

The complementary half, and the one an operator meets first: when the cookie is
still good, reloading must simply work. It does today — nothing in the Worker
issues a `Set-Cookie` and both the 401 and the 200 carry `Cache-Control:
no-store`, so neither a cleared cookie nor a cached refusal is in play (checked
2026-09-05). A UAT pins it, because this is the property the fix above could
plausibly break: a client that reacts to auth failure is a client that can
misfire on a working session and sign someone out for no reason.

## Test sessions must outlive a work session

The local Access harness mints one-hour tokens, which expire inside a single
sitting and make this bug's own symptom hard to distinguish from the harness
running down. Test sessions want a lifetime measured in days. This is
harness-only and has no production counterpart — deployed session lifetime is
[[REQ-187]]'s subject.

## Acceptance

- with an expired session, the builder reports that the session ended and does
  not draw an empty account
- `/api/businesses`, `/api/status` and `/api/sites` no longer convert a 401 into
  a default value
- a rejected fetch that may be an identity-provider redirect is treated as an
  authentication failure, not a transport error
- a **valid** stored token still loads the builder normally across a reload, and
  no auth-failure path fires on it
- unsaved editor state is still present after whatever recovery is offered
- the local Access harness issues multi-day tokens by default
