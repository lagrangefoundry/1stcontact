---
uid: comment-031b4415
id: COMMENT-3668
type: comment
title: Comment on epic EPIC-21
created_by: xgd
created_at: '2026-09-22T23:59:00.257742+00:00'
updated_at: '2026-09-23T02:37:58.046486+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-b9b27697
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e860e9bd-2b40-4a34-9f7a-e926f95c37bc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e15be3ab-483b-42c6-a3d7-57d183406494-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T23:58:35.051870+00:00" -->
#### You
This is an Epic to deal with fonts. I see three areas to deal with:
1. Free fonts - anything free worth having should be built into the platform and available for reuse
2. Users can upload fonts as assets
3. Font takedowns we need to be able to enforce the removal of fonts that are unlicensed

You are an Epic intended to cover all things font-related. Lets start with 1.

Can we just download all the "good" free fonts we are likely to want and make them available to all tenents?

<!-- xgd-turn id="e15be3ab-483b-42c6-a3d7-57d183406494-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T00:03:48.422773+00:00" -->
#### Claude
Read the ticket and the ground already covered. Short answer: **yes for the OFL/Apache slice — and that's almost everything worth having — but "all" is the wrong instinct, and there's one architecture fork to settle first because it's also the answer to your area 3.**

## What's already built

REQ-101 (`free_and_reconciled`) did the legal groundwork and left the machinery in place:

- `fonts/registry.yaml` — provenance index, with `licence.redistribute_in_product` as the load-bearing flag (`true` / `false` / `REVIEW_REQUIRED`, where unresolved is treated as "no")
- `1c fonts check` (`tools/generate/src/cli/fonts.ts`) — joins every site's `l1.resources.fonts` *and* every font file on disk against the registry; fails on unregistered family/file, unprovenanced bytes, or a `distribution: product` site referencing a font that isn't cleared
- Area 2 is further along than you'd think: `material.ts` already classifies `woff/woff2/ttf/otf/ttc` as `kind: 'font'`, and the Library → **Use on site** path (`promoteToSiteAsset`) already promotes non-image material to site assets. What's missing there is licence attestation, not plumbing.

## Can we just download the good free ones?

**Legally, yes — for OFL 1.1 and Apache 2.0.** Both explicitly permit bundling and redistribution as part of a larger work, which is exactly "serve it from 10,000 customer sites". That's essentially the whole Google Fonts corpus (~1,700+ families, near-entirely OFL, with a residue of Apache 2.0 and a few Ubuntu Font Licence). JetBrains Mono is already `redistribute_in_product: true` in the registry on precisely this reasoning.

**What does *not* qualify, and shouldn't be swept in:**
- **Fontshare / ITF FFL** (Satoshi) — free and commercial-use, but the grant is *non-transferrable and terminable*: it licenses us, not everyone we hand a site to. Already `REVIEW_REQUIRED`.
- **Adobe Fonts** — forbids self-hosting outright. Out entirely.
- **Ubuntu Font Licence** families — redistributable, but modification terms differ. Check individually rather than blanket-clear.
- **Icon fonts** (Font Awesome, eicons) — different problem. FA Brands carries third-party *trademark* constraints independent of the font licence; eicons has no standalone upstream at all.

## But don't ship "all" as a menu

Two costs, and they point opposite ways:

- **Bytes are cheap.** A curated ~50-family set as variable woff2, latin + latin-ext, is single-digit MB. The whole OFL corpus latin-only is a few hundred MB. R2 doesn't care about either.
- **Choice is expensive.** The menu is a design surface and the AI picks from it. 1,700 undifferentiated options produces incoherent picks and no pairing knowledge; 40–60 curated families with category and pairing metadata is the actual product.

So: **ingest the corpus as provenance-cleared *inventory*** (so nothing needs a fresh legal decision later), and **ship a curated *menu* on top**. Two concepts, deliberately separate — what's licensed vs. what's offered. The registry is the first; the menu is a second artifact carrying what the registry doesn't: category (sans/serif/slab/display/mono), available weights and variable axes, pairing hints, metric class for fallback matching.

## The fork that matters — and it *is* area 3

Today font files live per-site under `draft/assets/`, deliberately, "so a site stays self-contained and portable". That invariant collides with a platform library:

| | Copy-on-select (per-site) | Shared platform origin |
|---|---|---|
| Portability | preserved | site depends on platform origin |
| Bytes | duplicated per tenant | one copy |
| **Takedown** | **N-tenant sweep + N rebuilds** | **one registry flip + purge** |

