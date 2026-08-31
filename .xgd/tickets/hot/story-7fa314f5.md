---
uid: story-7fa314f5
id: STORY-125
type: story
title: 'Self-origin fulfilment: a picture of my own draft is the draft, not a sign-in
  challenge'
created_by: xgd
created_at: '2026-08-31T23:20:40.311983+00:00'
updated_at: '2026-08-31T23:30:56.310929+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-8eef3846
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 2
---

## Story

**As an** operator whose builder is behind a sign-in gate, **I want** a capture of
my own draft to show my draft, **so that** the picture the assistant reasons from
is the page I am working on rather than the gate standing in front of it.

## Description

The builder's own draft output is served from a host that a sign-in gate guards.
A browser the deployment launches to photograph that output is a brand-new,
unauthenticated client: it is challenged, and it faithfully photographs the
challenge. Nothing errors and nothing is reported — the picture is simply wrong,
which is the worst shape a failure can take for a tool whose whole job is to be
believed.

This story is the guarantee that this cannot happen: **the deployment answers
its own browser**. The browser is still pointed at the real absolute address of
the draft on the deployment's own host — so the page has a real origin and its
relative asset references resolve exactly as they do for a person browsing the
deployed builder — but every request addressed to that host is fulfilled from
inside the deployment, from the same draft rendering the preview surface itself
serves. A request that is never made cannot be challenged.

**In scope**

- A capture of the operator's own draft (or edit) channel returns the authored
  page — byte-for-byte what the preview surface serves for that site, channel
  and path — and never a sign-in challenge document. (AC-1469)
- **The rule is per-host, not per-path**, and that is the whole guarantee. A host
  is *owned* outright: every request to it is either fulfilled in-process or
  answered not-found in-process. A path nobody authored — a favicon, a build
  asset, a stray absolute link — is answered not-found rather than escaping to
  the gated origin. Nothing addressed to that host is ever handed to the network.
  (AC-1470)
- Naming a site that does not exist is answered not-found in-process, not
  fetched. (AC-1472)
- A failure while producing the page is answered with a server error, never let
  through to the network. A silent fall-through is the one outcome the mechanism
  exists to make impossible, because a fall-through lands on the gate and comes
  back as a challenge document the capture would faithfully record. (AC-1473)
- Requests to **any other host** are untouched and go to the network. A page
  legitimately loads third-party fonts and images, and a capture that silently
  dropped them would be a different kind of wrong picture. (AC-1471)
- The capture shows the draft as it stands *now*: the same rendering the preview
  surface would serve at that moment, not a second, independently produced one
  that could answer from an older state of the site. (AC-1474)
- Published output is deliberately **not** served this way. Published bytes live
  on a public host that no gate covers, so a capture of a published address is
  fetched over the network like any other page. (AC-1475)

**Out of scope**

- Acquiring and driving the browser at all — leasing a session, viewport
  presets, releasing on every exit, the shared capture preconditions. That is the
  sibling story from this same reconciliation (plan item 1), on which this one
  depends. That story can produce a technically perfect picture of the wrong
  document; this story is what makes it the right one.
- The behaviour of the sign-in gate itself — whom it admits and whom it refuses.
  That belongs to the access-gate story, which states "what lies behind the gate"
  as its own out of scope. This story is not a rule *within* the gate; it is the
  reason an outbound client of ours never becomes an inbound caller at all.
- Exposing capture over HTTP, and moving reference bytes to object storage. Both
  are deferred by the intent to later tickets.

## Technical Context

**Why this is not an extension of two neighbouring stories.** Both were fetched
and read in full during reconciliation planning:

- *The operator access gate.* Its scope is admitting or refusing an **inbound**
  caller, and it declares "what lies behind the gate" out of scope. The behaviour
  here is an avoidance of the gate, not a rule inside it — the request the gate
  would have judged is never made. Folding this in would breach that story's own
  stated boundary.
