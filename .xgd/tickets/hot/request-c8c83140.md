---
uid: request-c8c83140
id: REQ-268
type: request
title: 'The test gutter: a signed marker, marked records, default-excluded reads,
  and collection'
created_by: EPIC-15
created_at: '2026-09-17T22:01:26.424737+00:00'
updated_at: '2026-09-17T22:01:26.424737+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-312f9446
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f39161e2
---

**The gutter primitive.** [[DOC-54]] is the design; this ticket is the behaviour this
branch delivers. [[EPIC-15]] §1 and §1a are the requirements; §6 is the audit this
scope is sized against.

Manufactured traffic must be able to travel the product's real code paths without
appearing in anything a business sees, and must be removable afterwards. Nothing here
is a probe: this is the contract a probe will later depend on, built now because a
marker retrofitted onto records that already exist is a marker with a hole in it.

## 1. A signed marker rides the request

A submission may carry a **marker** — an HMAC over a payload holding a **run id** and
an **issued-at**, signed with a platform secret.

- The marker is **verified server-side** at the edge that receives the request. A
  caller cannot assert test status without the secret.
- It is **time-bounded**: a marker outside its window is not accepted.
- It reaches the handler as a **reserved field** on the form post, alongside the
  honeypot, the Turnstile token and the form-instance handle — and like them it is
  **stripped before anything is stored**, because it is a machine artefact and not
  something a person typed.
- **A marker that fails verification does not refuse the submission.** The request
  proceeds as ordinary traffic and the record is written **real**. A signing fault must
  never become lost customer data, and the attack worth closing runs the other way:
  marking real traffic as test would let a caller hide a business's leads from their
  own dashboard.
- The run id is minted by the existing opaque minter, `newId('run')` — never a second,
  shorter identifier format.

## 2. Records produced by marked traffic are marked

Every record a marked submission creates carries `synthetic` and the `run_id` of the
run that produced it: the contact, its events, its acceptances and its asset grants.

- **No call site supplies the flag.** Where a request context exists the write layer
  takes it from there; where one does not, it is **derived from the parent record** —
  an event written against a synthetic contact is synthetic because the contact is,
  read in the same `SELECT` that already derives the event's business from its contact.
- There is no default of false in a marked context.
- **The full real path runs.** The marker changes what is written and what is shown; it
  never changes what is executed. No branch skips work because a request is marked.

## 3. Marked records are excluded from every customer read

The contact list, an individual contact, the contact-change feed and the axes a
contact is placed on all **exclude marked records by default**.

- Exclusion is **structural**, carried on the scope every read already takes, rather
  than a predicate each call site remembers to add.
- **Absence means exclude.** A caller that says nothing gets the safe answer; seeing
  marked records requires asking for them by name.

## 4. Marked records can be collected

- **Collection by run**: given a run id, the records that run produced are removed —
  the contact and, by the cascade the schema already declares, its events, acceptances
  and grants with it. Real records are untouched.
- **A periodic sweep** removes marked records older than a horizon, **keyed on the
  record alone and never on a registry of known runs** — so a run nobody remembers is
  still collected.
- The sweep **reports what it took** rather than returning it, and **does not swallow a
  failure**, on the discipline the existing session sweep already states: a collector
  that has quietly been taking nothing is only visible if it says so, and a throw is
  what makes a broken one visible.
- The sweep **refuses an implausibly large harvest** rather than performing it. The
  expected count is zero; a very large one means the predicate is wrong, not that there
  is a backlog.

## 5. What this ticket does not build

Probes, tiers, canary sites, external execution, verdict storage, notification
suppression ([[EPIC-14]]'s resolver), and the customer-facing delete button. The
collection *function* is built because mechanism 4 cannot otherwise be proven; its
Contacts surface is [[EPIC-10]]'s.

## Evidence

UATs drive `worker.fetch` — the public handler, its real route grammar, real D1 with
the deployed schema — with the real capture path behind the service binding, extending
the harness `test_UAT_FC_REQ-223_lead_endpoint.workers.test.ts` established. The
marker's verification is an edge behaviour and can only be proven there; calling the
capture function directly with the mark already set would prove nothing about forgery.

1. **A marked submission runs the full path, lands marked, and is invisible.** The
   records exist and carry the run id; the contact list, the contact read, the change
   feed and the axes do not show them; the event is marked without any caller having
   passed a flag; the marker itself is not stored.
2. **A forged marker is refused and the submission is kept.** A marker with a bad
   signature, and one outside its window, each yield a **real** record — proving both
   that test status cannot be asserted without the secret and that a signing fault does
   not discard a visitor's submission.
3. **Collection removes marked records and leaves real ones**, by run and by sweep, and
   a swept-clean state yields a harvest of zero.