My recommendation: **platform fonts shared-served, tenant-uploaded fonts per-site.** The provenance classes already differ — we control the platform copy, we don't control what a customer uploaded — so the storage tier should differ too. Takedown of a platform font becomes a flag flip; takedown of an uploaded font is a per-tenant delete, which it was going to be regardless. That's the decision I'd want from you before area 1 gets built, because it's unpleasant to reverse.

## Two wrinkles worth knowing

1. **OFL's Reserved Font Name clause.** A *modified* version must not carry the reserved name, and subsetting is arguably modification. Google's own subsets do this universally and practice is settled, but the zero-risk path is shipping unmodified upstream release woff2 (variable where available) and only unicode-range splitting if byte cost bites.
2. **OFL obligations travel with the distribution** — copyright notice + licence text must ship alongside, and the files can't be sold standalone. Concretely: a served `LICENSES.txt`. The registry already notes this for JetBrains Mono.

**Side win:** doing this resolves five of the current `REVIEW_REQUIRED` entries. Cinzel, Lato, Oswald, Raleway and Karla are all OFL families sitting on disk as hash-named capture mirrors — re-point them at canonical library copies and those open actions close.

Now writing the epic body.

Ticket updated — titled **"Fonts: platform library, tenant uploads, and takedown enforcement"**, body covers all three areas with area 1 worked through in detail and areas 2/3 sketched.

**The one thing I need from you before area 1 can be built:** shared platform origin vs. copy-on-select. I've recommended shared-serve for platform fonts, per-site for uploads, but it's your call and it's the kind of decision that's painful to reverse once tenants hold assets.

Once that's settled, the natural area-1 shape is three pieces — corpus ingest + registry tier, the curated menu artifact with its design metadata, and re-pointing the five capture-derived families at canonical copies. Say the word and I'll file them as separate requests.

<!-- xgd-turn id="2d882f83-14ef-4263-9d1f-f9eb0391a56a-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T02:16:41.220492+00:00" -->
#### You
This sounds way complicated - our AI is supposed to be the chooser here - why do we have to constrain its choices? We dont' trust it? Its the same model that is going to make the curation decision that makes the usage call

<!-- xgd-turn id="2d882f83-14ef-4263-9d1f-f9eb0391a56a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T02:18:15.705615+00:00" -->
#### Claude
You're right, and the curation artifact should go. I was designing a human dropdown — 1,700 options is a problem for a `<select>`, not for a model that already knows type. And a hand-written list of 50 families is a taste judgment frozen at authoring time, which rots, while the model's judgment at call time doesn't.

The part that isn't curation, and does have to stay:

**Licence status is a fact, not a taste call.** The model can't verify whether a family is OFL, and getting it wrong ships an unlicensed font to a customer site. That gate stays — but it's a lookup, not a constraint on choice, and it isn't distrust of the model any more than giving it a filesystem API instead of asking it to recall file contents is distrust.

And once you frame it that way, the menu dissolves for a second reason I'd missed: **the real constraint was never "which fonts may it choose from", it's "are the bytes actually served".** If the model picks Cormorant Garamond and no `.woff2` is on the origin, the page silently falls back to a serif stack. That's an acquisition question, not a choice question — and the answer is just "mirror everything".

## Revised area 1

**Mirror the whole OFL/Apache corpus. Curate nothing.**

- A few hundred MB in R2 is free, and eager-mirroring kills cold-start latency, removes a runtime dependency on Google's servers at authoring time, and avoids leaking which tenant is building what.
- The registry becomes **generated, not hand-written** — derived from upstream metadata, one entry per family, `redistribute_in_product: true` where the licence field says OFL or Apache 2.0, excluded otherwise. No human writes taste into it.
- The model picks any family it wants. If it resolves, it's licensed and served, because those are the only two things in the mirror.

The licence fact is genuinely queryable rather than something I'd have to assert family-by-family: the `google/fonts` repo carries a per-family `METADATA.pb` with an explicit licence field and the licence text in the family directory. So "is this clear to redistribute" is a read, not a judgment.

The only metadata worth carrying alongside is what the model can't infer and would otherwise get wrong as a *fact*: which weights and variable axes actually ship. Referencing weight 300 of a family that only ships 400/700 is a silent fallback, same failure as a missing file. Category, pairing hints, metric class — dropped. That was taste, and it's the model's.

