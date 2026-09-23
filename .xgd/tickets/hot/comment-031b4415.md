---
uid: comment-031b4415
id: COMMENT-3668
type: comment
title: Comment on epic EPIC-21
created_by: xgd
created_at: '2026-09-22T23:59:00.257742+00:00'
updated_at: '2026-09-23T23:47:00.321790+00:00'
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

<!-- xgd-turn id="160d4cf5-fbf6-4787-bd32-f23536d1ca60-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T03:03:01.203788+00:00" -->
#### You
`kb/system/REF-fonts.md ` <-- we have been working with tickets can you have a ticket that gets updated with this for consistency?

I was assuming this would be platform wide and shared - fonts may be small but copying them around is just going to get fiddly - per tenant fonts are user-uploaded and their responsibility to meet the license requirements for, yes?

<!-- xgd-turn id="160d4cf5-fbf6-4787-bd32-f23536d1ca60-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T03:04:46.161723+00:00" -->
#### Claude
Two answers.

## On the KB doc and tickets

`REF-*` files are **deliberately ticketless** — that's an existing convention, not an oversight. `index.ts:1367` says it outright: *"a projection has no ticket, so an operator who cannot find `REF-l1` in the ticket store needs to be told it was generated, not looked for."* `kb-projection.ts` is emphatic about why: *"A machine-readable fact is generated from its source of truth, never authored. A projected document is not a document anybody maintains, and it cannot be stale."*

`kb/system/` holds both kinds — `DOC-*` exported from doc tickets, `REF-*` written by `writeProjections()`. And the corpus already pairs them: `REF-l1` is the projected vocabulary, `DOC-23` is the authored doc about the L1 substrate.

So the consistent shape here is that same pair, and it gets you the ticket you're asking for:

- **`REF-fonts.md`** — projected from `fonts/catalogue.json`, ticketless like its siblings. 1,946 families is not something a person maintains, and it'd go stale the day Google adds one.
- **A new `DOC-nn` font policy ticket** — what's licensed and why, the platform/tenant tier split, the upload attestation, takedown. That's genuinely authored, it's what the assistant should retrieve when a customer asks "can I use my own font?", and it's the thing that gets updated.

If you'd rather the catalogue itself be ticket-backed, that's a change to the projection convention — happy to do it, but flagging it rather than quietly breaking the rule.

## On the storage fork — taking that as decided

**Platform-wide and shared.** Agreed, and your reasoning is the right one: copying bytes around gets fiddly, and it's fiddly in exactly the way that rots.

On tenant uploads — **yes, with one caveat worth stating once.** The tenant uploads, the tenant attests they hold the licence, and liability sits with them. But we're still the party serving the bytes from our infrastructure, so an attestation shifts *liability* without removing our *obligation to act* on a valid takedown notice. That's the pair: area 2's attestation gives us the record of who claimed what, area 3 gives us the mechanism when a claim turns out false.

Good consequence of your decision: the platform tier is cleared by construction (OFL/Apache only), so **area 3 is essentially about the tenant-upload tier** — which is per-site, where deletion was always a per-tenant action. That collapses the "N-tenant sweep" problem I was worried about. The residual platform case is narrow: a family withdrawn upstream or an OFL licence dispute, handled by a registry flip plus a purge.

Ticket is consistent now — tier decision recorded, stale fork references cleaned, area 3 rewritten to reflect that it mostly collapsed.

**Where EPIC-21 stands:** nothing is blocked. The build is A (catalogue generator) → B (`REF-fonts` projection) + B2 (font-policy DOC ticket) → C (mirror) → E (`use_font`) → F (knowledge correction), with D/G/H alongside.

Two things I'd want your call on before filing sub-tickets:

1. **The projection convention** — I've kept `REF-fonts` ticketless and put the ticket on the policy doc instead. If you actually want the catalogue itself ticket-backed, say so and I'll do it, but it breaks the "generated facts have no ticket" rule that `kb-projection.ts` argues for at length.

2. **How to slice the sub-tickets.** I'd suggest three: *A+B+B2* (catalogue and knowledge — independently useful, and it tests whether KB retrieval over the catalogue returns good slates before any bytes get mirrored), *C+D+G* (mirror, registry tier, gate), *E+F* (the tool and its knowledge correction). H standalone whenever the editor work comes up.

The first slice is the one I'd start on — it's the cheapest way to find out whether retrieval beats recall here, and a poor result would change the chunking design before the mirror is built.

<!-- xgd-turn id="0dbd09e7-2482-4b20-8061-02477837b6d9-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T03:15:33.787165+00:00" -->
#### You
Unfortunately it is the rule that is broken - this is something we need to clean up. The system kb should be doc tickets of kind system_kb. We used to use docs that is dead - its not dead in xgd btw the change hasn't propagated that far but 1c's kbs should not be populated from docs - if it is please create an REQ for me to follow up and fix please

