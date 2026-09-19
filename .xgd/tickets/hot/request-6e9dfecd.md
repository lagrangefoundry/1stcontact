---
uid: request-6e9dfecd
id: REQ-285
type: request
title: 'The page arrives with the turn: an authoritative, bounded state digest so
  the consultant never has to go and look'
created_by: EPIC-19
created_at: '2026-09-19T19:02:33.177544+00:00'
updated_at: '2026-09-19T19:02:33.177544+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
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
