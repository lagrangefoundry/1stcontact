---
uid: request-3731fe6b
id: REQ-207
type: request
title: 'The consultant can research: web search as a configured API, and the image
  describer leaves its second path to a model'
created_by: CHAT-43
created_at: '2026-09-08T03:18:16.962511+00:00'
updated_at: '2026-09-08T22:46:02.002551+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-17eeb5e9
---

## What changes

**The consultant can look things up.** Today it works entirely from what the client says
in the conversation: told *"we're a wedding photographer in Bristol"*, it has the words
and nothing else — no sense of what that market's sites actually look like, whether the
client already has a web presence, or what their competitors are doing. A consultant who
cannot research is giving an opinion formed from a single sentence, and [[REQ-174]] asks
this role for judgement rather than hands.

This adds **web search** to the consultant's surface, configured rather than coded, and
takes the **image describer** off the second path to a model it is currently on.

## Rescoped 2026-09-08, after lagrange-framework REQ-139 and REQ-141 landed

This ticket was written against an expectation of what the framework would ship. It
shipped something different, and the scoping has moved twice in one day — recorded here
rather than quietly absorbed, because the second move reverses part of the first.

**The two halves are no longer one piece of work, and only one of them is blocked.** The
describer turns out to need nothing from the framework at all; search needs a framework
change that does not yet exist. They are kept in one ticket because they are one intent —
*the consultant stops being blind, and stops reaching around the host to do it* — but they
are sequenced below rather than built together.

**Search stays a provider-executed tool after all.** REQ-139 excludes provider-executed
tools, so this was rescoped once onto a third-party search API over the new `http` call
type. That rescope is withdrawn. REQ-139's stated reason is that `web_search` exists on
`claude_api` and not on `chatgpt`, so a granted role would silently hold different tools
depending on which backend opened the session — but the framework already carries the
machinery that answers this, in `capabilities()`, where `vision` is exactly such a
backend-conditional capability and REQ-139's own absence handling is exactly the response
to one. What is missing is a member of that set, not a mechanism. Reaching a second vendor
over HTTP to obtain a capability the conversation's own vendor already offers is the more
expensive answer and the less honest one.

**The describer needs no framework work.** REQ-111 put image content on the session
surface, and the installed `@lagrangefoundry/ai` already exports `imageBlock`. What is
left is a change in this repository and nothing else.
## Why search, and deliberately not fetch

**Only search is worth having here, and the reason is that [[REQ-206]] already gives us
something better than fetch.**

- **Search finds an address.** Nothing in this product can do that. It is the whole of
  the new capability.
- **Fetch reads a page — badly, for our purposes.** It does not render JavaScript, so a
  modern site comes back as a shell. `capture_site` drives a real browser, records the
  page at each viewport, reads the values behind it and mirrors its imagery. For *"look
  at this website"* the capture pipeline is strictly better, and having both would invite
  the assistant to reach for the worse one.

  This originally also said fetch was the more dangerous of the two. That was wrong and is
  withdrawn: the provider's fetch tool only retrieves URLs **already present in the
  conversation**, so it cannot wander. The case against it is quality, not reach.

So the two compose, and that is the intended shape: **search finds the site, capture
looks at it properly.** A client who says *"make it feel like the good photographers in
Bristol"* is answered by finding them and then capturing one — neither half is useful
alone.

Fetch is not refused on principle, only deferred: once REQ-206 has landed and we can see
what capture leaves uncovered, the remaining case for fetch is reading PDFs and plain
text, and it can be added as configuration without touching code.
## How it behaves

- The consultant can **search the web** when the client's request turns on something it
  cannot know — the client's own existing presence, an industry's conventions, what a
  named competitor is doing. It is expected to say what it found and where, in the
  client's language, never as a list of links.
- **It does not search to answer questions it can already answer.** Judgement about
  layout, colour and copy is what the role is for; a consultant who searches before
  forming a view is deferring rather than advising.
