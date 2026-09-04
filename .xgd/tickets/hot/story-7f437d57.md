---
uid: story-7f437d57
id: STORY-104
type: story
title: See the conversation about the site I am looking at, right beside it, with
  its history and my unsent words intact
created_by: xgd
created_at: '2026-08-10T08:46:03.530800+00:00'
updated_at: '2026-09-04T05:30:17.474101+00:00'
completed_at: null
last_field_updated: story_kind
status: completed
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-44a04848
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
---

## Story

**As a** person working on my site in the builder workspace, **I want** the
conversation with the assistant to sit beside the page I am looking at and always be
the conversation about *that* site — with its history, my half-typed message, and any
reason it cannot run all visible in the pane — **so that** I can ask for changes in my
own words without ever having to wonder which site I am talking to or repeat what I
already said.

## Description

The workspace shows the operator's rendered site in one pane. This story owns what is
in the other one: a working conversation, not a label saying one is coming.

In scope:

- **A live surface.** The secondary pane presents a message list and a composer the
  operator can type into and send from, with what the assistant did during a turn
  visible alongside what it said.
- **Following the displayed site.** The conversation on screen is always the one about
  the site the display panel is showing. The site is chosen in exactly one place in the
  workspace: exactly one control anywhere in the workspace offers the store's sites to
  pick from, however many other dropdowns the workspace has for other purposes, and the
  pane offers no control of its own that could disagree with it. Changing the site
  changes both halves together.
- **Replay.** On first open and on every switch, the pane shows what that site's
  conversation already contains, so the assistant never answers from context the
  operator cannot see. One site's conversation never appears under another's.
- **Composing state per conversation.** An unsent, half-typed message belongs to the
  conversation it was typed into: leave for another site and come back and it is still
  there, and the other site's composer is not holding it.
- **Turns addressed to what is on screen.** Sending goes to the conversation currently
  displayed, and the reply arrives progressively in the message list rather than in one
  lump at the end.
- **Visible failure.** An assistant that cannot run right now, and an origin that
  cannot be reached at all, are each explained in the pane. Neither costs the operator
  the history they already have, and neither leaves an empty pane or an endless wait.
- **Switching faster than the answers arrive.** However quickly the operator moves
  between sites, the pane ends up showing the site they last chose — an answer for a
  site they have left never lands in front of them.

Out of scope:

- **The conversation itself** — the routes, the session lifecycle, where the transcript
  is stored, how the assistant is primed, and what the stream carries belong to the
  assistant host story. This story owns only what the browser shows of them.
- **What the assistant is able to do** — the declared and granted operations, their
  validation and their audit belong to the site control surface.
- **The split's frame** — the divider, the rail collapse and drag-to-resize, and where
  workspace layout state is persisted, are unchanged and belong to the workspace story.

## Technical Context

- Depends on the assistant host (CAP-90 / story-a58a0974): the pane is handed an
  already-open conversation — its identifier, the turns already spoken, whether a turn
  can be run and why not — and runs turns against that conversation. Every guarantee
  about binding, persistence and refusal is the host's; this story asserts only that
  the operator can see them.
- The split, the divider, the rail collapse and drag-to-resize belong to CAP-85 /
  story-e674c60a and are unchanged by this work. That story's criterion describing the
  secondary as a placeholder is superseded and re-pointed to the live pane under plan
  item 1 of this same reconciliation; it is not restated here.
- **Intent supersession within the bundle.** REQ-122 first gave the pane a site
  identity: it held a slug, opened its own conversation, addressed each turn by site,
  and carried a guard token so a slow answer for an abandoned site could not land.
  REQ-127 withdrew that deliberately — the pane now holds a conversation and nothing
  else, the workspace performs the switch and hands the pane an already-open
  conversation, and the guard against a late answer moved to where the waiting happens.
  The criteria here follow REQ-127, the intent in force. The externally observable
  result is identical either way, which is why the race criterion is stated as an
  outcome rather than a mechanism.
- **Declared one-time consequence, not a criterion.** REQ-127 states that the key an
  unsent draft is held under moved from the site to the conversation, so a draft typed
  before that change is not found after it. That is a single migration effect, not a
  durable behaviour, and is deliberately not written as an acceptance criterion.
- **Evidence note.** Existing free-coded evidence proves tool activity at the host's
  stream rather than in the pane; the pane is mounted with its tool area enabled and
  the intent states the activity is shown there. The criterion is written from the
  intent, so its verification is expected to be observed in the pane.
- **Known upstream gaps, not claimed here.** Markdown and sanitiser engines load behind
  the component's own seams and are designed to degrade: without them the pane renders
  escaped text rather than failing. No criterion asserts rendered markdown.

## Reconciliation Decisions

*Recorded 2026-09-03, reconciling BUNDLE-23 (bundle-203b1dc2), item 13.*

- **The single-site-selector criterion is restated by what the control offers rather
  than by counting dropdowns.** REQ-161 names this supersession itself: the criterion
  was verified by asserting that the workspace held exactly one dropdown of any kind,
  which was exact while it did, and which the Library's role and kind filters break
  without touching what the criterion is about. Restated: **exactly one control in the
  workspace offers the store's sites**, and it is the toolbar's; every other dropdown
  in the workspace is checked against the store's site slugs and must offer none of
  them, so a second site selector still fails.
  *Rationale:* the property that matters is that nothing but the toolbar offers a site
  to pick — a second control that could disagree with it is worse than no control at
  all. The count was a proxy for that, and the proxy now has a false failure mode while
  the property is unchanged. The scope stays the **whole workspace** rather than the
  split, because the toolbar is the split's sibling and a narrower scope would pass
  while a second selector sat beside the one it found.
- **The pane's own absence of a site control is kept as part of the same criterion.**
  It is asserted both as a surface — the pane exposes nothing to set or read a site —
  and as chrome, so the guarantee does not rest on a DOM query alone.
  *Rationale:* the two halves fail independently, and the criterion's subject is that
  there is no second opinion about which site is displayed, not merely that no second
  dropdown is drawn.

## Dependencies

- Plan item 4 — the assistant session host (story-a58a0974): the conversation this pane
  displays and sends into.

## Story Points

3