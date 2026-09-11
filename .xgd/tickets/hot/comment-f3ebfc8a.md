---
uid: comment-f3ebfc8a
id: COMMENT-2618
type: comment
title: Comment on request REQ-222
created_by: xgd
created_at: '2026-09-10T22:08:15.980090+00:00'
updated_at: '2026-09-11T02:11:32.792196+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f51c8748
  kind: chat_transcript
---

<!-- xgd-turn id="97680887-97b9-46b4-92d5-727bd6bfe824-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:07:37.682487+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="97680887-97b9-46b4-92d5-727bd6bfe824-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:15:38.065382+00:00" -->
#### Claude
I've read the ticket, the epic, REQ-219, and traced the whole path end to end. No code touched. Findings below.

## What's actually there today

**Publish** — `tools/generate/src/publish/publish.ts:134` `publishSite()` is the one implementation over the `SiteStore` port. Order is: validate → diff (no-op short-circuit) → `renderSiteFiles()` → `store.writeRevision()` → re-parent draft. Called from three places: `1c publish` (fs store), the assistant's `publish` toolbox op, and `POST /api/publish` (`router.ts:2060`), which awaits it synchronously on the toolbar button.

**The `<img>` sink** — `packages/framework/src/l1/render.ts:2484` (the ticket says 2459; drifted). The ticket's claim that it is the *only* one holds: no behavior module emits an `<img>`. The one adjacent sink is `modules/markdown.ts:135`, which passes author markdown through and already stamps `loading="lazy" decoding="async"`.

**Render threading is easy.** `renderSiteFiles` is the only place both `publish.ts:153` and the request-time draft/edit render (`cli/preview.ts:229`) meet, and `renderL1Document` already takes an options bag (`mounts`, `palette`, `edit`) that funnels into a `RenderState`. A ladder manifest is one more option, set by publish and by nothing else — "the draft gets no ladder" falls out for free.

**R2 layout** — `sites/<siteId>/rev/NNNN/{source,out}`. `writeRevision` already copies every asset's bytes into *both* prefixes; public-site resolves `publishedOutPrefix(siteKey, MAX(id))` and serves only inside it. Anything at `sites/<siteId>/derived/…` would be publicly unreachable by construction.

**The Images binding does not exist yet** — not in either `wrangler.toml`, not in `vitest.workers.config.mts`. But it's cheap to add and it works locally: miniflare backs `env.IMAGES` with `sharp`, which is already in miniflare's own `node_modules`. `info()` gives width/height/format; `input().transform({width}).output({format})` gives the rendition. Both are exactly and only what this ticket needs.

## Six things in the ticket that need adjusting

**1. The one real photograph in the repo is a background, not an `<img>`.** The only raster site asset anywhere in `storage/sites/` is `AlchemistLabWithTech.png`, and it's referenced as `axes.backgroundImageUrl` on a box (gigabytealchemy home). `srcset` cannot reach it. As scoped, this ticket delivers zero bytes saved on the only photograph we have. Background images need `image-set()`, or — better and cheaper here — a different `background-image` per width media rule, which L1 can do because it *already* emits per-width rules. This is the biggest gap and it's a scope question, not a detail.

**2. `assetRefSchema` is the wrong schema to name.** The `<img>` sink reads `l1ImageSchema.src: z.string()`. `assetRefSchema` is module *content* only. The intent ("no schema change, delivery is a property of the publish") is right and holds; the sentence names the wrong object.

**3. "Revision's own prefix" and "zero transforms on republish" pull apart.** A revision prefix is per-revision, so an unchanged photo republished into rev 8 has no rev-7 rendition to find. Either you keep a revision-independent content-addressed cache and *copy* into the revision prefix (zero transforms, non-zero R2 ops — and consistent with the fact that `writeRevision` already duplicates every asset per revision), or you serve from a shared prefix, which needs a public-site route change and breaks REQ-109's document-relative flatness invariant. I'd take the copy.

**4. `RevisionContent.out` is `Map<string, string>` — text only.** Binary renditions need a new channel through the port, implemented in both the fs and D1/R2 adapters. Small, but it's a port change and this repo takes those seriously.

**5. `1c publish` has no Images binding, so publish output would diverge by adapter** — directly against `publish.ts`'s stated "ONE implementation" property. Fine as a decision (ladder absent → renders exactly as today), but it needs saying out loud in the ticket rather than being discovered.

**6. "Nothing is ever upscaled" must be our rule, not the transform's.** Miniflare's local resize is `fit: 'contain'` and *will* scale up; only the real binding defaults to scale-down. Capping the ladder to rungs ≤ the source width (from `info()`) makes local and remote agree by construction.

## The dependency on REQ-219 is weaker than it looks

Promotion **copies bytes** — `material.ts:567` `promoteToSiteAsset` reads the blob from `BLOBS` and writes it through `editAssetAdd` into the site's assets. `site_assets` is `(site_id, name, r2_key, content_type, size)`; there is no column linking back to the material, and `placed_on` records site slugs, not asset names. So at publish time there is no reachable path from an asset to its recipe.

Which means "content-addressed on the original, the recipe and the width" isn't constructible from publish, and doesn't need to be: content-address on the **promoted asset's own bytes** + width + format. A recipe change re-promotes new bytes, which is a new hash, which is a new rendition — correct by construction, and it makes REQ-222 need nothing from REQ-219 except the `[images]` binding declaration.

## Three things worth taking while we're here

**`sizes` is precisely derivable in this codebase, which is unusual.** L1 geometry keyframes carry the node's px width at each captured viewport width, and `columnExtentCss` already expresses a column-anchored width as a closed-form CSS `min()`. `sizes` accepts exactly those lengths. Almost everyone ships a hand-guessed `sizes` and gets it wrong; we can compute it. Honestly this is the strongest argument for doing `srcset` here at all — without an accurate `sizes` the browser assumes `100vw` and downloads too much anyway.

**Content-addressed filenames unlock `immutable`.** `public-site/src/index.ts:63` carries a comment naming "revision-scoped published asset paths" as the fix for its blanket `max-age=60`. Content-addressed rendition names *are* that fix for the renditions at least. For repeat visitors that's plausibly a larger win than the ladder.

**The L1 `<img>` emits no `width`/`height`/`loading`/`decoding`.** We'll have intrinsic dimensions from `info()` for free; stamping them kills layout shift. `loading="lazy"` needs an above-the-fold exemption (harmful on the LCP hero) — and L1 geometry can answer that question, which most frameworks can't.

## Two open questions I'd want settled before coding

- **Format.** Converting to WebP/AVIF is a bigger byte win than width alone at the same transform cost, but a static publish can't vary on `Accept`. The JAMStack-correct answer is `<picture>` with typed `<source>`s — which changes the *shape* of what the sink emits, not just its attributes. Cheaper to decide now than to retrofit. (Also: `tools/generate/src/store/content-type.ts` has no `.avif`, and its own comment predicts exactly this.)
- **Publish latency and limits.** First publish of a photo-heavy site is N images × M widths transforms plus R2 puts, inside a synchronous route behind a toolbar button. Republishes are near-free once the derived cache exists, but the first one isn't, and nothing today batches or defers it.

Where would you like to take this — widen scope to cover background images, or keep it to `<img>` and file the background case separately?

<!-- xgd-turn id="cc4aee6f-94c4-4202-be1d-51ff2002084d-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T02:11:32.651704+00:00" -->
#### You
Please reread the ticket your answers are there and proceed with the implementation

<!-- xgd-chat-end -->