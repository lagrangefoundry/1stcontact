---
uid: request-ba3e3fba
id: REQ-134
type: request
title: An image generation component — one internal API, several providers behind
  it
created_by: xgd
created_at: '2026-08-12T00:41:34.963160+00:00'
updated_at: '2026-08-13T21:20:13.773513+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-bf3e29de
---

# An image generation component — one internal API, several providers behind it

## Problem

A site needs pictures. Today the platform has no way to make one, and the only path is an asset the
client brings. [[CHAT-22]] settled the product position: **photographic** assets should be the
client's own (their premises, their product, their team — no generator beats a real photo of the
thing being sold), but **non-photographic** assets — atmospheric hero backgrounds, textures,
scrims, illustration, iconography, pattern — have no real-world subject to photograph, and a client
told to go and find those brings stock.

That is the failure this ticket exists to prevent. [[DOC-31]] Checklist A names
"obviously-stock imagery" as a leading template-DNA tell, and [[DOC-17]] puts image treatment at the
head of the expensive-versus-template list. A builder that cannot make an image is a builder whose
default output looks templated in exactly the way the audit says clients detect.

It also breaks the format promise. [[DOC-32]] §4.2.4 fixes the load-bearing claim as a single
real-time session that ends with a live site — **no brief to write and no hand-off**. "Now go and
generate your images somewhere else and come back" is a brief and a hand-off, and it converts a
finished session into homework.

**The Claude API cannot do this.** Claude reads images and writes text; there is no image
generation endpoint and Anthropic ships no image model. So this is necessarily a *second* provider
relationship, and the one thing we should not do is hard-wire the platform to whichever provider we
pick first. Per-image prices spread ~30× across providers today ($0.005–$0.24) and the tiering
changes every few months; the cheap-draft tier is the main cost lever (see §Cost below) and it is a
per-provider feature. Provider choice must stay a configuration decision, not an architectural one.

## Shape: the `ai` component's pattern, applied

This is the same problem the `ai` component already solved — one consistent internal interface over
several vendor APIs — so it should be the same shape, and for the same reasons. Mirror it
deliberately:

| `ai` component | This component |
|---|---|
| `backend.js` — the `Backend` port + registry | `backend.js` — the `ImageBackend` port + registry |
| Duck-typed documented shape, not a base class to subclass | same |
| `registerBackend(name, factory, caps)` stores a **factory** | same — construction is lazy |
| `getBackend(name)` throws `BackendError` listing available names | `getImageBackend(name)` / `ImageBackendError` |
| `backendCapabilities(name)` answerable **without constructing** | same |
| `capabilities()` returns a frozen plain object | same |
| `backends/index.js` self-registers the built-ins on import | same |
| `api_tools.js` — provider-independent substrate shared by adapters | shared prompt/size/output/cost substrate |
| `conformance/fixtures.json` + runner — language-neutral corpus | same |
| `PUBLIC-API.md` generated, never hand-edited | same |

Three properties of that design are the reason to copy it rather than improvise, and each must
survive:

1. **A factory, not an instance, is registered.** Construction may throw on a missing prerequisite
   (an API key), so it happens at `getImageBackend` time — the caller gets a clear, actionable error
   exactly when it first tries to generate, never an import-time crash.
2. **Capabilities are registered beside the factory.** A host must be able to answer "can this
   provider do transparency?" *before* an API key exists, to decide what controls to offer.
3. **The port is thin; resilience lives inside each adapter.** Retry, backoff and provider quirks
   are the adapter's business, not the caller's.

### The port

A backend is any object exposing:

```
name: string
capabilities: Capabilities                              // static + instance
generate(request): Promise<GenerationResult>            // the primitive
```

and, capability-gated, optionally:

```
edit(request): Promise<GenerationResult>                // image-to-image / inpaint
```

`generate` is the primitive. Everything else is a convenience over it.

**A `request` is provider-neutral and carries no platform concepts**: prompt, negative/avoid
guidance, aspect ratio, a quality tier, `n`, an optional seed, optional reference images, whether
transparency is wanted. **A `GenerationResult` is bytes plus metadata** — for each image the raw
bytes, mime type, actual pixel dimensions, and a per-generation record of provider, model, tier and
estimated cost.

### What the port must NOT know