- *The builder workspace origin.* It owns the workspace surface, the route table
  and the request-time production of the draft and edit channels. This work adds
  no route and changes no channel; it only widens who may ask that surface for a
  rendering. A capture-fidelity and egress guarantee is a new capability bucket,
  not an extension of workspace chrome.

**Capability placement is a judgement.** Filed under CAP-63 (1c Capture & Diff
Fidelity) because the mechanism is a property of *how a capture is taken*, not of
how the gate admits or how the workspace serves. It cross-references the access
gate and builder workspace capabilities as surfaces it must not weaken, and
claims neither.

**Depends on plan item 1** (cloud browser capture) for the browser itself, but
fails independently of it: the browser can work perfectly and still return the
wrong document.

**The decision record required by the intent's AC4.** The intent asked that the
approach be written down with the reasons the alternatives were rejected, so the
next person does not re-litigate it. Recorded here and in DOC-13 §6.1–§6.3, §8:

- **Chosen — the deployment fulfils the request itself.** It takes a real origin
  and the absence of a credential at the same time, so there is no trade to make.
- **Rejected — a long-lived service credential the deployment holds to talk to
  itself.** Strictly more machinery for strictly less guarantee: a credential can
  be misconfigured, leaked or left unrotated, whereas a request that is never
  made cannot be challenged.
- **Rejected — a gate bypass on a dedicated internal path.** Cheap, and a hole in
  the exact wall the access-gate work built. Named to be rejected explicitly
  rather than passed over in silence.
- **Rejected — handing the browser the document with no origin at all.** It gives
  up the page's real base address, so relative asset references stop resolving.
  That is precisely the blank-screenshot failure the project's own history
  records, which is why the browser still navigates a real absolute URL and only
  the transport is short-circuited.

## Reconciliation Decisions

- **Per-host ownership, in-process not-found, third-party passthrough, and a
  server error on failure are documented as intent, not as gaps** (decided at
  reconciliation, 2026-08-31): the intent ticket states each of them explicitly,
  with reasons, in its own implementation record — which is part of the
  operator's ticket and therefore intent, not merely code. Formalised as
  **AC-1470** (per-host ownership), **AC-1472** (unknown site), **AC-1471**
  (third-party passthrough) and **AC-1473** (failure answered, never passed
  through) on that authority.

- **"The same rendering the preview surface serves" is formalised as a
  behavioural criterion** (decided at reconciliation, 2026-08-31): the intent
  states the requirement only as an implementation note — that the capture must
  use the same memoised renderer as the preview route, because a second instance
  "could answer from a different stamp than the one the operator is looking at".
  Intent states no criterion for it. Formalised anyway as **AC-1474**, restated
  as the observable consequence rather than the mechanism: a capture taken after
  an edit shows the edited draft, and matches what the preview surface serves at
  that moment. A capture that silently showed a stale draft is the same
  wrong-picture-with-no-error failure this entire story exists to close, so it
  belongs in the criteria rather than in a comment.

- **The intent's AC4 — "record the decision in DOC-13" — is discharged as a
  documentation obligation and is deliberately not made an acceptance criterion**
  (decided at reconciliation, 2026-08-31): it asserts the presence of prose in a
  design document, not an externally observable system behaviour, and an AC of
  that shape could be satisfied by a string match while the system did the wrong
  thing. The record itself is reproduced in this story's Technical Context above
  so it survives independently of the document.

- **The published channel is stated positively** (decided at reconciliation,
  2026-08-31): the intent frames it as an exclusion ("published output is
  deliberately not served this way"). Restated as **AC-1475**, the positive
  behaviour it implies — a capture of a public address is fetched over the
  network — so the criterion is durable rather than a guard against a removed
  thing.

No contradiction between intent and code was found for this plan item.

## Dependencies

- story-080c6036 — Cloud browser capture: the deployed builder can take a
  picture (plan item 1 of this reconciliation). Supplies the browser this story
  answers.

## Story Points

2