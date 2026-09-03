---
uid: request-20bd7d63
id: REQ-166
type: request
title: 'Capture to ticket: bundles become corpus members'
created_by: xgd
created_at: '2026-08-31T21:38:56.541751+00:00'
updated_at: '2026-09-03T00:06:40.457071+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-162
  - REQ-163
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-97f85575
---

# Capture → ticket: bundles become corpus members

## The asymmetry this closes

[[REQ-163]] makes an uploaded file into a `material` ticket the AI can find.
Captures produce far richer material — a whole rendered site, its copy, its
palette, its imagery — and produce **nothing the AI can search**. Bundles land in
the ReferenceStore and stop there.

The result would be invisible from the outside and hard to explain: the client
uploads a PDF and the AI can discuss it; the client points us at the site they
admire, we capture it in full, and the AI cannot recall a thing about it.

## A bundle is N attachment records on one `reference` ticket

Settled in [[DOC-38]] §9, and the reason is [[DOC-13]] §9's *"capture once,
re-map forever"*. Re-extraction reads members **selectively** — `capture.json`,
then a screenshot, falling back to `rendered.html` — so:

- **One record over an archive** would force a Worker to pull an entire 11–23MB
  bundle to read one member of it. (Measured: three real single-page captures at
  11MB / 14MB / 23MB, 11 to 99 members each.)
- **A manifest inside one record** is N records with an extra indirection and no
  listing.

Each member carries `meta.member` naming its role (`capture.json`,
`screenshot.full.png`, `assets/hero.jpg`).

**Dedup falls out.** Addresses are content-derived, so recapturing a site
re-uses every unchanged blob — an unchanged hero image is one blob across every
capture that ever saw it. That matters far more for [[DOC-15]]'s permanently
retained internal corpus than for any single tenant.

## The body is the description of the site

The `reference` ticket's body is what the KB indexes ([[DOC-38]] §6), so it must
describe the captured site as prose: what the business appears to be, how the
page is structured, the palette and type treatment, the tone of the copy. Written
once at capture time from `capture.json` plus the screenshot.

A bundle with a weak description is a bundle the AI cannot find, however complete its
members are.

## Rights are inferred, never asked

[[DOC-38]] §10.1, and captures are the case that motivates it:

| Captured URL | `republishable` | `exportable` |
|---|---|---|
| matches the client's declared domain (3a — their own old site) | yes | **no** — it is their business |
| any other domain (3b — a reference) | **no** | yes — public marketing, structure only |

The two bits invert between the cases ([[DOC-38]] §4.2), which is why neither is
derived from the other. The only question ever put to the client is on a domain
mismatch — *"is this your site?"* — a question of fact, not of law.

**The invariant this exists to enforce:** a capture-sourced asset may never be
promoted into a site's asset library unless its bundle is `republishable`
([[DOC-38]] §5). Publishing a competitor's hero image under the client's own
domain is the most damaging single action available in the system.

## Out of scope

- **The capture pipeline itself** — [[REQ-154]] / [[REQ-155]]. This consumes what
  they produce.
- **Retention and the internal corpus** — [[DOC-38]] §12's detach timer and the
  export into the system tenant. Separate ticket.
- **The quarantine write gate** ([[DOC-38]] §11) — v1 is the prompt-level
  constraint plus the asset gate above.

## Acceptance

- A completed capture yields one `reference` ticket with one attachment record
  per bundle member, each addressable without reading the others.
- The body describes the captured site well enough to retrieve it by what it *is*
  — *"the bakery with the dark green palette"* — not merely by hostname.
- `republishable` / `exportable` are set from the URL, and a domain mismatch
  prompts the one factual question rather than assuming.
- Recapturing an unchanged site creates new records but no new blobs.
- Re-extraction reads a single member without materialising the whole bundle.


## What the client sees: a capture in the Library

