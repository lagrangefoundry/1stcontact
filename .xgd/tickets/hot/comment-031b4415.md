---
uid: comment-031b4415
id: COMMENT-3668
type: comment
title: Comment on epic EPIC-21
created_by: xgd
created_at: '2026-09-22T23:59:00.257742+00:00'
updated_at: '2026-09-23T02:18:16.694492+00:00'
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

<!-- xgd-chat-end -->