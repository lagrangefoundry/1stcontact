---
uid: request-b99bea26
id: REQ-220
type: request
title: 'The image modal: viewer, editable Library name, and the editing tools'
created_by: EPIC-1
created_at: '2026-09-10T21:50:53.431733+00:00'
updated_at: '2026-09-11T02:13:56.036163+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-8f31e389
---

## The gap

A client can look at a picture in the Library and change nothing about it. The
detail pane renders the image, offers a download link, and stops. To crop a
photograph they must leave the product, crop it elsewhere and upload it again —
at which point they hold two files and the product holds two materials.

They also cannot fix its name. A generated image is titled from the prompt that
made it, so it arrives in the Library under a sentence nobody chose to call it.

## What changes

**Clicking a picture opens it in a modal, with the editing tools.** Opened from
the Library's detail pane and from the picture in the chat, which is the same
picture and must go to the same place.

**The pattern already exists.** `mountReader` opens documents in a modal host
(REQ-172) and `library.js` already owns the detail pane and its editable fields
block. This is that furniture extended to pictures, not a second way of showing
a file.

**The Library name is in the modal and it is editable.** One field, one meaning,
both places — the name shown here is the name the item appears under in the
Library, and editing it in either place changes the same thing. This is the fix
for generated images arriving named after their own prompt.

**The tools are the shared vocabulary and nothing more:** crop, rotate, resize,
and adjustment of brightness, contrast and saturation. The same list the
assistant's `edit_image` uses, because there is one list.

**Undo and redo, throughout the session.** The client can step back through what
they have done in this sitting without thinking about recipes.

**And the picture is never destroyed.** Closing and reopening the modal a month
later, a crop can be widened again — the recipe is revisable, so what a crop took
away is still there. The client does not need to know why; they need it to be
true, and the editor must not offer any control that makes it false.

**Interaction is local; truth is rendered.** Dragging a crop box moves a CSS
overlay so the gesture is immediate, and committing re-fetches the real bytes
from the renderer. What the client is looking at after a commit is what will be
published.

**Crop and focal point are different things and both stay.** `assetRefSchema`
already carries `focalPoint` — *when a band forces an aspect on this picture,
keep this bit in frame*. Cropping says *this picture is that shape*. The modal
should let a client set the focal point too, and must not present the two as
alternatives.

## Depends on

The recipe model and the renderer. This ticket is the surface over them; it
introduces no operation of its own and no second definition of what an operation
means.


---

## Answered from EPIC-1, 2026-09-10

**1. Focal point is dropped from this ticket.** The investigation is right and
the body above is wrong: `assetRefSchema.focalPoint` is declared and **has no
consumer** — BUG-44 records that it lost its last one when the site-level asset
registry was deleted. The axis that is live is `l1ImageAxesSchema.objectPosition`
(REQ-136), and it sits on the **L1 image node**, which makes it a property of
*this picture in this band* rather than of the material. The Library modal holds
no page and no node, so there is nowhere for it to write that anything reads.
Delete the *"Crop and focal point are different things and both stay"* paragraph.
The distinction it draws is still true and is worth keeping in mind wherever
per-placement framing is next touched; it is not this ticket's to ship.

**2. The join is settled in REQ-219 and this ticket's claim narrows.** The recipe
is applied at **promotion**, not at publish: a recipe change re-promotes new bytes
into the site's assets. So *"what the client is looking at after a commit is what
will be published"* becomes true — but by re-promotion, not because publish reads
the material. Restate it that way. A picture already placed on a site does track
its edits; the mechanism is a re-promote driven by `placed_on`, and it belongs to
REQ-219.

**3. The name gets its own block.** Not the rights block. REQ-213 made that
`editable: ['role']` explicitly *"so the block cannot acquire a second editable
field by someone adding a descriptor"*, and putting the name there would break
that rule on purpose. It wants its own block, the way the description has one —
plus `reviseTitle` and a route, since `/api/material/description` and
`/api/material/role` are the only two that exist.

**Watch the capture trap:** `rowOf` falls back `filename = str(f.filename) ??
ticket.title`, so for a capture — which has no `filename` field — renaming would
silently rename its download filename too. Which is moot if:

**4. Captures and SVGs do not open the editor.** `preview()` sends both
`row.kind === 'image'` and `isCapture(row)` down the `<img>` branch, and `kindOf`
files `image/svg+xml` as `image`, so as written a click on either would open it.
Both are wrong. A capture is a reference bundle, not the client's picture. And
SVG is out of scope for editing across the whole epic — Cloudflare Images cannot
transform it, cropping a vector means changing its viewBox, and the assistant can
simply redraw. Both need a named refusal rather than a disabled-looking editor.