The storage fork is unchanged, and if anything more clear-cut now: a full-corpus mirror makes shared-serve obviously right over N per-tenant copies, and takedown stays a flag flip.

Updating the ticket.

Ticket revised — area 1 is now "mirror the whole corpus, curate nothing", with a decision-log entry recording why the menu was dropped so reconciliation can trace it.

Area 1 reduces to three mechanical pieces, none of which involve anyone's taste:

1. **Mirror + generated registry** — pull the OFL/Apache corpus into a platform R2 prefix, generate `fonts/registry.yaml` entries from upstream `METADATA.pb`, ship `LICENSES.txt`.
2. **Resolution + axes metadata** — `l1FontFaceSchema` resolves a family handle against the mirror; carry shipped weights/axes so a bad weight reference fails loudly instead of falling back silently.
3. **Re-point the five capture-derived families** at canonical mirror copies, closing their `REVIEW_REQUIRED` actions.

Still blocked on the storage fork — shared platform origin vs. copy-on-select. That's the one call I need from you, and it's load-bearing for area 3.

<!-- xgd-turn id="3c088d7e-0cb7-4523-a3d9-5382da741ae2-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T02:19:28.436543+00:00" -->
#### You
So look heres what I think we should do: ship everything for the AI - for the human drop down in the editor we choose a curated list of <100

What needs to be built? The production AI doesn't know where to find any fonts?

<!-- xgd-turn id="3c088d7e-0cb7-4523-a3d9-5382da741ae2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T02:21:24.057224+00:00" -->
#### Claude
Let me actually check what the production assistant can do about fonts today before answering that.

Your split is right, and it's the version I should have landed on: the dropdown is a human affordance, not a constraint on the AI. Recording that.

On your second question — I checked, and it's worse than not knowing where to find them. **The production AI cannot obtain a font at all.**

## What the production assistant can do with fonts today

`tools/generate/src/cli/ai/instances.json` defines two production instances, `consultant` and `builder`. Both get `ReadSite` (which holds `list_assets` / `get_asset`) and `AuthorPages`. Neither gets **`ManageAssets`** — the group holding `add_asset` / `remove_asset`.

So in production it can:
- **see** fonts already on the site (`list_assets`)
- **write** `fontFamily` into L1, and write a `resources.fonts` face

It cannot get a font onto the site. And `add_asset` wouldn't help even if it were granted — `toolbox-core.ts:262` notes it "reads a file off the operator's disk", so it's structurally a dev-machine tool, not just role-gated.

The surface is explicit about the consequence. `l1-surface.json:1242`:

> You cannot go and get a file — not from a URL, not from a machine, not from anywhere. What you CAN do is ask for one… so when you need a photograph, a logo **or a font**, ASK FOR IT HERE

and `REF-l1.md:604`:

> A painted font family must resolve to a face the page serves or name a generic every browser has, or **it silently paints the browser default** rather than anything chosen.

So the AI's only font path in production is *asking the customer to go download a font and drop it in the chat*. Otherwise it paints a `fontFamily` that silently resolves to the browser default. That's the gap — the model's taste is fine, it has no hands.

## What needs to be built

**1. The mirror and the generated registry.** Ingest the OFL/Apache corpus into a platform R2 prefix; generate registry entries from upstream `METADATA.pb`; serve `LICENSES.txt`. This is just "the bytes exist".

**2. A font tool for the assistant — a resolver, not a catalogue.** This is the actual missing piece, and it should stay small. Don't put 1,700 family names in context; the model already knows what Playfair Display is. The tool is:

- `use_font("Playfair Display", weights: [400, 700])` → binds the face into the page's `resources.fonts`, returns the handle to paint
- refuses legibly when the family isn't in the mirror, so the model picks another instead of silently painting a generic
- the response reports which weights/axes actually ship, so asking for 300 of a family that ships 400/700 is a stated correction rather than a silent fallback

That's the whole surface. It mirrors your framing exactly — the AI doesn't need a menu, it needs the bytes to exist and a way to bind them.

**3. The curated <100 for the editor dropdown.** A separate, editor-only artifact. Explicitly does not gate the assistant — same mirror underneath, two front doors.

**4. Knowledge correction.** `l1-surface.json:1242` and `REF-l1.md:604` both currently tell the assistant a font is something it must be given. Once the tool exists, those are wrong and will keep it from using the tool. The "or a font" clause comes out of 1242.

**5. `1c fonts check` learns the platform tier** — resolve a platform-origin `src` rather than flagging it `unregistered-file`.

