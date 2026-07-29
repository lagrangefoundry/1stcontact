---
uid: comment-cbcad23e
id: COMMENT-588
type: comment
title: Comment on chat CHAT-11
created_by: xgd
created_at: '2026-07-29T19:29:56.387350+00:00'
updated_at: '2026-07-29T19:35:01.135058+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-66d44613
  kind: chat_transcript
---

<!-- xgd-turn id="d2dbd500-5b10-4a43-bcb5-097b9a627e50-user" -->

<!-- xgd-chat role="user" ts="2026-07-29T19:29:54.374093+00:00" -->
#### You
We have a couple of sites now GigabyteAlchemy and xgd that are getting close to being ready to publish. I want to discuss the migration of the sites to Cloudflare

I want to keep moving us progressively towards the 1stcontact application so when we design the solution for this ticket it is intended to be a step towards that NOT a throw-away exercise. Please read the design documents to get oriented.

We are still creating sites locally on my laptop. I would like to continue to use this mechanism for site creating and modification, for now, but I would like to explore exposing the draft site on Cloudflare. I expect draft sites to appear under the 1stcontact.io domain something like https://1stcontact.io/site/gigabytealchemy_ai/draft/<SHA> the SHA is to make the URL hard to guess so people really need the link the "gigabytealchemy_ai/draft/" is possibly unnecessary but makes the link readable.

I am thinking that to move the sites in a way that is not throwaway we probably want to move the canonical store. Although maybe that is a second step - phase 1 we could copy them there - what do you think?

<!-- xgd-turn id="d2dbd500-5b10-4a43-bcb5-097b9a627e50-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-29T19:35:01.101774+00:00" -->
#### Claude
I'll get oriented on the current state before designing. Let me look at the repo, the `1c` CLI surface, and the relevant docs.

Let me verify the DNS/Cloudflare situation before I commit to a URL scheme.

Read the docs and dug into the actual state. Here's what I found and what I think.

## The state on the ground

| | Now |
|---|---|
| `1stcontact.io` | CF zone (adele/josh NS), **no A record** — nothing served yet |
| `gigabytealchemy.ai` | CF zone, already proxied and serving the *original* site you're reproducing |
| `public-site` / `control-app` Workers | routes declared in `wrangler.toml` (apex + `*.1stcontact.io`, `app.*`), bodies are `Hello from …` stubs |
| D1 | `db/migrations/` is empty; REQ-7 is still `draft` and carries a "must be reconciled to DOC-12" warning |
| R2 | **not enabled on the account** — `wrangler r2 bucket list` → `code: 10042, enable R2 through the dashboard`. Your OAuth token also has no `r2` scope, so it'll need a re-`wrangler login` after enabling |
| Sites | `gigabytealchemy`, `xgd`, `1stcontact`, `harbor-cafe` — all `draft/` only, `history.json` = `{"revisions": []}`. **Nothing has ever been published.** |

## Your URL scheme has a hard blocker

`https://1stcontact.io/site/gigabytealchemy_ai/draft/<SHA>` doesn't work with the current renderer, for a reason worth knowing:

```
storage/dist/sites/xgd/draft/index.html
  href="./theme.css"                      ← relative
  url("/assets/satoshi-400.woff2")        ← ROOT-absolute, inside CSS url()
  url("/assets/xgd-grid-hero.svg?v=3")
```

Those come straight from the authored L1 document (`draft/pages/home.json` literally contains `"/assets/satoshi-400.woff2"`). Under a path prefix they resolve against the apex and 404. And `<base href>` does **not** apply to `url()` inside CSS — so the obvious fix isn't a fix.

Also: `_` is not legal in a DNS hostname label, so `gigabytealchemy_ai` can't be a subdomain (it's fine in a path, but see below).

The three ways out:

1. **Render-time base-prefix rewrite** — bakes the URL into the bytes. Kills content-addressing: promoting a draft SHA to published requires a *re-render*, not a pointer flip. I'd avoid.
2. **Normalise all asset refs to relative** (`./assets/…`). Genuinely attractive — makes the artifact relocatable to any host *or* path. All pages are flat at the site root today so depth is uniform. But it touches L1 emission, which sits under the round-trip gate (`capture(render(L1)) ≈ L1`), so it needs costing, not assuming. Good candidate for later.
3. **Serve each snapshot at a host root.** Zero renderer change, artifact stays immutable and location-independent.

I recommend (3) now, keeping (2) on the list as a cleanup that would later *also* enable the path form.

```
draft preview   gigabytealchemy-draft-a1b2c3d4.1stcontact.io
published       gigabytealchemy.1stcontact.io          ← DOC-7's committed scheme
apex            1stcontact.io                          ← the 1stcontact site, when you want it
```

