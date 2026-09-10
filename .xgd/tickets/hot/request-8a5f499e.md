---
uid: request-8a5f499e
id: REQ-215
type: request
title: Switching channel must preserve what the page is showing
created_by: REQ-212
created_at: '2026-09-10T20:23:39.801557+00:00'
updated_at: '2026-09-10T22:18:22.784991+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-17655906
  story_points: 5
  commits:
  - working_sha: a6675273f6edd8395045ad4309de9a6d2c33d4ee
    reconcile_sha: null
    main_sha: null
  - working_sha: 4378b7d7a7f40469385872d02c78b7ba4baa85a8
    reconcile_sha: null
    main_sha: null
  version: 0.2.156
---

# Switching channel must preserve what the page is showing

## What prompted it

An operator building 1st Contact's sign-in modal was looking at the home page in
**View**, opened the sign-in dialog, and switched to **Edit** to change the copy
inside it. The dialog was not there. The edit render is a fresh load of a
different channel, so every piece of state the visitor's own interaction had
produced was gone — and the one thing they wanted to edit was reachable only
through an interaction the edit channel cannot perform.

The general shape: **the two channels are two renders of the same page, and the
operator experiences them as one page with a toggle.** Anything that breaks that
illusion reads as the builder losing their place.

## The rule

Switching between View and Edit shows **the same page in the same state**.

- Looking at the home page in View, switching to Edit shows the home page.
- Looking at the home page with the sign-in modal open in View, switching to Edit
  shows the home page with the sign-in modal open — and the copy inside the modal
  is editable, like any other copy on the page.
- Switching back returns to the page as it was.

Scroll position and which page of a multi-page site is showing are the same
question and are covered by the same rule.

## The tension this has to resolve

[[REQ-116]] makes the edit channel deliberately inert: it ships no behavior
client bundle and no L1 behaviour script, because the edit bridge resolves a
click to "edit this region" and a live page would resolve the same click to
"navigate" or "open the panel". That inertness is not incidental — it is what
makes a click unambiguous.

So the edit channel cannot simply run the behaviour and be driven into state the
way View is. Something has to carry the state across the switch and reproduce it
statically. The likely shape is that the panel-bearing surfaces declare their
open/closed state as something the edit render can be *told*, rather than
something it computes by running a script — but the design is open and belongs to
whoever picks this up.

Two constraints on any answer:

- **A click in Edit must still mean "edit this".** Whatever reproduces the state
  must not reintroduce a second meaning for a click.
- **The edit render's geometry must match the draft's.** [[REQ-116]] already
  turns on this; a modal reproduced in Edit has to lay out where it lays out in
  View, or the operator styles against a lie.

## Related

Carousels ([[REQ-96]]) and the account portal's erasure disclosure
([[REQ-183]]) have the same shape: content behind a behaviour, with a settled
state the edit channel shows instead. Today each declares its own settled state
in CSS keyed off `data-fc-edit`. A general answer to this ticket should say
whether that mechanism grows to carry *which* state, or is replaced.

[[REQ-216]] asks for the AI-facing half of the same capability — driving a page
into a state before photographing it. The two want the same underlying handle on
"which panel is open", and should be designed together even if they ship apart.
---

## The design

### 1. What is carried

Three things, and they are one question asked three ways — *what is this reader
looking at?*

| carried | read from | reproduced by |
|---|---|---|
| **which page** | the frame's own location, relative to the channel root | composing the other channel's URL with the same relative path |
| **where on it** | the document's scroll offset | scrolling the new document to it |
| **which panels are open** | the dialog shells carrying the open marker | see §3 |

The first two were simply never carried: the toggle recomputed the channel root
and threw the rest away, so switching channel on `/about` returned to the home
page at the top. Those are a URL and a number. The third is the one the ticket
was filed about.

### 2. The edit render gains the shell it was missing

Today the edit channel drops the whole modal apparatus, not just the script:
`isDialog` is false when rendering for edit, so there is no covering shell, no
`data-l1-dialog`, no `role`, and none of the overlay stylesheet. A panel is an
ordinary in-flow box and there is nothing in the document that could be *told*
anything.

So the edit render now emits **exactly what the draft render emits, minus the
script and minus the acting attribute**. The shell, its id, the `role`, and both
halves of the overlay stylesheet are channel-independent.

