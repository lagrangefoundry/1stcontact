---
uid: request-6e9dfecd
id: REQ-285
type: request
title: 'The page arrives with the turn: an authoritative, bounded state digest so
  the consultant never has to go and look'
created_by: EPIC-19
created_at: '2026-09-19T19:02:33.177544+00:00'
updated_at: '2026-09-19T20:21:22.099119+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d038d6de
  commits:
  - working_sha: 0cf86324949072643e7b9cdc4b20f623e8da074e
    reconcile_sha: null
    main_sha: null
  - working_sha: aafb2101b5162c8231480a6d19270582f06fac3b
    reconcile_sha: null
    main_sha: null
  - working_sha: 3b5074715c0532510d911818c35bf3855ed815db
    reconcile_sha: null
    main_sha: null
  version: 0.2.287
  story_points: 6
---

Parent: [[EPIC-19]] (Finding 5). The fourth of the consultant's own
recommendations, and the only one not covered by [[REQ-283]], [[REQ-284]] or
lagrange-framework REQ-168.

## What the consultant asked for

> **Let something else hold the state.** Most of my re-reading exists because I do
> not trust my memory of the page across a failure — correctly, as the
> `since: 120` slip demonstrates. A compact, authoritative *"here is the page as
> it now stands"* that arrives with the turn would eliminate the entire recovery
> ritual.

The slip it refers to is worth keeping: it asked the site for changes since
revision **120** when the true count was **76**. It had not misread anything — it
had *invented* a state marker and believed it. Its own verdict: *"That is not a
system fault, it is me confabulating a state marker, and it is a symptom of the
thing you are asking about."*

## Why this is the right fix and not more discipline

The other three recommendations reduce the COST of re-establishing state. This one
removes the NEED. A session that is handed the page every turn has no reason to go
and look, no reason to remember a revision number, and nothing to confabulate.

It is also the only one that helps after an interruption, which is when the
conversation is least trustworthy and the pressure to re-read is highest.

## The seam already exists

This host already delivers per-turn state through volatile priming providers:
`site.line` names the site and `site.changes` reports how many changes landed
since the session last looked. A page digest is a third provider of the same kind,
in the same tier, with no new mechanism — and it sits after the cache boundary, so
re-assembling it every turn cannot invalidate the cached prefix in front of it.

## What it should carry

Enough that a session never needs a read to orient, and no more:

- the pages that exist, and which one is being worked on;
- each page's structure at one level — its sections or bands in order, named;
- the assets the page references, by the Library label [[REQ-280]] gives them, so
  what the session reads matches what the client says;
- the current revision or change counter, **so the number it quotes is one it was
  given rather than one it produced**;
- whether anything is unpublished.

**Not** the L1 subtree, not the copy, not the paint axes. Those are what
`read_element` is for, and putting them here would recreate the cost this removes.

## The bound is the design constraint

This is volatile: it is re-sent on every turn and never cached. A digest that
grows with the site would become the very problem this epic is about, so it needs
a stated ceiling and a rule for what is dropped first when a site outgrows it —
most plausibly detail per page, so a ten-page site lists ten pages with less about
each rather than truncating to the first five.

**Measure it against what it replaces.** One page map plus two element reads is
already several thousand tokens; a digest costing a few hundred per turn pays for
itself within a handful of turns and eliminates a whole class of confabulation. If
it cannot be made small enough to win that trade, it should not ship — but the
trade is very likely winnable.

## Relationship to the other three

- [[REQ-283]] gives the session a memory of what was DECIDED.
- This gives it the current state of what was BUILT.
- They are complements: a summary that tried to track the page would be stale the
  moment an edit landed, and a page digest cannot record why a choice was made.


---

## What was built

A third volatile priming provider, `site.digest`, declared in `priming.json`'s
`reminders` tier immediately after `site.line` — the same kind, the same tier, no
new mechanism. It renders per turn and the tier declares no cache boundary, so it
is volatile by construction rather than by arithmetic.

### What the digest carries

- **Every page**, by the id every operation takes, with its title and its address
  — in the same order `list_pages` reports, because two orders for one question is
  two answers that will eventually disagree.
