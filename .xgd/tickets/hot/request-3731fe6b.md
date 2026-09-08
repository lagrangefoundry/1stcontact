---
uid: request-3731fe6b
id: REQ-207
type: request
title: 'The consultant can research: web search as a configured API, and the image
  describer leaves its second path to a model'
created_by: CHAT-43
created_at: '2026-09-08T03:18:16.962511+00:00'
updated_at: '2026-09-08T22:15:23.008199+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 3
  auto_merge_back: true
  needs_review: false
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
shipped something different, and in both halves the change is worth recording rather than
quietly absorbing.

**The two halves are no longer one piece of work, and only one of them is blocked.** The
describer turns out to need nothing from the framework at all; the search half needs a
framework component that does not yet exist. They are kept in one ticket because they are
one intent — *the consultant stops being blind, and stops reaching around the host to do
it* — but they are sequenced below rather than built together.

**Search is no longer a provider-executed tool, and that is a correction, not a
preference.** This ticket assumed the model's own vendor would run the search. REQ-139
rules that out for a reason that stands on its own: `web_search` exists on `claude_api`
and does not exist on `chatgpt`, so a role granted it would silently hold different tools
depending on which backend opened the session. That collides with the property the manual
exists to guarantee — that the model is told exactly what it has — and fixing it needs
capability negotiation of the kind the `vision` flag already performs. Until that exists,
search here is **a third-party search API reached over the framework's `http` call type**,
which is a change of mechanism and of threat model, both recorded below.

**The describer needs no framework work.** REQ-111 put image content on the session
surface, and the installed `@lagrangefoundry/ai` already exports `imageBlock`. What is
left is a change in this repository and nothing else.

## Why search, and deliberately not fetch

**Only search is worth having here, and the reason is that [[REQ-206]] already gives us
something better than fetch.**

- **Search finds an address.** Nothing in this product can do that. It is the whole of
  the new capability.
- **Fetch reads a page — badly, for our purposes.** A plain HTTP fetch does not render
  JavaScript, so a modern site comes back as a shell. `capture_site` drives a real
  browser, records the page at each viewport, reads the values behind it and mirrors its
  imagery. For *"look at this website"* the capture pipeline is strictly better, and
  having both would invite the assistant to reach for the worse one.

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
  often. REQ-139 ships this as `max_uses` in the instance configuration, spent only once a
  call has passed every other gate, so this is a configuration entry here rather than a
  mechanism to build.

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

**Adding the next API must not be a code change in this repository.** That test is
unchanged, and REQ-139 is what makes it passable: a search API is a **data-only plugin** —
a declaration and an `http` binding, with the framework's generic caller as its executor
and no code shipped on either side. The test of whether this landed correctly is that a
second API — a maps lookup, a companies register, a stock-photo search — is a
configuration entry and a grant, reviewed as data, with no TypeScript written here to
accommodate it.

**The plugin is a framework component, not a file in this repository.** [[DOC-25]]'s
ownership rule lets the framework ship a plugin when it wraps a public third-party
contract, which a published search API is, and every plugin is packaged as its own
component so its boundary is a declared dependency rather than a convention. This
repository installs it and configures it; it does not author it.

As a technical consequence of the above, and requested here so it is not discovered
during reconciliation:

- **The capability is granted, not merely present.** It joins the consultant's grant
  beside the surfaces it already holds, so a session that is not granted it is never told
  it exists — the projection rule [[REQ-126]] exists to enforce, and the exact failure
  REQ-206 documents.
- **Credentials are referenced from configuration, never written into it.** The host
  supplies the secret. A configuration file that *can* hold a key is one that will
  eventually be committed with one in it. REQ-139 enforces this structurally: a plugin
  names the credentials it needs and a declaration carrying an origin or a secret is
  refused by name.
- **A deployment that cannot supply the capability simply lacks it.** No key, and the
  plugin drops out of the surface and out of the manual, along with the configuration
  written for it. The session still opens, the transcript still replays, and nothing
  throws on first use — the same absent-and-fine shape as a missing API key, and the
  behaviour REQ-139 ships as `resolvePlugins`.
- **The surfaces this deployment did not compose are narrowed out of the grant.** This
  repository already does that, at `createL1Toolbox`, for the same reason the framework
  drops an absent plugin's configuration — so an absent search plugin needs no new
  handling here.

## Threat model, corrected

The original filing said there was **no SSRF surface**, on the grounds that the provider
executed the search on its own infrastructure and no request left our network. With a
third-party API over the `http` call type **a request does leave our network**, so that
sentence is withdrawn and replaced with what is actually true:

- **The destination is fixed at construction and the model cannot influence it.** The
  origin is supplied when the surface is built, path slots are percent-encoded including
  `/`, and query fields are serialized rather than concatenated. There is no hole for a
  model-supplied URL, which is the difference from `capture_site` and the reason
  `egress-guard.ts` has nothing to hold here: that guard exists because `capture_site`
  takes a URL *from the model*, and this operation never does.
- **Redirects are off, and same-origin only if ever enabled.** A fixed origin is a lie
  after one uncontrolled hop.
- **The response is capped and content-type checked before it is parsed**, and is marked
  `untrusted` before it reaches the model.

## Sequencing

1. **The describer.** Blocked on nothing. It is a change in this repository against
   already-installed framework code, and it can ship independently of everything below.
2. **The search plugin**, in lagrange-framework. Does not exist yet. It would be that
   layer's first data-only plugin — both plugins REQ-141 shipped are component-bridged,
   so the `http` path currently has tests and no consumer.
3. **Installing and configuring it here** — the shared store needs the post-REQ-139 `ai`
   before any plugin resolves, and a new component needs its re-export shim in
   `assets.ts` for the Worker rung.

**One open decision blocks step 2: which search API.** It fixes the declaration, the
credential name and the result shape, and nothing below it can be written until it is
made.

## What does not change

- **No new HTTP route.** Searching is reachable only as a tool call inside an admitted,
  business-scoped turn.
- **Nothing here changes a site.** Searching is a way of looking, and the site cannot
  move because the consultant looked something up.
- **The role text still enumerates no tools.** The manual grows because the grant does.