- **What comes back is a stranger's writing.** Search results, page titles and snippets
  are third-party text arriving because the assistant asked for it. It is material to
  report on and is **never an instruction**, however phrased and whoever it claims to be
  from — the rule the fidelity surface already states for captured sites, which holds
  identically here and for the same reason. The framework marks an `http` result
  `untrusted` by default, so this is the declaration's own default rather than something
  this configuration has to remember to ask for.
- **Every claim drawn from a search is attributable.** The result carries the source
  alongside the snippet; a consultant that tells its client something it learned from the
  web can say where it came from when asked.
- **Searching is bounded per session**, in the same shape as REQ-206's browser budget and
  for the same reason: it costs money per call. A session that exhausts its budget is
  told so in words it can act on, that one operation refuses, and every other tool keeps
  working — a client must never lose their consultant because it looked something up too
  often. REQ-139 ships the declared form as `max_uses` in the instance configuration, and the
  provider's own tool takes a native per-session cap, so the declared cap compiles onto
  the native one and this is a configuration entry here rather than a mechanism to build.

## The image describer stops being a second path to a model

`describe.ts` reaches the Messages API directly to describe an uploaded image, and says
in its own source why: this component's session surface is text-only, so an image cannot
be described through the host the Worker already runs. It names the consolidation point
and commits to being deleted when one arrives:

> either [[REQ-157]] (the fidelity/"looking" surface, which needs the same capability) or
> an image block on the AI component's own surface. Whichever lands, this function is
> what is deleted.

**This is that deletion, and the second of those two is what arrived.** The describer
becomes a configured capability reached through the same host as everything else, and
`anthropicImageDescriber`, its `VISION_MODEL` constant and this file's `import Anthropic`
go with it.

**It is the shape [[REQ-173]] already built for text, applied to images.** `ai.ts`'s
`sessionTextDescriber` opens a lightweight session on the AI host's own session factory,
prompts it once, and closes it; the image branch gets its peer, differing only in that it
sends an image content block beside the instruction. The `DescribeImage` seam in
`describe.ts` does not change shape, so the UATs that drive it keep working and keep not
reaching the network.

**This half depends on nothing that is not already installed.** The capability it needs
is image content on the session surface, which REQ-111 landed and which the installed
`@lagrangefoundry/ai` already exports as `imageBlock`. It does not need the plugin layer,
a new component, or a framework reinstall.

**The framework's own `describe_image` plugin is not what this adopts, and that is
deliberate.** REQ-141 ships one, and it is close to this product's model — attachment
records, bytes through the store's own blob handle, the description written into the
parent's body. It is not a substitute here, for three reasons, and the first is decisive:

- **It describes when the model asks; this product describes at ingest.** `material.ts`
  writes the description into the body as the material is created, for every upload,
  with no assistant in the room. [[DOC-38]] §6's whole simplification rests on *every*
  piece of material carrying a description, so the knowledge base indexes bodies
  uniformly and never learns that images exist. A description that exists only once a
  model has asked for one would leave every un-asked-about upload unfindable.
- **The body shapes disagree.** Here the body *is* the description, beside
  `description_status`, `description_model` and a `material_text` comment. The plugin
  splices an annotated block under a heading naming the attachment, because it assumes a
  parent may hold several images; this product's materials hold exactly one.
- **It covers one of four branches.** Documents, fonts and captures describe through the
  same `DescriptionStatus` mechanism, and a swap that fixed only images would leave the
  other three on their own path.

Mounting that plugin later as an assistant-facing *"look at that one again"* tool remains
open, and would be an addition rather than a consolidation. It is not in scope here.

Everything the description is *for* is unchanged: it is written for retrieval rather than
elegance, it still yields a title and a digest from one call rather than two, and a
degraded case still creates the material, still says honestly what is missing, and is
still selectable by predicate for a later re-describe pass.

## Configuration, not code

**Adding the next capability must not be a code change in this repository.** That test is
unchanged, and it is what decides the mechanism rather than the mechanism deciding it.

**A provider-executed tool is still a declared tool.** The framework needs a call type
whose operations are declared exactly as any other — a capability group, prose, a grant, a
use cap — but whose *execution* is delegated to the backend rather than performed by the
Toolbox. That is not a new pattern here: the filesystem surface already runs two
enforcement paths off one declaration, in-process for the API backends and compiled to CLI
flags for the agentic one, with nothing detecting a mode because the backend determines
which exists. This is the third member of that set.