Do you understand how system_kb tickets work? We could have a separate font kb if you like but I would still like the catalog in a ticket where is is easy for the xgd artificer to inspect and reference.

ok this is our next priority, it is blocking the Lagrange Foundry site...and the beta.

Are you ready to create tickets?

<!-- xgd-turn id="0dbd09e7-2482-4b20-8061-02477837b6d9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T03:20:12.615896+00:00" -->
#### Claude
Let me verify the mechanism before I answer that, rather than claim I understand it.

Yes — and I verified rather than assuming, because my earlier answer to you was wrong on exactly this point.

**How `system_kb` tickets work** (confirmed in `kb.ts`):

1. A doc ticket — `type: doc`, `fields.doc_kind: system_kb`.
2. `1c kb export` → `readDocTickets()` shells `xgd ticket list --type doc --view --json --no-limit`, filters on `inSystemKb()`, writes `kb/system/<ID>.md` with frontmatter + body. Tickets lacking the field are reported as *"not in the KB"*; a ticket that opts out or is deleted has its file swept.
3. `1c kb build` chunks **heading-anchored** and embeds via Workers AI `bge-small-en-v1.5` → `kb/system/chunks/`.
4. Bundle-resident; `system-knowledge.ts` opens it in workerd from three bundle values.

**And you're right about what's broken.** The `DOC-*` path is already ticket-backed — it reads the ticket store directly, no doc files involved. The violation is the **second corpus producer**: `writeProjections()` (REQ-165) derives `REF-l1`, `REF-surface`, `REF-behaviors` from code and writes them straight into `kb/system/` with no ticket, sweeping its own namespace. `index.ts:1367` even documents the consequence — *"an operator who cannot find `REF-l1` in the ticket store needs to be told it was generated, not looked for."* That's the rule I cited back at you as if it were settled policy. Filing the REQ.

**Useful consequence for the catalogue:** since chunking is heading-anchored, **one doc ticket with ~100 group headings gives exactly the ~100-chunk granularity** I costed earlier. So the catalogue goes in a single ticket — easy for the artificer to `xgd ticket get` — and chunks correctly for free. No separate font KB needed unless you want one later.

Before I generate the catalogue doc — the metadata had `stroke` and `classifications` fields I didn't use. Checking whether they carry style signal, because font names are proper nouns and embed poorly for style queries.

`stroke` adds **Slab Serif** (30 families) which `category` doesn't have, and `classifications` adds **Symbols** (22). No style descriptors though — nothing says "geometric" or "humanist". Noting that as an enrichment follow-up rather than inventing it. Generating the doc body:

92 sub-headings ≈ 92 chunks, 90KB body — lands exactly on the granularity target. Creating the ticket slate.

DOC-56 created. Now the REQs.

Now linking them into the epic.

Tickets created.

| | | |
|---|---|---|
| **DOC-56** | The fonts 1st Contact can serve | `doc_kind: system_kb` — 1,941 families under 92 group headings, plus what the assistant may do with them |
| **REQ-311** | Catalogue generator | high · **unblocked** |
| **REQ-312** | Mirror + registry platform tier | high · **unblocked** |
| **REQ-313** | `use_font` + knowledge correction | high · needs REQ-312 |
| **REQ-314** | Editor shortlist <100 | low |
| **REQ-310** | KB projections bypass the ticket store | medium · the cleanup you asked for |

EPIC-21 raised to high with the blocking note.

**On REQ-310** — you were right and I had it backwards. The `DOC-*` path is already ticket-backed (`readDocTickets()` shells `xgd ticket list --type doc`). The violation is `writeProjections()`, a *second* corpus producer that writes `REF-l1`/`REF-surface`/`REF-behaviors` straight into `kb/system/` with no ticket, plus a namespace partition that exists only to stop the two producers deleting each other's files. The REQ keeps the generate-from-code property — that part of `kb-projection.ts` is still right — but changes the sink to the ticket body so export stays the single producer.

**On DOC-56 and a separate font KB** — I went with one ticket in the system KB. Heading-anchored chunking means its 92 group headings give the ~92-chunk granularity the bundle affords, so the container and the retrieval shape agree for free. A separate font KB would be a new `knowledge_bases.json` entry and buys nothing yet; easy to split out later if the corpus grows.

**One thing DOC-56 is weak at, flagged in the ticket rather than papered over:** upstream carries no style descriptors — nothing says "geometric" or "humanist". Family names are proper nouns, so a style query retrieves the category slate rather than a precise match. Enrichment is follow-up work, and it shouldn't be done by inventing descriptions.

I'd start on REQ-311 — it's unblocked, and the mirror in REQ-312 reads the catalogue it produces. Want me to cut the branch?

