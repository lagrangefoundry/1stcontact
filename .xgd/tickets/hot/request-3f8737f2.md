---
uid: request-3f8737f2
id: REQ-157
type: request
title: 'The fidelity surface: the assistant can look, compare and judge'
created_by: xgd
created_at: '2026-08-20T23:16:44.004000+00:00'
updated_at: '2026-09-02T23:28:58.656376+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 13
  depends_on:
  - REQ-154
  - REQ-155
  - REQ-156
  - REQ-149
  auto_merge_back: true
  needs_review: true
  chat_comment: comment-422ff2d4
  commits:
  - working_sha: 11ca5fea9ae676265d4d492c426df027f249ab53
    reconcile_sha: null
    main_sha: null
  - working_sha: ecbed061a8306552701b6f920f8a7a9cb12e980a
    reconcile_sha: null
    main_sha: null
  version: 0.2.44
---

# The fidelity surface: the assistant can look, compare and judge

## Why

The assistant's entire tool surface is 27 site-editing operations ([[DOC-30]],
`l1-surface.json`). It can author a page and it can draw an SVG. It has **never been able to see
anything** — not a reference site, not its own output, not the difference between them. No
operation in any surface returns an image; `get_asset` returns *"its file and its alt text"*.

[[DOC-13]] §6 is titled *"Screenshots — the AI's eyes"*. In the cloud the assistant has none, and
[[DOC-9]] §2.1's "convert an existing site" — named there as the killer demo — is unreachable
without capture.

## A second surface, not more operations on the first

`l1-surface.json` is the **L1 control surface**: the documented, maintained way to *change a site*
([[DOC-30]]). Nothing in this ticket changes a site — capturing, shooting, comparing and judging
are all read-only with respect to the site. Bolting them onto the L1 surface would make that
document's own claim about itself false.

So this is a second declared surface, implemented the same way: declared as data, implemented
against the store, granted per role. The knowledge surface is the working precedent for a second
one — but it is only *half* a precedent: `createL1Toolbox` takes it as a **single named slot**
(`knowledgeSurface`), not as a list, so composing a third surface means generalising that
parameter first. (An earlier draft of this body claimed the parameter was already a list. It was
not; see the Decisions below.)

## The picture vocabulary — "anything against anything"

Today each verb has its own flags: `--ref <bundleDir|refPng>`, `--actual <png>`, `--source
draft|published`, `--size`, `--url`. That is fine for a person typing and useless as a tool
surface, where the model must be able to name any picture in one consistent way.

One **picture source**, resolved in one place:

| Source | Named by |
|---|---|
| a captured reference | bundle id + viewport |
| an authored draft | slug + page + viewport |
| the edit channel | slug + page + viewport |
| a published revision | slug + page + revision + viewport |
| any URL | url + viewport |

`screenshot` takes one. `compare` takes two, in any combination — which is what makes "compare
anything to anything" true rather than aspirational: draft against reference is the reproduction
case, draft against published revision is *what did I just change*, revision against revision is
*what changed between releases*, and reference against reference is a competitor over time.

**Shooting a published revision needs revisions to exist** — [[REQ-149]].

## Operations (provisional)

| Operation | Effect |
|---|---|
| `capture_site(url)` | fetch and capture; returns a reference bundle id |
| `list_references()` / `describe_reference(id)` | what has been captured, and what is in it |
| `screenshot(source)` | an image the model can **see** |
| `compare(a, b)` | perceptual verdict, ranked regions, crop pairs |
| `check_fidelity(actual, reference)` | `gate`'s three-way reconciliation and its verdict |

`check_fidelity` is `1c gate`, and it is included because it is the only verb that catches the
failure the other two cannot: `l1-gate` is blind to colour, font and media by design, and
`values-diff` can only compare elements present in **both** manifests — so a page whose capture
missed its imagery passes both while the perceptual eye reads 80% of pixels wrong. `gate` makes
that **disagreement** the finding, and names the likely cause (`capture-incomplete`,
`reproduction-wrong`, `unexplained-disagreement`). An assistant that could compare but not
reconcile would confidently work value deltas against a reference that was never valid.

## The hard part: an image has to reach the model

This is the risk in the ticket and it should be settled **before** the operations are built.

The Anthropic wire format accepts a `tool_result` whose `content` is an array of blocks including
`{type: 'image', source: {type: 'base64', …}}`, and `api_tools.js:407` passes the operation's
output straight through — **so the transport does not block it.** What is undecided is whether a
Toolbox operation may *declare* an image return at all: every `returns` in `l1-surface.json` names
a JSON shape, and the surface declaration format has no vocabulary for bytes.