## Still blocking

The storage fork. It's now directly in the way of piece 2, because `use_font` has to write a concrete `src` and what it writes *is* the fork — a shared platform origin URL, or a copy into `draft/assets/`. I'd go shared-serve for platform fonts, per-site for uploads, on the takedown argument. But I need that call before this is buildable.

Updating the ticket now.

Ticket updated with your direction, the gap findings, and the five-item build list. Decision log records both turns of the curation question so reconciliation doesn't re-litigate it.

The headline for you: **the central deliverable isn't a font library, it's `use_font`.** The mirror is necessary but inert — without a tool in `consultant`/`builder`, the assistant still can't reach it, and today it's stuck asking customers to download fonts by hand.

One call still needed: shared platform origin vs. copy-on-select. That's now genuinely blocking, since `use_font` can't be written without knowing what `src` it emits. My recommendation stands — shared-serve platform fonts, per-site uploads — but it's yours to make. Give me that and I'll file the sub-tickets and start on the mirror.

<!-- xgd-turn id="2224878b-61c9-4b4d-b251-df0215c822be-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T02:23:31.007492+00:00" -->
#### You
I think the font list should be documented are you really sure that you know all 1700 fonts on the list?

<!-- xgd-turn id="2224878b-61c9-4b4d-b251-df0215c822be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T02:26:54.760691+00:00" -->
#### Claude
You're right to push on that, and the honest answer is **no — I don't know all 1,700.**

I know maybe 100–300 confidently — the ones that appear constantly in real web code. Beyond that it degrades fast: most of the Noto family (hundreds of entries, largely non-Latin scripts), a long tail of display faces from individual designers, and anything added after my training cutoff, which I can't see at all. If I claimed otherwise I'd be guessing at names.

Let me get the actual list rather than keep estimating.

That sample settles it. Of those 40 I could genuinely describe maybe a third — `antonio`, `arvo`, `cairo`, `dosis`, `oswald`, `pacifico`, `leaguespartan`, a few variants of families I know. `ancizarserif`, `baumans`, `beiruti`, `borel`, `drsugiyama`, `keaniaone`, `novaoval`, `pliant`, `vampiroone`, the whole `playwrite*` set — I'd be inventing descriptions.

And my "~1,700+" was wrong too. Let me get the real metadata rather than slugs.

Now I have real numbers. Generating the documented catalogue.

Six families failed the directory join — the `Edu *` set was renamed upstream (`Edu NSW ACT Cursive` → `edunswactfoundation`). All `edu*` directories sit under `ofl/`, so they're OFL, but it's a real finding: **joining live metadata to licence by directory slug is not reliable**, and the production ingest must read each family's own `METADATA.pb` instead.

Catalogue written. Now correcting the ticket — this changes the design, not just the numbers.

You were right to challenge it, and the claim didn't survive contact with the data.

**What I got wrong:** I don't know the corpus. Sampling 40 non-Noto families, I could describe about a third. My "~1,700+" was wrong — it's **1,946** live families, 1,941 of them redistributable under OFL/Apache. And **20 post-date my training cutoff**, so they're invisible to recall no matter how confident I sound.

**Written:**
- `fonts/catalogue.json` — 1,946 records: family, licence, category, weights, variable axes, subsets, designers, popularity rank, date added
- `fonts/CATALOGUE.md` — human summary, methodology, caveats

Real numbers: OFL 1,906 · Apache 35 · UFL 5 (need individual clearing — modification terms differ). 558 variable. 212 Noto. By category: Sans Serif 720, Display 468, Handwriting 358, Serif 349, Monospace 51.

**Two design corrections follow, and they matter more than the numbers:**

1. **The assistant needs `search_fonts`, not just `use_font`.** A corpus the model can't enumerate is one it won't use — left to recall it reaches for the same forty faces and every tenant site looks the same, while 1,900 licensed families sit unused. That was the actual risk in my "resolver, not a catalogue" position.

2. **Category is an index, not taste.** I cut it alongside pairing hints as "the model's job". Wrong — you can't query a corpus you can't describe. Category, weights, axes and subsets are carried. Pairing hints stay out; those genuinely are taste.

**One finding for the build:** joining the live family list to licence directories by slug is unreliable — six `Edu *` families were renamed upstream (`Edu NSW ACT Cursive` → `edunswactfoundation`) and failed the join. I resolved them by prefix and marked them `licence_source: prefix-inference`, but the production ingest must read each family's own `METADATA.pb`. Also: the repo has 2,056 directories against 1,946 live — the gap is delisted/sandboxed families that must not be mirrored.

