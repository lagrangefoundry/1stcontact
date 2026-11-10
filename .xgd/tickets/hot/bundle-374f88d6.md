---
uid: bundle-374f88d6
id: BUNDLE-44
type: bundle
title: BUG-80 + REQ-217 + BUG-83 + BUG-76 + REQ-228 + 2 more
created_by: xgd
created_at: '2026-11-09T20:58:20.844971+00:00'
updated_at: '2026-11-10T11:27:13.051509+00:00'
completed_at: null
last_field_updated: session_planner
status: reconciling
fields:
  bundle_type: reconcile
  commits:
  - working_sha: 8559fcd03f3903ff73ad28d5eb5e1f856f5b0dd6
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 95115741c062e252161e7f27603bfd7d60eab311
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 486810a855c16653ab9bc06a82a3776ac48c6dd3
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0d792658f43652bfd2270e8f7ff313c6d21d0e20
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c02613b4d78bf8644ef6d44f7f482beba1be1269
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 3ef2b6edabe23d42f9a22039a1d8956e16fb1d86
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: a914d06a65546bcac536bcd8d9b4f9a52fafd86b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 67eb331ce905b315e271e719a3d5d2913639bbd2
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 3b00fd6ae697c705aa6a5b90aefe084dbc04df32
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 47a302012498ff3ba80e57885fe018a88c7ccb68
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: bcdf278962203b2e93131f89aba23be8cfadb831
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  bundle_size:
    members: 7
    commits: 11
    soft_cap: 10
    hard_cap: 30
    flexed: true
  auto_merge_back: true
  priority: medium
  regression_anchor_uid: report-4ada51a8
  session_builder: 1663cd2c-6868-437e-82e7-2131c5e5777a
  session_builder_started_at: '2026-11-10T11:23:38.049810+00:00'
  session_planner: f91cb05f-c276-4e12-9a6e-e15b371e40f7
  session_planner_started_at: '2026-11-10T11:27:12.989076+00:00'
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-80: screenshot: a failed stored-picture render returns the whole 22MB data URL to the model

## Symptom

In the Lagrange Foundry chat session (`chat-d73a11e1`, 2026-09-11 ~02:08), the
assistant tried to photograph a picture the client had uploaded and the turn died
with:

```
400 invalid_request_error: prompt is too long: 22131466 tokens > 1000000 maximum
```

The conversation could not be continued — every subsequent turn failed the same
way.

## What actually happened

The last two tool calls of the turn, from the tool transcript
(`comment-ca74b1b7`):

```
screenshot {"of":{"image":"DSC_7975.jpg","kind":"image"}}
  → Error: screenshot failed. 'DSC_7975.jpg' names 2 pictures: 'DSC_7975.jpg',
    'material-aa46d9cb'. Ask for one of those names...          (correct refusal)

screenshot {"of":{"image":"material-aa46d9cb","kind":"image"}}
  → Error: screenshot failed. net::ERR_ABORTED at
    data:text/html;base64,PCFkb2N0eXBlIGh0bWw+…                  (22,611,384 bytes)
```

The second result is a **22.6 MB string**, sent verbatim to the model as a tool
result. That is the 22,131,466 tokens.

## Root cause

`tools/generate/src/cli/capture/screenshot.ts`:

- `wrapperDocument()` built a `data:text/html;base64,…` URL with the picture's
  bytes base64'd *inside* a document that is itself base64'd — so the URL is
  roughly `(4/3)²` the size of the image.
- `rasterizeImage()` called `driver.navigate(wrapperDocument(...))` with no
  `try`. Playwright's navigation error message is `"<code> at <url>"`, so **the
  entire wrapper URL becomes the error message**, which propagates through the
  toolbox unchanged and lands in the model's context.

Two independent defects sit on that one line:

**1. A failure on this path can end the conversation.** Nothing between
`driver.navigate` and the model bounds the size of a tool result's *text*. The
image path is already capped (`MAX_IMAGE_EDGE` in `ai/fidelity-core.ts`, and
`withoutImageData` in `ai/host-core.ts` redacts image bytes from the transcript);
the error-text path had no equivalent. Any browser error carrying a payload is a
prompt bomb.

**2. Any stored non-PNG picture over roughly 1.1 MB could not be photographed at
all.** Chromium refuses to navigate to a URL longer than `url::kMaxURLChars`
(2 MiB) — that is the `net::ERR_ABORTED`, not a decode failure. Working the
double encoding backwards, the ceiling on the picture's own bytes was about
1,179,000 — so an ordinary phone or camera JPEG was *over* the limit, not an
edge case. The failing picture was ~12 MB. (PNG was unaffected: `storedPicture()`
in `picture.ts` passes PNG straight through and never reaches the browser. That
is why the earlier `a-renaissance-era-invention-study…png` screenshot in the same
turn worked.)

## Fix

Both halves land in `rasterizeImage`, and the second one **closes the capability
gap rather than refusing more politely**.

1. **Carry the picture to the browser by script, not by URL.** The browser is
   navigated to a small, fixed shell document holding an empty `<img>` — a URL of
   constant, trivial length that no picture can inflate. The picture's base64 is
   then delivered in bounded chunks through `driver.query`, which travels over the
   driver's evaluation channel and is subject to no URL-length limit, and a final
   script assembles it, sets the `src` and awaits `decode()`. A 12 MB photograph
   is photographable; so is one many times that. The chunk bound is what makes the
   *failure* path safe too: no single message a driver could echo back in an error
   is larger than one chunk.

   The stored media type is sanitised before it is interpolated into the `src`,
   for the same reason any stored string is sanitised before it reaches a
   document: it is a field somebody wrote down, not a value this code chose.

2. **Never let a driver error carry its payload out.** Every browser interaction
   on this path is wrapped, and anything that escapes is rethrown as
   `ImageNotRenderableError` with the driver's own message kept but any `data:`
   URL and any long base64 run removed, under a hard character cap. This is the
   half that matters most: it turns an unrecoverable session into a sentence the
   assistant can act on. It holds for every future failure on this path, not just
   the one observed.

3. **A sanity ceiling, refused before a browser is leased.** A stored picture
   beyond an absurd size is refused by name without taking a browser and without
   constructing anything large. This is not the old ~1.1 MB limit — it sits far
   above any real photograph — it is the backstop that keeps an unbounded input
   from becoming an unbounded number of chunks.

The refusal is honest rather than silent: the assistant is told the picture
exists and could not be shown, which is the one thing it must not have to guess
at — a blank or missing picture reads to a model exactly like a picture it saw.

**No resize tool is added, deliberately.** Once the bytes reach the browser, the
existing reduction does the rest with no new vocabulary: `MAX_RASTER_EDGE` bounds
the size the picture is laid out at, and `MAX_IMAGE_EDGE` in `fidelity-core.ts`
downsamples what the model is actually shown. A separate "make a smaller copy"
verb would be a second way to do what the pipeline already does on every picture,
and this product has no decoder of its own for a JPEG anyway — the browser is the
decoder, which is exactly what this fix restores access to.

## The poisoned session

Recorded here because it is the same incident, and because the diagnosis is
non-obvious. The durable transcript is **clean**: `comment-40c95649` (the session
file) is 26 KB and stops before the fatal turn, and the tool transcript already
elides oversized results (`[elided — kept 5800 of 22611384 bytes]`). What kept the
conversation dead is the session header's `backend_ref` — the handle the host
resumes the *backend's* conversation by. That conversation holds the 22 MB
message, so every resume re-sent it.

Clearing `backend_ref` in the session file's `<!-- xgd-session -->` header is the
repair, and the upstream code already documents it as a supported state: a header
carrying no `backend_ref` "takes the cold-start path on its next turn: a new
conversation, seeded from the summary and the window." Same chat ticket, same
visible transcript, fresh backend. Applied as data repair; no code change.

## Out of scope (recorded, not fixed here)

- **A general cap on tool-result text.** No single tool result should be able to
  exceed a budget regardless of which operation produced it. This ticket bounds
  the one path that was observed to blow it; the general guard belongs in
  `lagrange-framework` `components/ai/js/src/toolbox/runtime.js` — a different
  repository.
- **The two picture stores.** That the assistant could not enumerate the Library,
  and cannot move a picture from it onto the site, is a separate capability gap —
  REQ-227 (`request-a15815f4`).

## Test plan

UATs named `test_UAT_FC_BUG-80_*`, against `rasterizeImage` with a fake driver:

- a driver whose `navigate` rejects with a message containing a `data:` URL →
  the error that escapes contains neither the URL nor the base64, is under the
  cap, and still names the picture and the driver's own code.
- a driver whose `query` rejects echoing its script → same guarantee, so the
  bound is on the path and not on one call.
- a picture far larger than the old ~1.1 MB URL ceiling → is photographed: the
  navigated URL stays small and constant, the bytes arrive through `query` in
  bounded chunks, and the picture comes back.
- a picture over the sanity ceiling → refuses without the factory ever being
  called (no browser lease), and the sentence names the picture.
- a stored media type carrying quote/script characters → cannot escape the `src`
  it is interpolated into.
- an undecodable picture → still the existing `ImageNotRenderableError` wording
  (no regression on the decode path).


---

## REQ-217: Chat: an image a turn produced appears in the conversation

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


### Correction from EPIC-1, 2026-09-11: "a drawing has no material record" is a bug, not a rule

The section above told this ticket not to make its picture clickable, because a
`write_image` drawing is a site asset with no material record and therefore no uid
to recover. **That is true today and is exactly what [[BUG-84]] calls a defect.**

The operator's constraint: *"all site materials MUST have catalogue (ticket)
entries and MUST be available via the ticket API — that's what it was built for."*
BUG-84 carries the evidence: 14 SVG drawings live on sites, zero catalogue
entries, while `create_image` and the upload path both mint one correctly.

**What changes for this ticket, and what does not:**

- **The instruction stands for now.** Until `write_image` mints a ticket there is
  no uid in the URL to recover, so a clickable drawing would resolve to nothing.
  Emitting the markdown line remains the whole job.
- **But do not build the impossibility in.** The earlier reasoning — *"a drawing
  that renders in the conversation and does not open a crop tool is the designed
  outcome, not a gap"* — was half right and is corrected: the *crop* tool is
  permanently inapplicable to an SVG ([[REQ-219]] refuses it, and `info()` gives no
  dimensions), but **naming is not**, and a drawing is exactly the picture whose
  name a client should be able to fix. So the line this ticket emits should address
  the drawing in a form that can carry a uid once one exists, rather than one that
  forecloses it.
- **The `create_image` half is unaffected** — a generated picture has had a
  catalogue entry all along, through `generatedMaterialStore`.

**Which makes the URL question above easier, not harder.** A catalogue entry means
the material file route is the natural address for every picture in a conversation,
and the scoped-URL decision recorded above already points there.



---

## What landed, 2026-09-11 — both halves, in one pass

The staging above is superseded: the upstream seam is present in the installed
store, so `write_image` and `create_image` both put their picture in the
conversation and there is nothing left waiting on lagrange-framework.

### The seam, and why it is a seam and not a literal

Neither tool can compose its own address. `write_image` runs bound to a slug and
knows nothing about a business; `create_image` is upstream's and knows nothing
about this product's routes. So each is handed a **URL factory by the host**, and
composes nothing itself:

- **`HostDeps.assetUrl`** — `(slug, handle) => string`, a factory over the slug
  exactly like `fidelity`, `pictures` and `ledger`, bound to the session's site in
  `host-core.ts` and threaded into `createL1Toolbox` beside `measurer`. **Absent is
  the default and is ordinary**: the `1c` CLI's conversation is a terminal, so a
  drawing is written and described in words, as it was before this existed.
