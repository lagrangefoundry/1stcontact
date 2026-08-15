---
uid: comment-299f1881
id: COMMENT-888
type: comment
title: Comment on chat CHAT-19
created_by: xgd
created_at: '2026-08-09T23:25:16.500469+00:00'
updated_at: '2026-08-15T01:09:54.889085+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-231d2cb0
  kind: chat_transcript
---

<!-- xgd-turn id="3a065f62-d714-40bf-b54b-a2c4da341fb1-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T23:25:12.144389+00:00" -->
#### You
We have had some discussions on this already. I think we decided that we were going to constraint ourselves to free fonts at least to begin with. However the first sight that we created xgd.dev apparently uses two paid fonts - great! 

Let's talk about font management and what would be involved in including paid fonts in the capabilities that we offer a user. Particularly if a user  is wedded to a font, can we let them upload it as an asset. How is licensing of fonts on the Internet managed?

<!-- xgd-turn id="3a065f62-d714-40bf-b54b-a2c4da341fb1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T23:27:13.625637+00:00" -->
#### Claude
I'll ground this in what we actually have first.

## First, a correction that matters to the discussion

Neither font on xgd.dev is paid.

- **JetBrains Mono** — SIL Open Font License 1.1. Genuinely open; already cleared `redistribute_in_product: true` in our registry.
- **Satoshi** — free from Fontshare under the **ITF Free Font Licence**. Free for commercial use, self-hostable, no money changes hands.

But Satoshi is the *interesting* case, and it's why we already flag it `REVIEW_REQUIRED`: the ITF FFL is **non-transferrable and terminable**. It licenses *us*, not everyone we hand a site to. So it demonstrates the distinction that runs through this whole topic — **"free" and "shippable as our product" are different questions.** Price is almost irrelevant; *transferability* is everything.

We also already have most of the machinery. REQ-101 shipped `fonts/registry.yaml` + `1c fonts check`, which joins every site's `l1.resources.fonts` against a provenance record and fails on unregistered families, unregistered files, unprovenanced bytes on disk, and product-distributed sites using fonts that don't permit it. That was built for exactly this conversation.

## How font licensing actually works on the web

Four tiers, and only the boundaries matter:

| Tier | Examples | Self-host? | Can *we* redistribute? |
|---|---|---|---|
| **Open (OFL/Apache)** | Google Fonts, JetBrains Mono, Inter, most of Fontshare's OFL set | yes | **yes** — conditions are just: keep the notice + licence, don't sell the files standalone, respect Reserved Font Names |
| **Free-with-strings** | Satoshi (ITF FFL), foundry giveaways | yes | **no, not without asking** — non-transferrable, revocable |
| **Commercial webfont** | MyFonts/Monotype, Klim, Grilli, Commercial Type | usually yes | **no** — explicitly forbidden |
| **Subscription/CDN-locked** | Adobe Fonts, Monotype Fonts | **no** (Adobe forbids self-hosting entirely) | no |

The structural fact that decides our product shape: **commercial webfont licences are per-licensee, and scoped by domain and/or monthly pageviews.** They near-universally prohibit sublicensing. Agencies and hosting platforms are *named* in most EULAs as parties who may not buy one licence and spread it across client sites.

So there is no engineering trick that lets us buy a paid font and offer it in a menu. Wix, Squarespace and Canva all offer premium fonts — they did it by negotiating **distribution/OEM licences foundry by foundry**. That's business development, not code.

## Can a user upload their own font?

Yes — and it's the right answer. It's the standard industry pattern (Webflow, Shopify, Squarespace on higher plans all do exactly this), and it's the only way to serve a customer who is genuinely wedded to Founders Grotesk.

The model is **bring your own licence**: the customer holds the licence, we hold a record that they asserted they do, and we serve the bytes at their direction. That's the hosting-provider posture — attestation at upload, indemnity in the ToS, and a takedown path if a foundry complains.