<!-- xgd-turn id="74ae1e7e-fe9d-4968-ac1c-2dfc9563e9cc-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:05:51.188170+00:00" -->
#### You
Here's what I want for user access to fonts:
1) a drop down with (say) 30 of our favourite fonts with the names written in the fonts
2) a text box at the top of the drop down. If I start to type, say the letters "Ar" in the text box the 30 curated fonts are replaced with the top 30 font families listed alphabetically begining with Ar. 

If I have a web developer come in and they really know what font they need, and we have it, I do not want our UX to prevent them from accessing it.

Can you update REQ-314 with that model please?

<!-- xgd-turn id="74ae1e7e-fe9d-4968-ac1c-2dfc9563e9cc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:07:10.669379+00:00" -->
#### Claude
REQ-314 updated with your model — curated 30 rendered in their own faces, query box at the top of the dropdown, prefix match alphabetical capped at 30, reaching the whole mirror with no mode switch.

Three things I worked through that follow from it rather than being in your ask — flagging so you can cut any of them:

**Rendering names in their own face has a real cost.** Thirty faces per list is ~1–2.5MB at unmodified upstream `woff2`, and another thirty on each keystroke-settled query. Spec'd as: fetch only visible rows, `font-display: swap` so a row never blocks, debounce the query.

**That surfaces an open decision I couldn't settle myself.** A name-only preview subset is ~1–3KB versus a 30–80KB full face — the difference between snappy and sluggish. But REQ-312 deliberately mirrors *unmodified* upstream woff2 to stay clear of OFL's Reserved Font Name clause, and subsetting is arguably modification. I've written the three options (full lazy faces / preview subsets / server-rendered name images) as a decision to take knowingly rather than picking one and having it contradict REQ-312.

**Empty results need to distinguish two cases.** Your web-developer requirement implies it: someone typing `Helvetica` has asked a reasonable question, and an empty list answers it misleadingly. Spec'd so a known commercial family explains that per-licensee webfont licences can't be shared across customer sites, and points at the upload path. That needs a small hand-maintained list of famous unavailable names — it can't come from the catalogue, which by construction only knows what we *do* have.

One question I resolved by following your wording literally: matching is **prefix**, so `Ar` → Archivo, Arimo, Arsenal, Arvo. That means typing `mono` won't surface the monospace families. If you want substring or category matching too, say so and I'll add it — but prefix is what you described and I didn't want to quietly widen it.

<!-- xgd-turn id="16d27cf8-6f92-49e6-bc21-8784b272e79d-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:11:04.895316+00:00" -->
#### You
Good questions:
I only want to render the curated list in fonts - if you go looking by name you need to know what you are looking for. Is that managable?
Of you can suggest other filters in addition to prefix that are worth including then sure, but lets not let it get too complicated

<!-- xgd-turn id="16d27cf8-6f92-49e6-bc21-8784b272e79d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:12:29.085983+00:00" -->
#### Claude
Yes — and it simplifies three things at once.

**Manageable, and better than manageable.** A fixed 30 is a *known* set, so it's cacheable across sessions and — because platform fonts are shared-served — across tenants. First load is ~1–1.5MB, every load after that is free. More importantly it kills the keystroke-fetch problem entirely: no debouncing preview loads, no fetch storm while someone types `Archivo`.

**And it closes the open decision I flagged.** The RFN/subset question only existed because per-query previews needed to be cheap. With previews confined to a fixed cached 30, full unmodified upstream `woff2` is clearly right — REQ-312's mirror stays untouched and there's no modification question to answer.

Your reasoning holds up on its own too: someone typing `Archivo` is committed to Archivo. The preview earns its cost in browse mode, not lookup mode.

One cheap addition: **the closed control can render the *selected* family in its own face**, whether it came from the curated list or the query box. That face is already loaded — it's on the page — so it costs nothing and the control never looks like it forgot what you picked.

## Filters worth adding — two, and I'd stop there

**1. Word-prefix instead of strict string-prefix.** Match when *any word* in the family name starts with the query. `Ar` → Archivo, Arimo, Arvo, unchanged. `Mono` → Roboto Mono, JetBrains Mono, Space Mono. `Sans` → Open Sans, DM Sans, Noto Sans. This is the same predictable prefix semantics — no surprising mid-word hits — and it handles the way people actually type a distinguishing word. It also fixes the `mono` case I flagged last turn, properly.

**2. Category chips.** One row of six toggles from data the catalogue already has: Sans Serif, Serif, Slab Serif, Display, Handwriting, Monospace. "Show me the serifs" is the dominant browse intent and this is the whole of it. Chips narrow whichever list is showing — curated or query results.

**What I'd leave out**, so it doesn't creep: variable-axis filter, weight-availability filter, script/subset filter, popularity-sort toggle, fuzzy matching. Each is defensible alone; together they turn a font picker into a database query builder. The script filter is the one I'd revisit first if a non-Latin site needs it.