- **`ImageSurfaceOptions.materialUrl`** — `(uid) => string`, supplied to the
  plugin through upstream's own `display` construction option. Absent means the
  plugin composes no display field and its manual describes none, which is
  precisely what the shipped prose says absence means.

`router.ts` supplies both from `scope.businessId`, because it is the only place
holding the route and the business at once.

### One composer, because the line is a contract

`displayLine(name, url)` in `toolbox-core.ts` is the single place the markdown is
formed, used by both halves. What reaches the client's DOM is an `<img>` carrying
that URL and nothing else, so the chat pane recovers what a picture *is* by
reading the address back off it — two spellings of that address is how the two
come apart. The alt text is the file's name and not a description: describing the
drawing is the model's job, in the sentence around the picture.

### `businessPath()` — the scoped-URL composer the origin never had

Every scoped URL until now was formed in the browser by `builder/api.js`'s
`scoped()`, from a business the client had already selected. A picture in the
conversation is composed on the **server**, which has no `scoped()`. So
`scope.ts` gains **`businessPath(businessId, path)`**, the inverse of
`splitBusinessPrefix` and deliberately beside it: the shape of the prefix is one
fact, and two writers that each know it separately are one rename away from
disagreeing.

The two functions round-trip, and that is asserted rather than assumed.

### The surface prose

`l1-surface.json`, `surface_version` 8 → 9:

- `shapes.image` gains **`display`** — what the line is for, that it is pasted
  *exactly as written*, and that absence means there is nowhere to show a picture.
- `write_image`'s description tells the model to paste it **word for word**, not
  to retype it, not to rename the file in it, and not to describe the picture
  instead of including it.
- `absences` gains **"Showing a picture any way but pasting the line"**, which is
  where the accepted failure mode is made hard to miss.

### Two consequences, written down so nobody meets them as bugs

**A redraw retroactively changes every earlier bubble.** The URL names the asset
as the site now holds it, so `replace: true` changes what a transcript from an
hour ago shows. That is the honest semantics of naming a live asset; site assets
are not content-addressed and a frozen per-turn copy is not worth a second byte
store.

**A drawing is not clickable, permanently.** [[BUG-84]]'s operator scope decision
settles that `write_image` drawings stay site assets and are deliberately kept out
of the Library — so there is no uid to recover and no recipe to edit, and
[[REQ-219]] refuses SVG for transforms in any case. The earlier note in this
ticket anticipating a uid is superseded by that decision. A drawing that renders
in the conversation and opens nothing is the designed outcome.

**A generated picture's click is REQ-220's to finish.** Its line addresses the
material file route in the ordinary scoped form, which is the correct thing to
emit; `materialUidFromUrl`'s exact-match on `/api/material/file` cannot read a
`/b/<id>` prefix, and fixing that is recorded on [[REQ-220]] rather than worked
around here.

### The pane

`builder.css` gains `.builder-chat img` with `max-width: 100%` and a
`max-height`. `webui-chat` ships no `img` rule because it never expected an image
in a message; bounding content a component never anticipated is a different act
from restyling a component that ships its own look. The `max-height` earns its
place separately: a tall picture that fits the width still pushes the sentence
that introduced it off the top of the conversation, and the point of the picture
is that it sits in what was said about it.

### Evidence

- `tests/test_UAT_FC_REQ-217_a_picture_in_the_conversation.test.ts` — the tool
  authors the line; a redraw points at the same picture; no surface to show it
  means no field at all; the line is ordinary markdown the stock sanitiser
  already permits; the surface says to paste it verbatim and `absences` names the
  failure; the address round-trips through the production prefix reader; the pane
  bounds the picture.
- `tests/test_UAT_FC_REQ-217_a_picture_in_the_conversation.workers.test.ts` —
  **the round trip, through the Worker's own route table over real D1 and R2**: a
  scripted turn draws a mark, the line the model was handed is split by
  `splitBusinessPrefix` and fetched, and the drawing's bytes come back; the same
  for a generated picture's material URL; and a deployment with no way to show
  one gets no display field. The claim is *the client sees the picture*, and
  fetching it is the only honest form of that.


---

## BUG-83: Sixteen tests fail on a clean tree, and the suite's red masks new breakage

## The gap

Sixteen tests across twelve files fail on a clean `xgd-working` tree. They have
been failing for long enough that the suite's red is now the normal state, which
is the actual damage: a run that is expected to fail cannot tell anybody that
something new broke. REQ-220 was verified by baselining against `xgd-working` and
diffing the failure sets by hand, because there was no other way to know whether
its own work had broken anything.

A test that is red for a known reason and left red is a test that has stopped
being a test. These are worth either fixing or retiring, and each one below is
named with what it actually asserts so that choice can be made per cause rather
than in bulk.

## The five causes

**1. What the providers add to the primed system text does not arrive — 11 of
the 16.** Every failure in this group asserts on what the model was SENT, and in
each the received text is the consultant role and the projected manual with a
provider's contribution missing from it: the site-binding sentence (*the site
"studio"*, *Every tool you have acts on that site*), the change signal
(*changed this site since your last turn*), and the corpus delta (*Two new
documents arrived*, and the document titles REQ-160 expects). One REQ-182 case
reads the system text as the empty string, so in that path nothing is composed at
all.

The files: `test_UAT_FC_BUG-63_priming_configuration` (2),
`test_UAT_FC_REQ-182_priming_is_configuration` (2),
`test_UAT_FC_REQ-122_chat_host` (1), `test_UAT_FC_REQ-131_change_journal` (1),
`reconciliation-draft-change-journal` (1),
`reconciliation-assistant-conversation` (1), and
`test_UAT_FC_REQ-160_two_kb_session.workers` (3).

**There are two candidate causes here and they have to be separated before
either is fixed.** The first is upstream drift: the priming list is loaded
through the framework's own `rolesFromMapping` and the missing sentences are all
PROVIDER output, so a change to how the shared `@lagrangefoundry/ai` registers or
invokes providers would produce exactly this shape — and those packages are not
in the lockfile, so it would land here with no commit in this repo. The shared
store was last refreshed 2026-09-10. The second is environment: the node runs
print *the system knowledge base could not be opened … GET /accounts: fetch
failed*, which is the sandbox having no route to Cloudflare. That one cannot
explain the site-binding sentence, which is composed locally and needs no
network, but it may well explain REQ-160's three document titles. Establish which
tests fail for which reason first; a fix aimed at the wrong one will look like it
worked on eight of eleven.

**2. Three declared origin routes have no non-cacheable probe — 1 test.**
`reconciliation-builder-workspace-origin`'s `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable`
enumerates the routes `router.ts` declares and the routes its own probe list
covers, and reports the difference. It is currently
`/api/material/changes`, `/api/material/name` and `/api/material/recipe`.

**The last two are REQ-220's and are named here rather than quietly left.** That
ticket added them and did not extend the probe list; the test was already red
over `/api/material/changes`, so nothing went from green to red and the omission
did not announce itself — which is the masking effect this ticket is about,
caught happening. The fix is three probes, not a change to the guardrail.

**3. The panel width whitelist is wrapped across lines and the assertion matches
a contiguous substring — 2 tests.** `reconciliation-copy-edit-form-presentation`'s
and `reconciliation-copy-edit-image-picker`'s
`test_UAT_AC1043` both select the rule by
`sel.includes(':has(.builder-modal__box')` and both read the empty string. The
rule is in `builder.css` and is correct; it is formatted as a multi-line
`:not(:has( … ))` with the selector list indented onto its own lines, so between
`:has(` and `.builder-modal__box` there is a newline and eight spaces. The
selector the test wants is present and the string it looks for is not.

**This is an assertion that reads CSS as text and is therefore sensitive to how
the CSS is laid out**, which is a fact about the test and not about the panel. It
should match on the selector's parts rather than on one unbroken substring —
whitespace inside a selector list is not a behaviour anybody meant to pin.

**4. The webui component scope is restated outside its declaration — 1 test.**
`bug32-webui-scope-rebrand`'s `test_UAT_AC960_component_scope_is_written_in_exactly_one_place`
permits the scope literal in its single declaration and in the declared
browser-source exception, and finds it in three other tracked files:
`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`,
`tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts` and
`tools/generate/src/cli/ai/ledger-core.ts`. Two restatements in tests and one in
source. The AC is *written once*, so each of the three either reads the
declaration or is added to the permitted set with a reason.

**5. `points.js` contains `data-l1-segment` — 1 test.**
`reconciliation-copy-edit-gesture`'s
`test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source`
asserts that `apps/control-app/src/builder/points.js` does not read the attribute
itself, because address resolution is meant to be the renderer's own source and
one implementation of it. The attribute appears once, at `points.js:49`, inside a
CSS string that outlines the hot segment.

**Whether this is drift or a false positive is the question to answer, and the
answer changes the fix.** A style rule that mentions an attribute is not a second
address resolution, so the AC's intent may be intact and the check too broad —
in which case the check narrows to actual reads. But the overlay knowing that
selector at all may equally be the drift the AC was written to catch. Read the
AC before touching either side.

## What done looks like

`npm test` on a clean tree is green, or every remaining red test has been
deliberately retired with the reason recorded. Not sixteen failures that the next
person has to baseline by hand to work around.

The order that pays off first is cause 2 (three probes), then 3 and 4, which are
small and certain. Cause 1 is eleven of the sixteen and is the one worth real
investigation; it is also the one where a wrong diagnosis costs the most, so it
should not be started until its two candidates have been told apart.


---

## Investigation (this session)

A clean baseline on a fresh worktree gives **17** failures across **13** files —
the sixteen above plus one that landed after this ticket was written, which is
cause 6 below and is the masking effect caught happening a second time.

### Cause 1 is one root cause, not two, and neither candidate was right

All eleven failures are **the reminder tier never reaching the `system` field**.
They look like three different missing sentences because the reminder tier has
three provider entries — `site.line`, `site.changes`, `corpus.delta` — and each
failing assertion happens to name a different one. REQ-160's three document
titles are `corpus.delta`'s output, not a knowledge-base read, so the offline
sandbox does not explain them either.

The reminder still reaches the model. Upstream `@lagrangefoundry/ai` moved it:
`ClaudeAPIBackend.promptStream` used to fold `reminder` into the `system` field
and now passes it through `turnTail`, which appends it to the **last user
message** instead (the package's own REQ-144, for cache-prefix stability — a
marker on the reminder would put a block guaranteed to differ next turn inside
the prefix the next request has to match). Those packages are not in this repo's
lockfile, so the change landed here with no commit, exactly as the ticket
anticipated.

So nothing in this repository is broken and no production behaviour changes. The
defect is in the evidence: `tests/support/scripted-model-client.ts` documents
`system` as *"the assembled priming, reminder included"*, and eleven assertions
read it through `systemText`. That statement is now false.

**The fix is at the one shared double, which is what it exists for.** Two
readers are added beside `systemText` — one for the per-turn tail the reminder
now travels in, one for everything the model was sent this turn — and the
assertions move to whichever of the three they are actually about. The
distinction is load-bearing for REQ-182, whose subject is *where* the reminder
sits relative to the cache boundary, not merely that it was sent.

### Cause 5 is drift, and the fix is in `points.js`

AC-1006's subject is the logic that turns a clicked element into an address, and
a stylesheet is not that. But the overlay restating the renderer's markup
contract in its own CSS is a real second reader of it: rename the attribute
upstream and the dimmed-hover rule silently stops matching, with nothing to say
so. The rule does not need the attribute — `.l1-edit-hot` is the renderer's own
hot-segment marker and already selects exactly the set — so the selector drops
it and takes `!important` to keep winning over the renderer's own hot treatment,
which it previously won by specificity. The guard is left alone.

