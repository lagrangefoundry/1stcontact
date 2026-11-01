---
uid: story-189fc1ac
id: STORY-106
type: story
title: Have the assistant compose a page — see where everything sits, read an element
  as it stands, and replace it — without it ever being able to write markup, styles
  or scripts
created_by: xgd
created_at: '2026-08-10T09:18:31.384971+00:00'
updated_at: '2026-11-01T01:11:43.676604+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-fe236246
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
---

## Story

**As a** site owner working with an assistant, **I want** it to be able to see where
every element on my page sits, read any one of them exactly as it stands, put a changed
one back, and read and set how the page itself is painted — its background, text colour,
width ladder, content column and font table — **so that** it can actually compose my
pages — add a nav bar, rearrange a section, change how something looks — instead of only
being able to swap words in elements it cannot build, and so that everything it can
express is still confined to my site's own vocabulary of elements.

## Description

Before this, the only reach into a page was a four-field copy edit: the words of a text
run, an image's file and alt text, a painted box's background image. That is the right
granularity for a person clicking a heading and typing, and the wrong one for composing a
page — on a real page, roughly half the elements were invisible to it and none of the
styling any element carried was reachable at all. An assistant asked for a menu could only
decline. Even once elements were reachable, the page document around them — its
background, text colour, widths, column and fonts — had no reader and no writer, so an
assistant could neither discover that a page was white nor change it.

This story gives the control surface read and write symmetry around one address, and
around the page document itself.

In scope:

- **Where is everything.** Asking for a page returns every element on it, in order — the
  boxes and rows as well as the words and pictures inside them — each carrying the
  address that reaches it, the kind of thing it is, a short label enough to recognise it
  among its siblings, and the component instance and slot the address is scoped to when
  it sits inside one. Its element entries carry no styling at all, so its size follows how
  many elements a page has rather than how richly it is styled, and it stays affordable on
  a large page. Beside the element map it carries the page's document-level keys, so how
  the page itself is painted is visible in the call an assistant already makes first.
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
- **The page document itself.** Everything a page is outside its element tree — the
  width ladder it is authored against, its background, its inherited text colour, its
  shared content column and its font table — is readable and writable through a
  dedicated pair. Reading returns those keys exactly as stored (palette references still
  references), so what is read may be written back. Writing merges at the top level:
  naming one key leaves the others as they were, each named value is replaced whole
  rather than merged into, and a key given as null is removed. The resulting page is
  validated whole (so a width-ladder change that would strand a per-width variation is
  refused), and the element tree is never touched by it. The set of keys is derived from
  the page document's own schema, never listed by hand, so a key added to the document
  later is reachable the day it lands.
- **One way to change each half of a page.** The narrower copy-field pair retires from
  this surface rather than living alongside its successor; a caller has exactly one
  operation for changing the element tree and one for changing the page's document-level
  style, both in the authoring capability group the surface declares and the consumer is
  granted.
- **A write may not introduce a broken reference.** A change that would leave the page
  painting something that does not exist is refused, naming what is wrong and what would
  be accepted: a font-family stack that names no face the page serves and no generic
  fallback family, or an image or background-image reference to a site asset the site
  does not hold (a cache-busting query string or fragment is ignored when matching).
  Absolute web references are not the site's to vouch for and are left to the URL-scheme
  allowlist. The rule is on the *write*, not the document: a broken reference the stored
  page already carried — typically from a reproduction whose source named a face that
  could not be mirrored — does not block an unrelated change, including one that moves
  that reference to a different address.
- **Parity with reproduction.** Every element and every document-level key of every
  reproduced page in the corpus can be read through this surface and written back
  unchanged, so anything the reproduction path can express the assistant can express.
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
- Everything a site carries outside its pages' documents — settings, component
  instances, page search metadata, generated images.
- Adding assets or font faces from the assistant. The assistant can bind only faces and
  images the site already holds; whether it should be granted asset management is a grant
  decision, not a parity gap.

## Technical Context

- Builds on CAP-92 (the control surface declared, granted, validated and audited): this
  story adds reach, not governance. Argument checking, the error taxonomy, provenance
  marking and the per-call audit record are CAP-92's and are unchanged here.
