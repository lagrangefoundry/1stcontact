---
uid: request-fd68ef61
id: REQ-217
type: request
title: 'Chat: an image a turn produced appears in the conversation'
created_by: EPIC-1
created_at: '2026-09-10T21:49:47.223456+00:00'
updated_at: '2026-09-10T22:28:26.546993+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1c9627f2
---

## The gap

An image the assistant makes falls out of the conversation that made it. The
turn says a picture exists and names a ticket; the client goes to the Library to
find out what it looks like. The conversation that produced the image is the one
place it is not.

## Half of this is blocked on lagrange-framework REQ-149

**The `write_image` half is not blocked.** That tool is this repository's own
(`tools/generate/src/cli/ai/toolbox-core.ts`), so it can author its own markdown
line and its surface prose is ours to write. A drawing the assistant composes can
appear in the conversation with no upstream change at all.

**The `create_image` half is.** That surface belongs to lagrange-framework's
imagegen plugin, and two things there stand in the way:

1. **There is no seam for the host to contribute a display handle.** The plugin
   composes the `generated_image` result; the host wires the plugin and supplies
   the store. Nowhere in that arrangement can 1stcontact add *"show this to your
   user"* with the material URL only it knows how to form.
2. **The surface prose forbids the attempt.** Its overview tells the model *"the
   picture itself never enters this conversation."* Even if a handle could be
   smuggled into the result, the instruction to paste it would contradict the
   overview the model read first, and a model resolving that conflict against us
   would be reading its manual correctly.

**And a local workaround is out of bounds by our own rule.** `imagegen.ts` states
it: *"NOTHING HERE IS A TOOL SURFACE… If any of that ever needs more than wiring,
the finding belongs upstream rather than in a local workaround."* Wrapping the
plugin's result to inject a line is precisely the workaround that header forbids.

So this ticket can be started and half-landed against `write_image`, and its
generated-image half waits on lagrange-framework REQ-149.

## What changes

**An image a turn produced appears in that turn**, small, inline, as an ordinary
markdown image in the assistant's own reply.

**The tool authors the line; the model places it.** A tool result is not a chat
bubble — only an assistant text turn is in the transcript, and the transcript is
what replays on reload. So the operation that produced the picture returns the
exact markdown line to paste, and the surface prose instructs the model to
include it verbatim in its reply. The tool is responsible for the handle being
right; the model is responsible only for where in its sentence the picture goes.

**This is what makes it survive a reload.** The picture is inside the assistant's
turn markdown, so replaying the transcript replays the picture. Nothing about the
chat panel's replay path changes.

**It renders today.** A turn is `{role, markdown}` and the chat sanitizer is
stock DOMPurify, which already permits `<img>`. Nothing new is needed in
`webui-chat`.

**Any image a turn produced, not only generated ones.** An SVG the assistant
draws with `write_image` is exactly as invisible today. The rule is *a picture
this turn made is a picture the client sees*, which is easier to hold than a list
of which tools qualify.

**Clicking it opens the image modal.** A delegated handler on the chat pane, so
the picture is a way into the editor rather than a decoration. The modal itself
is a separate ticket; until it lands, the click is not wired and the image is
still worth having.

**The handle is a same-origin URL the builder already serves.** `library.js`
renders material with `transport.fileUrl(uid)` under the same session; the chat
is the same origin under the same identity. No new serving path, no public URL,
nothing that could leak into a published page.

## Not in this change

**The picture is not made small on the wire.** Day one it is constrained by the
stylesheet and the full bytes are fetched — acceptable on a builder-local
request. A thumbnail rendition is a consequence of the publish-time ladder work
and lands with it.

**The model still cannot see the picture.** Emitting a markdown line is not
looking at one; that is the sixth `picture` kind, separately.

## The failure mode we accept

A model that does not paste the line leaves a turn with no picture in it. It is
visible, it is cheap — the image is still in the Library — and the surface's
`absences` section is where that instruction is made hard to miss. Host-injecting
a trailer after every turn would close it and was rejected: it would put the
picture in a fixed place rather than where the sentence wants it, for a failure
that costs a client one click.


---

## Answered from EPIC-1, 2026-09-10

The investigation's two questions, and one of its findings, answered from the
epic's design conversation.

**Yes — `write_image` only, for now.** `create_image` stays genuinely untouched
until lagrange-framework REQ-149 lands. That is the split this ticket already
describes; treat it as settled rather than provisional, and ship the drawing half
without waiting.

**Yes — bake the business-scoped absolute URL into the archived transcript**, and
the reason is stronger than acceptability. The relative alternative is *actively
unsafe*: an unscoped `/preview/…` resolves through `resolveScope`'s fallback to
the first admissible business (`scope.ts:262-266`), which for a multi-business
operator is precisely the *one business's page rendered with another's assets*
failure `scope.ts:161-171` exists to prevent. A URL naming `/b/<businessId>`
explicitly is the safe form, not the compromise. The business id is opaque and
stable by design — REQ-190 moved the *name* into `tenants.name` so the key never
has to change — and the transcript is only ever read by someone already admitted
to that business, so the durable string discloses nothing.

**The consequence is accepted and must be written down.** A `draft/assets/` URL
names the asset as it stands, not as it stood during that turn. So a drawing
redrawn with `replace: true` retroactively changes what every earlier transcript
shows. That is the honest semantics of naming a live asset, there is no stable
alternative for site assets (they are not content-addressed), and pointing a
historical bubble at a frozen copy is not worth a second byte store. Say it in
the ticket so nobody discovers it as a bug.

**Yes — add the `max-width`/`max-height` rule to `builder.css`.** The comment at
`builder.css:876-882` declines to *restyle* a component that ships its own look.
Constraining content the component never anticipated is a different act:
`webui-chat` ships no `img` rule because it never expected an image. Bounding one
is not an opinion about its design.

## The URL shape is a contract with REQ-220

REQ-220's click handler must recover the picture's identity from the `<img src>`
in the rendered bubble — `mountChat` sets `innerHTML` per message and offers no
per-node hook, so delegation off the panel host is the only route. **The markdown
line this ticket authors is therefore an interface, not an implementation
detail.** It must be parseable back to the thing it names, and the two tickets
must agree on the shape before either is written. Both namespaces are in play:
a drawing is a site asset under `/b/<biz>/preview/<slug>/draft/assets/<file>`,
and a generated picture will be material under the material file route.

## Corrections to the body above

The paragraph beginning *"The handle is a same-origin URL the builder already
serves"* is **wrong for this ticket's own half**. `transport.fileUrl(uid)` serves
*material*; a `write_image` drawing is a **site asset** (`editAssetWrite` →
`src: '/assets/<name>'`), reached through `assetUrl(slug, handle)` and scoped by
`previewUrl`. The tool cannot compose that URL from what it holds — it knows the
slug and nothing about the business — so this ticket needs a local seam of the
same shape REQ-149 asks for upstream: an optional display-URL factory on
`HostDeps`, threaded into `createL1Toolbox`'s deps beside `measurer`, supplied by
`router.ts` from `scope.businessId`, and absent on the CLI host. Absence stays the
default, so a deployment that cannot show a picture emits no line.