### Cause 6 — the lead write is routed after all, and the guard says it is not

`test_UAT_FC_REQ-223_internal_seam`'s
`test_UAT_FC_REQ-223_the_write_is_an_entrypoint_and_not_a_route` forbids
`captureLead`, `LeadIntake` and `/api/lead` from appearing in `router.ts`. BUG-78
added `POST /preview/<slug>/draft/api/lead` so that the one surface an operator
can actually press the button on is not the one surface where the button cannot
work, and wired it to `public-site`'s own `handleLead` over an in-process
`captureLead`. Three of the four assertions in that block are now false.

The claim the AC is making is that no **unauthenticated** URL reaches the
tenant-wide contact write. That still holds: the preview route runs under the
same `openStore()` scope every other builder route does, takes the site key from
the slug through that store rather than from the body, stamps the channel itself
and refuses any channel but `draft`. BUG-78's behaviour has its own workers
suite, which passes. So the static guard narrows to what it means — no
`/internal/` path, no service binding to this Worker's own default handler, and
the single lead path is the preview's, gated and channel-bound — rather than
forbidding a mention that a later intent deliberately introduced.

## What this session changes

1. **`tests/support/scripted-model-client.ts`** — `turnTailText` and `sentText`
   beside `systemText`, and the header corrected to say where the reminder
   travels now. The seven suites in cause 1 read the right channel.
2. **`tests/reconciliation-builder-workspace-origin.test.ts`** — three probes,
   for `/api/material/changes` (in its rejection shape, since the success shape
   is an SSE stream that never ends), `/api/material/name` and
   `/api/material/recipe`.
3. **`tests/support/css-rules.ts`** — one `rulesOf`, hoisted out of the three
   copies that had it, handing `keep` a selector whose layout has been
   normalised away. Whitespace inside a selector list is not behaviour.
4. **The scope literal** — the two prose restatements are rephrased to name the
   package without writing the scope, and the markdown suite reaches its two
   components the way every other suite does, through `webuiPackageDir`.
5. **`apps/control-app/src/builder/points.js`** — the dimmed-hover rule stops
   restating the renderer's attribute.
6. **`tests/test_UAT_FC_REQ-223_internal_seam.test.ts`** — the routing guard
   narrowed to the claim it is making.

`npm test` is green on a clean tree afterwards, with nothing retired.


## Outcome

`npm test` runs green on a clean tree: 444 files, 3698 tests, 0 failures, and
nothing was retired. All seventeen were fixed rather than removed.

**One caveat, recorded rather than hidden.** Three suites are order-dependent
under the parallel pool and each has failed once across four full runs while
passing in isolation every time: `reconciliation-l1-navigation`'s AC-845 (jsdom
delivers no `hashchange`), `req115-builder-shell` (`wrangler d1 migrations
apply` racing another worker on the same local database file), and
`test_UAT_FC_REQ-150_plain_vite_bootstrap` (`1c assets --json` racing on
`dist-assets`). All three predate this ticket, all three share a process-global
rather than an assertion, and none was in the sixteen. They are a separate
defect of the same family — a suite that fails for a reason nobody reads stops
being read — and are worth a ticket of their own rather than being folded in
here.


---

## BUG-76: Sign-in modal: three defects that made a working component look broken

# Sign-in modal: three defects that made a working component look broken

## What prompted it