### What we'd need to build

The substrate is already there — `l1.resources.fonts` maps family→src, files live per-site under `draft/assets/`, and REQ-90 wired `@font-face` emission. The gaps are:

**1. Per-site provenance, not just project-level.** `fonts/registry.yaml` is git-tracked and project-scoped — correct for fonts *we* author with, wrong for 10,000 customer uploads. A customer font's record belongs with the site (D1, eventually), carrying: uploader, timestamp, asserted licence, the exact attestation text shown, and optionally an uploaded receipt/licence PDF.

**2. A third distribution class.** Today `config.distribution` is `internal | product`. A BYOL font is neither. It needs `customer`, with a hard invariant: **a customer-uploaded font is servable only from the site that uploaded it, and can never enter the shared font menu.** That's the one leak that would turn a customer's licence problem into ours.

**3. Upload validation and re-encoding.** Font files are parsed binary formats and a real historical attack surface (a long tail of FreeType/DirectWrite CVEs). Minimum: sniff the magic bytes, reject anything that isn't a genuine sfnt/WOFF2. Better: **re-encode through a subsetter** so we serve bytes *we* generated, not bytes they uploaded — which also buys us size reduction for free. Caveat: subsetting is itself modification, and some commercial licences restrict it, so that needs to be a declared step.

**4. Metadata extraction — the genuinely useful automated check.** OpenType's `name` table carries `nameID 13` (License Description) and `nameID 14` (License Info URL), and many commercial fonts embed their EULA there verbatim. `OS/2.fsType` carries embedding-permission bits; a "restricted" font is a loud signal. Extracting these at upload lets us show the user their own font's licence terms back to them, and store them in the provenance record — far stronger evidence than a tickbox alone.

**5. Serving posture.** Serve from the site's own origin with CORS scoped to that site rather than `*`, so the font isn't trivially hotlinkable. Some commercial licences actually require this.

## The product shape I'd recommend

| Tier | User sees | Licence held by | Our exposure |
|---|---|---|---|
| **Curated** | a small, art-directed font menu | nobody (OFL) | none |
| **Open library** | ~1,900 Google Fonts + Fontshare's OFL set, self-hosted | nobody (OFL) | none |
| **Bring your own** | upload + attestation | the customer | attestation + indemnity + takedown |
| *later* **Premium** | negotiated foundry catalogue | us, per foundry deal | contractual |

The first two tiers are much stronger than the "free fonts look cheap" instinct suggests — Satoshi and JetBrains Mono on xgd.dev are the proof. I'd treat the premium tier as a business-development item to revisit only when a real customer's deal turns on it.

## One live item

**Satoshi is currently a blocker on our own flagship.** If xgd.dev is ever marked `distribution: product`, `1c fonts check` will fail it — correctly. Either resolve the ITF FFL transferability question with ITF, or swap Satoshi for an OFL equivalent before that site ships as product. Worth deciding now rather than at publish time.

---

Happy to turn any of this into a ticket — the two obvious candidates are the **BYOL upload path** (per-site provenance + `customer` distribution class + upload validation) and the smaller, sharper **Satoshi licence resolution**. Say the word and I'll file them.

<!-- xgd-turn id="66a666e9-ad4a-492f-bc39-c34765e0502d-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T01:09:03.830622+00:00" -->
#### You
How do I (or a customer) prove that I bought a license? Is that an email exchange? Or is there something I can upload to the site to prove my ownership?

<!-- xgd-turn id="66a666e9-ad4a-492f-bc39-c34765e0502d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T01:09:54.388144+00:00" -->
#### Claude
## The honest headline: there is no verification standard

No certificate authority, no cryptographic signature, no central registry, no API any foundry exposes for third-party verification. Nobody in the industry can actually *verify* a font licence. Webflow, Shopify and Squarespace all resolve this the same way — a tickbox — because there is nothing better to resolve it with.