[[REQ-161]] already built the shelf this lands on. `listMaterial` queries
`MATERIAL_TYPES = ['material', 'reference']` and the Library's kind filter already
offers `capture`, so a `reference` ticket appears in *Your material* the moment
this ticket writes one — tenant-wide, newest first, with no Library work at all.

What does not follow for free is the detail pane, because every part of it assumes
ONE TICKET IS ONE FILE and a bundle is 11–99. Three things read wrong unchanged:
nothing renders as a preview (`kind` is not `image` and the resolved content type
has no reader), the *File* field falls back to the ticket title, and the download
link serves `attachments[0]` — an arbitrary member of the bundle.

### The preview is the screenshot

A capture shows `screenshot.full.png`, fetched as a single member. This is the
same member-addressed read the re-extraction criterion already requires, so the
client-facing need and the architectural one are one route, not two.

### A capture is a picture and a description, not a directory

The client's model of a capture is *"a picture of that site and what you thought
of it"*. Members are re-extraction machinery. So the detail drops the *File*
field, points its download at the screenshot rather than at whichever member
sorts first, and states the member count plainly — *"99 files captured"*. A
99-row member list would be honest and useless.

### The body opens with a link to the site captured

The first line of every capture description is a markdown link to the captured
URL, so the client can always get from our prose about a site back to the site.
The Library renders the body through the sanitizer, which keeps anchors — but it
adds no `target`/`rel`, so the link must be opened in a new context rather than
navigating the builder away and discarding editor state.

### The title is the site's own title