REQ-314 updated. The preview-scope change earned its keep — it removed a section rather than adding one, and the subsetting decision is now closed rather than deferred.

Current shape of the control:

- **Empty query** — ~30 curated families, each in its own face
- **Typing** — up to 30 word-prefix matches, alphabetical, in the UI face
- **Six category chips** — narrow whichever list is showing
- **Closed control** — selected family in its own face, free since it's on the page
- **Unavailable commercial names** — explained, not answered with an empty list

Font loading is now bounded to a fixed cacheable set; typing fetches nothing.

Ticket slate stands at DOC-56, REQ-310 through REQ-314, with 311 → 312 → 313 the path that unblocks the beta. REQ-311 is still the one to start on — want me to cut the branch?

<!-- xgd-turn id="f52bf100-4083-419f-9763-916b909dd915-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:23:12.699392+00:00" -->
#### You
No you are an EPic you create tickets not code please - is 314 updated?

<!-- xgd-turn id="f52bf100-4083-419f-9763-916b909dd915-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:23:56.375287+00:00" -->
#### Claude
Understood — Epic scopes and files tickets; implementation happens in the request tickets. I won't offer to cut branches again.

Yes, REQ-314 is updated. Verifying from the store rather than from my own write:

Confirmed from the store — REQ-314 body is 7,844 chars with all the changes present:

- **Interaction model** — curated 30 in their own faces; query results in the UI face, with your direction quoted
- **Matching** — word-prefix (`Mono` → Roboto Mono, JetBrains Mono, Space Mono), case- and space-tolerant, alphabetical, capped at 30
- **Category chips** — six toggles, plus the explicit exclusion list so it doesn't creep
- **Rendering previews — bounded by construction** — replaced the old constraint section; the subsetting decision is closed, not deferred
- **When nothing matches** — commercial families explained rather than shown as empty
- **Behaviour** — 17 testable statements for UAT tracing, including "typing fetches no faces"

Title is now *"The editor font control: 30 curated faces, and a query box that reaches all 1,941"*, priority low, parented to EPIC-21.

Full slate under the epic: DOC-56 (catalogue), REQ-311 (generator), REQ-312 (mirror + registry tier), REQ-313 (`use_font` + knowledge correction), REQ-314 (editor control), plus REQ-310 outside the epic for the KB projection cleanup.

<!-- xgd-turn id="3e4f2bea-7909-4179-a8fc-97d7026ae99a-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:26:39.631877+00:00" -->
#### You
Please take a look at your child REQ-312 it has questions - on running the mirror - that should be part of the system build - not sure its something we want/need to do every build but it needs to be in that tool set just like any other dependency.

Please answer any questions from 312 that you feel confident about in its ticket. bring anything else back here.

<!-- xgd-turn id="3e4f2bea-7909-4179-a8fc-97d7026ae99a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:29:11.724209+00:00" -->
#### Claude
The ticket's open points aren't flagged as questions — let me pull them out, and verify a couple empirically rather than reason about them.

TTF only — **no woff2 in the repo at all.** Inter ships two variable TTFs at 1.78MB; Lato ships 18 static TTFs at 11.9MB. Let me size the whole corpus properly rather than extrapolate from three families.

Measured. Now updating REQ-312 with what I can settle, including two corrections to facts I'd asserted.

REQ-312 updated. **Answered in the ticket:**

- **Build integration** — your direction written in: a `1c fonts mirror` verb in the release toolset alongside `1c kb build`, acquired like a dependency rather than rebuilt like an artifact. Not per-build, pinned to a catalogue version so two deployments from the same commit serve the same faces, incremental, and an unpopulated mirror reports itself rather than silently serving nothing.
- **Registry placement** — platform entries go in a *separate generated file*, not `fonts/registry.yaml`. That file is nine hand-authored entries carrying the reasoning behind each licence judgement; 1,941 generated entries would drown it and make diffs unreadable.
- **Licence text** — every upstream family ships its own `OFL.txt` (2,379 across the tree). Mirror each alongside its family's bytes so the notice travels with the font, plus an aggregate index at the origin root.

**Two things I had wrong, now corrected in the ticket:**

**The `woff2` premise was false.** `github.com/google/fonts` ships **TTF only** — `ofl/inter` is two variable TTFs and no woff2; the whole OFL tree has 3,808 TTFs and zero woff2. The woff2 everyone uses comes from `fonts.gstatic.com`, and **those are Google's unicode-range subsets**. So "mirror unmodified upstream woff2" — which REQ-312 specified and REQ-314's preview decision leans on — isn't a thing that exists.

