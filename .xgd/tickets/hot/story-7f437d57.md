---
uid: story-7f437d57
id: STORY-104
type: story
title: See the conversation about the site I am looking at, right beside it, with
  its history and my unsent words intact
created_by: xgd
created_at: '2026-08-10T08:46:03.530800+00:00'
updated_at: '2026-09-19T15:00:08.142035+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-44a04848
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-8e1807f6
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
  operator cannot see. One site's conversation never appears under another's. Replay
  waits for the markdown engines to settle before it paints, because each turn is
  painted once and cannot be redrawn: a transcript handed over while the renderer is
  still arriving would read as its own markdown source for the life of the page. The
  wait runs alongside the opening of the conversation, so it costs no more than the
  slower of the two.
- **Composing state per conversation.** An unsent, half-typed message belongs to the
  conversation it was typed into: leave for another site and come back and it is still
  there, and the other site's composer is not holding it.
- **Turns addressed to what is on screen.** Sending goes to the conversation currently
  displayed, and the reply arrives progressively in the message list rather than in one
  lump at the end.
- **Following the assistant's writes.** When a turn reports that the site moved, the page
  shown beside the conversation is fetched again, so a request answered by several edits
  arrives edit by edit while the assistant is still working, rather than leaving the
  operator to reload by hand once it stops talking. A turn that moved nothing leaves the
  page where it was, so asking a question does not cost the operator their place on it.
  The report itself is not part of the conversation: it is acted on and leaves no message,
  no activity entry and nothing to replay.
- **Visible failure.** An assistant that cannot run right now, and an origin that
  cannot be reached at all, are each explained in the pane. Neither costs the operator
  the history they already have, and neither leaves an empty pane or an endless wait.
  The pane's own note about a conversation that could not be opened is markdown too, so
  it is held for the same readiness the transcript is.
- **Switching faster than the answers arrive.** However quickly the operator moves
  between sites, the pane ends up showing the site they last chose — an answer for a
  site they have left never lands in front of them.
- **One renderer for the workspace.** The engines that turn markdown into prose — and
  the sanitizer that scrubs what they produce — are started once for the whole
  workspace, and the readiness every markdown surface waits on settles whether they
  load or cannot be fetched at all. It never fails, so waiting on it cannot strand a
  surface, and an unreachable renderer yields a plainer panel of escaped text rather
  than a blank or hanging one.

Out of scope:

- **The conversation itself** — the routes, the session lifecycle, where the transcript
  is stored, how the assistant is primed, and what the stream carries belong to the
  assistant host story. This story owns only what the browser shows of them, and what it
  does on receiving them. That the change report is made at all, that it is made once per
  write, and that it is derived from the site's own change count rather than asked of the
  assistant, are all claimed there and not here.
- **What the assistant is able to do** — the declared and granted operations, their
  validation and their audit belong to the site control surface.
- **The split's frame** — the divider, the rail collapse and drag-to-resize, and where
  workspace layout state is persisted, are unchanged and belong to the workspace story.
- **The other markdown surfaces.** The Library's document reader and its "What this is"
  description wait on the same readiness and render through the same seam, but what
  they show and how they behave belong to the Library's own story.

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
- **The markdown engines are a waited-for dependency, not a disclaimed gap.** They are
  still third-party and still lazily imported, and the render seam's degradation to
  escaped source when the sanitizer is absent is still the right answer and is still
  not claimed as rendering. What changed is that the pane no longer paints while the
  engines are merely *late*: the workspace waits on their readiness before handing a
  conversation over, and the same readiness is what the Library's surfaces wait on. The
  wait is injectable where the workspace is mounted, so the cold-load ordering can be
  held open and observed rather than raced; that seam is a means of verification and is
  deliberately not itself a criterion.
- **The reload is the update mechanism, and the conversation was the one producer that
  never triggered it.** The draft and edit views render when they are requested, so no
  saved artifact exists for a write to keep in step: re-fetching the displayed page *is*
  how it catches up. Every other producer of structured edits in the workspace — the
  palette popup, the segment editor — already re-fetches after its writes, by the same
  means and for the same reason, so this work gives the conversation that same idiom
  rather than a second one. The re-fetch is the workspace's business and its failure is
  isolated from the turn: one that throws is swallowed and the assistant's answer still
  arrives in full.

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

*Recorded 2026-09-14, reconciling BUNDLE-27 (bundle-8e1807f6), item 9 (BUG-42, transcript half).*

- **Rendered markdown in the pane is now claimed, and the previous "no criterion
  asserts rendered markdown" note is withdrawn.** BUG-42 states the ordering rule
  directly — do not paint markdown before the engine has settled — and the workspace
  implements it by waiting on readiness alongside opening the conversation. The
  disclaimer described a gap the intent has since closed, so keeping it would leave the
  matrix asserting less than the operator asked for.
  *Rationale:* the degradation itself was never the defect. What was undocumented is the
  distinction between an engine that is *absent* (escaped source, correct) and one that
  is merely *late* (escaped source, permanent, wrong), and that distinction is exactly
  what a criterion has to carry.
- **The shared-engine criterion is written here even though other surfaces wait on it.**
  The readiness signal is one workspace-wide thing — started once, settling on load or
  failure, never failing — and this pane is the surface whose defect forced it into
  existence. It is stated once, here, as a property of the workspace rather than of the
  pane.
  *Rationale:* restating it on every story that waits on it would put one guarantee in
  several places; the Library's story says what the Library shows, not how many times
  the engines load.
- **The injectable readiness seam is not a criterion.** BUG-42 names it, but it exists
  so a suite can hold the ordering open and observe it. It is a test affordance, not
  something an operator can see.
  *Rationale:* acceptance criteria must be observable at a product boundary; the
  ordering that seam verifies already is one, and is stated on AC-1063.

*Recorded 2026-09-14, reconciling BUNDLE-27 (bundle-8e1807f6), item 10 (BUG-43).*

- **Acting on the change report is claimed here; producing it is not.** The report is made
  by the side that serves the turn, and that it is made — per write, from the site's own
  count, unskippable by the assistant — is asserted on the host's story. What this story
  adds is the half an operator can see: the page beside the conversation follows the
  writes.
  *Rationale:* the two fail independently. A report nothing acts on and an action with
  nothing to act on are different defects with different fixes.
- **The report's invisibility is stated on the existing activity criterion rather than as
  a criterion of its own.** AC-1066 is the criterion about what a turn puts in front of
  the operator, and "this frame is consumed and not displayed" is a claim of exactly that
  kind. Left separate, AC-1066 would go on reading as though every frame a turn carries is
  shown somewhere.
  *Rationale:* one criterion per question the operator can ask of the pane.
- **The reload is asserted as the displayed page being fetched again, not as the
  mechanism that does it.** What the operator sees is that the page caught up; whether
  that is a frame reload, a re-render or a navigation is not something they can tell
  apart, and pinning the mechanism would fail the criterion on a change that kept its
  promise.
  *Rationale:* acceptance criteria are observable at a product boundary.

## Dependencies

- Plan item 4 — the assistant session host (story-a58a0974): the conversation this pane
  displays and sends into.

## Story Points

3