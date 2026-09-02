---
uid: request-3f8737f2
id: REQ-157
type: request
title: 'The fidelity surface: the assistant can look, compare and judge'
created_by: xgd
created_at: '2026-08-20T23:16:44.004000+00:00'
updated_at: '2026-09-02T20:50:28.796963+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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
against the store, granted per role. `createL1Toolbox` already takes a **list** of surfaces
(`host-core.ts:515`) and the knowledge surface is the working precedent for a second one.

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
- The caretaker grant is the whole surface: this is the role that builds sites, and looking at
  what it built is not a privileged act. It remains ungranted `Publish` and `ManageAssets`, which
  this ticket does not touch.

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
7. The caretaker is granted the surface and its manual says what it can now do.
8. No operation on this surface can change a site — asserted, not asserted-by-inspection.

## Origin

[[CHAT-27]]. Last of four, and the only one the operator asked for directly; the other three are
what it stands on.
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