**Sizing was off by an order of magnitude.** Not "a few hundred MB": **2.45 GB of TTF, ~1.35 GB converted to woff2.** And preferring variable files saves nothing (2.44 vs 2.45 GB) — families that ship variable mostly ship *only* variable, so there are no redundant statics to drop. That optimisation is closed.

## Bringing back to you

**1. The woff2 route — needs your call.** Three options, written into the ticket unselected:

- **Convert repo TTFs ourselves.** Compression and container change only, no glyph removed, no name altered — the strongest position on Reserved Font Name. Costs a conversion step and the most bytes.
- **Mirror gstatic's woff2.** Far smaller, and it's what google-webfonts-helper and thousands of self-hosting sites do — but they're Google's subsets, so we'd be redistributing a modified version, which is the exact question the first option avoids.
- **Convert and subset ourselves.** Smallest, most controlled, most clearly a modification.

I've noted option 1 as the conservative default but haven't selected it — it's a licence-posture decision, not a technical one.

**2. The serving origin.** Which hostname and path shape platform fonts serve from. Both REQ-313's `use_font` (writes the `src`) and `1c fonts check` (resolves it) depend on this, so it wants settling before either starts.

**3. Worth a sanity check given the size.** "Ship everything for the AI" was decided when I thought this was a few hundred MB. At 1.35 GB it's still cheap in R2 terms, and I'd still mirror everything — but you should know the real number before it's treated as settled.

<!-- xgd-turn id="80392f69-9171-487f-9b55-d5bbbd6827af-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:56:11.407335+00:00" -->
#### You
what is the performance hit that we are concerned about? We need to download and convert these how often? Anually? They are part of the deploy but since they only change infrequently we only need to upload them infrequently (if our deploy tools are smart enough) and at the end of the day we serve the ones we use - which is true anyway so it will cost us what a few hundred MB of R2 storage - I'm not sure what the discussion here is of course we pull everything

<!-- xgd-turn id="80392f69-9171-487f-9b55-d5bbbd6827af-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:58:32.174466+00:00" -->
#### Claude
You're right — there is no performance hit, and I framed a non-issue as a decision. Concretely:

- **Visitor-facing: zero.** A page serves the two faces it uses. 1,941 in R2 is invisible to it.
- **Storage: ~$0.02/month.** 1.35 GB at R2's ~$0.015/GB-month. **Egress is free on R2**, so serving costs nothing per request beyond read ops.
- **Deploy: untouched.** The mirror is R2 objects, not Worker bundle — it persists across deploys independently, so it doesn't interact with the 10MB bundle limit or need smart deploy tooling. It's a data population step, not a build step.
- **Convert: once per refresh.** 3,808 files, well under an hour on one machine.

**Cadence:** upstream added 202 families in 2024, 122 in 2025, 42 so far in 2026 — so ~120–200/year. **Annual is fine**, with an ad-hoc run whenever we want something new. The case that actually warrants attention isn't additions, it's a family *removed* upstream, because a live site may be serving it — which is why the ticket already requires removals be reported rather than silently dropped.

Also taking "we need to download and convert these" as settling the format question — that's route 1, converting repo TTFs ourselves, which was the conservative default. Recording it as decided rather than leaving three options open.

The script died before writing, so the update re-applied the previous body — no changes lost, but none applied either. Let me check the actual headings.

Encoding mismatch on the captured body — em-dashes mangled, so the match failed silently. Redoing with explicit UTF-8 and verifying each edit applies.

REQ-312 updated and verified — that MISS was my check string, not the content.

**Now settled in the ticket:**

- **Format** — convert upstream TTFs to woff2 ourselves. Compression and container change, no glyph removed, no name altered, so the Reserved Font Name clause doesn't bite. gstatic's woff2 rejected explicitly (they're Google's subsets), as is subsetting by us.
- **Sizing** — reframed as a corrected fact, not a gate. ~$0.02/month, no egress, R2 objects rather than bundle content so deploys neither re-upload nor wait on it. **Pull everything** recorded as your decision.
- **Cadence** — annual refresh, with ad-hoc runs. Rationale in the ticket: ~120–200 families added per year, and falling a few months behind just means a family the assistant can't name yet.
- **Behaviour** gained three testable lines — same faces from the same commit, a refresh leaves already-served faces byte-identical, a deploy doesn't re-upload or wait.

**One question left in REQ-312:** the serving origin — which hostname and path shape platform fonts serve from. REQ-313's `use_font` writes that `src` and `1c fonts check` resolves it, so both wait on it. It's the last unsettled item across the whole epic.

<!-- xgd-turn id="0334efaa-a0e0-47d1-a3b1-81515c529cee-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T20:15:40.006593+00:00" -->
#### You
312 is in-flight!

What is your recommendation on where things are served from. I think it is highly desirable that a site is self-contained and everything it needs comes from its domain - is that problematic?