The ticket is titled with what the client saw in their browser tab, not a phrase
a model invented for someone else's site. `capture.json` does not currently carry
it: [[DOC-13]] §4's `Capture` is `url, host, path, capturedAt, viewport, theme,
sections, assets`. So `title` is ADDED TO THAT SCHEMA and read during the capture
pass. Parsing it out of `rendered.html` at ticket-creation time was rejected —
re-extraction reads `capture.json` first and would never see it, leaving the two
paths to disagree about what a site is called. A blank or absent title falls back
to `host`.

This is a deliberate, named exception to the *capture pipeline itself* being out
of scope above: one field on one schema, and the surface it feeds is here.

### Recapture overwrites the description

One `reference` per URL ([[DOC-38]] §9) means recapture updates a row in place
rather than multiplying it. The description is REWRITTEN on recapture, including
one the client corrected — an exception to the `description_model: client`
protection [[REQ-161]] added for the re-describe pass, and deliberate: a
description of a page that has since changed is inaccessible garbage about
someone else's site, and archiving third-party sites is not the goal. The
protection exists to stop a background pass silently replacing a client's words
about THEIR OWN material; a recapture is an explicit act about a page that has
demonstrably moved.

### Acceptance

- A completed capture appears in the Library as a `capture`-kind row without any
  change to how the list is queried or filtered.
- Its detail shows the captured screenshot, fetched as a single member.
- The detail states how many files the bundle holds, offers the screenshot as its
  download, and shows no single-file *File* field.
- The description's first line links the captured URL, and following it does not
  navigate away from the builder.
- The ticket is titled with the captured page's own `<title>`, falling back to the
  host when it is blank.
- Recapturing a site replaces the description in place, leaving one row per URL.


## Where this happens: `capture_site` finishes the job it starts

The assistant ALREADY captures. `capture_site` on the fidelity surface
([[REQ-157]]) leases a browser, runs `cmdCapturePage`, and answers with a bundle
name — and that is precisely where the asymmetry above begins: the bundle lands
in the `ReferenceStore` and stops. So this ticket is not a new entry point. It is
the second half of an operation the assistant already has, and the tool it is
exposed through is the one that already exists.

No new client-facing control. A UI that starts a capture may follow if it earns
its place; the Library shows the result either way.

**The ticket store reaches `capture_site` as an optional dep on `FidelityDeps`.**
The Worker supplies it in `shot.ts`; the `1c` CLI, which has no D1 and whose
capture module had `node:fs` deliberately removed from its import graph
([[REQ-155]]), supplies nothing and captures exactly as it does today. That is
the same conditional-composition rule the fidelity surface is itself registered
under — a deployment that cannot do a thing does not declare it — rather than a
second mechanism invented here.

A capture that is stored but not adopted is REPORTED, not silently half-done: the
operation's answer says whether a `reference` ticket was written, for the same
reason [[REQ-163]]'s ingestion says loudly when a material was stored but not
indexed. A bundle nothing can find is the failure this ticket exists to remove,
and it must not be able to happen quietly.

### Acceptance

- `capture_site` yields both a bundle and a `reference` ticket, and says which.
- The same URL captured twice leaves ONE `reference` ticket, updated in place.
- A host with no ticket store captures exactly as before and says no ticket was
  written, rather than failing.


## Corrections found while building this

Three things in the sections above did not survive contact with the code. They
are corrected here rather than edited away, because each was a reasonable belief
at scoping time and the reason it was wrong is worth keeping.

### The dedup is ours now, and it is stronger than what was asked for

The acceptance above says *"recapturing an unchanged site creates new records but
no new blobs"*. That was written when the ticketing component CONTENT-ADDRESSED
attachments. It no longer does: `attach` addresses a blob by the attachment
record's own uid, because a blob shared between two records cannot be moved to
the trash without breaking whichever sibling still names it — and moving it is
what makes deletion actually revoke reach.

So the dedup is done in this ticket instead, against the `sha256` the component
still records on every attachment: a member whose hash matches the record already
holding it is left completely alone. **An unchanged recapture therefore creates
neither a new blob NOR a new record**, which is what the acceptance was reaching
for. That line is superseded by this one.

A member whose bytes DID change is attached afresh and the superseded record is
`detach`ed — the trash, not a purge, so replacing a screenshot stays reversible.
Leaving both would make the attachment set a history of every capture ever taken,
with no way to ask which `screenshot.full.png` is the current one.

### The identity is the bundle name, not the URL

*"One `reference` ticket per URL"* is slightly wrong and the difference bites.
`bundleNameFor` slugs the path and drops the query string, so two addresses can
land in ONE bundle — and keying the ticket on the URL would let a recapture under
a slightly different address write a second ticket pointing at bytes the first
one already owns: two rows in the Library, one set of bytes, and no way to tell
which is current. The ticket is keyed on the BUNDLE NAME, which is what storage
itself keys on, and carries it in a `bundle` field.

### A bundle that is not a capture is refused by name

Not previously stated, and reachable the moment anything other than
`capture_site` can name a bundle. A bundle with no `capture.json` is not a
capture, and saying so beats describing whatever happened to be in it.

## Also true of the finished work

- **A failed write-up never loses the capture.** If adoption raises — the
  describer is unreachable, the corpus is down — `capture_site` reports the
  failure and its reason, and the bundle stands complete in the store. Discarding
  11–23MB of successfully mirrored site over a text generation is the trade
  [[REQ-163]] already refuses to make when indexing fails.
- **The description degrades in stages, and the link survives all of them.** With
  no describer, no screenshot, or a screenshot over the vision ceiling, the body
  still opens with the link to the site and still carries the palette, the type
  and the section count read from `capture.json` — facts a vision call should
  never have been asked to guess. What is lost is the prose about what the
  business appears to be, and not the entry.
- **Ordinary material is untouched by all of it.** A `material` is one file and
  has no member vocabulary, so it reports an empty member list, keeps its *File*
  field, and its download URL carries no member. Every caller that predates this
  ticket behaves exactly as it did.

### Acceptance

- Recapturing an unchanged site writes neither a new blob nor a new record.
- A changed member is replaced and the superseded record detached, leaving one
  live record per member.
- Two captures of one bundle leave one ticket, found by bundle name.
- A bundle with no `capture.json` is refused by name.
- An adoption that fails leaves the bundle complete and says what went wrong.
- Ordinary single-file material keeps its filename, its *File* field and its
  member-less download URL.
