---
uid: request-0d4b67bf
id: REQ-206
type: request
title: 'The assistant''s eyes in the builder: mount the fidelity surface on the Worker'
created_by: CHAT-43
created_at: '2026-09-08T01:17:40.528379+00:00'
updated_at: '2026-09-08T01:17:40.528379+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: chat-80217782
---

## What changes

**The builder's assistant can see.** Today it works blind: it can write a heading
and it cannot tell whether the heading landed where it meant, whether the colour
is the colour, or whether the page looks anything like the one the client asked
it to reproduce. The `fidelity` surface — capture a site from the web, screenshot
a page, compare two pictures, judge a reproduction against its reference — is
built, tested, and already granted to the consultant. It is simply not mounted on
the deployment the client talks to. This mounts it.

After this, a consultant session in the builder has `capture_site`,
`list_references`, `describe_reference`, `screenshot`, `compare` and
`check_fidelity`, and its tool manual says so.

## Why it is absent today

Not a bug in the surface and not a missing grant. `instances.json` already grants
the consultant `fidelity: ["SeeSite"]`, which is all six operations. `host-core.ts`
mounts the surface only when `HostDeps.fidelity` is supplied; the `1c` CLI supplies
it and `workerHost` does not — its deps object has no `fidelity` key at all.
`fidelityDeps` exists in the Worker, exported, and is called from nowhere. Neither
is `r2ReferenceStore`, nor `adoptCapture`. The whole capability is built and dark.

That was deliberate when it landed ([[REQ-154]], [[REQ-157]]): the note in the
Worker's `shot.ts` says no route answers it yet because exposing a metered browser
is a decision about rate limiting and authorisation rather than a wiring step, and
it belongs to the ticket that gives the assistant the surface. **This is that
ticket**, and the decision is below.

**And it is why the assistant does not merely fail to use its eyes — it denies
having them.** The tool manual is projected from the surface declaration and the
session's grant ([[REQ-126]]) precisely so that a session is never told about a
capability it was not granted, and the role text deliberately enumerates no tools
at all. An unmounted surface is therefore not a tool the model cannot find; it is
one it has never heard of. Asked whether it can take a screenshot, it says no, and
it is telling the truth. Nothing about this is repairable by priming — only by
mounting the surface.

## How it behaves

- A consultant session in the builder can screenshot **its own draft**, **the page
  as the client is editing it right now**, and **a published revision** — pictures
  of our own channels, rendered in process and never leaving the browser.
- It can screenshot **any public address on the web**, and it can **capture** one:
  load it at each viewport width, record what it looks like, read the values
  behind it, and mirror its imagery, so everything afterwards works from the
  recording rather than from the live site.
- A capture is **written up as findable material** — described in prose, adopted
  into the client's own corpus — so a reference is findable later by what it *is*
  rather than by the address it came from. Without that binding a capture still
  stores, and `capture_site` says the bundle was not written up; a client who
  asks the assistant to "make it look like our old site" and is then told the
  capture is unfindable has been given half a feature, so the binding is part of
  this ticket rather than a follow-on.
- Captures are the **client's own private material**, held per business. One
  business never sees another's references. This falls out of the store the
  surface is handed rather than being enforced a second time in the surface.

## The browser is metered — the decision this ticket makes

**Authorisation is already answered, and the answer is to add no new surface.**
The concern in the original note was exposing a browser *over HTTP*. This does not:
no route is added. The browser is reachable only from inside a turn of a
conversation that has already been admitted — by our own session cookie or by
Access ([[REQ-202]]) — and already scoped to one business. The fidelity surface
inherits that admission entire. A capture of an address the model chose is held to
the egress policy on **every** request the page makes, not just the typed one,
which is the control that already exists and is the reason a redirect into
link-local space cannot be reached.

**Rate limiting is the real exposure, and it is about spend, not safety.** A
Browser Rendering session is metered and the account has a concurrency cap and an
acquisition rate limit. A responsive ladder is eight navigations; a conversation
that captures repeatedly can turn a chat into a bill, and a stranded session
degrades into an outage that reads to the client as a hang. So:

- **Browser-backed operations are budgeted per session.** A session has a
  bounded number of live-page fetches; operations that read something already
  captured or already rendered do not spend from it.
- **Exhausting the budget is a refusal the assistant can read and act on**, in the
  same shape as every other refusal on the surface: it names what ran out and what
  is still possible. It refuses that one operation. Every other tool keeps working
  and the conversation continues — a client must never lose their consultant
  because it looked at their page too often.
- **The refusal is stated to the assistant before it spends**, in the surface's
  own overview, which already tells it that looking is neither free nor instant
  and to take the picture it needs rather than the set it might need. That text
  becomes true rather than advisory.
- Counting has a precedent to follow rather than invent: sign-in already bounds
  attempts by counting recent rows ([[REQ-202]]).

As a technical consequence of the above, and requested here so it is not
discovered during reconciliation:

- The Worker builds a **reference store for the request's business** and hands it
  to the surface, so captures land in the client's own private bucket rather than
  anywhere a site's published bytes live.
- The surface is given **the builder's own address**, taken from the request, so a
  browser sent to look at a draft has somewhere to navigate. Our own channels are
  answered in process; the address is what makes the page's own assets resolve.
- **Two driver factories, and the difference is the security story.** Our own
  previews are served from the in-process renderer, so their requests never leave
  the browser and cannot come back as an Access challenge page. A capture of
  somebody else's site gets the guarded factory and **no** origin resolver — a
  captured page that happens to name our host must not be answered out of our own
  store.
- A deployment **without** the browser binding still opens the session, still
  replays the transcript, and simply has no eyes — the same shape as a deployment
  without an API key. Absent must stay absent-and-fine rather than throwing on
  first use.

## What does not change

- **No new HTTP route.** Nothing about this is reachable except as a tool call
  within an admitted, business-scoped turn.
- **No change to the surface declaration or its operations.** They are correct;
  they were never mounted.
- **No change to the `1c` CLI**, which has wired this correctly since it landed.
- **The role text still enumerates no tools.** The manual grows because the grant
  is now honoured, which is the whole point of projecting it ([[REQ-126]]).
- **Nothing here changes a site.** Every operation on this surface is a way of
  looking at one.