Session `chat-5c9fd79b` (1st Contact's own home page, 2026-09-10). The operator
asked for a sign-in modal. Building it took nine turns, produced a **false bug
report against a component that works**, a duplicate label written into the page,
and a closing message from the AI that was itself wrong.

Three of the frictions in that session are already owned elsewhere and are not
this ticket:

- [[BUG-75]] — `capabilities.js` was a syntax error, so no client script ran and
  the dialog really did sit inline and open. Fixed; this is the "immediate bug"
  the operator refers to at 21:26.
- [[REQ-215]] — switching View→Edit loses the open dialog.
- [[REQ-216]] — `picture` cannot drive the page before photographing it, which is
  why the AI reasoned from a still image and then invented a story about
  "preview mode" to explain what it saw.

What remains is below. All three are confirmed in the code, and all three share a
shape: **the AI was told something false by a reference surface, and had no way
to find out.**

---

## Defect 1 — `emailLabel` is documented as visible and is `sr-only` by design

The operator asked why the sign-in panel showed nothing but a field and a
Continue button. The AI concluded the component's label span "isn't rendering",
told the operator to report a defect to whoever owns the component, wrote its own
copy of the line into the `dialog` slot as a workaround, and warned that the line
would appear **twice** once the component was fixed.

None of that is true. The label renders correctly, with the configured text, and
is **deliberately invisible**:

`packages/framework/src/modules/account-chrome/component.ts`
```html
<label class="account-chrome__label" data-fc-invariant for="…">{emailLabel}</label>
```

`packages/framework/src/modules/account-chrome/styles.css`
```css
.account-chrome__label { position:absolute; width:1px; height:1px; margin:-1px;
                         overflow:hidden; clip-path:inset(50%); … }
```

That is the standard screen-reader-only clip, and the CSS comment says so
plainly — *"removed from the visual flow so it neither paints nor displaces the
L1 layout. Obligation, not styling — which is why a designer cannot vary it."*

Every surface the AI could read said the opposite:

| Surface | What it says |
|---|---|
| `meta.ts` config doc | *"The dialog's field label — programmatic, and **visible unless L1 hides it**."* |
| REF-behaviors (`kb-projection.ts`) | *"`emailLabel` — an HTML `span` element; painted by the component itself, never by the page"* |
| `styles.css` | clipped to 1×1px, unconditionally |

The meta comment is simply false — L1 cannot hide it, because it is already
hidden and L1 cannot unhide it. The reference doc says who paints it but never
that it does not paint *visibly*. And the declared element is `span` while the
component emits `<label>`.

Two consequences worth separating:

- **The AI's workaround is the correct permanent answer**, arrived at by
  accident. Its parting advice — "tell me when the component is fixed and I'll
  pull mine out, or it will show twice" — is wrong and would cost another cycle.
- **A false defect was escalated to the operator** about a component that is
  behaving exactly as designed.

### Defect 1b — the field cannot be labelled at all from config

Follows directly. `account-chrome`'s only label is the clipped one, and unlike
`contact-form` it has no in-field option:

- `contact-form` — `labelMode: 'visible' | 'placeholder'`, and `placeholder`
  puts the words inside the box.
- `account-chrome` — no equivalent. `emailLabel` sets text that never paints.

So a sign-in panel authored purely from config ships a bare field with no visible
prompt of any kind. The AI reported this half correctly.

**Note the two surfaces already disagree about invariant controls**, which is
what let the AI think it might style this one: `editBehaviorList`
(`tools/generate/src/cli/edit.ts`) *filters invariant controls out* of the
catalogue — its comment says offering one "would invite a caller to try — which
the contract then refuses, for a reason that reads as a bug" — while
`kb-projection.ts` lists them. The AI read the doc, not the tool.

---

## Defect 2 — undeclared config keys are accepted silently

The AI passed `account: "https://app.1stcontact.io/account"` to `account-chrome`.
That key belongs to `account-portal`. It was stored, echoed back in `changed`,
and never questioned — it is still in the instance config today.

`packages/framework/src/modules/behavior.ts`
```ts
export function validateBehaviorConfig(meta, config) {
  const errors = []
  for (const [name, spec] of Object.entries(meta.config)) {
    validateConfigField(`config.${name}`, spec, c[name], errors)
  }
  return errors            // ← nothing ever looks at keys of `c` not in meta.config
}
```

The loop is over the *declared* names only. A key the contract has never heard of
cannot produce an error, so a typo or a misremembered setting is stored, reads
back verbatim, and does nothing. This is the one failure mode the L1 side is
strict about (`.strict()` everywhere) and the component side is not.

---

## Defect 3 — a schema error inside a slot collapses to "Invalid input"

Asked to move Close to an ✕ in the top right, the AI's `set_l1` was refused with:

```
/pages/0/modules/1/slots/dialog: Invalid input
```

That names the slot root and nothing else. The actual fault was `lineHeight` on a
control node's `axes` — the vocabulary is `lineHeightPx`, and axes are `.strict()`.
The AI had to search the reference and re-derive; its own account was *"I used a
couple of field names that don't exist."*

The same class of mistake **in the page's own `l1` tree** reports precisely:

```
/pages/0/l1/root/children/1/axes: Unrecognized key: "backgroundGradient"
```

The difference is not accidental. `packages/site-schema/src/issues.ts` exists
specifically to unbury union failures, and it works — but it needs to identify a
discriminator, and the slot position wraps the node union in a *second* union:

`packages/site-schema/src/schema.ts:489`
```ts
slots: z.record(z.string(), z.union([l1NodeSchema, z.array(l1NodeSchema)])).optional(),
```

`chooseBranch` looks for a branch excluded by a mismatched literal at path
length 1 (`kind`). Neither branch of *this* union fails that way — one fails
`invalid_type` (expected array), the other fails `invalid_union` — so no tag is
discovered, `chooseBranch` returns `null`, and the outer union's own default
message ("Invalid input") is kept at the slot's path.

**So every schema error anywhere inside a behavior slot's subtree is opaque,
while the identical error in the page tree is precise.** Behavior slots are
exactly where modal and dialog authoring happens.

### Defect 3b — an unknown `kind` reports "Invalid input" too

Earlier in the same session, `kind: "picture"` (the real name is `image`)
produced:

```
/pages/0/l1/root/children/0/children/0/children/0/children/1: Invalid input
```

Here `issues.ts` behaves as designed — no branch survives, so nothing is guessed.
But the message retained is Zod's default. The path is right and the sentence is
useless; naming the tag (`kind 'picture' is not one of: text, image, slot,
control, box, container`) costs nothing and is the single most self-correctable
message the envelope could emit.

### Defect 3c — only the first error is reported

`validateOrThrow` (`tools/generate/src/cli/edit.ts:294`) throws on
`result.errors[0]`. A payload with two invented field names takes two round
trips to discover both.

---

## Defect 4 — the modal has no second screen, and three separate things stop it

The operator's brief, verbatim: *"clicking the continue will replace that content
in the modal with a message — 'Please check your email. If you are already a
member we have just sent you a sign up link.'"*

It does not advance. Three independent causes, any one of which is enough.

### 4a — it was never built to swap; the message is additive

`client.js` `submitAddress` un-hides a paragraph and disables two controls. It
never removes or hides the address field, the Continue button, the ✕ or the
label:

```js
if (sent) sent.hidden = false
for (const node of [email, form.querySelector('button[type="submit"]')]) {
  if (node) node.disabled = true
}
```

So the panel does not *become* the confirmation — it grows one more line beneath a
greyed-out form. `contact-form` faced the same requirement and answered it with a
real swap:

```js
root.innerHTML = successHtml || '<p>Thanks — your message has been sent.</p>'
```

Two components, one requirement, two different answers, and the sign-in one
does not satisfy the brief it was given. `sentMessage`'s own doc comment reasons
carefully about *what* the message says and never about *what it replaces*.

### 4b — the configured endpoint is not a route, and it is cross-origin

The instance is configured with:

```
signIn: "https://app.1stcontact.io/auth/request-link"
```

There is no such path anywhere in the codebase. The real endpoint already exists
and is `POST /sign-in` (`apps/control-app/src/sign-in.ts`, [[REQ-202]]) — one of
four routes deliberately matched ahead of the Access gate. The AI told the
operator these were "placeholders your engineers will need to point at whatever
actually handles sign-in", when a working endpoint was already there to be named.

The consequence is not a quiet 404. `client.js` deliberately never reads the
response, so a 404 would still count as *completed* and show the sent message.
But this POST is **cross-origin** and carries `Content-Type: application/json`,
so it takes a CORS preflight; with no CORS headers coming back the `fetch`
**rejects**, and a rejected fetch is the one case routed to the error paragraph
instead:

```js
} catch (_e) {
  if (error) error.hidden = false
  return          // ← returns before the sent message and before disabling
}
```

So on the draft preview, Continue produces the error state, not the sent state —
and because the `return` precedes the disable, the button does not even grey out.
Nothing visibly happens.

### 4c — even on the success path, the message paints outside the card

`sent` and `error` are emitted as direct children of the `<form>`, siblings of
the authored dialog subtree:

```html
<form class="account-chrome__dialog" …>
  <label class="account-chrome__label" …>          <!-- clipped, Defect 1 -->
  {the L1 dialog slot — the 380px card the AI styled}
  <p class="account-chrome__sent"  data-fc-invariant hidden>…</p>
  <p class="account-chrome__error" data-fc-invariant hidden>…</p>
</form>
```

Once enhanced, that form *is* the overlay:

```css
.account-chrome[data-account-chrome-enhanced] .account-chrome__dialog {
  position:fixed; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; background:rgba(0,0,0,0.5);
}
```

So the two message paragraphs are column flex items **outside** the card,
centred on the 50%-black scrim. Their only styling is
`.account-chrome__sent, .account-chrome__error { margin: 0 }` — no background, no
colour — so they render in the page's default dark ink on a dark scrim.

And they cannot be fixed from the page: both are `data-fc-invariant`, painted by
the component, bound to no slot node. **This is Defect 1 again, on two more
elements.** Three of this component's four text surfaces — the field label, the
confirmation, the error — are component-painted, unstyleable, and positioned
outside the region the author controls.

### Why the tests did not catch it

`test_UAT_FC_REQ-200_account_chrome.test.ts` asserts exactly what the code does:

```ts
expect(outcomes[0]).toBe('false|Check your email for a sign-in link.|true')
```

`sent.hidden === false` is true, and the message is identical at 202/404/500 —
which is the [[REQ-134]] property that test exists to defend, and it holds. What
no test asks is whether the panel now *reads* as a confirmation: whether the form
is gone, whether the message is inside the card, whether it is legible against
what is behind it. The unit test is in JSDOM, where the overlay CSS does not
apply and geometry does not exist.
---

## What this cost

The component was correct throughout. Every turn spent on it went to
distinguishing "the component is broken" from "the documentation is wrong" from
"my field name is wrong" — and the AI got that call wrong twice: once inventing a
preview-mode story ([[REQ-216]]), once filing a false defect (Defect 1).

The unifying rule this argues for: **a reference surface that describes a
component is generated from the component, or it is a liability.** Defect 1 is a
hand-written doc comment that contradicts the CSS three files away. Defect 2 is
a validator that cannot see what it was not told to look for. Defect 3 is a
correct error-localiser defeated by a schema shape it was never shown.

---

## Scope question for the operator

This is one investigation and four unrelated fixes, in three packages:

1. `account-chrome`'s three invariant text surfaces — the field label, the sent
   message, the error — none of which the page can style or position
   (Defects 1, 1b, 4c)
2. The sign-in dialog does not swap to a confirmation state (Defect 4a), and the
   site is configured against an endpoint that does not exist when a real one
   does (Defect 4b — arguably a config fix, not a code one)
3. Behavior config strictness (`behavior.ts`, Defect 2)
4. Slot-error localisation (`site-schema`, Defect 3)

They can be one free-coded cycle or several. [[BUG-77]] is open and untitled —
say the word and I'll split, or keep all four here.

## Test plan

To be decided once scope is settled. Sketch, per defect:

1. Render `account-chrome` and assert the configured `emailLabel` text is present
   and clipped; assert the catalogue/reference text matches that behaviour.
   Plus, for 1b, whatever the chosen answer is (a `labelMode`, or documenting
   page-authored text as the route).
2. `configure_component` with a key the behavior does not declare is refused,
   naming the key and the declared set.
3. `set_l1` into a behavior slot with a bad axis key reports the offending path
   and key, matching what the same node reports in the page's own `l1` tree; an
   unknown `kind` names the valid kinds.
4. After a completed submit the address field and submit control are no longer
   presented, and the confirmation is inside the authored card rather than a
   sibling of it — asserted on rendered geometry, not only on `hidden`, since
   `hidden` is precisely what the existing UAT already proves and it was not
   enough.


---

## Addendum — checked 2026-09-11, before starting work

**4b is a data repair, not a repo change.** The committed draft for this site
(`storage/sites/1stcontact/draft/pages/home.json`) already names the real route:

```json
{ "type": "account-chrome",
  "config": { "signIn": "https://app.1stcontact.io/sign-in", ... } }
```

One module, `modules/0`, and no `account:` key. The instance the session was
editing is `modules/1` — a second chrome, authored during that session — and it
lives in the live store (the R2-backed site bucket), not in this checkout. So:

- the **repair** is a one-line config edit against whichever draft that session
  wrote, and nothing in this repository carries the bad value;
- the **durable** fix is that `meta.ts`'s `signIn` doc reasons at length about
  *why* it is a URL and never says what a 1c-hosted site's answer actually looks
  like. A doc that named `POST /sign-in` as the built-in answer would have cost
  the AI nothing to find.

`sentMessage` has a precedent worth naming in the same breath: **`contact-form`
solves the same problem with config markdown in a `<template>` and
`root.innerHTML = successHtml`** — component-painted, not slot-bound, and it
destroys the author's L1 subtree on success. So "unstyleable confirmation" is
the house pattern rather than an account-chrome oversight. Deciding 4a/4c means
deciding whether that pattern is right, which is why it is not a mechanical fix.


---

## Decision — change the contract (operator, 2026-09-11)

Option 2 of the two sketched above. `account-chrome` gains **authored message
surfaces and a visible-label route**, and its contract version goes to **2**.
All four defects stay on this ticket; nothing splits to [[BUG-77]].

### D1 — `labelMode`, matching `contact-form`

`account-chrome.config.labelMode: 'visible' | 'placeholder'`, default `visible`,
with exactly the semantics `contact-form` already gives the name:

- `placeholder` — the words go **inside the address box**, as the control's
  `placeholder` attribute. A panel authored purely from config now shows a
  visible prompt, which is what Defect 1b said it could not.
- `visible` — the words are **authored as an L1 text run beside the control**.
  This is what the session's AI did by hand, and it is the supported route
  rather than a workaround; its parting warning that the line would one day
  appear twice is wrong, and stays wrong, because the `<label>` never paints.

The clipped `<label>` stays in the DOM under both, unchanged and invariant: the
accessibility obligation is not a mode. What changes is that the surfaces stop
lying about it —

- `meta.ts`'s *"visible unless L1 hides it"* is **deleted**. It is not visible,
  and L1 cannot make it so.
- the declared `element` becomes `label`, which is what the component emits.
  `'label'` joins `L1ControlTag`; `contact-form`'s own label control carries the
  same correction, for the same reason.
- `BehaviorControlSpec` gains **`invariantPresentation`** — one sentence, stated
  beside the declaration, saying what the pinned presentation actually IS. Every
  reference surface projects it instead of inventing its own words. This is the
  ticket's unifying rule applied at the smallest scale that discharges it: one
  source, many surfaces.
- the projected REF-behaviors entry says an invariant control **cannot be bound
  from L1**, which is what `editBehaviorList` has always done by omitting them.
  The two surfaces agreed on the fact and disagreed on the telling.

### D2 — `sent` and `error` become slots

`sentMessage` config is **removed**, and with it the hardcoded error string.
Both become required L1 slots, so the confirmation and the failure are authored,
placed and styled exactly as the panel is:

```
slots: { signedOut, signedIn, businesses, dialog, sent, error }
```

All six render **inside the overlay form**, as siblings: the `dialog` subtree in
a wrapper the client can hide, and the `sent` / `error` subtrees in wrappers that
start hidden. So the confirmation is a card the author drew, centred on the
scrim by the same rule that centres the panel — not a bare `<p>` flex item
painting dark ink on a dark background (Defect 4c). The two invariant `<p>`
elements and their stylesheet rules are deleted outright; there is no fallback
copy of either message anywhere in the module.

REQ-134's property survives the move intact and is not weakened: the `sent`
subtree is revealed **when the request completes, at any status**, and
`client.js` still never reads the response. One authored message, shown to a
known address and an unknown one alike.

The L2 preset supplies a default `sent` and `error` card so a site can still
instantiate the chrome without authoring L1 — the same cost the preset already
removes for the other four slots.

### D3 — the swap (Defect 4a)

On completion the client **hides the dialog wrapper and shows the sent wrapper**.
The panel therefore *becomes* the confirmation instead of growing a line beneath
a greyed-out form: the address field, the submit, the close and the clipped label
all go with it. That is the operator's brief — *"replace that content in the
modal with a message"* — read literally.

A thrown `fetch` reveals the `error` subtree and **leaves the form standing**,
because a network failure is the one case where trying again is the right next
move. The pre-emptive `return` that skipped disabling the controls therefore
stops mattering: nothing is disabled on that path by design.

### D4 — undeclared keys are refused (Defect 2)

`validateBehaviorConfig` reports a key the contract does not declare, naming the
key and the declared set. **`validateBehaviorSlots` gets the same treatment in
the same change** — it is the identical loop-over-declared-names shape, and an
undeclared slot name is silently dropped exactly as `account: …` was. Refusing
one and accepting the other would leave the defect half-fixed.

The refusal lands at the **write** boundary (`configure_component` and every
other edit verb, through `validateBehaviorInstance`), not in the render path: an
instance already stored with a stray key must still paint, because isolation
([[DOC-25]]) says a malformed instance costs its own corner of the page and not
the page.

### D5 — slot errors localise (Defect 3)

`chooseBranch` gets one further rule, stated generally rather than special-cased
to slots: **a branch that failed at the union's own root is the wrong shape
entirely; a branch that failed deeper is the right shape with bad content.** When
exactly one branch has no root-level type mismatch, that is the branch the author
meant. `z.union([l1NodeSchema, z.array(l1NodeSchema)])` is precisely this case —
the array branch fails at the root with `invalid_type`, the node branch fails
deeper — so a bad axis key inside a behavior slot now reports the same path and
the same key it would report in the page's own `l1` tree.

For Defect 3b, when no branch survives but every branch mismatched the same tag,
the retained message **names the tag and its valid values** rather than saying
"Invalid input".

For Defect 3c, `validateOrThrow` reports **every** error it was given, not
`errors[0]`. `path` still points at the first, since a `CommandError` has one.

### D6 — the endpoint (Defect 4b)

Doc and data only, no behaviour change: `meta.ts`'s `signIn` field names
`POST /sign-in` as what a 1c-hosted site's answer looks like, so the next author
has somewhere to read it. It carries no UAT — a TSDoc comment has no runtime
surface to assert on — and the bad value itself lives outside this repository
(see the addendum above).

### Version

`account-chrome` goes to **version 2**. Removing `sentMessage` and requiring two
new slots is breaking by the contract's own definition, and the committed
`1stcontact` draft instance is migrated in the same change.

## Test plan (settled)

UATs are `test_UAT_FC_BUG-76_*`:

1. **`account_chrome_contract`** — the configured `emailLabel` text renders,
   carries `data-fc-invariant`, and is the clipped element the stylesheet pins;
   `labelMode: 'placeholder'` puts those same words in the field's `placeholder`
   and `visible` does not; the catalogue omits invariant controls while the
   projected reference lists them as unbindable and states their pinned
   presentation — the two surfaces telling one story.
2. **`undeclared_keys`** — a config key the behavior does not declare is refused,
   naming the key and the declared set; an undeclared slot name is refused the
   same way; a stored instance carrying one still renders.
3. **`slot_error_localisation`** — a bad axis key inside a behavior slot reports
   the offending path and key, and reports *the same* path tail the identical
   node reports in the page's own `l1` tree; an unknown `kind` names the valid
   kinds; a payload with two bad field names reports both.
4. **`sign_in_confirmation`** — after a completed submit the dialog wrapper is
   hidden and the `sent` wrapper is shown, so the field, the submit and the close
   are no longer presented; the outcome is identical at 202, 404 and 500; a
   thrown `fetch` shows the `error` wrapper and leaves the form standing.

   On 4c the assertion is **structural, not geometric**: the unit test is JSDOM,
   where the overlay CSS does not apply and geometry does not exist — which is
   exactly why the existing REQ-200 UAT passed while the panel was visibly wrong.
   What is asserted instead is that the confirmation IS the `sent` slot's
   authored subtree, carrying that subtree's own L1 CSS, and that no
   component-painted `<p>` sibling of the card remains in the output. The failure
   mode the old test missed was "unstyleable element outside the author's
   region"; the assertion that it no longer exists is the honest form of it.

`test_UAT_FC_REQ-200_account_chrome.test.ts` is updated rather than left: it
asserts `sent.hidden === false` on a `<p>` this change deletes. Its REQ-134
property — one message, identical at every status — is carried across to the new
shape rather than dropped.

-


---

## REQ-228: One picture catalogue: the Library is the catalogue, and being on the site is a mark on it

## What this is

A proposal for how the two picture stores should look **to the assistant**, and
the answer to the question that prompted it: the ticket API was implemented so
that exactly this would be reachable, and the assistant cannot reach it.

Supersedes REQ-227 (`request-a15815f4`), which reported the gap without proposing
a shape.

## Why the assistant cannot see this as tickets

Nothing is missing from the design. Three things are missing from the **wiring**,
and each of them is small.

**1. The ticket surface is shipped and not granted.**
`@lagrangefoundry/ai-ticketing` declares a `tickets` surface —
`get`, `query`, `comments`, `backlinks`, `history`, `create`, `update`,
`append_body`, `comment` — in two groups, `ReadTickets` and `WriteTickets`. It
exports `TicketToolbox`, `instanceConfig` and `ticketToolbox(store, config)`,
which is the same triple `@lagrangefoundry/ai-knowledge` exports and which
`ai/host.ts` already composes through `HostDeps.extraSurfaces`. It carries
`scope_axes` for `project`, `project_write` and `ticket`, every one of them
`when_unset: deny`, so a grant is a per-session allow-set rather than a blanket
one.

`instances.json` grants the consultant `l1` and `fidelity` and nothing else.
**The assistant is the only actor in this system that cannot read the project's
own tickets.**

**2. Promotion exists, is gated, and is wired only to the client's UI.**
`promoteToSiteAsset` in `material.ts` copies a material's bytes into the site's
`assets/` through the ordinary `editAssetAdd` path, refuses anything whose record
is not `republishable` (`NotRepublishableError`), and records the placement. Its
own header says it "ships WITH its refusal, unrouted", so a surface could later be
wired "to something that is already safe". `router.ts` then wired it — to the
Library tab's HTTP route, for a human clicking. No AI operation reaches it. The
gate everyone was waiting for has been in place for some time.

**3. The mark the proposal needs already exists.**
`MaterialRow.placed_on: string[]` is, in its own words, "the sites this
material's bytes are ON — where it landed, not where it was uploaded from"
(BUG-47). `promoteToSiteAsset` is "the one function that puts a material's bytes
on a site, so it is the only thing that knows the fact the Library's pill, its
`Used on` field and its 'used on this site' filter are all trying to state."

So the client's Library tab is *already* one catalogue of items with metadata,
where being on the site is a mark on the item. The data model is the proposed one.
Only the assistant sees something else.

**Why it turned out this way.** REQ-161 built the Library for the client's UI, and
every capability added after it — the placement record, the promotion gate, the
edit recipe — was wired to an HTTP route for that UI. The assistant's toolbox was
never pointed at the same store. Each step was reasonable; the shape nobody chose
is the one we have.

## The proposal

**One catalogue. Every asset is a catalogue item. Being on the site is a field on
the item, not a different place to look, and what the client sees is a filter on
that one list rather than a second one.**

Concretely, what the assistant should be able to do:

- **List and search the catalogue**, the way a person scrolling the Library tab
  does — by kind, by role, by rights, by whether it is placed on this site, by
  what the describer wrote about it.
- **Read one item's metadata**: its title, the client's own filename, the
  description, `kind`, `role`, `rights`, `republishable`, `placed_on`, the edit
  recipe, when it arrived and where from.
- **Look at it** — `screenshot` already does this, by any name the item goes
  under, and needs no change.
- **Place it on the site**, which sets the mark.

Nothing above is a new concept. Three of the four are reads of a ticket, and the
fourth is a function that already exists.

### Half A — grant the ticket surface (small, and the direct answer)

Compose `ai-ticketing`'s `TicketToolbox` into the consultant's toolbox through
`extraSurfaces`, scoped to this client's project, with `ReadTickets` granted.
This is the same wiring `ai-knowledge` already has in `host.ts`, so it is a known
shape and not an experiment.

`WriteTickets` is a **separate decision and should not ride along.** The
engagement record already has its own narrow verb (`record_decision` on the
ledger surface), and an assistant that can create and patch arbitrary tickets in
the client's project is a much larger grant than anything this ticket needs.
Start read-only.

The grant must travel with the surface rather than sitting in `instances.json` —
the in-repo declaration validator only knows about surfaces this repository holds,
and a grant there for a framework surface is a grant nothing can check. `ai.ts`
already states this rule for the knowledge surface; the same applies here.

### Half B — the catalogue IS the listing

**Decision, 2026-09-11 (operator): there is one list.** SVG drawings go into the
Library like everything else, and `list_assets` is either dropped or becomes a
view over the ticket API. The earlier plan of a peer listing beside `list_assets`
is withdrawn — two listings is the thing being fixed, not the fix.

So the shape is: **every asset a site holds is a catalogue item**, and the site's
listing is a query over the catalogue filtered by `placed_on`. A picture, a
drawing the assistant composed, a font, a stylesheet mirrored from a capture —
all of them are items. What differs is `kind`, and the **client's Library view
filters on `kind`**, which is where the "the client does not need to see the
assistant's sketches" concern belongs. Visibility is a filter on one list, not a
reason to keep a second one.

A raw ticket is not a picture, so what the assistant reads back must still be in
the `StoredImage` vocabulary — `name`, `where`, `mediaType`, `title`, `aliases` —
because `resolveStoredImage` is deliberately the single rule for what a picture's
name means and must stay so. The catalogue is where the rows come from; it is not
a new way to name one.

**The listing must be bounded**, the way `list_references` is. An engagement's
catalogue can hold every asset of every site plus every upload, and an unbounded
listing spends the tokens this is meant to save.

#### The constraint that makes this safe, and it is not optional

`list_assets` **used to** read a registry, and BUG-45 records what that cost:

> "`list_assets` reported the union of `site.json`'s `assets` array and the
> store, so a file with bytes and no entry was listed — and `get_asset` on that
> same name raised NOT_FOUND. An assistant that lists, probes, and reads a manual
> describing an `asset_id` as 'the REGISTERED name' can only conclude that an
> unregistered asset may not be used. **It cost a client their uploaded logo,
> replaced by a drawing.**"

BUG-44 fixed it by deleting the registry, so that "what a site's assets ARE is
the bytes its store holds" and "the listing and the site can no longer disagree."

Pointing `list_assets` at the catalogue **reintroduces a registry**. That is
acceptable — and is the right destination — but only under one invariant:

> **The catalogue must be complete by construction, not by convention.** Every
> write path into a site's assets mints or updates its catalogue item as part of
> the same operation. There is never a moment where bytes exist and an item does
> not.

BUG-44's lesson is not "never have a registry". It is "never have two sources
that can disagree". One source is fine. Two is what cost the logo.

Two consequences follow, and both are requirements rather than notes:

1. **Order of work.** Close BUG-84 and bring every write path into the catalogue
   **first**; verify completeness; cut `list_assets` over **last**. Cutting over
   while any door still writes bytes without an item reproduces the logo
   incident exactly.
2. **A completeness check.** Something that asserts the store and the catalogue
   agree for a site — every asset has an item, every item marked `placed_on` has
   bytes — so "complete by construction" is a verified property and not a hope.

#### What else reads this listing

`listSiteAssets` is not the AI's alone. Cutting it over touches all of these, and
the third is the one to think hardest about:

- `imageHandles` — the builder's image picker.
- `1c asset list` — the CLI, in the Node host, which has no ticket store.
- **`validateOrThrow`** — every write that touches a page checks its asset
  references against this listing, so a dangling reference is refused at the
  write. Making it ticket-backed makes **page validation depend on the ticket
  store**. That is a real coupling and needs a deliberate answer, not a
  discovery during implementation.
- `router.ts`'s asset route, which the builder UI reads.

"Drop it" and "make it a view" are genuinely different answers here. Dropping it
means those four callers each need their own answer. Making it a view keeps one
listing with one implementation swapped underneath, which is the smaller change
and the one I would take — with the caveat that the Node CLI has no D1, so the
view needs to resolve through whatever store the host actually has.

### Half C — placing a picture on the site

A `place_on_site` operation over `promoteToSiteAsset`, in its **own group** and
not folded into `ManageAssets`.

It is a real trust boundary and should read as one: the private bucket holds the
client's confidential material and the site's `assets/` serves the public
internet, so promotion is a copy across that boundary and a publication decision.
DOC-38 §5 calls promoting a capture-sourced asset "the most damaging single
action available in the system". The refusal is already written and already fires
on the record rather than on an argument. A distinct group is what lets a
deployment grant looking without granting publishing.

Its result should be the `/assets/…` handle, so the next thing the assistant does
is write it into a picture element. And it should carry forward what
`promoteToSiteAsset` already says about alt text: the description lives on the
material ticket, and the assistant is the one that writes it onto the picture
element that places the image.

### Half D — the doors that bypass the catalogue

Half B's invariant only holds if every door mints an item. Today three do and the
rest do not.

**Correct already:** a client upload mints a ticket through `material.ts`'s
ingestion; `create_image` mints one through `generatedMaterialStore`; promotion
copies bytes onto the site, checks the rights gate and records `placed_on`.

**Doors that write bytes and mint nothing:**

- **`write_image`** — the assistant's SVG drawings. Now **in scope** (the earlier
  decision to exclude them is withdrawn): 14 drawings are live on sites with no
  catalogue item. They should mint items with an `origin` of their own — a
  drawing this system composed is a third provenance, distinct from `uploaded`
  and `generated` — and the client's Library view filters them out by `kind`
  rather than by their absence.