So the question isn't "how do we verify" but "what evidence do we collect, and what does it buy us." Four things exist, in increasing order of strength:

### 1. The purchase receipt — usually an email

Most commonly this *is* an email. Order confirmation from MyFonts, Fontspring, Adobe, or direct from the foundry. It typically names the licensee, the family, the licence type (desktop / web / app), the domain or pageview tier, the date, and an order number. Uploadable as a PDF or a saved `.eml`; PDF is what people actually have.

### 2. The licence certificate

Some foundries — Klim, Commercial Type, Grilli Type, Lineto — issue a proper per-purchase PDF certificate naming the licensee and the permitted domains. When it exists it's the best artifact available, because it states the *scope*, not just that money changed hands.

### 3. The vendor account

For MyFonts/Fontspring/Adobe, the account itself is the record of truth — order history, re-download. Useless to us directly, since there's no third-party lookup, but it means the customer can always retrieve the receipt.

### 4. The font file itself — the part we can automate

This is the one that costs the user nothing. OpenType's `name` table routinely carries:

| Field | What's in it |
|---|---|
| nameID 13 | **License Description** — many commercial fonts embed the EULA verbatim |
| nameID 14 | **License Info URL** |
| nameID 7 / 8 / 10 | Trademark, manufacturer, description |
| `OS/2.fsType` | Embedding permission bits — a "restricted" value is a loud signal |

And some foundries **stamp the licensee's name into the font binary at purchase**, or serve per-customer watermarked webfonts. So the file frequently carries its own evidence. Extracting this at upload and showing it back to the user is free, needs no cooperation from them, and is stronger than anything they'd type.

## The check that actually catches real problems

Most licence breaches here won't be fraud — they'll be **the desktop/web mix-up**, and it's very common. Someone buys a desktop licence to use a font in InDesign, gets `.otf` files, and uploads those to their website. That's a genuine breach they had no intention of committing.

The tell is the file format. A *web* licence almost always ships `.woff2` specifically. So:

> **If the upload is `.otf` or `.ttf` rather than `.woff2`, warn.** "This looks like a desktop font. Web use usually needs a separate web licence — check your purchase."

Warn, don't block — plenty of legitimate web licences do hand over `.ttf`. But this single check probably prevents more actual infringement than the entire attestation apparatus.

## What I'd have us collect

| Tier | What | Effort | What it buys |
|---|---|---|---|
| **Required** | Tickbox attestation | zero | Shifts liability, triggers the ToS indemnity |
| **Required** | Structured declaration: foundry, licence type, licensed domain(s), order ref, purchase date | ~30s | A liar must now lie *specifically*; and it's what we hand a foundry who emails us |
| **Optional** | Receipt / certificate upload (PDF or `.eml`), stored, never parsed | ~1 min | Produced on demand; strongest artifact we'll ever hold |
| **Automatic** | Extract nameID 13/14, fsType, trademark/manufacturer; flag desktop-format uploads | zero | Catches honest mistakes; surfaces the EULA the user probably never read |

The structured declaration is the part I'd fight for. A tickbox is legally sufficient but operationally useless — when a foundry emails saying "your customer is serving our font without a licence," a tickbox lets us say nothing. A declaration plus a receipt lets us answer the same day with a name, a date, an order number and a PDF, which is usually the entire dispute.

## What happens when a foundry does complain

Realistically: they email. Rarely a lawyer, usually a founder who ran a crawler. What we need is a **takedown switch** — disable the font on that site, fall back to the declared stack, notify the customer — and the ability to produce the record within a day. That combination is what keeps it a five-email exchange instead of a problem.

Worth restating: none of this touches the OFL/Google Fonts tiers. The whole apparatus exists only for bring-your-own, which will be a small minority of sites.

---

This has firmed up enough that I think the BYOL ticket is worth filing — it now has a concrete evidence model, not just an upload path. Want me to write it up?

<!-- xgd-chat-end -->