The catalogue is currently a one-off pull; the generator that reproduces it still needs committing, which is now item 1 on the build list. And the storage fork is still the thing blocking `use_font`.

<!-- xgd-turn id="82fd43cb-09a9-4140-adb4-a83285b27172-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T02:36:12.243415+00:00" -->
#### You
We already have search technology we don't have to invent a new one. This should just go into the knowledge base that's what I was saying.

OK can you lay out here what needs to be built?

<!-- xgd-turn id="82fd43cb-09a9-4140-adb4-a83285b27172-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T02:37:57.602904+00:00" -->
#### Claude
Right — the KB already has retrieval. Let me check how it's built before laying this out.

You're right — no new search surface. `kb/system/` already has the whole path: authored markdown → `1c kb build` embeds with `@cf/baai/bge-small-en-v1.5` → heading-anchored chunks, bundle-resident, byte-identical per tenant. The catalogue is just another corpus document. `search_fonts` is dropped.

One constraint I found while checking that: embeddings are float32 at **1536 bytes/chunk**, and the whole system corpus is currently 357 chunks / 548KB. A chunk per family would add ~2.9MB of embeddings plus ~1.2MB of metadata to a bundle-resident index — likely bundle-breaking. Grouping families under headings (~20 per chunk, ~100 chunks, ~200KB) is both affordable and better suited: a query for "geometric sans" should return *a slate of candidates*, not one family. `system-knowledge.ts` notes the index could move to R2 if per-family granularity is ever wanted — the port exists.

## What needs to be built

**A. Catalogue generator** — `1c fonts catalogue`. Pulls the family list and metadata, resolves licence by reading each family's own `METADATA.pb` (the slug join is unreliable — six `Edu *` families are renamed upstream), excludes delisted/sandboxed families (2,056 repo dirs vs 1,946 live), writes `fonts/catalogue.json`. Replaces the one-off pull I did today.

**B. KB corpus projection** — generate `kb/system/REF-fonts.md` from the catalogue, authored so headings group families into useful retrieval slates. `1c kb build` then picks it up with **no change to KB machinery**. This is what makes the corpus reachable by the assistant.

**C. The mirror** — fetch woff2 for the 1,941 redistributable families into a platform R2 prefix; serve them; ship `LICENSES.txt` for the OFL notice obligation.

**D. Generated registry entries** — extend `fonts/registry.yaml` with a platform tier from the catalogue, so provenance covers mirrored bytes.

**E. `use_font`** — the one new tool, in a group `consultant`/`builder` actually carry. Binds a family into the page's `resources.fonts`, returns the handle to paint, refuses legibly when a family isn't mirrored, reports which weights/axes actually ship.

**F. Knowledge correction** — drop the "or a font" clause from `l1-surface.json:1242`; update `REF-l1.md:604`. Left as-is, they teach the assistant a font is something it must be given, and it won't reach for the tool.

**G. `1c fonts check` platform tier** — resolve a platform-origin `src` instead of reporting `unregistered-file`.

**H. Editor dropdown <100** — curated shortlist, editor-only, does not gate the assistant.

**Dependencies:** A → B, D, H. A → C. C + storage fork → E → F. C/D → G.

**Unblocked now:** A, B, H, and F's text edits. **Blocked on the storage fork:** E, and C's layout — you need the bytes somewhere either way, but the prefix shape is the fork.

Recording this.

Ticket updated — `search_fonts` dropped, KB projection is now item B, and the assistant surface narrows to `use_font` alone.

Net of the three corrections you've made, area 1 is smaller than where I started: **one new tool, one new KB document, a generator, and a mirror.** Everything else was me inventing machinery that already exists.

Two things I'd want from you before filing sub-tickets:

1. **The storage fork** — still blocking E, and shaping C. Shared platform origin vs. copy-on-select.
2. **Whether A–B go first as a standalone ticket.** They're unblocked, they're independently useful (the assistant gets font *knowledge* even before it gets hands), and they'd let us see whether KB retrieval over the catalogue actually returns good slates before committing to the mirror.

I'd suggest doing A–B first for exactly that reason — it's the cheapest way to test the premise that retrieval beats recall here, and if the slates come back poor, that changes the chunking design before any bytes get mirrored.

<!-- xgd-chat-end -->