That is likely an upstream `@lagrangefoundry/ai` change, exactly as [[REQ-103]] was for the
Workers export rung. Settle it first.

**A tool that returns "a screenshot was taken, it is at this key" and nothing the model can look
at satisfies none of this ticket.** The point is the eyes.

## Grant and safety

- `capture_site` fetches an **arbitrary URL on the operator's behalf**. That is an SSRF surface
  and [[DOC-2]] applies: refuse private and link-local address space, cap redirects, cap response
  size, cap time. The URL and the refusal are journalled.
- Everything a capture returns is a third party's content arriving inside a tool result. The L1
  surface already marks reads `provenance: 'untrusted'`; this is more so, and a captured page's
  text must never be able to read as an instruction.
- The consultant grant is the whole surface: this is the role that builds sites, and looking at
  what it built is not a privileged act. It remains ungranted `Publish` and `ManageAssets`, which
  this ticket does not touch. (This body was written when the role was called the *caretaker*;
  [[REQ-174]] renamed it to the **consultant**, and `consultant` is the only name written
  anywhere now. Read every "caretaker" below as the consultant.)

## Acceptance criteria

1. A second toolbox surface, declared as data and implemented against the store, registered
   alongside the L1 surface rather than merged into it.
2. The picture-source vocabulary resolves all five sources through one function, and every
   operation takes it — no verb carries its own `--ref`-shaped parameters.
3. `screenshot` returns an image the model can actually see. A UAT asserts an image content block
   reaches the backend; asserting that a key or a URL was returned does not satisfy this.
4. `compare` of any two sources returns the verdict `1c diff` returns for the equivalent CLI
   invocation.
5. `check_fidelity` reproduces `1c gate`'s reconciliation, including which of its five verdicts it
   names (`pass`, `structural-failure`, `capture-incomplete`, `reproduction-wrong`,
   `unexplained-disagreement`).
6. `capture_site` is refused for private address space, over-large responses and redirect loops;
   each refusal is journalled with the URL.
7. The consultant is granted the surface and its manual says what it can now do.
8. No operation on this surface can change a site — asserted, not asserted-by-inspection.

## Origin

[[CHAT-27]]. Last of four, and the only one the operator asked for directly; the other three are
what it stands on.

---

## Field evidence: the scope of "cannot see" is wider than this ticket assumed

*Appended from [[CHAT-35]], 2026-09-02 — the first client-shaped session run
against the product. Restored: this section was overwritten by a body rewrite
fourteen seconds after it was appended, and is reinstated here verbatim apart
from its closing note, which had gone stale.*

This ticket frames looking as a **fidelity** capability: capture a reference,
shoot the draft, compare, judge. That framing is right and it is not wide
enough. The session showed the assistant needs to see in order to do ordinary
authoring work, before any question of fidelity arises.

The operator uploaded a hero image and asked for a placeholder site. The
assistant placed it as a large standalone block. The operator's objection was
not about fidelity to a reference — there was no reference — it was that the
image had been *composed* as a backdrop and was being used as a subject:

> "This image was created to be a background image that the hero text would
> layer on top of... loading up this page it looks weird, even at a
> three-quarter sized browser window all I see is my background image."

The judgement required is *backdrop or subject?* — and it is unanswerable from
`{id, src, kind, onDisk}`, which is all `get_asset` returns. The assistant said
so itself, and named the two things it would need: what the image looks like,
and whether it is meant to sit behind something.

**The capability already exists and is pointed elsewhere.** `describe.ts` runs
`claude-opus-5` over every uploaded image at ingestion (REQ-163) and writes a
composition description — *"blue daylight comes through an arched gothic window
on the right"* — into the **material ticket body** for retrieval. The assistant
had that description available by search, did not think to look for it, and told
the operator that its alt text had been written by whoever uploaded the file.
So there are three distinct failures stacked here, and only the first is this
ticket's:

1. No image reaches the assistant's context. (This ticket.)
2. The description that does exist is not attached to the asset, so
   `get_asset` cannot return it and nothing points from the file to the words
   about it. Cheap to fix and independent of the fidelity surface.
3. Nothing prompts the assistant to ask the backdrop-or-subject question when
   an image arrives.

**Status note, updated.** The original note here flagged that this ticket was
still `draft` behind a four-ticket dependency chain, and asked whether (2) should
be scheduled ahead of it. That is now moot for (1): REQ-154, REQ-155, REQ-156 and
REQ-149 have all landed and the fidelity surface is built, so an image does now
reach the assistant's context. **(2) and (3) remain open and are not in this
ticket.** `describe.ts:107-118` names this ticket as one of the two places the
duplicate vision path gets deleted — that deletion is *not* done here, so the
duplication it accepts stays open until (2) is scheduled. Both belong in their
own tickets.

