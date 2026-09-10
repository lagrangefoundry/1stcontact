---
uid: request-8a5f499e
id: REQ-215
type: request
title: Switching channel must preserve what the page is showing
created_by: REQ-212
created_at: '2026-09-10T20:23:39.801557+00:00'
updated_at: '2026-09-10T20:23:56.264087+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
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
