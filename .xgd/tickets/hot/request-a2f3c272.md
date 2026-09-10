---
uid: request-a2f3c272
id: REQ-216
type: request
title: The AI must be able to drive the page before it photographs it
created_by: REQ-212
created_at: '2026-09-10T20:23:43.136350+00:00'
updated_at: '2026-09-10T21:30:49.283293+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6bc952d2
---

# The AI must be able to drive the page before it photographs it

## What prompted it

Asked to build a sign-in modal, the product AI styled it, was told it still did
not look like a modal, and replied that it could not check: *"I only have the
inline preview to work from"*, *"I can't personally click 'Sign in' and watch it
open, because I only ever get a picture, not an interactive page."*

The second half of that is true and is this ticket. The first half was not —
`kind: 'draft'` existed and it never tried it — but the true half is the one that
matters, because it is why the AI reasoned from a picture instead of from the
page, and then defended a story about "preview mode" that was invented rather
than observed.

A modal is the clearest case and not a special one. **Anything reached by an
interaction is invisible to the AI today**: a modal, a carousel past its first
slide, a disclosure, a form's success state, a hover treatment, a focus ring.

## The capability

`picture` gains a way to say **what state the page should be in before the
shutter opens**. On the `draft` channel the behaviour scripts are live, so the
state produced is the real one — the actual modal, opened the actual way, not a
reconstruction.

The minimum that answers the prompting case: name a control to activate before
the shot, so the AI can open the sign-in dialog and photograph it. The natural
generalisation is a short ordered list of interactions — activate this, then
this — because a success state needs a field filled and a form submitted, and a
carousel's third slide needs two advances.

## Constraints

- **The picture must remain evidence.** Whatever the AI asks for has to have
  actually happened to the page. If a requested interaction cannot be performed —
  no such control, nothing happened, the page never settled — that is a refusal
  that names what failed, not a picture of the page in the wrong state. A tool
  whose output is believed must not return a plausible wrong answer; that is the
  same reasoning [[REQ-154]] used to keep the browser off the network.
- **It names what the operator would name.** The AI should ask to activate "the
  Sign in control", not a CSS selector or an internal attribute. Selectors are
  substrate detail the document layer deliberately does not expose
  ([[REQ-100]], [[REQ-108]], [[REQ-212]] all turn on the AI never naming one),
  and a tool parameter is not the place to hand that back.
- **`edit` remains inert.** This is a `draft`-channel capability. The edit
  channel ships no behaviour by [[REQ-116]], and driving it is [[REQ-215]]'s
  problem, not this one.
- **Failure is loud.** An interaction that half-worked must not photograph
  quietly.

## The second, cheaper half

Independently of driving the page: **a picture should say which channel it is
of, and what that channel does not do.** A `kind: 'edit'` picture returned with
one sentence — *behaviour is off in this channel; panels, carousels and
disclosures show their settled state* — would have ended the prompting exchange
before it started, because the AI would have known the page it was looking at was
not the page a visitor gets.

This is worth shipping first. It is a caption, it costs nothing, and it converts
the failure mode from "the model invents a mechanism" to "the model reads the
label".

## Related

[[REQ-215]] is the operator-facing half of the same problem — carrying page
state across a channel switch. Both want a handle on "which panel is open" and
should be designed together even if they ship apart.