- Reaches the same single, validated, all-or-nothing write path as the command line and
  the operator's click-to-edit form (CAP-86). The whole resulting site is validated
  before a byte is written, exactly as for every other change.
- The addressing rule is CAP-92's, unchanged: an address is positional and is valid only
  for the version of the page it was read from, because every change re-renders the page
  and regenerates its addresses. The page document is reached by its own pair rather than
  by extending the address grammar, so the address stays purely positional.
- Relates to the operator-facing editing surfaces (CAP-86 structured copy editing, CAP-87
  the click-to-edit gesture), which this story must leave working unchanged and
  demonstrates on assistant-authored elements.
- The security posture rests on DOC-2's structured-only invariant: the element schema is
  closed (strict objects, closed enumerations, hex-only colours, a URL-scheme allowlist),
  and the renderer independently re-checks every URL sink. **Any hole found in that
  closure is a security finding against this story, not a capability gap.**

**Reconciliation (BUNDLE-34 / REQ-175), 2026-10-31.** The story grew from composing the
element tree to composing the whole page document (REQ-175 decisions D1–D6):

- The document-level pair sits in the authoring grant beside the element write, not in
  page management (D1), so a role that can paint every element can also paint the page.
- The page map carries the document keys as a page-level member beside the page's
  metadata (D2); the per-element map entries remain styling-free, so AC-1084 is
  unaffected.
- All five non-root keys are writable, `widths` and `column` included (D3); `resources`
  is writable (D4).
- A document write that names no key is refused, and naming the element tree's own key
  is refused with a pointer to the element write at address "0" rather than being
  silently dropped.
- The dangling-reference refusal applies to every validated write on this path, not only
  the two authoring operations. It is evaluated on the write rather than inside the
  document validator on purpose: the site validates on every read, and an inherited
  broken reference must not make a reproduced page unopenable.

## Reconciliation Decisions

- **2026-10-31 — the font rule is on the stack, not only its first family.** REQ-175 D5
  states the rule on the stack's *first* family, with a generic first family needing no
  face. The implementation dialogue on REQ-175 (secondary authority) refined this: a
  stack that names a generic family *anywhere* has a declared fallback and cannot fail
  silently — which is what keeps the corpus's own
  `"Satoshi, Helvetica Neue, Arial, sans-serif"` valid, as D5 itself requires. Formalised:
  a stack is accepted if its first family is a face the page serves, or if it names any
  generic family; otherwise it is refused naming the faces the page does serve.
- **2026-10-31 — only introduced references are refused, compared by value.** The same
  dialogue states the rule on the write: a write may not introduce a dangling reference
  but need not repair an inherited one. Comparison is by reference value rather than
  address, so an element that merely moves is not read as a new fault. A page the write
  creates has no prior version, so all its references count as introduced. Formalised as
  an AC.

**Divergences and known limits recorded in the intent, not claimed as correct behaviour
(the first has since been closed upstream):**

- **Refusal specificity was degraded for this caller — closed upstream, no longer a
  limit.** The write path reports the exact offending field when a change is refused, and
  a command-line user always saw it. When this story landed, the assistant's tool layer
  rendered only the declared meaning of the error code and dropped that detail, so a
  refusal named *what to do* rather than *which field*; it was filed upstream, and the
  declared meaning was written to carry the recovery strategy because of it. The upstream
  fix has since landed: a declared refusal now appends the host's own account of the
  failure, that behaviour is opt-*out* and this surface's schema-invalid code does not opt
  out, so a refused replacement now names the offending pointer **as well as** the
  strategy. Recorded rather than deleted as the history of why the declared meaning is
  worded the way it is; the acceptance criterion below now asserts both halves, the field
  and the strategy, so nothing here is outstanding.
- The site's settings still carry a vestigial navigation key that nothing renders.
  Navigation is expressed in the element tree; that a caller is shown a setting with no
  effect is a separate defect and is not addressed here.

## Dependencies

- Plan item 6 — the control surface declared as a governed API (STORY-105,
  story-93905de4 / CAP-92).

## Story Points

3