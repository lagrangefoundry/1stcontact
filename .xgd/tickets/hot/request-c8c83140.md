---
uid: request-c8c83140
id: REQ-268
type: request
title: 'The test gutter: a signed marker, marked records, default-excluded reads,
  and collection'
created_by: EPIC-15
created_at: '2026-09-17T22:01:26.424737+00:00'
updated_at: '2026-09-20T18:41:21.195141+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-312f9446
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f39161e2
  commits:
  - working_sha: 7b68d0294a988128099393c3e718bb91ec454b6c
    reconcile_sha: null
    main_sha: null
  version: 0.2.244
  story_points: 8
---

**The gutter primitive.** [[DOC-54]] is the design; this ticket is the behaviour this
branch delivers. [[EPIC-15]] §1 and §1a are the requirements; §6 is the audit this
scope is sized against.

Manufactured traffic must be able to travel the product's real code paths without
appearing in anything a business sees, and must be removable afterwards. Nothing here
is a probe: this is the contract a probe will later depend on, built now because a
marker retrofitted onto records that already exist is a marker with a hole in it.

**It lands on top of [[REQ-267]], which reached `xgd-working` while this was being
built.** That ticket owns the mark *at rest* — the `synthetic` and `run_id` columns on
the four tables, the `synthetic_runs` registry, and the reserved-address carrier for
inbound mail, which is the one channel with no request to sign. This ticket owns the
marker *in flight* and everything that follows from it: the signed token, the write-side
derivation, the read-side exclusion, and collection.

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
- **An unconfigured deployment is one of the ways it fails.** No platform secret means
  no marker is honoured and ordinary leads are taken exactly as they always were. This
  is the opposite of the Turnstile secret's fail-closed rule, deliberately: that one
  guards an unverified write, this one answers *is this manufactured traffic*, and a
  missing answer to that question must never cost a visitor their message.
- **The response is unchanged by the mark.** A marked submission gets the same frozen
  acknowledgement a real one gets. A response that differed would be a probe for
  whether the gutter is configured, offered to anyone holding a form.
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
- **A marked write's own lookups are scoped to its run.** A capture path finds-or-creates
  a contact by address, and under a mark that lookup sees only the run's own rows. Two
  consequences, and the second is the requirement: a probe that submits twice in one run
  is one contact rather than two, and a marked submission can **never resolve a real
  contact who happens to hold the same address**. Hanging a probe's events on a
  customer's own person is the one way marked traffic could pollute the record it exists
  to stay out of; where the addresses do collide the capture **fails loudly** rather than
  attaching, because the alternative is silent and silent is the failure nothing
  downstream can ever find again.

## 3. Marked records are excluded from every customer read

The contact list, an individual contact, the contact-change feed and the axes a
contact is placed on all **exclude marked records by default** — as does the query that
selects who receives a mailing, which is the sharpest of them: a marked contact there is
manufactured traffic receiving a customer's mail.

- Exclusion is **structural**, carried on the scope every read already takes, rather
  than a predicate each call site remembers to add.
- **Absence means exclude.** A caller that says nothing gets the safe answer; seeing
  marked records requires asking for them by name.
- **Naming a run is how they are seen**, and it yields that run's rows and nothing else
  — neither the customer's real records nor another run's. The same scope field is what
  marks the write side, so a marked row with no run id is not constructible.
- The run id is the one value the exclusion clause interpolates into SQL, and it is
  **refused unless it is an id this system minted**. It is set in code and never read off
  a request, so a value that fails that check is a programming error and is treated as
  one rather than escaped.

## 4. Marked records can be collected

- **Collection by run**: given a run id, the records that run produced are removed —
  the contact and, by the cascade the schema already declares, its events, acceptances
  and grants with it. Real records are untouched, and so is every other run.
- **The account a contact was minted with goes too.** Its foreign key points the other
  way, so the cascade cannot reach it; a parentless account would accumulate somewhere
  no customer surface looks, which is precisely why nothing would ever notice. It is
  taken only when no contact is left on it, because an account is many-to-one and taking
  a shared one would orphan a real person's row.
- **A periodic sweep** removes marked records older than a horizon, **keyed on the
  record alone and never on a registry of known runs** — so a run nobody remembers is
  still collected. Real records past the horizon are not taken; the mark is the whole
  predicate.
- The sweep **reports what it took** rather than returning it, and **does not swallow a
  failure**, on the discipline the existing session sweep already states: a collector
  that has quietly been taking nothing is only visible if it says so, and a throw is
  what makes a broken one visible. It runs on the schedule that sweep already holds.
- The sweep **refuses an implausibly large harvest** rather than performing it. The
  expected count is zero; a very large one means the predicate is wrong, not that there
  is a backlog. A swept-clean state therefore yields a harvest of zero, which is the
  state it is in on an ordinary day.

## 5. What this ticket does not build

Probes, tiers, canary sites, external execution, verdict storage, notification
suppression ([[EPIC-14]]'s resolver), and the customer-facing delete button. The
collection *function* is built because mechanism 4 cannot otherwise be proven; its
Contacts surface is [[EPIC-10]]'s.

## Where the marker's code lives, and why

The wire format is a module in `packages/framework` with no imports of its own. Two
Workers have to agree on it and neither can see the other: the edge that verifies a mark
on a form post, and whatever mints one. A second implementation at either end is a format
free to drift by one character in silence. It is separate from [[REQ-267]]'s
`control-app` gutter module, which is the **store** side — the run registry, the reserved
address namespace, the blob prefix — and which reads D1.

**Nothing in that package reads the ambient clock.** [[REQ-152]] makes that a rule of the
package and enforces it with a source scan, so signing and verification take the instant
as an argument and the Worker with a request supplies it. That is also what makes the
expiry rule provable: a test can mint a mark that is already outside its window rather
than waiting five minutes for one.

**The reserved-field list is closed and is asserted whole.** The marker is its fourth
member, and the assertion that names the list is what forces a new machine artefact to be
declared rather than stored in a contact's provenance beside the words a person typed.

## Evidence

UATs drive `worker.fetch` — the public handler, its real route grammar, real D1 with
the deployed schema — with the real capture path behind the service binding, extending
the harness `test_UAT_FC_REQ-223_lead_endpoint.workers.test.ts` established. The
marker's verification is an edge behaviour and can only be proven there; calling the
capture function directly with the mark already set would prove nothing about forgery.

1. **A marked submission runs the full path, lands marked, and is invisible.** The
   records exist and carry the run id; the contact list, the contact read, the change
   feed, the axes and the mailing query do not show them; the event is marked without
   any caller having passed a flag; the marker itself is not stored; a resubmission in
   the same run is the same contact, and a marked submission at a real contact's address
   leaves that contact and their events exactly as they were.
2. **A forged marker is refused and the submission is kept.** A marker with a bad
   signature, one outside its window, one that is not a token at all, and an honest one
   against a deployment holding no secret each yield a **real** record that appears in
   the customer's list — proving both that test status cannot be asserted without the
   secret and that a signing fault does not discard a visitor's submission.
3. **Collection removes marked records and leaves real ones**, by run and by sweep,
   reaching every table that hangs off a contact and the account beneath it, leaving
   other runs and real records alone, refusing an implausible harvest rather than
   performing it, and yielding a harvest of zero once swept clean.