---

## Decisions (design session, 2026-09-02)

The four tickets this stands on have all landed, and they landed further than this body assumed.
`apps/control-app/src/shot.ts` already gives the Worker `shotUrl` and `shotPreview` and says in its
own header that exposing them belongs here; `capture/capture.ts` takes an injected
{@link ReferenceStore} and `driverFactory` and has no `node:fs` in its import graph;
`perceptual-core.ts` was split from `perceptual.ts` so the maths imports into an isolate, and
`png.ts` is a pure-JS codec. So none of the "does this run in workerd" risk is live any more.

### 1. The image reaches the model inside the tool loop, with no upstream change

**The transport was already open and the ticket's "settle it first" is answered by reading the
code rather than by changing it.** This host registers its tools as closures
(`host-core.ts`, `new lib.Tool(name, …, (input) => box.run(name, input))`), and upstream's
`ToolSet.run` returns a closure handler's value **unmodified** — only the *Toolbox* path
stringifies. So a handler that returns an array of Anthropic content blocks has them carried
straight through `ToolOutcome` → `AnthropicWire.record` → `content: [{type:'image', …}]`.

That is strictly better than the alternative considered — returning a handle and having the host
attach the image to the *next* turn's user message via the surface upstream REQ-111 widened.
That alternative works too, but the image would only arrive after the model had already ended its
turn, so "shoot, look, adjust" would cost a turn per look. Inline keeps the loop inside one turn,
which is the loop [[DOC-13]] §6 is about.

`screenshot` therefore returns **two blocks**: a text block naming what was shot and at what size,
and an image block carrying the bytes. The text block is what makes a picture self-describing in a
transcript that no longer holds it (below).

### 2. The cost of inline is transcript weight, and it is bounded by capping the image

The same value the model sees is also yielded as `toolEvent(meta.output)`, and the manager appends
that as a `tool` record — which is a CONTENT kind, so it is drained to the durable session
transcript and carried forward on recycle. Upstream redacts images in `turn_start` and has no
equivalent for tool records, so an uncapped screenshot would put megabytes of base64 into the
session file and into every recycle's carried context.

Two answers, both here rather than upstream:

- **Every image this surface returns is downsampled to a longest edge of 1024px** before it becomes
  a block, and is refused if it still exceeds a declared byte ceiling. Anthropic downscales above
  ~1568px anyway, so the cap costs no fidelity the model could have used, and it bounds what any
  one call can put in the transcript.
- **`meta.output` is stripped of image data before the event leaves `streamPrompt`**, so the
  operator's browser is never sent the base64 twice over SSE. The text block survives, so the
  activity line still says what was shot.

The remaining exposure — capped base64 in the durable transcript — is recorded as the upstream
follow-up this ticket does not take: a `tool`-record redaction shaped exactly like the one
REQ-111 already built for `turn_start`.

### 3. Five picture sources, and the fifth is built rather than dropped

Four of the five resolve against what already exists: a URL and a captured reference directly, and
the draft and edit channels through `shotPreview`, whose `PreviewChannel` is already
`'draft' | 'edit'`. The fifth — a published revision — had nothing behind it, because
`PreviewRenderer` reads `loadDraft` and `previewOriginResolver` refuses any channel that is not
`draft` or `edit`.

It is built here instead of dropped: `SiteStore.readRevision` returns a frozen `StoredSnapshot`,
so a `rev-<id>` channel renders that snapshot through the same `renderSiteFiles` every other
channel goes through. **A revision's assets come from the snapshot's own bytes, not the draft's** —
a revision that pointed at today's logo would not be a picture of that revision.

### 4. The picture source is one declared `param_type`, validated by the declaration

The vocabulary is a single `object` param type with a declared `keys` set, which upstream's
declaration format already supports end to end: `validateParams` enforces the keys and their
enums, and `wireProperties` projects them into the tool's JSON schema with
`additionalProperties: false`. So "one picture source, resolved in one place" is enforced by the
declaration rather than by a convention each operation re-implements, and the model is *shown* the
shape rather than refused for guessing it wrong.

### 5. The surface composes as a list, not a second named slot

`createL1Toolbox` takes `knowledgeSurface` as a **named slot**, not the list this body assumed.
Generalising it to `extraSurfaces: {surface, granted}[]` is the change that makes AC1's "registered
alongside rather than merged into" true; the knowledge surface becomes the first entry in that list
and nothing about it changes.