<!-- xgd-turn id="0334efaa-a0e0-47d1-a3b1-81515c529cee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T20:17:09.209600+00:00" -->
#### Claude
Noted on 312 being in-flight — let me check what state I edited into.

REQ-312 status is `free_coding` — actively being worked. Let me note that, then look at how site assets actually serve today.

Status is `free_coding` — so I edited REQ-312's body while someone was coding against it. Flagging that below.

## Recommendation: serve from the site's own domain

**Not problematic — it's the better design, and I conflated two independent decisions earlier.**

*Where bytes are stored* and *what origin the browser fetches them from* are separable. You can have **one shared R2 copy** served **through every site's own domain**. No copying, and the visitor never talks to a second host.

Four reasons same-origin actively wins, beyond your self-containment preference:

1. **The shared-CDN argument is dead.** All major browsers have partitioned the HTTP cache by top-level site since ~2020. "The visitor already has Roboto cached from another site" hasn't been true for years. A shared font origin buys *zero* cache reuse — it only costs.

2. **A second origin costs a connection.** DNS + TCP + TLS before the first font byte, on the critical path for text rendering. Same-origin rides the connection that's already open.

3. **CORS disappears.** `@font-face` fetches are CORS-restricted and need `crossorigin` plus correct `Access-Control-Allow-Origin`. Same-origin sidesteps it entirely — one fewer thing to misconfigure per domain.

4. **Privacy.** No third-party request from the visitor's browser at all. German courts have found Google Fonts CDN usage a GDPR violation specifically because it leaks visitor IPs to a third party. Our own platform origin would be less bad, but still third-party *from the site's perspective*.

**It also fits what's already built.** `public-site` owns every published byte and already serves `assets/` via a per-revision digest manifest and content-addressed `assets/d/`. Platform fonts become one more prefix on machinery that exists — the route resolves to the shared platform R2 prefix instead of the per-site one.

**Concretely:** one stored copy, N serving paths. Site requests `/<site>/assets/f/<hash>.woff2`; the route reads the shared object. I'd follow `assets/d/`'s precedent and make it **content-addressed** — immutable `max-age`, and a refresh that changes bytes cache-busts itself rather than needing a version scheme.

Takedown is unaffected: one stored object still means flip-and-purge, not an N-site sweep.

The only real cost is that each site's *edge* cache holds its own copy — but partitioning makes that true regardless, and edge cache is cheap.

## On REQ-312 being in-flight

I updated its body twice this session — the format decision (convert TTFs ourselves), the cadence, and the sizing reframe — and it was already `free_coding`. The edits made it *more* determined rather than less, and one replaced the open "woff2 problem" section with a settled answer, so it shouldn't invalidate work in progress. But whoever's coding it should know the contract moved under them.

Given that, how do you want the serving decision recorded? I'd rather not edit 312 a third time mid-flight. Options: put it in EPIC-21 and let REQ-313 pick it up from there, file it as its own small ticket, or go ahead and amend 312 if you'd prefer it all in one place.

<!-- xgd-turn id="24ed5a62-5781-4604-9e25-2d0614401e5a-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T21:13:21.892142+00:00" -->
#### You
put it in 312 and I will tell it to re-review

<!-- xgd-turn id="24ed5a62-5781-4604-9e25-2d0614401e5a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T21:15:53.892348+00:00" -->
#### Claude
Body has grown to 18,401 chars — the implementer has been adding to it. Let me see the current structure before touching anything.

The implementer has already added a **"The serving origin — SETTLED 2026-09-23"** section. Reading what they decided before I touch it.

They settled it the other way — shared platform origin, absolute platform-host URLs — with real reasoning. I'm not going to overwrite that; I'll preserve it, mark it under re-review, and put your preference beside it with the analysis.

No concurrent edit since I read it — safe to write.

REQ-312 moved into the reconcile pipeline between my read and my write — body is now frozen and the update was rejected. Let me check where it is and whether a comment still lands.

`ready_to_reconcile` with a commit — the work is done and queued. Body is frozen, but `add-comment` is a separate object. Posting the re-review there.

REQ-312 reached `ready_to_reconcile` between my read and my write — body frozen, update rejected. The re-review is posted as **COMMENT-3711** instead.

**Important: they settled the serving origin the other way from your preference.** The ticket records it as SETTLED — shared platform origin at `/_fonts/…`, `Access-Control-Allow-Origin: *`, and pages carrying an **absolute platform-host URL**. So when you send it back to re-review, that's the decision to reopen.

My comment preserves their reasoning and argues four things they didn't weigh:

1. **A shared origin buys no cache reuse** — browsers have partitioned the HTTP cache by top-level site since ~2020. Their year-long immutable caching is right; the cross-site sharing it implies isn't there.
2. **A second origin costs DNS + TCP + TLS** before the first font byte, on the path that decides whether text paints in the real face.
3. **CORS stops being load-bearing** — they need `Access-Control-Allow-Origin: *` *because* it's cross-origin.
4. **Third-party requests from visitors' browsers** — the same GDPR exposure that got Google Fonts embedding ruled against in German courts. Our origin is a better third party than Google's, still a third party from the customer's site's view.

**Their "forced" claim doesn't hold as stated.** They argue the absolute platform URL is forced because the renderer rewrites root-relative `url()` to document-relative. That's sound and rules out root-relative paths — but an absolute URL naming *the site's own* host passes through untouched by the identical rule. The constraint picks the URL's form, not whose domain it names. Their cross-tenant-guard objection is likewise already handled by their own mechanism: matching `/_fonts/` ahead of the site grammar works on a bound customer domain too.

**The one genuine argument for their choice, which they didn't make:** hostname stability. An absolute self-host URL baked into a rendered page goes stale if a site later binds or changes a custom domain.

That turns on a question I flagged rather than assumed: **are pages re-rendered and republished when a domain binding changes?** If yes, the staleness window is bounded by a step that already happens and the objection mostly dissolves. If no, they're right as written. Worth having the re-review answer that first — it decides the whole thing.

Storage is unaffected either way: one copy, one prefix, takedown still a flip and a purge. Only the host in the `src` changes.

<!-- xgd-turn id="78ba8174-1b92-4400-ad78-e4122caa8e17-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T23:10:57.757428+00:00" -->
#### You
Are fonts now available? Do I need to do a build how do I get these changes to the dev environment?

<!-- xgd-turn id="78ba8174-1b92-4400-ad78-e4122caa8e17-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T23:14:51.549942+00:00" -->
#### Claude
I'll check what actually landed rather than infer from the ticket state.

Both REQ-312 and REQ-313 landed. Now checking whether the bytes actually exist and how they reach dev.

Two more things that decide the answer — how the projection reaches the worker, and whether DOC-56 is embedded.

Checked the code, the artifacts, and the serving path. Here's where it actually stands.

## Are fonts available? No — the code is all there, none of the data is

All three requests landed on `xgd-working`:

| | |
|---|---|
| `00675d47ba` | REQ-311 — catalogue generator + DOC-56 |
| `f62cf1b0f7` | REQ-312 — mirror, registry tier, origin |
| `b02340216a` | REQ-312 follow-up — same-origin `_fonts/…` at every snapshot root (your COMMENT-3711 direction won) |
| `b89dfbcb0e` | REQ-313 — `use_font` |

But every artifact those commands *produce* is empty or absent:

- `fonts/mirror/` — **does not exist** (gitignored staging dir, never created)
- `fonts/platform.json` — **does not exist** (the manifest, tracked)
- `tools/generate/src/cli/ai/platform-fonts.json` — `{"mirror":null,"families":[]}`
- `kb/system/DOC-56.md` — **not exported**, so not embedded either

So today the assistant has neither the knowledge nor the bytes. `use_font` returns its `ENVIRONMENT` refusal ("mirror unpopulated" — exactly the case REQ-313 built for), and any `_fonts/…` request 404s.

## What you need to run

Four steps. Handing them over rather than running them — the first is a 2.5GB download, the third writes production R2.

```bash
# 1. once, and kept — deliberately not done by a build verb (~2.5GB)
git clone --depth 1 https://github.com/google/fonts ~/lagrangefoundry/google-fonts

# 2. convert TTF→woff2 into fonts/mirror/, write fonts/platform.json,
#    and auto-run `fonts index` to write the projection use_font reads
./bin/1c fonts mirror --repo ~/lagrangefoundry/google-fonts

# 3. upload to R2 bucket 1stcontact-sites under platform/fonts/
#    needs CLOUDFLARE_API_TOKEN — the 1c_Admin_Token, same one kb build uses
./bin/1c fonts publish

# 4. so the assistant knows what it can serve
./bin/1c kb export && ./bin/1c kb build
```

Step 2 is the long one. Steps 2 and 3 are both incremental and digest-checked, so an interrupted run resumes by re-running.

## Getting it to dev — and this is the problem

**`bin/deploy` has no fonts hook.** `fonts publish` is a standalone release-toolset step, like `1c kb build`. That's by design, and it matches what you asked for — acquired like a dependency, not rebuilt every deploy.

**But there is no path to the local dev environment at all.** `1c fonts publish` writes the *cloud* bucket over the R2 REST API. `1c builder` defaults to local `wrangler dev`, where `env.SITES` is miniflare's own R2 under `.wrangler/state` — which publish never touches. So after running all four steps, your local builder previews will still 404 every platform font.

`1c builder --remote` would work, but `dev-env.ts:199` is explicit that `--remote` points at the **deployed D1 and R2** — that's editing production data, not a dev mode you'd want to sit in.