- **Which page is being worked on**, marked *last changed*. Nothing in this host
  knows which page the client has open, so it is read out of the change journal:
  the most recent record that names a page, looked back a bounded twelve records
  rather than over the whole window. A value carried across turns would be exactly
  the kind of marker the session confabulates; a value read from the record
  survives an interruption, which is when the question is actually asked.
- **Each page's bands** — the top-level children of the page root, in order, each
  with the dotted address a write takes beside it. The address travels with the
  name because a band the session can see and cannot reach is an invitation to
  compose one, which the declaration's `overview` already forbids. They are named
  by `segments.ts`'s existing `labelOf`, so the digest, the page map and the
  journal call a thing the same thing.
- **The pictures each page references**, by the Library label where the deployment
  has a catalogue and by the site handle where it does not. The `1c` CLI has no
  client Library, so there is no shared name to use and the handle is the only
  name that exists — an honest absence, not a degraded mode.
- **The change counter**, as the store holds it now.
- **Whether anything is unpublished** — never published, or *r4 is live and N
  files differ*, or *r4 is live and nothing differs*.

It carries no L1 subtree, no copy below a band, and no paint axes.

### The bound

`MAX_DIGEST_CHARS = 2000`, about five hundred tokens; a real two-page site renders
at around seven hundred characters. A site that outgrows the ceiling sheds detail
in four rungs, in the order what goes is worth least: everything, then the
pictures on the pages nobody is working on, then the bands on those pages, then
every page as one line. The page being worked on keeps its detail longest.

A page heading is never shed. A site with more pages than fit even as bare lines
has its list cut — and **says so**, naming `list_pages` as the cheap call that
completes it ([[REQ-284]]), because a silent truncation reads exactly like a
complete listing and this entry's whole value is that it can be trusted.

### What it costs per turn

The derivation is cached against `SiteStore.version`, which is bumped by every
write — so it is re-derived exactly when something changed and on no other turn,
and a turn that only answers a question costs one `version` read. The counter is
deliberately not the key: the counter is the *journal's* and stands still when a
write fails to journal, which is precisely when a cached page shape would be
wrong.

### Silence rather than failure

The provider is registered whether or not the host has a digest to give, because
the shipped configuration names the entry unconditionally and a registry that
omitted it could not load the role at all. With no source, or with a store that
cannot be read, it renders `null` — which drops the entry and its separator, with
no residue. The record is what makes a turn cheap, not what makes one possible.

## Two things it needed that did not exist

- **`l1AssetReferences`** in `site-schema`, extracted out of
  `danglingAssetReferences`. That walk already knew the two non-obvious places a
  reference hides — a behaviour module's `slots`, and a painted
  `backgroundImageUrl` on any node's axes — and it was asking which of them the
  site does not hold. The digest asks what a page references at all. One walk,
  two consumers; two walks would have been two ideas of where a reference can be.
- **`placed_as` carried onto the catalogue item.** `placed_on` answers *is this
  material on the site*; `placed_as` ([[REQ-282]]) answers *what is it called
  there*, and that is the only thing that joins a site handle in a page to the
  `IMAGE-5` the client reads on their own Library row. Optional, and absence is
  the empty list — material placed before the names were recorded is named by its
  handle, which is right, because no shared name for it exists yet.

## Test plan

`tests/test_UAT_FC_REQ-285_the_page_arrives_with_the_turn.test.ts` — thirteen
cases. The end-to-end ones assert on **what the model was actually sent**, through
the real host, the real `priming.json` loaded by the framework's own loader, a
real filesystem store and a real change journal; the only double is the Anthropic
client, which is the network. They cover: the digest arriving on every turn and
being absent from the cached prefix; the pages, their bands in order and the page
last changed; the counter matching the store's own; the unpublished state; the
pictures named by handle without a catalogue and by label with one; and the
absence of the subtree, the copy below a band and the axes. Three more drive the
bound through the real renderer and the real templates — a site carried whole, a
site shedding detail while keeping every page, and a site too big even for bare
lines saying it was cut. Three cover silence: no source, an unreadable store, and
the entry's declared position in the volatile tier.