The fidelity grant is **local**, so it is written in `instances.json` beside the L1 grant. The
knowledge grant travels with its surface because its two scope axes must name the same set; this
one has no such coupling, and putting it in the same place as every other local grant is what keeps
it reviewable.

### 6. SSRF is enforced at the driver's request seam, not only on the typed URL

A pre-flight check on the URL the model supplied cannot see a redirect to link-local space, and the
browser follows redirects itself. `shotPreview` already proves the driver can answer requests
per-request (`driverFactory({ origin: resolver })`), so that is where the guard belongs: every
navigation is checked, not just the first. The URL, the viewport and any refusal are journalled
with the reason.

## Test approach

UATs land in `tests/test_UAT_FC_REQ-157_*.test.ts`, driving the real surface against injected
seams — a fake browser driver, an in-memory store — with nothing reaching the network.
The load-bearing ones assert what the *backend was handed*, not what the surface claims: that an
image content block reaches it (AC3), that a comparison verdict equals `1c diff`'s for the
equivalent invocation (AC4), that each of `gate`'s verdicts is reproduced (AC5), that a private,
oversized or looping URL is refused and journalled (AC6), and that no operation on this surface
moves the site's change counter (AC8).

---

## Behaviour the build settled

Six things the operations must do that fall out of the above as technical
consequence rather than being asked for directly. Written down because each is
asserted, and an assertion with no language behind it reads as drift.

**A comparison crops to the common rectangle.** A reproduction is rarely exactly
as tall as its reference, and refusing a comparison on that basis would fail on
the case the operation most exists for. Both sides are anchored top-left and
cropped to the overlap, and the result reports the `size` actually compared
rather than leaving the caller to assume it was either input's.

**The reference side follows the actual side's viewport.** A page can be right at
one width and wrong at another, so reading a desktop reference against a mobile
reproduction would manufacture a failure that is entirely the gate's own doing.
Whichever viewport the actual picture asked for is the one the reference is read
at.

**A missing ladder member falls back, and says so.** A bundle captured before the
viewport ladder existed still holds a full-page shot. Reading it beats refusing a
comparison the operator can plainly see is possible — but a comparison against a
fallback must never be mistaken for one at the right width, so the picture's
label names it as a fallback.

**The surface is bound to one site at construction**, exactly as the L1 surface
is. No operation takes a `slug`, and no picture names one. That is stronger than
a scope axis that refuses the wrong value: there is no value for a model to get
wrong, and it is the reason a picture of kind `draft` cannot be a picture of
somebody else's draft.

**Each of the five verdicts carries its own next step.** The verdicts are the
whole reason `check_fidelity` exists rather than `compare` alone, and each
implies a *different* action — so they must be distinguishable in what they tell
the reader to do, not merely distinct as values.

**Downsampling averages rather than samples.** Reducing to the 1024px edge by
nearest-neighbour would drop exactly the thin high-contrast detail — rules, one-
pixel borders, small type — that a fidelity judgement turns on. A box filter over
the source pixels is what makes the reduced picture honest about what was there.

---

## As built

### The surface

`fidelity-surface.json` declares six operations in one group, `SeeSite`, every one
`effect: read`. `fidelity-core.ts` implements them against the store and the browser seam and
carries no prose the model ever sees — the same split `toolbox-core.ts` holds to.
`createL1Toolbox` now takes `extraSurfaces: {surface, granted?}[]` instead of the single
`knowledgeSurface` slot, and the knowledge surface became the first entry in that list.

**The grant is narrowed to the surfaces actually composed.** `instances.json` says what the
consultant may do; which surfaces exist is a property of the deployment. A Worker with no
`[browser]` binding, or a `1c` invocation with no server behind it, composes no fidelity surface —
and the Toolbox refuses to construct when a configuration names a surface nobody registered. So
`createL1Toolbox` filters the grant down to the composed set. The filter only ever removes keys,
so it cannot widen a grant.

### The picture vocabulary

One `param_type` (`picture`) with a declared `keys` set, so `validateParams` enforces the keys and
their enums and `wireProperties` projects the shape into the tool's JSON schema with
`additionalProperties: false` — the model is shown the shape rather than refused for guessing it.
Which field a `kind` requires is a cross-field rule no per-key declaration can express;
`resolvePicture` enforces that and names the missing field.

All five sources resolve through `resolvePicture` in `picture.ts`. The fifth was built rather than
dropped: `PreviewRenderer` gained a `rev-<id>` channel that renders a frozen `StoredSnapshot`
through the same `renderSiteFiles`, with **assets read from the snapshot's own bytes** — a
revision that pointed at today's logo would not be a picture of that revision.