- **`add_asset`** — a file from the operator's own disk.
- **Seed / push** from `storage/sites/<slug>/draft/assets/`. This is BUG-84
  (`bug-cd883d86`), and it is the one with an exposure attached: a subresource
  mirrored from a captured third-party site reached a client site with no rights
  record, going around the gate `promoteToSiteAsset` enforces.

**Fonts and build output.** They are in `list_assets` today — its own summary is
"the images and fonts this site can use" — so if the listing becomes a catalogue
view they need items too, or the union comes back and with it the two-sources
shape. The answer that keeps one list is that they are items with a `kind` the
client's Library filters out, exactly as drawings are. Worth confirming
explicitly when this is scoped, because "mint a ticket per mirrored stylesheet"
sounds wrong right up until the alternative is two sources of truth again.

## What good looks like

The 2026-09-11 session (`chat-d73a11e1`) is the acceptance test. The assistant
generated three candidate illustrations and then asked the client "how do the
mold shapes look?" three times without looking at them, because it believed they
were unreachable. With this, the same session reads its own catalogue, sees three
items it made, looks at them, forms a view, and places the one it chose — without
asking the operator to drag a file into the chat a second time.

## Prior art in this repo, for whoever builds it

- `tools/generate/src/cli/image-library.ts` — the one name rule, and the header
  explaining why the two stores are two.