This changes nothing about how the edit render looks on its own. Every overlay
rule is gated on `data-l1-dialog-ready`, which only a script sets — so with no
script the shell is `display: contents` and the panel lays out in flow, open and
settled, byte-equivalent to today plus an inert wrapper. [[REQ-116]]'s
inertness is untouched: no script, no listener, no acting attribute, and a click
still means "edit this".

What it buys is that the edit document now carries **the same handle on
open/closed that the draft document does** — and REQ-212 already made that
handle a pair of plain attributes rather than script-held state, precisely
because the CSS had to be able to read it.

**This supersedes [[REQ-212]] §5.7 and its acceptance 12** in one narrow
respect: the edit render still emits no dialog script and an action node still
loses the attribute that would act, but "no shell, no role" is replaced by "the
shell and the role, always". §5.7's own goal — *the edit render differs from the
draft render by the missing behaviour and nothing else* — is what the change
serves; it was the one place the implementation fell short of it.

### 3. Reproducing the state is a client-side act, not a render input

The panel-bearing surface is *told* which state to be in by having the marker
set on it — `data-l1-dialog-ready` on the document, `data-l1-open` on the shells
that are open. That is the same instruction the script gives, given by the
builder instead, across the same-origin boundary it already reaches through to
mount the edit bridge.

It is deliberately **not** a render-time parameter on the preview URL. A render
input would have to thread through the router, the preview renderer, its
`(slug, channel)` memo, the page assembler and `L1RenderOptions`, and would
multiply the cached file set per state — to produce markup the client can
produce by setting two attributes. Nothing is shipped into the page: the code
runs in the builder, and the rendered document remains as inert as [[REQ-116]]
requires.

The two channels reproduce state differently, and the difference is the point:

- **Edit** — the markers are set directly. There is no script to run and none is
  wanted; the existing gated stylesheet does the rest, so the panel lands where
  it lands in View because it is laid out by the same rules.
- **View** — the opener is **activated**. The draft channel has the live script,
  so the panel opens the way a visitor opens it: focus moves in, the scroll lock
  goes on, `aria-expanded` tells the truth. Setting the attribute by hand would
  produce a panel that looked right and behaved like nothing had happened.
  Closing is the same act in reverse and for the same reason: a panel the state
  says is shut is shut by **activating what shuts it** — its own Close, or, for
  a panel that does not contain one, the scrim, which is the gesture of clicking
  beside it and which a panel that has opted out of scrim dismissal declines
  exactly as it declines a reader's. Removing the marker instead would leave the
  focus, the lock and the opener's `aria-expanded` all still saying it was open.

That asymmetry is the same distinction [[REQ-216]] draws for the AI's half —
drive the draft page, reproduce the edit one — and both are served by one shared
handle on "which panel is open", which is what this ticket contributes.

### 4. Does the `data-fc-edit` settled state grow to carry *which* state?

**No — it is left exactly as it is, and it is now the fallback rather than the
answer.**

The carousel's rule says out loud that the channel must not know what a carousel
is. A settled state is a surface saying *"with behaviour off, show everything"*,
which is the honest thing to render when nobody has said what state the page was
in. It cannot say *which* state, because saying which requires a name for the
state and modules do not have one.

So the two mechanisms stack rather than compete:

- **Nothing carried** — the edit render is opened on its own, in a new tab,
  outside the builder. Every surface shows its settled state exactly as before.
- **State carried** — the builder says which panels are open, by the id the
  document itself declared, and the panel-bearing surface obeys.

Inside the builder there is always a carried state, and its initial value is
*the page as a visitor first meets it* — no panel open. So Edit matches View
from the first frame, which is the rule.

### 5. Scope: L1 dialogs, not module-owned panels

The handle is the L1 dialog role's `id`. A behaviour module that hides content
behind its own behaviour — `account-chrome`'s sign-in dialog, the account
portal's erasure disclosure — has no such id and keeps its settled state.
Reaching into one from here would mean the channel knowing what an
`account-chrome` is, which is the thing §4 says it must not do; giving every
module a uniform panel handle is a behaviour-contract change and does not belong
inside this one. `account-chrome`'s migration onto the L1 dialog role is already
[[REQ-212]] §6's follow-up, and it is what makes that surface carry.

### 6. A way back out, and a way in

A modal reproduced in Edit covers the page, and every control in the edit render
is inert — including the panel's own Close. Without something in the chrome an
operator who switched to Edit with a panel open could only leave it by switching
back to View, closing it there and switching again.