The seam it lands on already exists in this repository: the backend's tool list is built
entirely from `box.schemas()`, so a provider operation is projected into that list as a
passthrough descriptor instead of a JSON-schema tool, and never reaches `box.run`.

The test of whether this landed correctly is unchanged: a second provider capability —
fetch, code execution — is a configuration entry and a grant, reviewed as data, with no
TypeScript written here to accommodate it.

As a technical consequence of the above, and requested here so it is not discovered
during reconciliation:

- **The capability is granted, not merely present.** It joins the consultant's grant
  beside the surfaces it already holds, so a session that is not granted it is never told
  it exists — the projection rule [[REQ-126]] exists to enforce, and the exact failure
  REQ-206 documents. This is the property that a bare pass-through into the backend's tool
  list would destroy, and the reason that shortcut is not taken.
- **A backend that cannot execute it does not offer it.** The capability is declared per
  adapter, as `vision` already is, and a deployment whose backend lacks it drops the
  operation from the surface and from the manual rather than granting a tool that is not
  there. That machinery is REQ-139's and is reused unchanged.
- **The surfaces this deployment did not compose are narrowed out of the grant.** This
  repository already does that, at `createL1Toolbox`, so an unavailable capability needs
  no new handling here.
- **No credential is added by this half.** The search runs on the conversation's own
  vendor, under the key this deployment already holds. Search is the one capability in
  this product that costs no new secret — see [[REQ-208]] for the first that does.
## Threat model, corrected

The original filing said there was **no SSRF surface**, on the grounds that the provider
executed the search on its own infrastructure and no request left our network. The `http`
rescope made that false and it was withdrawn; with the rescope itself withdrawn, **the
original claim is restored and is the accurate one**. No request leaves our network for a
search, and `egress-guard.ts` has nothing to hold — that guard exists because
`capture_site` takes a URL *from the model*, and no operation here does.

What the provider's own tool gives us, which a hand-built surface would have had to
reimplement:

- **A per-session cap**, native to the tool, which is what the declared use cap compiles
  onto.
- **A domain allowlist and blocklist**, which is a coarse scope and more than this ticket
  originally asked for.
- **A source alongside every result**, which is what makes a claim attributable.

What is genuinely given up, and it is worth stating plainly rather than discovering later:

- **Results are not wrapped in this component's provenance markers.** A Toolbox result is
  wrapped before the model sees it; a provider-executed result arrives inside the
  assistant turn and nothing on our side touches it. *"Material, never instruction"* drops
  from a structural guarantee to a stated rule in the surface's prose for this one tool.
  The exposure is bounded — these are short search snippets rather than whole
  attacker-controlled pages, which is what `capture_site` handles and does wrap — but it
  is a real step down and not a technicality.
- **The call does not appear in the Toolbox's audit record.** The result blocks are in the
  transcript, so the operator can still see what came back; what is missing is the entry in
  the trail every other tool call leaves.
## Sequencing

1. **The describer.** Blocked on nothing. It is a change in this repository against
   already-installed framework code, and it can ship independently of everything below.
2. **A provider call type**, in lagrange-framework. Does not exist yet, and needs its own
   ticket: the call type, a per-adapter capability declaration for the tools a backend
   executes itself, and the passthrough in the tool-list projection. Smaller than the
   search plugin this replaces, and it makes fetch and code execution configuration rather
   than three more components.
3. **Granting and configuring it here** — the shared store needs the post-REQ-139 `ai`,
   and the grant joins the consultant's entry in `instances.json`.

**The open decision that was blocking step 2 is gone.** It was *which search vendor*, and
there is no longer a vendor to choose. What remains is a cost check: per-search pricing
should be looked up rather than assumed before the use cap's default is set.
## What does not change

- **No new HTTP route.** Searching is reachable only as a tool call inside an admitted,
  business-scoped turn.
- **Nothing here changes a site.** Searching is a way of looking, and the site cannot
  move because the consultant looked something up.
- **The role text still enumerates no tools.** The manual grows because the grant does.