The `ai` component's discipline is that the component is domain-agnostic and the *host* binds it to
a site ([[REQ-127]] located that binding in exactly one place). The same rule here, and it is worth
stating because it is the easy thing to get wrong:

**No site, no slug, no page, no asset path, no `/assets/` vocabulary crosses this port.** The
component hands back bytes and a suggested filename stem. Writing those bytes into a site is the
host's job, and the host already has everywhere to put them: assets live in `draft/assets/`
([[DOC-12]]), an L1 `image.src` or a surface's `backgroundImageUrl` references them as
`/assets/<name>` ([[DOC-23]]), and `L1SegmentFieldOptions.assets` already offers a site's assets to
the picker as a closed list (`packages/site-schema/src/l1/edit.ts`).

**This is the reason the integration is small: the moment generated bytes land in `draft/assets/`,
they are indistinguishable from an uploaded asset.** The picker, the schema, the URL validation and
the renderer already work. Nothing downstream of the asset directory needs to change, and nothing
downstream should be able to tell how an image arrived.

### Capabilities

The `ai` component's axes (`streaming`, `interrupt`, `inject`, `persistentProcess`) do not transfer;
image generation has its own, and these are the ones a host actually branches on:

| Axis | Why a host needs it |
|---|---|
| `qualityTiers` | The draft/final split — the primary cost lever (§Cost). Absent on some providers. |
| `batch` | Can return `n > 1` per call, for a selection grid |
| `transparency` | Alpha channel — decides whether a provider can be offered for a logo or icon |
| `referenceImages` | Accepts input images for style or subject conditioning |
| `editing` | Image-to-image and masked edit — gates the optional `edit` method |
| `seed` | Reproducible re-generation |
| `aspectRatios` | The set actually supported, so a host never offers a ratio that will fail |

### Backends to build

**`openai`** (gpt-image) — the one named in the request. Strong instruction-following, supports
transparency and editing.

**`google`** (Imagen / Gemini image) — the second, chosen for a specific reason: it has a genuinely
cheap Fast tier alongside a standard tier, so the draft-then-final mechanism below is *real* on it
rather than simulated. It is also a fully independent vendor, which is the point of having two.

Both self-register in `backends/index.js`; both start from environment API keys and throw a clear
`ImageBackendError` when the key is absent. Anything else — FLUX, Ideogram, a local model, an
aggregator — is a later thin add, which is the whole argument for the registry.

**Deliberately not chasing text-in-image.** Some providers differentiate on rendering legible text
inside the picture. We should not use it and should not select a provider for it: text baked into a
raster is uneditable, untranslatable, invisible to search and unreadable by a screen reader. Real
text belongs in L1 where [[DOC-23]] puts it. Generated images here are backgrounds and imagery that
*text sits on*, never text itself.

## Cost, and why it is a design property rather than a footnote

Cost is per *attempt*, not per keeper — a usable image typically costs several rejected ones. That
makes the iteration ratio the multiplier on the entire spend, and two mechanisms in this component
attack it directly:

- **Draft-then-final.** Generate the selection candidates at the cheap tier; re-render only the
  chosen one at the good tier. On current pricing this is roughly a 3× reduction for free, and it
  matches how a person actually picks an image. This is why `qualityTiers` is a first-class
  capability and not a provider detail.
- **The platform writes the prompt, not the client.** The consult already holds the brand, palette,
  band and intent, so it can write a better prompt than the client would — and the ratio is mostly a
  prompting problem. The component's shared substrate must therefore accept structured context and
  assemble the prompt itself, the way `assemblePrimingPrompt` does for the `ai` component.

**Every generation is metered at source.** Each result carries provider, model, tier and estimated
cost, so the credit metering [[DOC-32]] §4.2.3 already requires has a real unit to count and does
not need to reverse-engineer spend from provider invoices. Enforcing a budget is the host's job, not
this component's — but it cannot be done at all if the component does not report.

**Refusals are normalised.** [[DOC-32]] §0.3 names content moderation as the likeliest route by
which human time re-enters the business, and generating imagery on a client's behalf is exactly
where that bites. Providers refuse in different shapes; the port must fold them into one so a host
can respond consistently and so refusal *rate* is measurable from day one rather than discovered
later.

## Acceptance criteria

1. Registering a backend under a new name makes it appear in the available-backends listing, and
   `getImageBackend` returns an instance from its factory.