So Edit gains one control: **a panel selector**, listing the panels this page
declares plus "No panel". It reads the document (the shells and their ids), so
it needs nothing from the definition and nothing new from the renderer. Picking
one re-applies the state to the document already loaded — no reload, because
applying is two attributes.

**A panel is named by what is written in it**, not by its id: its accessible
name if the role gave it one, else its first heading, else its opening words. An
id is an author's slug, and a list of slugs is a list nobody can read; the slug
is the last resort, for a panel with nothing in it to read.

**A page that declares no panel shows no control at all** — not an empty one.
Most pages have no modal, and a permanently inert select in the strip is chrome
that teaches the operator to stop looking at the strip.

It is the escape hatch and the entrance in one: it is also how you edit the copy
inside a modal you never opened in View. Single-select — a page may have several
panels open at once and the carry mechanism holds a list, but the control offers
one at a time, because choosing an arrangement of overlapping modals is not a
thing an operator wants to do.

### 7. Surviving a re-render

An edit that lands re-renders the page and reloads the frame. The carried state
is the builder's, not the document's, so it is re-applied on every load — which
is what makes *editing the copy inside an open modal* work at all, rather than
closing the panel on the first save.

**But only for the same page.** The carry answers "the same page in the same
state" and nothing wider, so a reader who follows a link out of an open panel
arrives at the next page with no panel over them and at the top of it. A channel
switch and a post-save reload both keep the path, which is exactly when the state
should survive — and a navigation does not, which is exactly when it should not.

Switching site resets it for the same reason: another site's page is not this
page in another state.

## What is built

- **`packages/framework/src/l1/dialog.ts`** (new) — the dialog attribute
  vocabulary, lifted out of `render.ts` so the emitter and the state module share
  one definition site rather than two spellings of `data-l1-open`.
- **`packages/framework/src/l1/page-state.ts`** (new) — reads a rendered page's
  state from a window and puts a window into one, branching on the channel as
  §3 describes. The one place that knows how a page is driven.
- **`packages/framework/src/l1/render.ts`** — the shell, the role and the
  overlay stylesheet stop being conditional on the channel; the script stays
  conditional on it.
- **`tools/generate/src/cli/assets.ts`** — `page-state` joins the framework
  entry points served to the browser, so the builder runs this implementation
  rather than a second copy of it.
- **`apps/control-app/src/builder/carry.js`** (new) — the builder's half:
  capture from the document that is going away, compose the next channel's URL,
  re-apply to the document that arrives.
- **`apps/control-app/src/builder/api.js`** — `previewUrl` takes the relative
  path within the channel.
- **`apps/control-app/src/builder/panel.js`** — announces that it is about to
  replace the document, and announces the document it has; both are what a
  capture and a re-apply hang off.
- **`apps/control-app/src/builder/toolbar.js`** — the panel selector action.
- **`apps/control-app/src/builder/app.js`** — the wiring.

## Acceptance

1. Switching channel keeps the page: the relative path within the channel is
   carried, so a reader on `/about` in View is on `/about` in Edit.
2. Switching channel keeps the scroll offset.
3. The edit render emits the covering shell, the panel's `role`, its declared
   `id` and the overlay stylesheet — and still emits no dialog script and no
   acting attribute on an action node.
4. With nothing telling it otherwise, the edit render lays a panel out in flow,
   open and settled, exactly as before: every overlay rule is gated on a marker
   only a script or the builder sets.
5. A page's state can be read from a loaded document as the ids of the panels
   that are open plus the scroll offset.
6. Applying a state to an edit document opens exactly the named panels and
   closes every other, as overlays, laid out by the same rules the draft render
   lays them out by.
7. Applying a state to a draft document opens the named panels by activating
   the control that opens them, and closes every other by activating what shuts
   it — its Close, or the scrim where it has none — so the page's own script
   does both, and the focus, the lock and `aria-expanded` are true afterwards.
8. Reading a state and applying it to the other channel round-trips: the same
   panels are open on both sides.
9. Edit mode offers a panel selector naming the panels the page declares plus
   "no panel"; View does not offer it. Each panel is named by what is written
   inside it rather than by its id, a page that declares none shows no control
   at all, and picking one changes what the loaded document shows without
   reloading it.
10. A re-render of the page — the reload after a save — re-applies the carried
    state rather than resetting it.
11. Switching site discards the carried state, and so does following a link to
    another page: the reader arrives with no panel over them and at the top.
    A channel switch and a post-save reload keep the path, and keep the state.
12. A behaviour module's own panel is unaffected and keeps its settled state.