### The image reaches the model inside the tool loop

`screenshot` returns `[{type:'text'}, {type:'image'}]` and upstream carries it through unchanged.
The UAT asserts what the **backend was handed**, driving upstream's real `ToolSet`,
`runToolLoop` and `AnthropicWire` through the SDK-free `/core` entry point.

Images are downsampled to a 1024px longest edge by a box filter (`downsampleRaster`, beside
`cropRaster` in `perceptual-core.ts`) and refused over a byte ceiling. `streamPrompt` strips image
data out of `meta.output` before the event reaches the SSE stream, so the operator's browser is
never sent the base64 a second time.

### Three modules had to be split, and it is the same split each time

The fidelity surface runs in workerd, and REQ-146's boundary test named every violation the moment
it did. Each fix is the seam `perceptual-core.ts` already established — the pure half of a module
that was also a CLI command:

- **`gate-core.ts`** — the perceptual floor, the coverage proxies, `reconcileGates`, and
  `cmdL1Gate` (moved from `repro.ts`). `gate.ts` is `1c gate` and is now a *caller* of the
  reconciliation rather than its owner, which is what makes "reproduces `1c gate`'s
  reconciliation" a property of the build rather than of anyone's care.
- **`responsive-table.ts`** — the N-way table builder. `l1/fold.ts` imports it, so the
  `1c responsive-diff` command's `node:fs` graph was reaching every consumer of the L1 fold.
- **`capture/pipeline.ts` is inject-or-fail** — it defaulted four driver seams to Playwright,
  which REQ-155 named as needing this rule and did not apply. The Node convenience is relocated to
  `capture/index.ts`, the barrel that is Node-only by design and says so, so every `1c capture` and
  every real-browser test calls exactly what it always did. `ReconcileInput.perceptual.regions` was
  widened from the CLI report's region type (which carries crop-file paths) to something countable,
  because counting is all `reconcileGates` ever did with it.

Three `../l1` and `../cli/capture` barrel imports became deep paths for the same reason — including
two `import type`s, because REQ-154's bundle check follows every local import regardless of whether
TypeScript erases it.

### Safety

`egress-guard.ts` classifies a URL (scheme, credentials, private/loopback/link-local space
including IPv4-mapped IPv6) and carries the redirect and byte budgets for one capture. It is
installed at **both** drivers' request seams, so it sees every redirect hop and every subresource —
a pre-flight check on the typed URL cannot. `capture_site` also pre-flights, so an obviously bad
address is refused without leasing a metered browser and without three retries. Refusals are
returned to the model under the declared `REFUSED` code and carried in the Toolbox's audit record
with the URL. What it honestly does not do is defeat DNS rebinding: nothing inside workerd can
resolve a name to check it.

### Both hosts

The Worker composition root is `apps/control-app/src/shot.ts` — the file whose own header said this
belonged to REQ-157 — with `leasedDriverFactory` binding one metered session to one driver's
lifetime. Node is wired too: `GlobalOptions.origin` carries what the process is called from
outside itself, which the builder sets per request from the `Host` header, because an ephemeral
port is not knowable until `listen` has bound one. Absent an origin there is no fidelity surface,
which is the honest answer — without one there is nowhere for a browser to navigate to see the
draft.

### Evidence

`tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts` — 27 UATs. The declaration is checked by the
framework's own validator; the Toolbox, the operations, the stores, the diff maths, the
reconciliation and the egress policy are all production code. One thing is doubled — the browser —
and the pictures are real PNGs, because half of what is under test is what happens to pixels.

Three suites belonging to other tickets were updated where this change made their assertions
observe something new, rather than weakened: REQ-126's and AC1071's author-time validation now
validate both declarations together (the instance config names both), and AC1058's offered-tool
set is now the union of the two declarations' operations — still derived from the declarations
rather than written out, which is the property that assertion exists to hold. The AC3 UAT drives
the shared model double (`calls`/`says`) rather than transcribing the wire protocol a second time,
which BUG-39 forbids.

### Suite state

`node`: **2064 passed, 1 failed** — `test_UAT_AC960` (bug32), which names
`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`, a file this branch does not touch.
Pre-existing. `workers`: **203 passed, 0 failed**.

### Not taken, and named so it is not mistaken for done

The durable transcript still holds the capped base64: the manager appends the tool event as a
`tool` record, which is a CONTENT kind, so it drains to the session file and is carried across a
recycle. Upstream redacts images in `turn_start` and has no equivalent for tool records. That is
the follow-up, shaped exactly like the redaction REQ-111 already built; the cap here is what keeps
it bounded until then.