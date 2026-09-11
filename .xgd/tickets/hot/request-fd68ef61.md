---
uid: request-fd68ef61
id: REQ-217
type: request
title: 'Chat: an image a turn produced appears in the conversation'
created_by: EPIC-1
created_at: '2026-09-10T21:49:47.223456+00:00'
updated_at: '2026-09-11T22:17:35.623831+00:00'
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



---

## Answered from EPIC-1, 2026-09-11

The investigation closed with two questions. Both are answered; a third thing has
changed underneath this ticket since it was written, and it matters more than
either.

### 1. `write_image` only. `create_image` stays untouched until REQ-149 lands

Yes — the display line is for `write_image` in this ticket, and `create_image`
gains nothing. This is already the epic's recorded position: *"the `write_image`
half is ours and is not blocked, so REQ-217 can start and half-land while REQ-149
is in flight."* The investigation's reasoning for asking is exactly right — a
pasted line would contradict the manual the model read first, and `imagegen.ts`'s
own header forbids the local workaround — so the half that is ours lands and the
half that is upstream's waits.

### 2. Yes, bake the business-scoped absolute URL into the transcript

Take the scoped absolute URL. Three reasons, and the third is the one that
settles it:

- **The alternative costs more than it saves.** A site-relative handle rewritten
  at render time requires the chat pane to learn what site it is showing, and
  `chat.js` refuses that deliberately. Trading a deliberate layering boundary for
  a shorter string in an archive is a bad exchange.
- **The transcript already names the business in every other way.** It is that
  business's conversation, about that business's site. A URL carrying `/b/<id>`
  discloses nothing the surrounding text does not.
- **The scoped URL is the *safe* form, not the risky one.** The investigation
  established that an unscoped `/preview/…` does not 404 — it resolves through
  `resolveScope`'s fallback to *the first admissible business*. For a
  multi-business operator that is precisely the "one business's page rendered with
  another's assets" failure `scope.ts:161-171` exists to prevent. Naming the
  business explicitly is what makes a replayed transcript correct years later
  rather than quietly resolved against whoever happens to be first.

So the durability concern is real and the answer is that an explicit name is more
durable than an implicit one, not less.

### 3. What changed underneath: REQ-220 has landed, and its parser will not accept your URL

[[REQ-220]] shipped the click handler this ticket was told not to build, and in
doing so it fixed the URL contract in code — without this ticket in the room. Its
own investigation predicted this: *"the markdown line REQ-217's tool authors has
to use a URL shape REQ-220 can parse. Worth writing down in both tickets now, or
they will disagree."* It was not written down, and they now disagree.

**`materialUidFromUrl` (`builder/api.js:693`) requires `url.pathname` to equal
`/api/material/file` exactly**, and returns `null` otherwise. `app.js:529` is its
only caller, and a `null` means the click silently does nothing.

Two consequences for this ticket, which are different from each other:

**A `write_image` drawing is not openable, and that is correct.** A drawing is a
site asset with no material record, so there is no uid to recover and no recipe to
edit; [[REQ-220]]'s `isEditablePicture` excludes drawings deliberately, and
[[REQ-219]] refuses SVG for transforms in any case. **So this ticket should not
try to make its picture clickable.** Emitting the markdown line is the whole job;
a drawing that renders in the conversation and does not open a crop tool is the
designed outcome, not a gap.

**But the parser is broken for the case it was written for**, and this ticket
should not build against it in its current state. See the note added to
[[REQ-220]]: `materialFileUrl` composes its URL through `scoped()`, so in any
session with a business selected the path is `/b/<id>/api/material/file` and the
exact-match test fails. That is [[REQ-220]]'s debt to fix, not this ticket's —
recorded there. **What this ticket owes is not to design around it**: when the
`create_image` half arrives after REQ-149, its line should address the material
file route in its ordinary scoped form, and the parser is what gets fixed.

### One thing from the investigation worth keeping

The CSS note stands and the instinct to say it out loud was right. A
`max-width`/`max-height` on content the chat component never anticipated is a
different act from restyling a component that ships its own look, and
`builder.css:876-882`'s rule is about the latter. Add the rule; the comment does
not forbid it.


### Postscript: the upstream blocker has moved

lagrange-framework **REQ-149 is now `ready_to_reconcile`**, where the investigation
recorded it as `draft`. The seam this ticket was told to wait for — a host
contributing a display handle, and the surface prose that currently forbids one —
has been built upstream.

**This does not automatically unblock the `create_image` half here.**
`@lagrangefoundry/*` is not pinned in this repo's lockfile, so what the installed
package actually exposes is a separate question from what the upstream ticket
says landed. **Check the installed surface before designing against it**; if the
seam is present, the two halves can land together and the staging above collapses.
The `write_image` half is unaffected either way and remains the part that needs
nothing from upstream.


### Confirmed in the installed code: the blocker has cleared

Checked against the shared store this deployment actually bundles
(`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-imagegen/`,
resolved through `src/generated/ai-imagegen.js`), 2026-09-11. **Both halves of
what this ticket was waiting for are present.**

**The prohibition is gone.** The overview no longer says *"the picture itself
never enters this conversation."* What it says now is narrower and is about the
tool result rather than about display:

> A generated image is not returned to you as a picture. It is stored, and you are
> told the id of the ticket holding it.

and on the operation, *"The image is never returned here as data."* Neither
forbids a host from showing the picture; they describe what `create_image` hands
back. The sentence that would have contradicted a pasted line is no longer there.

**And the seam exists, as a host-composed sentence.** `shapes.host_display`:

> **`display`** — *"How to put this picture in front of the person you are talking
> to, in the host's own words about its own surface. Absent where there is no way
> to show this one, in which case the id is the whole of what you can pass on."*

That is exactly the shape the epic asked for: the host contributes a sentence
about its own surface, and absence is the ordinary state rather than an error.

### So what this ticket must now do — and it is wiring, not a workaround

**Nothing here needs a local workaround, which is what `imagegen.ts` forbids.**
Its header states its job precisely: *"This file installs it: it names the
provider, supplies the credential, supplies the ticket type, and hands the plugin
the one thing a framework component cannot know — this product's own vocabulary
for a piece of material."* A display sentence for this product's own chat pane is
another instance of exactly that, so supplying it is this file doing its stated
job rather than routing around the plugin.

**Nothing supplies it today.** `imagegen.ts` has no `host_display` wiring — the
seam is open and unfilled. That is the `create_image` half of this ticket, and it
is now unblocked.

**So the staging in the section above collapses.** Both halves can land together:

- **`write_image`** — ours throughout, needs the display-URL factory on `HostDeps`
  the investigation designed, and emits the markdown line itself.
- **`create_image`** — supplies `host_display.display` from `imagegen.ts`, composed
  the same way the Worker composes any scoped URL, for the same `scope.businessId`
  the chat host is already keyed on.

**One caveat worth keeping.** `@lagrangefoundry/*` is not pinned in this repo's
lockfile, so the installed store can move without a commit here. What is recorded
above is what is installed today; re-check the surface before relying on the exact
field name.