- `apps/control-app/src/material.ts` — `MaterialRow`, `listMaterial`,
  `promoteToSiteAsset`, `recordPlacement`, `materialImageLibrary`.
- `tools/generate/src/cli/edit.ts` — `siteImageLibrary`, `listSiteAssets`,
  `editAssetList`, `editAssetAdd`, and `validateOrThrow`, which is the page
  reference check that reads the listing.
- **`editAssetGet`'s header in the same file — read it before starting.** It is
  BUG-45's account of what a registry disagreeing with the bytes cost, written on
  the function this ticket proposes to re-point at a registry.
- `tools/generate/src/cli/ai/host.ts` — how `ai-knowledge` is composed through
  `extraSurfaces` with its own grant. The pattern to copy.
- `apps/control-app/dist-assets/builder/library.js` — what a human sees, which is
  the thing being reproduced.

## Not in scope

- BUG-80, the stored-picture render path — already fixed.
- Unifying the two buckets. They are separate on purpose and stay separate; this
  is about the catalogue over them, not the storage under them.


## Scope, as built (2026-09-11)

All four halves are in scope. A–C are implemented here; D is a decision recorded
here and a bug filed elsewhere.

### Half A is granted, and the reach into past conversations is the point

**Operator decision, 2026-09-11.** The proposal above described `ReadTickets` as
the direct answer and left the size of the grant implicit. It is stated here
because it was questioned during implementation and the answer changes what gets
built: the tenant's ticket store holds every `chat` ticket for this client — each
carrying a previous conversation's full transcript in its `chat_transcript`
comment — alongside the engagement ledgers, the material records and the
awareness map.

**That reach is the intention, not a side effect to be narrowed.** An assistant
that cannot read what it and this client already worked out is an assistant with
no context, and context is most of what makes it useful. A grant trimmed to "the
picture catalogue only" would answer this ticket's acceptance test and leave the
product's actual intent unbuilt.

So the consultant is granted `ReadTickets` over this client's whole store.
`WriteTickets` is still withheld, exactly as the proposal says: reading what was
decided is the capability being added, and creating or patching arbitrary
tickets is a separate decision nobody has made.

**Local-only falls out rather than being configured.** The `project` and
`project_write` axes are left unset, which their declarations read as an empty
allow set; a local uid projects to no authority, and a projection that yields
nothing is unconstrained. The result is that every ticket in this session's own
store is readable and any reference naming another project is refused, with no
predicate anybody has to keep correct. The `ticket` axis is left unset too,
which reads as "this session's store, all of it".

The tenant handle is what keeps this to one business. The store the surface is
built over is already `forTenant`-bound, so there is no argument anywhere on the
path that could name another client's tickets.

### Half B — what the catalogue listing actually returns

The catalogue lists **everything the client has given us, not only pictures**.
The Library holds documents and fonts beside images, and a client who uploads
their brand font uploaded it so it could go on the site; a listing that silently
omitted it would be the same shape of bug this ticket is fixing. `kind` is
therefore a filter rather than a fixed predicate, and the other three dimensions
a person scrolling the Library tab uses are filters too: what it is for (`role`),
whether it is already on this site, and text the describer or the client wrote.

**The listing is bounded and says what it left out.** An engagement's Library can
hold every upload of the whole engagement. The listing takes a limit, defaults
it, and reports the total it matched and whether more were held back — a bounded
listing that did not say it was bounded would read as a complete one.

**One naming rule, over a wider set.** `resolveStoredImage` stays the only thing
that decides what a stored picture is called. The catalogue does not get a second
matcher: it feeds that same function a candidate set covering every catalogue
item rather than only the images, so a picture is spelled here exactly as
`screenshot` and `edit_image` spell it. The projection from a material row to a
named item is written once and used by both the Library's half of the merged
image library and the catalogue, so the two cannot drift.

**A name that means two items is refused, never guessed**, and the refusal names
the candidates — the rule the naming vocabulary already states, inherited rather
than restated.

### Half C — what placing returns

`place_on_site` reports the `/assets/…` handle as well as the stored name, so the
next thing the assistant does is write it into a picture element without deriving
a path. It carries the item's description back with it, because alt text is
written onto the element that places the picture and the description lives on the
material record.

Placement is **its own capability group**, separate from looking. It is not
folded into `ManageAssets`.

**Nothing about the refusal is new or re-implemented here.** `promoteToSiteAsset`
already refuses material whose record is not `republishable`, already renames
around a collision rather than overwriting a live picture, and already records
`placed_on` after the bytes land. The operation is a wire to it.

**Placing is not publishing.** The bytes land in the site's draft assets; the
site becomes public only when the client publishes. The surface says so, so the
assistant does not treat placing as an irreversible public act.

### Where the grants live, and where the surfaces are absent

Both grants **travel with their surfaces** rather than sitting in
`instances.json`, for the reason `ai.ts` and `image-core.ts` already state: that
file is validated against the declarations this repository holds, so a grant
there for a surface the validator was never handed is a grant nothing can check.

Both surfaces are **composed only where there is a ticket store**. The `1c` CLI
has none, so a local builder gets a consultant that edits sites perfectly well
and simply has no catalogue and no ticket reads — the same conditional
composition the ledger surface already has, and not a degraded mode.

## Not built here

- The seed/push door — **BUG-84** (`bug-cd883d86`), filed with evidence.
- `WriteTickets`.
- The assistant's own `write_image` drawings entering the Library. Excluded by
  operator decision, 2026-09-11.


---

## BUG-84: A capture-mirrored picture can reach a site's assets with no catalogue ticket and no rights record

## What is wrong

A picture can land in a site's assets without ever becoming a catalogue item, so
the catalogue is not a complete account of what is on a site.

**Scope, 2026-09-11 (operator, revised).** An earlier decision excluded the
assistant's `write_image` drawings from the catalogue; it has been **withdrawn**.
REQ-228 now takes the strong form — one list, every asset is a catalogue item,
and what the client sees in their Library is a filter on `kind` rather than a
second list. Drawings are in.

That makes this ticket one door among several rather than the whole gap. The
others — `write_image` and `add_asset` — are named in REQ-228's Half D. **This
one keeps its own ticket because it is the only one with an exposure attached**,
and that exposure stands whatever happens to the catalogue.

## The exposure

Setting drawings aside — they are a catalogue gap, not a rights one — the raster
picture on a site with no record is **one file**:

```
non-SVG pictures in site_assets : AlchemistLabWithTech.png (2.4 MB)
                                  DSC_7975.jpg (12.7 MB)
material ticket for DSC_7975.jpg: yes — promoted, placed_on recorded correctly
material ticket for Alchemist…  : none
```

Its provenance is the point:

```
storage/references/gigabytealchemy.ai/index/assets/AlchemistLabWithTech.png
storage/sites/gigabytealchemy/draft/assets/AlchemistLabWithTech.png
→ site_d669b155… (slug: gigabytealchemy)
```

It is a subresource **mirrored from a captured third-party website**, which then
reached a site's assets through the seed/push door (`storage/sites/<slug>/draft/`
→ `1c push`). No material ticket was minted, so no `rights` block was ever
written, and `republishable` was never evaluated.

`promoteToSiteAsset` refuses exactly this picture — it checks `republishable` on
the material's own record and raises `NotRepublishableError` for anything
capture-sourced, because DOC-38 §5 calls promoting a capture-sourced asset "the
most damaging single action available in the system": it publishes third-party
copyright under the client's own domain. **That gate is correct, and this door
goes around it**, because a picture with no ticket has nothing for the gate to
read.

The instance here is a development fixture and harms nobody. The door is the bug.

## What works, stated so it is not re-litigated

- **A client upload** mints a `material` ticket through `material.ts`'s
  ingestion — classified, described, indexed.
- **`create_image`** mints one through `generatedMaterialStore` in `imagegen.ts`,
  which exists precisely so that "a generated image is an ordinary `material`".
- **Promotion** copies a material's bytes onto the site, checks the rights gate,
  and records `placed_on` — `DSC_7975.jpg` is in both places, correctly marked.

Three of four doors are right. This is about the fourth.

## The doors that bypass the catalogue

1. **Seed / push from `storage/sites/<slug>/draft/assets/`.** Whatever is in that
   directory becomes a site asset. Capture-mirrored subresources land there, so a
   third party's imagery can reach a client's site with no rights record and no
   gate. This is the live instance and the one that matters.

2. **`add_asset`** — a file from the operator's own disk. Same absence, lower
   stakes: the operator is asserting their own material, and the operation is not
   granted to the consultant.

`write_image` is a third door and is now in scope for the catalogue — but it is
**REQ-228 Half D's**, not this ticket's. A drawing this system composed has no
rights question: it is owned and republishable by construction. Keeping it here
would mix a catalogue gap into a rights gap and blur what this ticket is for.

Fonts (`satoshi-*.woff2`), stylesheets and other mirrored subresources
(`blog.*.css`, `css2`, `index`) are likewise REQ-228's to decide. Note that they
arrive through the *same* seed/push door as the picture above, so whatever answer
that door gets has to cover them — which is part of why the door, rather than the
file type, is the right thing to fix.

## What we want

A **picture** that lands in a site's assets through the seed/push door gets a
catalogue entry carrying its provenance and its rights block — or, if minting a
ticket per seeded asset is the wrong shape, the rights question is answered at
that door some other way. What must not survive is a picture on a client's site
that no record can account for.

The narrower framing, if the broad one is too much: **a capture-mirrored image
must not reach a site's assets without passing the same gate promotion passes.**
That is one rule, at one door, and it closes the exposure without touching the
catalogue's shape.

## Relationship to REQ-228

REQ-228's Half B makes `list_assets` a view over the catalogue, and states the
invariant that makes that safe: **the catalogue must be complete by
construction** — every write path into a site's assets mints its item as part of
the same operation, so there is never a moment where bytes exist and an item does
not. BUG-45 is the evidence for why that is not optional.

This door is one of the ones that breaks the invariant, so closing it is a
precondition of the cut-over rather than an improvement alongside it. The
difference from the other doors is that this one is *also* a rights hole, and
would be worth closing even if the catalogue were never unified.

## Questions to settle when scoping

- Whether the seed/push door mints tickets, or is gated some other way.
- Whether the existing `AlchemistLabWithTech.png` is left alone (a dev fixture),
  or is the test case for whatever gate is added.
- Whether a capture bundle's images should be catalogue items in their own right
  — they are the client's *reference* material, which is a real category with a
  `rights` answer of its own, distinct from anything they own.

## Related

- REQ-228 (`request-77e4e59c`) — the catalogue proposal. Half D names this gap.
- BUG-47 — established `placed_on` as placement rather than upload context.
- BUG-45 — made promotion go *through* `editAssetAdd` rather than past it, so a
  file arriving by one door is treated like one arriving by another. This is the
  same argument, at a door that has no gate at all.


---

## Scope settled, 2026-09-11 (implementation)

The three scoping questions above are answered as follows.