2. Requesting an unregistered backend raises the component's error type, and the message names the
   backends that *are* available.
3. A backend whose prerequisite (API key) is missing raises that same error type with an actionable
   message **when it is fetched**, not when the module is imported.
4. A backend's capability descriptor is readable by name without constructing it — including when
   its prerequisite is absent.
5. A capability descriptor is frozen: a caller mutating what it received does not affect what the
   next caller reads.
6. Re-registering an existing name with no descriptor keeps the descriptor already there; a
   genuinely new name with no descriptor gets the all-false default.
7. Both shipped backends satisfy the same port: an identical request produces a result of the same
   documented shape from each, differing only where a declared capability differs.
8. A result carries, per image, the bytes, the mime type, the true pixel dimensions, and a record
   naming provider, model, tier and estimated cost.
9. A request for a capability the chosen backend does not declare fails before any network call,
   with a message naming the capability and the backend.
10. A provider refusal surfaces as the component's normalised refusal outcome — not as a transport
    error, and not as an empty success.
11. The deterministic, provider-free surface (prompt assembly, ratio and size normalisation, output
    normalisation, cost estimation, capability negotiation, refusal classification) runs from the
    conformance corpus with no network access.
12. No symbol in the public API names a site, slug, page, or asset path.

## Decisions to pin during implementation

