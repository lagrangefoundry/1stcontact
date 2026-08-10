---
uid: story-189fc1ac
id: STORY-106
type: story
title: Have the assistant compose a page — see where everything sits, read an element
  as it stands, and replace it — without it ever being able to write markup, styles
  or scripts
created_by: xgd
created_at: '2026-08-10T09:18:31.384971+00:00'
updated_at: '2026-08-10T09:18:31.384971+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-fe236246
  story_kind: feature
  story_points: 3
---

## Story

**As a** site owner working with an assistant, **I want** it to be able to see where
every element on my page sits, read any one of them exactly as it stands, and put a
changed one back, **so that** it can actually compose my pages — add a nav bar, rearrange
a section, change how something looks — instead of only being able to swap words in
elements it cannot build, and so that everything it can express is still confined to my
site's own vocabulary of elements.

## Description

Before this, the only reach into a page was a four-field copy edit: the words of a text
run, an image's file and alt text, a painted box's background image. That is the right
granularity for a person clicking a heading and typing, and the wrong one for composing a
page — on a real page, roughly half the elements were invisible to it and none of the
styling any element carried was reachable at all. An assistant asked for a menu could only
decline.

This story gives the control surface read and write symmetry around one address.

In scope:

- **Where is everything.** Asking for a page returns every element on it, in order — the
  boxes and rows as well as the words and pictures inside them — each carrying the
  address that reaches it, the kind of thing it is, a short label enough to recognise it
  among its siblings, and the component instance and slot the address is scoped to when
  it sits inside one. It carries no styling at all, so its size follows how many elements
  a page has rather than how richly it is styled, and it stays affordable on a large
  page.
- **Read one element as it stands.** An address returns that element and everything
  inside it, exactly as stored: nothing resolved, nothing tidied, references still
  references, per-width variations still variations. Verbatim is the point, not an
  implementation detail — a tidied view reads better and cannot be written back, and
  being able to write back what was read is the whole of the pair.
- **Replace one element.** Whatever sits at that address is replaced by what was sent,
  and everything inside it goes with it. Adding is replacing a group with a group holding
  one more child; removing is replacing it with one holding one fewer. There is no
  separate insert or delete, and no way to submit a whole page in one call — a change is
  bounded by the address it names.
- **One way to change a page.** The narrower copy-field pair retires from this surface
  rather than living alongside its successor; a caller has one operation for changing
  what is on a page, and the capability group it belongs to is one the surface declares
  and the consumer is granted.
- **Where the security guarantee now lives.** "It cannot write HTML, CSS or JavaScript"
  used to hold because no operation accepted them. It now holds because the page's
  element vocabulary is *closed*: an element carrying markup, carrying a stylesheet,
  carrying a script URL, of a kind the vocabulary does not have, or with the wrong type
  of value for one of its typed properties, is not a valid element, so the change is
  refused whole and the draft is left byte-for-byte as it was. That relocation is
  measured, not asserted.
- **The operator's own editing gesture is untouched.** Clicking an element in the page
  still opens the same small form over the same fields — including on elements the
  assistant composed — and saving through it leaves everything the assistant set alone.

Out of scope:

- Submitting a whole page in one call. Deliberately absent: bounding a change by address
  is what keeps it affordable, and a whole-page write has the caller rewriting regions it
  never looked at.
- Everything a site carries outside its element tree — settings, component instances,
  page search metadata, generated images.

## Technical Context

- Builds on CAP-92 (the control surface declared, granted, validated and audited): this
  story adds reach, not governance. Argument checking, the error taxonomy, provenance
  marking and the per-call audit record are CAP-92's and are unchanged here.
- Reaches the same single, validated, all-or-nothing write path as the command line and
  the operator's click-to-edit form (CAP-86). No new validation was written: the whole
  resulting site is validated before a byte is written, exactly as for every other
  change.
- The addressing rule is CAP-92's, unchanged: an address is positional and is valid only
  for the version of the page it was read from, because every change re-renders the page
  and regenerates its addresses.
- Relates to the operator-facing editing surfaces (CAP-86 structured copy editing, CAP-87
  the click-to-edit gesture), which this story must leave working unchanged and
  demonstrates on assistant-authored elements.
- The security posture rests on DOC-2's structured-only invariant: the element schema is
  closed (strict objects, closed enumerations, hex-only colours, a URL-scheme allowlist),
  and the renderer independently re-checks every URL sink. **Any hole found in that
  closure is a security finding against this story, not a capability gap.**

**Divergences and known limits recorded in the intent, not claimed as correct behaviour:**

- **Refusal specificity is degraded for this caller.** The write path reports the exact
  offending field when a change is refused, and a command-line user sees it; the
  assistant's tool layer renders only the declared meaning of the error code and drops
  the detail, so a refusal names *what to do* rather than *which field*. Filed upstream
  and mitigated by making the declared meaning carry the recovery strategy. The
  acceptance criterion below asserts the mitigation that exists, not the fix that does
  not.
- The site's settings still carry a vestigial navigation key that nothing renders.
  Navigation is expressed in the element tree; that a caller is shown a setting with no
  effect is a separate defect and is not addressed here.

## Dependencies

- Plan item 6 — the control surface declared as a governed API (STORY-105,
  story-93905de4 / CAP-92).

## Story Points

3