The one thing that *does* read local disk is the Node builder transport (`builder.ts:161`, reading the staged `fonts/mirror/`), and its own header says it is test infrastructure and not a hosting path.

So: **production works after those four steps; local dev has no story.** That gap isn't in any of REQ-311/312/313 — it fell between the mirror ticket (which owned publish) and the serving change (which owned the reader seam).

One other thing worth knowing: `platform-fonts.json` is a **static import** (`ai/platform-fonts.ts:36`), so it's baked into the worker bundle. After step 2 you need a builder restart or a redeploy before `use_font` sees a populated mirror.

Want me to file the local-dev gap as a request under the epic? The obvious shape is a `--local` target on `fonts publish` that writes miniflare's R2 state directly, probably paired with `--only` so you stage a handful of families rather than 1.35GB into `.wrangler/state`. I'd rather scope that as a ticket than have you find it by hitting a 404 in the builder.

<!-- xgd-turn id="c1cc5bf4-4bf4-4efd-a05a-d10c7dd1c107-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T23:40:25.989366+00:00" -->
#### You
How long will 2 take? - is that 1900 lines?

Can you give me a couple of extra tools then:
bin/deploy --fonts

And that should deploy to dev or prod as directed please

<!-- xgd-turn id="c1cc5bf4-4bf4-4efd-a05a-d10c7dd1c107-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T23:45:22.770325+00:00" -->
#### Claude
Let me get you real numbers rather than a guess.

Now let me check what "dev" means in this repo's deploy vocabulary before scoping.

Answering the timing question first, then scoping the tool.

## How long step 2 takes

Not 1,900 lines — **1,940 families**, which is **3,808 font files, 2.45 GB of TTF** (REQ-312 measured that from the recursive OFL tree and put the table in its body).

I benchmarked the actual conversion. `sfntToWoff2` is Node's `brotliCompressSync` at `BROTLI_QUALITY = 11` — brotli's maximum — single-threaded, plus a full round-trip decode verification on every file.

**~0.65 MB/s**, consistent across a 1.4 MB and a 15 MB sample. So:

> **2.45 GB ÷ 0.65 MB/s ≈ 65 minutes of brotli — call it 75–90 minutes wall clock** with parsing, round-trip verification, hashing and writes.

It's incremental and digest-checked, so that's one-time and a re-run is near-free. But it's an hour and a half before you see a font.

**There's a cliff you should know about.** On the 15 MB sample:

| quality | time | output |
|---|---|---|
| q11 (default) | 23.6 s | 4.56 MB |
| q10 | 10.7 s | 4.63 MB |
| **q9** | **1.2 s** | 4.97 MB |

q9 is ~20× faster for ~9% more bytes. `1c fonts mirror --repo <dir> --quality 9` would finish in **under 10 minutes**. For getting fonts in front of you today that is obviously the right trade; for the production corpus it obviously isn't. The flag already exists — nothing tells you the cliff is there, which is how the default quietly costs 90 minutes when you wanted 5.

## bin/deploy --fonts

Filed as **REQ-315** under EPIC-21 — *"bin/deploy --fonts, and a dev target the font mirror never had"*. Scoped, not coded: this session is the epic, so the branch cut belongs to the child.

Two things I found while scoping that shaped it:

**It can't be a per-app deploy hook.** `bin/deploy` iterates apps, and two of them serve `_fonts/…` — but there's one bucket and the mirror isn't per-app. As a hook it would publish 1.35 GB twice; digest-checking means the second pass transfers nothing, but it still re-reads and re-hashes the whole corpus. So `--fonts` is a repo-level target, once per invocation.

**"Dev" is the half that doesn't exist.** Production is just `1c fonts publish` with a door on it — same REST API, same token, already incremental and resumable. But local dev needs the objects written into miniflare's R2 state (SQLite + a `blobs/` dir under `.wrangler/state/v3/r2/<bucket>/`), and **that state is per app directory** — `apps/control-app/.wrangler/state` and `apps/public-site/.wrangler/state` are separate stores. So "the local bucket" is two locations. Seeding only control-app leaves a locally-served published site 404ing the same fonts the preview next to it renders fine.

I defaulted it to `--env production` to match the rest of `bin/deploy`, with the local target selected explicitly — a deploy script that silently wrote a local store when you meant the cloud would be the wrong way round. Say if you'd rather it defaulted the other way.

One flag on the ticket: it assumes you want `--fonts` composable with the existing `--dry-run` and `--env`, not a separate subcommand. That's the cheaper read of "as directed" but it's a guess about your intent.

<!-- xgd-turn id="35e30292-28cb-499c-bc82-e29377205379-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T23:46:59.671302+00:00" -->
#### You
is the dev environment bin/deploy --env dev

<!-- xgd-chat-end -->