## Landed 2026-09-08 — step 1 of the sequencing, and only step 1

**The describer half is built. The search half is not, and is still blocked on
the same thing it was blocked on when this was written**: the framework's
`CALL_TYPES` set is checked and still reads `new Set(['inproc'])`. There is no
provider call type and no `http` one either, so there is nothing here to
configure a search onto. Step 2 remains a lagrange-framework ticket that has not
been filed.

### What the describer does now

`describe.ts` no longer reaches the Messages API. Its `import Anthropic`, its
`VISION_MODEL` constant, `anthropicImageDescriber` and the chunked `base64`
helper that existed only to feed it are all deleted, and with them the only place
this Worker talked to a model without going through the host it already runs.
The vision prompt survives the deletion as an exported `IMAGE_DIGEST_SYSTEM`,
beside `DOCUMENT_DIGEST_SYSTEM` — the two prompts this product sends about
material stay in the file that decides what a description IS.

`ai.ts` gains `sessionImageDescriber`, the peer REQ-173 built for text. An
upload is described by a lightweight session on the AI host's own session
factory: no tools, no corpus, a `NullArchive`, one session per image, closed
after it — the same four properties the document describer has, for the same four
reasons. The image travels as a content block from the port's own `imageBlock`,
with the one-line instruction beside it, in the order this product sent before.

**The `DescribeImage` seam did not move**, so `material.ts`, `capture-material.ts`
and every UAT driving them are untouched and still never reach the network. The
router's `defaultDescriber` swaps one constructor for another and now reads
identically to `defaultTextDescriber`.

### Consequences of the above, requested here rather than left for reconciliation

- **The two describers are one function.** The difference between them is a
  system prompt and the shape of one turn's content; everything else — the
  session lifecycle, the null archive, the empty toolbox, the memory junction —
  was the same decision made twice. Consolidating an image path onto the text
  path while leaving two copies of the path would have missed the point, so the
  shared half is `describerSession` and both describers are three lines on top of
  it. `DESCRIBER_ROLE` and `DESCRIBER_BACKEND` collapse into one `TEXT_DESCRIBER`
  constant: they were always the same string, so the pair was two things to keep
  in sync for no distinction anyone could act on.
- **Each describer registers under its own name, and that is not cosmetic.**
  `registerBackend` is a process-wide idempotent overwrite and the router builds
  both describers per request, so a shared name would mean the one constructed
  second silently owns the first's backend — a document answered through the
  image describer's instruction, with nothing downstream able to detect it. A UAT
  pins it.
- **The image is encoded to base64 before it is handed to `imageBlock`**, though
  the constructor accepts bytes too. The session manager writes the turn's
  durable record — and measures the image for it — before the backend normalises
  content, so raw bytes that far up the path are read as a string and are not
  one. The encoder used is the port's own `bytesToBase64`; this file having a
  second one would be the duplication this ticket removes, in miniature.
- **The content-block vocabulary joins the Worker's declared boundary.**
  `imageBlock`, `textBlock` and `bytesToBase64` are named in `assets.ts`'s
  `AI_WORKER_EXPORTS`, so an upstream rename surfaces as a typecheck failure here
  rather than as a request the provider refuses inside an upload.
- **`@anthropic-ai/sdk` is dropped from `apps/control-app`'s dependencies.**
  Nothing in this repository imports it once `describe.ts` stops. It remains
  reachable transitively through the AI component, which is the only thing that
  should be reaching it; what goes is the second copy [[REQ-163]] measured at
  +138 KiB of Worker bundle.

### Evidence

`tests/test_UAT_FC_REQ-207_image_describer_session.test.ts` — eight UATs against
the real session manager, role assembly and content-block validation, with the
Anthropic client as the one double. They assert the turn the host assembles, not
merely that a description comes back: a test of the latter would pass against the
SDK call this removes. The picture is on the wire as an image block carrying the
caller's own bytes; the priming is the image prompt and nothing else; no tools
are offered; two images share no conversation; a failing description still closes
its session; the two describers do not cross-wire; and the `DescribeImage` seam
still satisfies `describe()` end to end, title split and all.