**The seed/push door is gated, not made to mint tickets.** Minting a `material`
ticket per seeded asset is REQ-228's shape decision — it is the one that has to
cover fonts, stylesheets and build output too, and the ticket says so. More to
the point, minting a ticket for a capture-mirrored picture would *record* the
infringement rather than prevent it: there is no `rights` block that makes a
third party's photograph publishable on a client's domain, so the only honest
entry is one that refuses. This ticket therefore takes its own narrower framing:
**a capture-mirrored asset must not reach a site's assets without passing the
same gate promotion passes.** REQ-228's invariant is still served — after this,
the door either writes bytes that some record can account for, or writes nothing.

**`AlchemistLabWithTech.png` is the test case, and is left where it is.** The
local reproduction under `storage/sites/gigabytealchemy/draft/` is what `1c
repro` exists to produce and what the fidelity loop reads; deleting its mirrored
assets would break the framework-growth loop rather than close a hole. The
refusal is at the push door, so the reproduction keeps rendering locally and
stops being publishable. Measured against the real corpus, the rule is exactly
discriminating: all five of that draft's assets are byte-identical to members of
`storage/references/gigabytealchemy.ai/index/assets/`, and none of the nine
assets under `storage/sites/xgd/draft/assets/` matches anything in any bundle.

**Whether a capture bundle's members become catalogue items in their own right
is REQ-228's**, and nothing here decides it.

## The rule

> Bytes this system mirrored from a captured page may not enter a site's assets.

**Identity is the sha256 of the bytes.** The copy into
`storage/sites/<slug>/draft/assets/` destroys every other link back to the
capture — the file arrives under its own basename in a directory that records
nothing — so the content hash is the only evidence that survives it. That is
also why the gate reads bytes rather than provenance: a path-based or
name-based test would be defeated by the rename the copy already performs.

**Every mirrored subresource counts, not only pictures.** The scan is the
bundle's `assets/` prefix, which is where the capture pipeline puts every
subresource it mirrored. A third party's stylesheet or licensed webfont
republished on a client's domain is the same act as their photograph, and a
type test would be one more thing to get wrong. The bundle's own derived and
observed members (`multistate.json`, the screenshot ladder, `rendered.html`)
are deliberately **not** scanned: they run to tens of megabytes, nothing copies
them into a draft, and reading them on every import would put a Worker's limits
between the operator and their push.

**The refusal is hard and has no override.** `NotRepublishableError` has none
either, for the same reason: an escape hatch on a rights gate is the gate not
existing. `--force` remains what it has always been — BUG-51's answer to
replacing builder changes — and does not reach this.

## Where it is enforced

Both halves of the one door, because each half holds different evidence and
neither alone is sufficient.

1. **`1c push` (Node).** Checked against the operator's own
   `storage/references/` bundles, before anything crosses the wire. **This is
   the half that catches the reported instance**: the gigabytealchemy capture
   was taken on the operator's disk and was never adopted into any tenant's
   cloud store, so a Worker-side check alone would have found nothing to match
   and let it through.
2. **`POST /api/import` (the Worker).** Checked against the tenant's R2
   reference store, which is where a capture taken in the cloud lives. The
   Worker is the writer, and a rule only the client enforces is not a rule: a
   request posted by hand must be refused by the same rule that refuses the CLI.

One predicate, two call sites, two adapters of the one `ReferenceStore` port.

## What must not change

- A push carrying no assets, or a tenant holding no captures, is unaffected —
  there is nothing to match against and no extra work is done.
- A deployment with no `BLOBS` binding has nowhere for captures to live, so the
  import route has nothing to check and proceeds as before rather than failing.
- The refusal names the offending asset and the bundle member it mirrors, so
  the operator is told *which* file and *where it came from* rather than that
  the push was refused.
- BUG-51's 409 conflict and this refusal are different answers to different
  questions and must stay distinguishable: the import route answers this one
  with **403**, because the request was well formed and the rule said no.

## Not in scope

- `write_image` and `add_asset` — REQ-228 Half D's, named there.
- Cataloguing fonts, stylesheets and build output — REQ-228 Half B's.
- The `AlchemistLabWithTech.png` row already in a dev deployment's `site_assets`
  is an operator cleanup, not a code change; the door it came through is shut.


## Behaviour this adds, stated so it has evidence

- **A refused import leaves nothing behind — not even an empty draft.** The gate
  runs before `createDraft`, for the same reason BUG-51's 409 refuses ahead of
  the write rather than rolling back after it: a slug that has never been
  imported must not come into existence because somebody tried to publish a
  picture they may not publish.
- **Nothing is uploaded when the CLI refuses.** The check runs while reading the
  draft, before the request is formed, so a refused push never puts a third
  party's bytes into anyone else's storage on the way to being told no.
- **The gate reads bytes, not names.** The same bytes under a different name are
  refused; different bytes under the captured name are not. That is what makes
  the rule survive the rename the copy into `draft/assets/` already performs.
- **One business's captures never gate another's push.** The reference store is
  bound per business by `forTenant` and the gate inherits that barrier rather
  than re-enforcing it — one client's private material must not decide what a
  different client may publish.
- **`readSitePayload` now takes the reference store it checks against**, and
  `PushOptions.references` is required rather than optional: an optional store is
  a gate a caller can forget, and a forgotten gate looks exactly like a clean
  push. A caller with no bundles passes one that lists none.

## Known consequence, accepted

`bin/publish` with no slugs named pushes every site in `storage/sites/`, so a
checkout holding a `1c repro` reproduction will now stop at that site rather
than publishing it. That is the bug being surfaced rather than a regression —
the reproduction is a local framework-growth artifact and was never publishable
— and the refusal names the file and the bundle it came from.


---

## REQ-229: Promotion records the asset name, and a recipe change replaces those bytes in place

## The gap

A client crops their logo in the Library, sees it cropped there, publishes, and
their site serves the picture uncropped. Nothing errors. Every component behaves
exactly as designed; what is missing is the seam between them.

[[REQ-219]] settled how a recipe reaches a published site — **the material records
the site asset name it was promoted to, and a recipe change re-promotes** — and
recorded it as decided. Neither half was built:

- **`promoteToSiteAsset` does not record the promoted name.** It computes one
  through `freeAssetName` — which *may rename on collision* — writes the bytes via
  `editAssetAdd`, then calls `recordPlacement`, which writes `placed_on` slugs and
  nothing else.
- **`reviseRecipe` does not re-promote.** It validates, compiles, writes
  `fields.edits`, and returns. Nothing touches the site's copy.
- **Publish reads no recipe**, which is correct under this design — it ladders
  bytes that promotion was supposed to have already corrected.

So the epic's own title breaks between its third and fourth verbs: *change* does
not reach *publish*.

## What changes

**Promotion records the asset name it wrote.** Not just which sites a material
landed on — the name it landed under, which `freeAssetName` may have altered. This
is the pointer the whole design rests on and the thing that distinguishes a first
placement from a later one.

**A recipe change re-promotes to that recorded name.** The rendered bytes for the
current recipe replace the bytes already at the name the site's pages reference.

**Promotion itself writes the render, not the stored original.** [[REQ-219]]
settled that *the recipe is applied at promotion, not at publish* — that is the
heading the decision sits under — and promotion currently copies the attachment's
bytes untouched. So a picture cropped in the Library and *then* put on the site
arrives uncropped, by the same seam and with the same symptom. Promotion renders
the material's current recipe and writes what comes out. For the overwhelming
case — a file dropped on the overlay, promoted in the same second, with no recipe
at all — the recipe is empty and there is nothing to render, so this costs
nothing where nothing has been edited.

**A recipe change the ASSISTANT makes re-promotes on the same terms.** The client's
modal and `edit_image` are two producers of one fact — the recipe on the record —
and [[REQ-228]] has just made the catalogue reachable by the assistant. A
propagation that fired for one producer and not the other would be the same gap
this ticket closes, re-opened on the surface the product leads with.

**Where this deployment cannot render, the recipe still lands and nothing is
re-promoted.** No `[images]` binding means no bytes to write, which is the state
`rendered: false` already reports. The recipe is on the record and reaches the
site the next time a deployment that can render touches it — the surface says the
client is looking at the picture before the change, which is exactly what it
already says.

**What a re-promotion answers with.** Each recorded placement, the name it was
written at, and whether the bytes were replaced — reported beside the row the
edit returns, so a client's crop that did not reach their site says so on the
turn it happens rather than in a picture somebody looks at next week.

## Replacement is explicit, and is not delete-then-add

**This is the decision that makes the ticket safe, and it is the operator's.**
Re-promotion must **replace bytes at an existing name**, as one operation.

**The principle, in the operator's words.** *When I edit a photo, I expect the edit
to replace the existing photo — same name, everything.* That is the whole of it,
and it is what a user of any photo tool expects; a crop that arrives as a second
file called `logo-2.png` is not an edit, it is a copy.

**A second name would be a version mechanism on top of a version mechanism.**
Editing is already non-destructive here: the material retains the **original bytes**
and the **sequence of operations** that produced the current render ([[REQ-219]]'s
recipe). Nothing is lost by overwriting, because the thing being overwritten is a
*derived artifact* — re-derivable from the original and the recipe at any moment.
Minting a new name to preserve the old bytes preserves nothing that is not already
preserved, and pays for it twice: an orphan in the bucket on every commit, and a
site whose pages still point at the stale derivation.

**So naming is settled by what the name addresses.** The site asset name addresses
*this material's picture, as currently edited* — a stable pointer, not a version.
Versions live in the material: the original, plus the operations. One mechanism,
in one place.

**Why not delete and re-add.** Between the two there is a window in which the
site's pages reference an asset that does not exist — a broken picture on the
client's live draft, and a publish in that window renders a snapshot with a hole in
it. It also takes a second trip through `freeAssetName`, which would hand back the
*original* name only if the delete had already committed. Two operations to
express one intent, with a failure mode in between, is the glitchier of the two
paths.

**Why replacement cannot reuse the promotion path as it stands.**
`freeAssetName` (`material.ts:812`) appends `-2`, `-3`, `-4` on collision. A
re-promotion through it mints `logo-2.png` on the first edit and `logo-3.png` on
the second, while every page referencing `logo.png` keeps serving the **unedited**
original and a fresh orphan lands in the bucket on every commit. The client's
crop would be strictly invisible and strictly expensive.

**And that behaviour is correct for the door it guards**, which is why this must
not be "fix `freeAssetName`". Its own comment states the rule: *"promoting a second
`logo.png` would REPLACE the first — silently changing a picture that is live on
the client's site, from a surface whose whole promise is that it only adds."* That
promise holds for every caller except this one.

**So the two doors are told apart explicitly, by the record.** A material with **no
recorded asset name** is a new placement: it takes a free name, exactly as today. A
material that **already records one** is a re-placement: it overwrites that name
and mints nothing. The record is what makes the distinction mechanical rather than
a flag someone has to remember to pass.

**A replacement that finds nothing at the recorded name does not invent one.** If
the name is gone — an operator deleted the asset, a push overwrote the site — the
material's record is stale, and silently re-adding the picture would put back
something somebody removed. It reports rather than repairs.

## What this does not change

**Draft and published still differ, and that is the point.** Re-promotion updates
the **draft**. A published revision is a frozen snapshot and does not change.
Changes reach the live site when the client publishes, which is the product's
semantics everywhere else and wants no exception here.

**No new join key.** This is the shape [[EPIC-1]]'s catalogue principle asks for —
the catalogue is the source of truth and a site's assets are a projection of it. A
material that records where its bytes landed and re-promotes when its recipe
changes *is* that projection. A `material_uid` column on `site_assets` would be a
join between two peer stores, which is the thing being avoided.

**The width ladder is untouched.** [[REQ-222]] ladders whatever bytes it finds in
the site's assets. Once those bytes are the corrected ones, it ladders the
corrected ones. Nothing about the ladder needs to know a recipe exists.

