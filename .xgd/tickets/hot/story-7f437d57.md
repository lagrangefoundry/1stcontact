---
uid: story-7f437d57
id: STORY-104
type: story
title: See the conversation about the site I am looking at, right beside it, with
  its history and my unsent words intact
created_by: xgd
created_at: '2026-08-10T08:46:03.530800+00:00'
updated_at: '2026-09-10T22:44:57.607779+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-44a04848
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by:
  - bundle-87be4669
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
  the site the display panel is showing. Exactly one control in the whole workspace
  *offers a site to choose*; the pane offers no such control of its own that could
  disagree with it. Other dropdowns may exist elsewhere in the chrome for unrelated
  purposes — narrowing a list, say — and are not site controls: the guarantee is about
  what a control offers, not about how many dropdowns the workspace contains. Changing
  the site changes both halves together.
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

*Recorded 2026-09-10, reconciling BUNDLE-26 (bundle-87be4669), item 15 (REQ-161).*

- **"Exactly one place chooses a site" is restated by what the control offers rather
  than by counting dropdowns.** The criterion was written while the workspace held one
  dropdown of any kind, so "there is exactly one dropdown" and "exactly one dropdown
  offers a site" were indistinguishable and the cheaper reading was taken. REQ-161 adds
  a second tab whose list carries filter dropdowns — offering roles and kinds, never
  sites — which falsifies the count without touching the property the criterion exists
  for. REQ-161 names the criterion as superseded and states the restatement, so it is
  restated: every dropdown in the workspace is examined and those offering one of the
  store's sites are kept; exactly one survives, and it is the toolbar's.
  *Rationale:* the risk is a second control changing the site out from under the
  conversation. A dropdown that cannot name a site cannot do that, so counting it was
  never the claim — it was a proxy that happened to hold.
- **The other tab's filters are not described here.** This story asserts only that they
  do not offer a site; what they narrow, and the surface they narrow it on, belong to
  the capability that declared that tab.
  *Rationale:* stating the Library's controls here would put one capability in two
  places, and the reuse-first rule points them at their own story.

## Dependencies

- Plan item 4 — the assistant session host (story-a58a0974): the conversation this pane
  displays and sends into.

## Story Points

3