---
uid: request-a6dcbdef
id: REQ-219
type: request
title: 'An edit is a recipe: the operation vocabulary, one renderer, and edit_image'
created_by: EPIC-1
created_at: '2026-09-10T21:50:34.465379+00:00'
updated_at: '2026-09-10T21:50:34.465379+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
---

## The gap

There is no image editing anywhere in the product — not in the Library, not as a
tool. A client who wants a picture cropped has to leave, crop it somewhere else,
and upload it again. DOC-48 already instructs the assistant to *"crop an
interesting strip and set the text beneath it"*: advice it cannot act on.

The obvious implementation — edit the bytes, keep the result — is the wrong one,
and this ticket exists to build the right one before any UI depends on it.

## An edit is a recipe, not new bytes

**The original is kept forever.** An ordered list of parameterised operations
sits on the material's record. Any state of the picture is the original plus a
prefix of that list. The bytes anyone is shown are derived and disposable.

**This is what delivers "the crop needs to be a little wider."** That is not
undo — it is editing the crop operation's parameters. Because operations are
parameterised rather than baked, every past state stays reachable by editing or
removing an operation, in any order, months after the fact. A picture cropped in
January can be widened in June without going back to the client for the file.

**So the recipe is persisted and the undo stack is not.** Undo and redo are
editor session state. The recipe is a better history than a history log would be,
because its entries are individually revisable rather than merely reversible, and
persisting both would mean two things that could disagree about what the picture
is.

**Coordinates are normalised** — fractions, never pixels. A pixel crop silently
moves the moment a resize is inserted before it, and the whole value of a
revisable recipe is that editing one operation does not quietly relocate another.

**The vocabulary is closed and shared.** One list, used by the editor UI and by
the assistant's tool. Two implementations of "crop" drift within a month.

v1 is `crop`, `rotate`, `resize`, and `adjust` over brightness, contrast and
saturation.

**`flip` is deliberately out of v1.** The platform renderer cannot do it, and
keeping it would mean standing up a second renderer for one operation. It can
return when there is a second reason to want one.

**`resize` is editorial, not a bandwidth control.** A logo that is 400px wide
because that is what it is. The surface prose must say plainly that delivery
sizes are handled automatically at publish, or the model will start
hand-optimising bandwidth and fight the width ladder.

## One renderer, in three places

**The Cloudflare Images binding applies the recipe.** Its transform pipeline maps
almost one-to-one onto the vocabulary above, so a recipe is a transform chain
rather than a canvas program. The same call renders the editor's true preview,
the assistant's view of a picture, and the published output.

**The client's browser does interaction only** — dragging a crop box over a CSS
overlay, then committing the recipe and re-fetching the real bytes. That is how
editors behave anyway, and it is what stops a client cropping one thing and
publishing another: preview and artifact come out of the same code.

**Browser Rendering was the alternative and was rejected.** `[browser]` is
already bound and already paid for (REQ-154), but it is heavier per publish and
it cannot decode HEIC — so it would have solved this and left the upload path
needing a second answer.

**Renditions are content-addressed** on the original, the recipe and the size
asked for. Nothing is recomputed that has not changed. The material store already
content-addresses blobs (`t/<tenant>/blob/<sha256>`), so this is the pattern the
store was built with rather than a new one.

## `edit_image`, the assistant's half

**The same vocabulary, as a tool.** It changes the recipe; it does not produce
bytes. Composed with the sixth `picture` kind, the loop the assistant needs is
available to it: look, crop, look again.

**Refusing is normal and must read as information.** An operation that would
leave nothing, a crop outside the frame, a resize past the source's own
dimensions — each is refused with the reason, the recipe is left as it was, and
the assistant can correct the call. A refusal that silently clamps is how a
client ends up with a picture nobody chose.

## Not in this change

The modal, the editing controls and the editable Library name are the editor
ticket. The publish-time width ladder is its own. HEIC is its own. This ticket is
the model, the renderer and the tool — the things all three of those need to
exist first.