**5. The click needs a keyboard affordance.** An `<img>` is not focusable, and
the reader puts its ⤢ in a bar for exactly that reason. Follow it — a wrapping
`<button>` or the same bar — rather than shipping a mouse-only route into the
only place a picture can be changed.

**6. The URL shape is a contract with REQ-217, and it is recorded in both.**
`mountChat` sets `innerHTML` per message with no per-node hook, so the click must
be delegated off the panel host and must recover the picture's identity from the
`<img src>`. The markdown line REQ-217's tool authors is therefore an interface.
Agree it before either ticket is written; both namespaces are in play — a drawing
is a site asset under `/b/<biz>/preview/<slug>/draft/assets/<file>`, a generated
picture is material under the material file route.

**7. Consume REQ-219's content-addressed rendition address**, not
`materialFileUrl(uid)` — a stable URL will re-serve a cached rendition after a
committed edit, which is the one bug guaranteed to make the editor look broken.

**8. The smaller ones are all accepted as scope:** the editor box joins
`.builder-modal__panel`'s width whitelist (`builder.css:359`); the name field
gets the same subscribe-feed guard `openDetail`'s `reload()` gives the
description; and the modal is torn down in `destroy()` the way the reader is, so
a `list-detail` swap cannot leave it open over a different material.

**On sizing:** agreed this is the largest child of the epic and is not a small
free-code. It is also, correctly, almost entirely downstream — there is little
worth writing here until REQ-219 lands.


## What this surface is made of, and what it refuses to own

Written while implementing, so that every behaviour the code has is a behaviour
this ticket asked for.

**The Library name is the material's TITLE, and the filename is not touched.**
The Library lists a row under `title` and falls back to `filename` only when
there is none; the rights block's *File* row is the filename and stays read-only
for the reason [[REQ-213]] gives. So renaming a picture changes what the Library
calls it and leaves the download saving under the name the file arrived with —
which is the honest pair. Those are two different facts about one material and
the modal must not quietly conflate them.

**One field definition, mounted twice.** The name is the same `mountFields`
descriptor in the detail pane and in the modal, committed through the same call,
because *one field, one meaning, both places* is a claim about the code as much
as about the screen. Two descriptors that happened to agree today is the drift
this epic keeps naming.

**The picture is a button.** A client opens the editor by clicking the picture,
and an `<img>` cannot be reached from a keyboard — so the picture is wrapped in a
real button carrying the words, exactly as the reader's expand affordance
(REQ-172) puts the words on a button and the glyph in an `aria-hidden` span.
Opening the editor is not a mouse-only capability.

**A capture is not offered the editor.** Its bytes are a screenshot of somebody
else's site held as reference (REQ-166) — it is not a picture the client made or
owns, and the one thing a crop of it could be for is publishing it. The detail
pane draws captures and ordinary images through the same `<img>`, so this is
stated rather than inherited.

**The operation vocabulary lives in one module and this ticket does not define
what an operation MEANS.** `crop`, `rotate`, `resize` and `adjust` are named in
one place, with their parameters and their normalised coordinates, and both this
editor and `edit_image` read that one place. The editor composes recipes; it does
not apply them to bytes, and it contains no second renderer.

**The local rendering is CSS, and it is the recipe rather than a picture of it.**
All four operations have exact CSS counterparts — a crop is a clip, a rotate is a
transform, a resize is a width, an adjustment is a filter — so the preview is
derived from the recipe the client is building and cannot drift from it. That is
what makes *interaction is local* honest rather than approximate.

**A commit the origin refuses leaves the recipe as it was and says so.** The
recipe model and the renderer are REQ-219's; until they answer, a commit is
refused and the editor reports the refusal against the picture instead of
inventing a local fallback. Baking bytes in the browser to cover the gap would be
the second definition of an operation this ticket exists not to create — a client
would be shown one thing and publish another, which is the exact failure the
single-renderer decision was taken to prevent.

**Undo and redo span the open editor, and the recipe outlives them.** The stack
is editor state (REQ-219), so closing the modal ends it; what is persisted is the
recipe, whose entries stay individually revisable. Nothing in the editor removes
an operation's parameters in a way that cannot be re-entered, which is how *the
picture is never destroyed* is kept true by a surface that cannot see the bytes.

**The focal point is set on the picture, beside the recipe and not inside it.**
It is not an operation — it changes nothing about what the picture IS — so it
cannot be an entry in an ordered list of operations, and it is not undone by
stepping back through them. It is offered next to the crop tool and labelled for
what it does: *when a band forces an aspect on this picture, keep this bit in
frame.*