- **Which repository this component lives in — settle this first, it is the largest open question.**
  The `ai` component lives in `lagrange-framework/components/ai` and is reached from here through
  `sharedModuleUrl`, out of an out-of-repo shared store. An image component is equally
  domain-agnostic and by that logic belongs beside it as a peer component. Against that: 1stcontact
  is its only consumer today, this ticket is filed in 1stcontact's store, and cross-store ticketing
  is not yet supported (`--store` reports the target's access kind does not allow it), so a REQ here
  cannot drive a build there. **Recommendation: build it in lagrange-framework as a peer component
  and re-file this REQ into that store.** Do not start the build until this is settled — it
  determines the language set, the test layout, and where `PUBLIC-API.md` is generated.
- **Dual-language, or JS only.** The `ai` component ships JS and Python peers held together by the
  conformance corpus. Nothing currently needs image generation from Python. Lean JS-only for v1 and
  keep the corpus language-neutral so a Python peer stays cheap — but a peer component in
  lagrange-framework may be expected to carry both.
- **Dependencies need explicit sign-off.** lagrange-framework's CLAUDE.md forbids installing a
  package without the operator's explicit go-ahead, and neither provider SDK is present in
  1stcontact today. Decide per backend whether to take the vendor SDK or call the REST endpoint with
  `fetch` — `fetch` keeps the dependency count at zero and keeps the component reachable from
  workerd ([[DOC-12]] §7 phase 2), which is a real argument, not just a convenience.
- **Bytes or URLs across the port.** Some providers return a short-lived URL rather than bytes.
  Normalising to bytes inside each adapter is simpler for every caller and removes an expiry
  footgun; it costs a fetch. Lean bytes, and say so in the port docs.
- **Tier vocabulary.** `draft`/`final` are ours; each provider's tier names differ and one has none.
  Pin the neutral names and the per-provider mapping, including what a provider without tiers does
  with a `draft` request.
- **Where a rejected candidate goes.** A selection grid produces images the client will not keep.
  Writing all of them into `draft/assets/` would pollute a git-tracked directory ([[DOC-12]] §3.1)
  with discards. Lean on a non-tracked staging area, with only the chosen image promoted — but this
  is the host's integration decision and needs its own home.
- **Model pins.** Name exact models and record the price assumed for each, so the cost figures in a
  result are auditable and a provider's repricing is a visible diff rather than a silent drift.

## Explicitly out of scope

- **The client-facing picker and any UI.** [[REQ-128]] owns background image selection and
  [[DOC-28]] owns the editor. This ticket ends at bytes.
- **Writing generated bytes into a site, and promoting a chosen candidate.** The host integration is
  real work and wants its own ticket, once the placement decision above is settled.
- **Metering, budgets and billing enforcement.** [[DOC-32]] §4.2.3 owns the credit model. This
  component *reports* cost; it does not police it.
- **Prompt authoring by the consult AI.** The component assembles a prompt from structured context;
  deciding what imagery a business needs is [[DOC-33]] playbook work.
- **The upload path.** Client-supplied assets already work and are the preferred source for
  photographic imagery. Nothing here changes that, and nothing here should tempt us to change it.
- **The free-consult allowance.** [[DOC-32]] §4.3 names free-session compute as the one unbounded
  cost, and an unmetered image generator is the obvious thing to farm. A cap is required before this
  is exposed in a free session — it is a host policy decision, not a component feature.
- **Video, upscaling, and background removal.** Each is a separate capability; the registry makes
  them addable without revisiting this design.
- **Text rendered inside an image.** See above — a deliberate non-goal, not a gap.

## Context

Designed in [[CHAT-22]], which established the photographic/non-photographic split, the
draft-then-final cost mechanism, and the finding that the Claude API cannot generate images at all.
The pattern being followed is `lagrange-framework/components/ai` — specifically `js/src/backend.js`
(port and registry), `js/src/backends/` (adapters and self-registration), `js/src/backends/chatgpt.js`
(the closest analogue: a thin wire adapter over a shared provider-independent substrate), and
`conformance/fixtures.json` (the cross-language contract corpus).


---

## ⛔ ABANDONED — moved to lagrange-framework REQ-102

**This ticket is closed as `abandoned`. It is not being built here. The live ticket is:**

> **`lagrangefoundry/lagrange-framework` → REQ-102 (`request-2f815719`)**
> *"Image generation component — one internal API, several providers behind it (components/imagegen)"*
>
> Read it with:
> ```
> XGD_PROJECT_ROOT=/Users/martin/lagrangefoundry/lagrange-framework xgd ticket get request-2f815719
> ```

### Why moved

This ticket's own §Decisions named the repository as "the largest open question" and said **"do not
start the build until this is settled."** It is now settled in favour of this ticket's own
recommendation — build it in lagrange-framework as a peer component beside `components/ai` — for
three verified reasons:

1. The component is domain-agnostic by construction (§What the port must NOT know). Nothing in it
   knows what a site is. That is the same property that put `components/ai` in that store.
2. 1stcontact already reaches that store server-side through `sharedModuleUrl(name)`
   (`tools/generate/src/cli/webui.ts:138`), and that resolver is **not** webui-specific — its doc
   comment notes `@lagrangefoundry/ai` is loaded through it. A new peer component is reachable from
   here with **zero new plumbing**.
3. Single-language components are precedented in that store (`knowledge` and `ai_knowledge` are
   py-only; `webui/*` and `ticketing` are js-only), so the JS-only v1 this ticket leans toward
   breaks no house rule there.

Because cross-store ticketing is not supported (creating into a foreign store reports that the
target's access kind does not allow it — tracked as REQ-67 in lagrange-framework), a REQ in this
store cannot drive a build in that one. Re-filing was the only route, so this ticket is abandoned
rather than left open and stale.

### What carried over

REQ-102 is **self-contained** — the full problem statement, the port design, the capability axes,
the cost mechanism, all 12 acceptance criteria, and the out-of-scope list were carried over intact.
Cross-store references (`DOC-31`, `DOC-32`, `CHAT-22`, …) were rewritten there as plain text
(`1stcontact:DOC-31`) rather than wiki links, since those documents live in *this* store and the
links would dangle in that one.

REQ-102 also records the scoping session that produced the move, and settles several decisions this
ticket left open: JS-only v1, bytes across the port, `draft`/`final` tier vocabulary, model pins with
a dated price table, and that no live API keys are needed to build it.

**One question remains open there and blocks the start of the build:** dependency sign-off —
zero-dependency `fetch` (recommended, and the option that keeps the component reachable from workerd
per DOC-12 §7 phase 2) versus taking the vendor SDKs.

### What stays in this store

The host-side work is still 1stcontact's, and still unfiled. When REQ-102 lands, **file a new REQ
here** for the integration that this ticket listed as out of scope:

- writing generated bytes into `draft/assets/` (DOC-12) and promoting a chosen candidate;
- where rejected candidates from a selection grid go — a non-tracked staging area, so discards never
  pollute the git-tracked asset directory (DOC-12 §3.1);
- the free-session cap (DOC-32 §4.3) required before an image generator is exposed in a free
  consult.

No code was written in this store under this ticket.