Single-level wildcard, so Universal SSL already covers it — no Advanced Certificate Manager. It also happens to be *better* for unguessability than `<sha>.preview.1stcontact.io`: with a wildcard cert no per-host certificate is issued, so the SHA never appears in Certificate Transparency logs. Add `X-Robots-Tag: noindex` on the draft channel.

If you want your readable link back, the apex can 302 `1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4` → the subdomain. The *shared* link is then readable; only the address bar shows the ugly one. Costs ~10 lines.

Label budget: 63 chars total, so `-draft-` + 8 hex leaves slug ≤ 48. Worth landing the slug validation REQ-7 already anticipates.

## Copy vs move the canonical store

Neither, quite. I think the useful cut isn't *how much* to move — it's **separating serving from storing**, and doing only serving now.

Moving canonical storage to D1 while authoring stays on your laptop is the one configuration no end state has. You'd get local files that must sync bidirectionally with D1 — strictly worse than either endpoint, and *that's* the throwaway work. The reason to move the store is that a server-side editor needs to read and write it; until control-app exists, D1 buys nothing and costs a sync problem. So the trigger for Phase 2 is clean: **the store moves when the builder lands, not before.**

But a plain "copy the rendered folder up" is under-specified rather than wrong. The question is *what artifact crosses the wire*, and DOC-12 already answers it: a revision is an immutable, complete snapshot (definition + assets + metadata); published output is derived; live = latest. DOC-12 §7's CF mapping already routes revision snapshots to R2. So Phase 1 is: **make the snapshot a first-class R2 artifact and let the Worker serve it.** `1c` stays the producer; Cloudflare becomes the server.

Concretely:

```
r2://1stcontact-sites/
  sites/<slug>/manifest.json          revision list + channel pointers
  sites/<slug>/rev/0001/source/       site.json, pages/, assets/   ← the DOC-12 snapshot
  sites/<slug>/rev/0001/out/          rendered static output
  sites/<slug>/preview/<sha>/out/     draft snapshots (GC-able)
```

Two deliberate details:

- **Upload `source/` alongside `out/`.** Costs almost nothing and makes the R2 revision a *complete* DOC-12 revision. Phase 2 then becomes "import R2 revisions into D1" rather than "re-derive the history from a laptop."
- **A draft deploy is a *preview snapshot*, not a revision** — immutable, SHA-addressed, garbage-collectable, and it never enters `history.json`. That keeps DOC-12's mutable-draft/immutable-revision split intact and lets you share previews freely without minting revision numbers.

Three pieces of work:

1. `1c deploy <slug> [--channel draft|published]` — render (exists), hash the output, upload, update manifest, print the URL.
2. `public-site` Worker — parse host → `(slug, channel, sha?)`, resolve, stream from R2, correct content-types, `immutable` cache + Cache API on SHA-addressed paths, `noindex` on draft.
3. A single **`SiteStore` accessor** in the Worker — R2-manifest-backed now, D1-backed in Phase 2. One function to swap; nothing else in the Worker knows.

This also closes DOC-7 §11.3's open question in passing. Workers Static Assets binds assets to a *deployment*, so every publish and every preview link would be a Worker deploy — that doesn't go multi-tenant. R2 + Worker is the right call and matches DOC-5 §5 ("R2 for static build artifacts").

What survives Phase 2 verbatim: the R2 layout, the SHA/revision addressing, the hostname grammar and route table, all the serving logic, the `SiteStore` interface, and the DNS/TLS setup. What changes: `SiteStore`'s implementation, and the renderer moves server-side. That's the non-throwaway test, and I think it passes.

Worth noting the risk profile: `gigabytealchemy.ai` is already live and proxied with the original site. Phase 1 touches only `*.1stcontact.io`, so the custom-domain cutover stays a separate, deliberate later step with zero exposure now. Same for the apex — leave it unrouted until you actually want the marketing site public.

## Before I write the ticket, four decisions

1. **R2 needs enabling in the dashboard** (and probably a `wrangler login` afterwards for the `r2` scope). That's yours to do — do you want me to proceed on the assumption it'll be there, or hold?
2. **Draft privacy.** DOC-12 says draft output is "author only (private)". Unguessable-URL is *not* private — it's the Vercel/Netlify preview model. Fine by me for now, but it contradicts DOC-12 as written, so either you accept it (and I amend DOC-12's wording) or drafts wait for control-app auth.
3. **Readable redirect** at the apex — worth the ~10 lines, or skip it?
4. **Slug vs domain.** Your example said `gigabytealchemy_ai`, implying the slug encodes the target domain. Current slug is `gigabytealchemy`. I'd keep slug as the platform identifier and make custom domain a separate site field — confirm?

Once you've called those, I'll scope it onto CHAT-11 with the behaviour description and test plan before touching code.

<!-- xgd-chat-end -->