## Where it sits

One of three faces of the same sentence — *the catalogue is the source of truth* —
failing at different points. [[BUG-84]] is the entry half (pictures that reach a
site with no catalogue ticket). [[REQ-228]] is the access half (the AI cannot read
the catalogue as tickets, and cannot promote). **This is the propagation half.**
Fixing any one alone leaves the promise false.

Depends on nothing new. Both halves are edits to `material.ts` plus the site
store's ability to write bytes at an existing name.


---

## Answered from EPIC-1, 2026-09-11 — four things an implementer hits on day one

Swept for unanswered questions across the epic's children. This ticket was the
only one with no epic-level answer pass, and its last chat turn — *"if you have
any questions ask them here"* — never got a reply: the generation failed on a
spend limit. So these are the questions that would have been asked, answered
where the epic's design conversation settles them and escalated where it does
not. **Verified against the code, not inferred from the ticket.**

### 1. Promotion itself must apply the recipe — not only re-promotion

**The body describes two halves and there are three.** As written, this ticket
records the name at promotion and re-promotes when the recipe changes. Both are
right. But `promoteToSiteAsset` (`material.ts:712`) reads the **attachment's
original blob** — `readBlob(tickets, args.uid, attachment.uid)` — and hands those
bytes straight to `editAssetAdd`. It takes no renderer and has no parameter for
one, and none of its three callers (`placeOnSite` at `router.ts:1338`, the
role-change route at `router.ts:2532`, the Library's **Use on site** button at
`library.ts:138`) could supply one.

So the failure this ticket exists to fix has **two doors**, and the body only
shuts one:

- *promote, then crop* — the recorded name is stale. This ticket fixes it.
- *crop, then promote* — promotion writes the uncropped original. **This ticket
  does not fix it**, and the client's experience is identical: they crop in the
  Library, see it cropped, publish, and get the original.

[[REQ-219]] decided *"the recipe is applied at promotion, not at publish"*. Read
literally, that is a statement about **promotion**, and it is the first
placement that most obviously has to honour it. **Both doors are in scope**:
promotion renders the current recipe before it writes, and re-promotion is the
same act against a recorded name. A material with an empty recipe renders to its
original bytes, so there is one path, not two.

### 2. The record is per-site, and it must not be carried in `placed_on`

The body says *"the asset name it landed under"*, singular. It cannot be
singular. `placed_on` is a **list of slugs** and [[REQ-219]] states the
consequence explicitly — *"a material placed on several sites re-promotes to
each, driven by `placed_on`"* — and `freeAssetName` resolves collisions against
**one site's** listing, so the same logo can be `logo.png` on one site and
`logo-2.png` on another. One name would re-promote to the wrong file.

**And the name must not be folded into `placed_on` by changing its element
shape.** That field is `{ type: 'list' }` in `MATERIAL_FIELDS` (`tickets.ts:121`)
— the engine checks only `Array.isArray`, so nothing would stop it — but four
readers would break silently rather than loudly:

- `placedOn()` (`material.ts:799`) filters `typeof v === 'string'`, so every
  object would be dropped and **every placed material would read as unplaced**.
- `MaterialRow.placed_on` is typed `string[]` (`material.ts:923`).
- `library.ts:71` carries it to the client, where the pane's *Used on* field,
  its pill and its "used on this site" filter all read it.
- `router.ts:3229` returns it in the `AlreadyOnSiteError` 409 envelope.

The first of those is the dangerous one: it fails **open**, into the state that
reads as "never placed", which is exactly the state this ticket uses to decide
that a promotion is a *first* one. A shape change would make every existing row
take a free name on its next edit — the `logo-2.png` failure the body is written
to prevent, arrived at through the migration instead.

**So: a second field, keyed by slug**, beside `placed_on` and declared in
`MATERIAL_FIELDS` the way `edits` was. `placed_on` keeps saying *which sites*;
the new field says *under what name on each*. Absence reads as "no recorded
name", which is the first-placement branch — so material that predates the field
needs no migration, the same property `placed_on` and `edits` were both given.

### 3. Re-promotion cannot go through `editAssetAdd`, and fixing that in place is forbidden

`editAssetAdd` (`edit.ts:2287`) throws `CommandError{code:'CONFLICT'}` when the
name is already in `listAssets`. `promoteToSiteAsset`'s own comment relies on
never meeting it — *"The name is already free, so the CONFLICT branch cannot fire
from here"* — which stops being true the moment a re-promotion aims at a recorded
name. The body is right that this must not become "fix `freeAssetName`"; the same
argument applies one layer up, because `editAssetAdd`'s refusal is the same
only-adds promise stated in a different place.

**The replace path is a sibling of `editAssetAdd`, not a flag on it.** The
underlying call is already replace-capable — `opts.store.write(slug, {assets:
[{name, bytes}]})` puts bytes at a name and says nothing about what was there —
so the sibling is that write plus the same draft-journal note (`op:
'asset.replace'`), which is what keeps the assistant told that a picture changed
on the turn it changes. That preserves the property `promoteToSiteAsset`'s
header insists on: *"one write path, one set of rules about names"* — two verbs
over one write, rather than one verb with two meanings.

### 4. `reviseRecipe` has neither of the two things it now needs

`reviseRecipe` (`material.ts:1616`) is `(store, args, deps: {measure?})`. It has
no site store and its only dep **measures** — it never produces bytes. Both have
to be threaded for the re-promote to happen where the body puts it.

Two things to carry through that threading, both already decided elsewhere:

- **The `republishable` gate travels with the bytes.** `promoteToSiteAsset`
  checks it on the material's own ticket before anything is copied, and
  [[BUG-84]] is the ticket about what happens when bytes reach a site without
  that check. A re-promotion is a fresh cross-bucket copy and takes the same
  gate — a material whose rights were narrowed after its first placement must
  not keep pushing new bytes through on every crop.
- **`rendered: false` stays honest.** A deployment with no Images binding already
  stores the recipe and reports that the client is looking at the picture before
  the change. The same deployment cannot re-promote either, and must say so in
  the same field rather than silently recording an edit that never reached the
  site.

### What this does not change

The body's own decisions all stand and none of the above disturbs them:
replacement rather than delete-then-add, no new join key, a stale record
reporting rather than repairing, and the draft/published distinction. The
operator's principle — *an edit replaces the existing photo, same name,
everything* — is what item 1 extends rather than qualifies: the first promotion
of an already-cropped photograph should put the cropped photograph on the site,
for the same reason.

## How the record holds it

`fields.placed_as` — a list of `{ slug, name }`, beside the `placed_on` that
already exists. Both are written in one patch by the one function that performs a
placement, so they cannot disagree about where a material went.

**`placed_on` keeps its own meaning and is not derived from the new field.** It
answers *which sites*, which is what the Library's pill, its `Used on` field, its
"used on this site" filter and the catalogue's `placed` predicate all read, and
none of them has anything to do with a filename. Deriving it would also erase
every placement made before this ticket the first time such a material was put on
another site — material with a slug and no recorded name is precisely the
"no recorded asset name" state the design already has a reading for.

`editAssetReplace` is the site store's new verb: bytes at an existing name, one
operation, `NOT_FOUND` if the name is not there. It sits beside `editAssetAdd`
rather than inside it, so neither surface can drift into the other's behaviour —
one only adds, and the other only replaces.

## Test plan

UATs in `tests/test_UAT_FC_REQ-229_recipe_reaches_the_site.workers.test.ts`,
through `route()` against real D1, real R2 and the real `IMAGES` binding — the
suite [[REQ-219]] established, for the reason it established it: a recipe
asserted against a hand-written renderer proves the fake.

**Asserted with `rotate`, deliberately.** Miniflare's local Images implementation
honours `rotate`, `width` and `height` and silently drops trim and every colour
adjustment, so a crop asserted in pixels here would pass against an uncropped
picture. A quarter turn is a real transform the local renderer really performs
and its result is checkable without trusting the renderer's own word — the
picture's width and height swap.

The happy paths:

1. Promotion records the name it wrote, including the one `freeAssetName` renamed.
2. A recipe change replaces the bytes at that name — same name, no second asset.
3. Promotion applies a recipe the material already carried.
4. A second promotion of the same material onto the same site replaces rather
   than minting a new name.
5. A recorded name that is no longer on the site reports and does not re-add it.
6. `edit_image` propagates to the site by the same path the modal does.


---

## Answered from EPIC-1, 2026-09-12: both scope calls stay

The implementation asked *"say the word if either should come back out"* about
the two widenings past this ticket's original two bullets. **Both stay**, and
neither is a widening so much as the ticket's own sentence finished.

### Promotion applying the recipe — stays, and was the epic's answer before it was yours

This was recorded as in scope in §1 above, before the branch was cut, and the
reasoning has not changed: [[REQ-219]] decided *"the recipe is applied at
promotion, not at publish"*, and the first promotion is the most obvious thing
that decision is about. Without it the gap has two doors and the client cannot
tell them apart — *promote then crop* was fixed and *crop then promote* was not,
with one symptom between them.

The implementation's own argument is the better one and should be the one that
survives here: `image-ladder.ts` carries a comment asserting it ladders *"bytes
that promotion already produced by applying the recipe"*. Leaving promotion
un-rendering would have left that comment false while every suite stayed green,
which is precisely the failure mode [[REQ-222]]'s and [[REQ-220]]'s seams
already demonstrated.

**Keeping the renderer optional is right.** A deployment with no `[images]`
binding promotes the original, which is the behaviour that predates recipes and
the same answer `rendered: false` already gives the editor. Making it required
would turn *"this deployment cannot crop"* into *"this deployment cannot publish
a logo"* — a much larger claim than a missing binding supports.

### The `edit_image` path — stays, and leaving it out would have been the bug

The epic's principle is *one mechanism, in one place*. A propagation that fired
for the modal and not for `edit_image` would mean the same operation, on the same
record, reaches the site when a client does it and does not when the assistant
does — a difference with no explanation a client could be given.

And the timing makes it sharper than a symmetry argument: [[REQ-228]] has landed,
so the assistant now reads the catalogue as tickets and can promote. The surface
the product leads with is the one that would have silently not worked. Wrapping
the library recipe port so both producers pass through one function is the same
shape [[REQ-220]] used for its own write path — *a second producer of structured
edits, never a second definition of one*.

### One consequence worth stating plainly

Because promotion now renders, **an unedited picture must pay no transform**.
The empty-recipe short-circuit is not an optimisation — it is what keeps
promotion's cost unchanged for the overwhelming majority of pictures, which have
no recipe and never will. That is load-bearing for [[REQ-222]]'s publish-latency
budget, which was costed before promotion rendered anything.


### The `republishable` re-check §4 asked for is correctly absent

§4 above asked that *"the `republishable` gate travels with the bytes"* on
re-promotion. `republishMaterial` does not check it, and **that is right** —
recorded here so reconciliation does not read the omission as an unbuilt
requirement.

The gate cannot be evaded, because the state §4 worried about is unreachable:

- `republishable` is **derived, never accepted from a caller** — `reviseRole` is
  the only writer, and it sets it from the role alone.
- `reviseRole` **refuses narrowing once the bytes have landed**: `role:
  'reference'` against a non-empty `placed_on` raises `AlreadyOnSiteError`.

So a material that has placements to re-promote to is a material that was
`republishable` at promotion and cannot since have stopped being one. A second
check would be dead code asserting an invariant two other functions already
hold — and the kind of dead check that later reads as the real guard.

**What does still gate it** is the record itself: `placedAs` empty means nothing
to replace and the function returns immediately, so a material that was never
promoted cannot acquire site bytes through the recipe path.