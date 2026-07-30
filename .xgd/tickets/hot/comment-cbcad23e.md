---
uid: comment-cbcad23e
id: COMMENT-588
type: comment
title: Comment on chat CHAT-11
created_by: xgd
created_at: '2026-07-29T19:29:56.387350+00:00'
updated_at: '2026-07-30T23:02:45.744289+00:00'
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

<!-- xgd-turn id="07a65c0c-4675-429c-904c-a4621a5ee591-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T18:42:53.749443+00:00" -->
#### You
1. Please give me the commands to run
   2. Lets discuss - I see value in being able to share draft sites and unguessable seems sufficiently private to me at least for v1. Once we have user login we can tighten up and offer more robust control like google docs. Its not worth gating publication on having access control
   3. I don't understand this one
   4. ok
   
   Can you playback the storage and workflow for the design you are proposing, I am a little unclear what you are suggesting?

<!-- xgd-turn id="07a65c0c-4675-429c-904c-a4621a5ee591-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-30T18:45:22.852908+00:00" -->
#### Claude
Good — let me nail down one thing that changes my recommendation, then play the whole design back.

## 1. Commands to run

Step one is dashboard-only — there's no CLI to enable R2 on an account:

**In the browser:** https://dash.cloudflare.com/8feaadfce95919ab2d2b93aa8df6f6ce/r2 → **Enable R2**. It asks for a payment method even though the free tier (10 GB-month storage, 1M Class A ops, 10M Class B ops/month) will cover us for a long time — our whole corpus is a few MB.

Then, from `/Users/martin/Projects/1stcontact`:

```bash
# Re-mint the OAuth token — your current one has no r2 scope
./node_modules/.bin/wrangler login

# Verify: should now list "r2 (write)" among the scopes
./node_modules/.bin/wrangler whoami

# Should return an empty list rather than error 10042
./node_modules/.bin/wrangler r2 bucket list

# Create the bucket
./node_modules/.bin/wrangler r2 bucket create 1stcontact-sites
```

DNS: `1stcontact.io` has no proxied record, so the declared Worker route can't resolve yet. Rather than hand-adding a placeholder record, I'd switch `apps/public-site/wrangler.toml` from a `routes` entry to `custom_domain = true` — wrangler then provisions the DNS record and cert itself on deploy. That's a config change I can make when we implement; no manual DNS step for you.

Tell me when R2 is enabled and I'll run the verification commands myself.

## 2. Draft privacy

Agreed, and I think that's the right call — gating publication on access control would be the tail wagging the dog. I'll amend DOC-12's "author only (private)" wording to say drafts are shared by unguessable URL, with real ACLs arriving with login. Doc change, no code.

## 3. What I meant — and why it's now moot

I was assuming previews had to live on a subdomain (`gigabytealchemy-draft-a1b2c3d4.1stcontact.io`), because root-absolute `/assets/…` refs break under a path prefix. The redirect was a consolation prize: let you *share* the readable `1stcontact.io/site/…` link, which would then 302 to the ugly subdomain.

Then I looked at the renderer, and the constraint is softer than I thought. There is exactly **one** CSS `url()` sink:

```ts
// packages/framework/src/l1/render.ts:105
function cssUrl(src: string | undefined): string | null {
  if (!src) return null
  const v = src.trim()
  if (!isSafeUrl(v) || !CSS_URL_ALLOWED.test(v)) return null
  return `url("${v}")`
}
```

One hardened chokepoint, plus the equivalent for `<img src>`. Normalising `/assets/x` → `assets/x` at those two points makes the rendered output **relocatable** — it works at any path *or* any host. Every page is flat at the snapshot root (`index.html`, `home.html`), so the relative depth is always zero; and `CSS_URL_ALLOWED` already permits the characters.

So: **your original URL works, verbatim, and no redirect is needed.** Better still, it drops the wildcard-DNS dependency entirely — proxied wildcard records are plan-dependent on Cloudflare and I couldn't confirm they're available on this zone. Phase 1 now needs one hostname: the apex.

The cost is re-baselining the fidelity/round-trip gates, since the emitted bytes change. The authored L1 stays exactly as it is — sites keep writing `/assets/…`, so no ticket churn on `xgd` or `gigabytealchemy`.

## 4. Slug stays the platform identifier

Confirmed — `gigabytealchemy`, with custom domain as a separate site field later.

---

# Playback: storage and workflow

## Local — unchanged, still canonical

```
storage/sites/gigabytealchemy/
  draft/              site.json, pages/*.json, assets/*     ← you edit here
  revisions/0001/     immutable snapshot, written by `1c publish`
  history.json        revision log
storage/dist/sites/gigabytealchemy/draft/                   ← rendered output, disposable
```

Nothing about how you author or modify sites changes.

## R2 — new

```
r2://1stcontact-sites/
  sites/gigabytealchemy/manifest.json
  sites/gigabytealchemy/preview/a1b2c3d4/out/     index.html, theme.css, capabilities.js, assets/…
  sites/gigabytealchemy/preview/a1b2c3d4/source/  site.json, pages/, assets/
  sites/gigabytealchemy/rev/0001/out/
  sites/gigabytealchemy/rev/0001/source/
```

```json
// manifest.json
{
  "slug": "gigabytealchemy",
  "live": 1,
  "revisions": [{ "id": 1, "publishedAt": "2026-07-30T…", "message": "launch" }],
  "previews": [{ "sha": "a1b2c3d4", "createdAt": "2026-07-30T…", "basedOn": 1 }]
}
```

Two things to notice. `out/` is the rendered artifact the Worker serves. `source/` is the DOC-12 snapshot — it costs a few hundred KB and it's what Phase 2 imports into D1, so the store move reads from R2 rather than from your laptop.

## Workflow A — share a draft

```bash
$ 1c render gigabytealchemy          # existing
$ 1c deploy gigabytealchemy          # NEW (--channel draft is the default)
```

`deploy` hashes the rendered output → `a1b2c3d4`, uploads `out/` + `source/` under `preview/a1b2c3d4/`, appends a preview entry to the manifest, and prints:

```
https://1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4/
```

Edit, deploy again, get a new SHA and a new link. Old links keep working because snapshots are immutable — which is what makes "here's what it looked like on Tuesday" free. `1c deploy --prune` garbage-collects previews.

Note a preview snapshot is **not** a revision: it never enters `history.json` and never mints a revision number. That keeps DOC-12's mutable-draft / immutable-revision split intact and lets you share previews as freely as you like.

## Workflow B — publish

```bash
$ 1c publish gigabytealchemy -m "launch"          # existing: draft/ → revisions/0001, renders
$ 1c deploy gigabytealchemy --channel published   # NEW: uploads rev/0001, sets manifest.live = 1
```

```
https://1stcontact.io/site/gigabytealchemy/       ← Phase 1
https://gigabytealchemy.1stcontact.io/            ← later, when we do subdomains
https://gigabytealchemy.ai/                       ← later still, custom domain cutover
```

`gigabytealchemy.ai` currently serves the original site you're reproducing, and Phase 1 touches only `1stcontact.io` — so there's zero exposure to anything live.

## Worker — the request path

```
GET 1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4/assets/satoshi-400.woff2

  parseRoute      → { slug, channel: 'draft', ref: 'a1b2c3d4', file: 'assets/satoshi-400.woff2' }
  SiteStore       → r2 prefix  sites/gigabytealchemy/preview/a1b2c3d4/out/
  R2 GET          → stream, content-type by extension
  Cache-Control   → public, max-age=31536000, immutable      (SHA-addressed, never changes)
  X-Robots-Tag    → noindex                                  (draft channel)
```

For the live published URL there's no SHA, so `SiteStore` reads `manifest.live` → `rev/0001/out/index.html`, with a short TTL and a Cache API purge on deploy. `/site/` is a reserved prefix, so it won't collide with the 1stcontact marketing site when that eventually occupies the apex root.

`SiteStore` is one small accessor — `resolve(slug, channel, ref) → prefix` plus `live(slug)`. It is the seam.

## What Phase 2 actually changes

| | Phase 1 | Phase 2 |
|---|---|---|
| `SiteStore` impl | reads `manifest.json` from R2 | reads D1 `sites` / `revisions` / `pages` |
| Site definition | local files, `source/` mirrored to R2 | D1 canonical, imported from R2 `source/` |
| Renderer | local `1c` | server-side, in control-app |
| Route grammar, R2 `out/` layout, SHA addressing, caching, deploy semantics, DNS/TLS | — | **unchanged** |

Which is the point: Phase 2 is "swap one accessor and move where rendering runs," not a rebuild. And it's triggered by the builder needing server-side reads and writes — not by a date.

---

Two things I'd like your read on before I scope it onto CHAT-11:

**Is the renderer change in or out of Phase 1?** In: your readable URL works and no wildcard DNS is needed. Out: previews need subdomains and the wildcard question becomes blocking. I'd put it in, but it means re-baselining the fidelity gates on both sites, and you're mid-flight on reproduction work (REQ-108 and friends) — so it's your call whether that churn lands now.

**Does `1c deploy` also render, or require a prior `1c render`?** `publish` already renders implicitly. I'd have `deploy` render too, so there's no way to ship stale bytes — but that makes it slower and less obviously a pure upload.

<!-- xgd-turn id="94614e3b-d36a-4eb6-8b62-ea68f4cd0471-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T19:29:48.047882+00:00" -->
#### You
((.venv-working) ) martin@nyx 1stcontact % ./node_modules/.bin/wrangler login

⛅️ wrangler 4.106.0 ──────────────────── Attempting to login via OAuth... Opening a link in your default browser: https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20ai-search%3Awrite%20ai-search%3Arun%20websearch.run%20agent-memory%3Awrite%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20artifacts%3Awrite%20flagship%3Awrite%20containers%3Awrite%20cloudchamber%3Awrite%20connectivity%3Aadmin%20email_routing%3Awrite%20email_sending%3Awrite%20browser%3Awrite%20offline_access&state=orhJAA2mHHeQ5eM~-r9pu1yk9U.cO6U~&code_challenge=1tkjPxDP4icMdGJpzzRyW3WtwYoCY5Q1FVyiDkAJRaI&code_challenge_method=S256 Successfully logged in. ((.venv-working) ) martin@nyx 1stcontact % ./node_modules/.bin/wrangler whoami

⛅️ wrangler 4.106.0 (update available 4.116.0) ─────────────────────────────────────────────── Getting User settings... 👋 You are logged in with an OAuth Token, associated with the email martin-cloudflaire@westhead.me. ┌──────────────────────────────────────────┬──────────────────────────────────┐ │ Account Name │ Account ID │ ├──────────────────────────────────────────┼──────────────────────────────────┤ │ Martin-cloudflaire@westhead.me's Account │ 8feaadfce95919ab2d2b93aa8df6f6ce │ └──────────────────────────────────────────┴──────────────────────────────────┘ 🔓 Token Permissions: Scope (Access)

- account (read)
- user (read)
- workers (write)
- workers_kv (write)
- workers_routes (write)
- workers_scripts (write)
- workers_tail (read)
- d1 (write)
- pages (write)
- zone (read)
- ssl_certs (write)
- ai (write)
- ai-search (write)
- ai-search (run)
- websearch.run
- agent-memory (write)
- queues (write)
- pipelines (write)
- secrets_store (write)
- artifacts (write)
- flagship (write)
- containers (write)
- cloudchamber (write)
- connectivity (admin)
- email_routing (write)
- email_sending (write)
- browser (write)
- offline_access ((.venv-working) ) martin@nyx 1stcontact % ./node_modules/.bin/wrangler r2 bucket list

⛅️ wrangler 4.106.0 (update available 4.116.0) ─────────────────────────────────────────────── Listing buckets...

((.venv-working) ) martin@nyx 1stcontact % ./node_modules/.bin/wrangler r2 bucket create 1stcontact-sites

⛅️ wrangler 4.106.0 (update available 4.116.0) ─────────────────────────────────────────────── Creating bucket '1stcontact-sites'... ✅ Created bucket '1stcontact-sites' with default storage class of Standard. To access your new R2 Bucket in your Worker, add the following snippet to your configuration file: { "r2_buckets": [ { "bucket_name": "1stcontact-sites", "binding": "_1stcontact_sites" } ] } ((.venv-working) ) martin@nyx 1stcontact %

Lets make the renderer change its small

Sure deploy can render - make sure its clear in the command output what it is doing though?

Can you create tickets for this work now, please?

<!-- xgd-turn id="94614e3b-d36a-4eb6-8b62-ea68f4cd0471-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-30T19:36:14.922609+00:00" -->
#### Claude
R2 is live and the bucket exists. Both decisions noted: renderer change is in, `deploy` renders with explicit staged output.

Let me check the ticket conventions before I write these.

Confirmed three URL sinks. Writing the tickets now.

Now creating the tickets:

Three tickets created, all at `draft` (I won't promote them — that's your call):

| Ticket | Points | Scope |
|---|---|---|
| **REQ-109** | 2 | Relocatable output — document-relative asset URLs at the three renderer sinks |
| **REQ-110** | 3 | R2 artifact store + `1c deploy` |
| **REQ-111** | 3 | `public-site` Worker serves previews and published sites from R2 |

CHAT-11 now carries the design record — the serving-vs-storing decision, the URL scheme and what was rejected, the phase-2 boundary, every decision taken in session, and the account state (bucket created, `1stcontact.io` unrouted, `gigabytealchemy.ai` untouched). Appended, so the existing body and the `xgd-chat-end` marker are intact.

Four judgement calls I made while writing them up, since you should know rather than discover them:

**Trailing slash is load-bearing.** Once asset URLs are relative, `/site/xgd/draft/<sha>` without the trailing slash resolves `assets/x.svg` one directory too high. The Worker must 301 the bare form. That's in REQ-111 as a correctness requirement, not a polish item — it's the kind of thing that would otherwise show up as "fonts work on my machine but not from the link I sent."

**Snapshot id is a 12-hex content hash** (48 bits), so redeploying identical content is a no-op that returns the same link. The honest caveat: a content hash is derivable by anyone who can reproduce the exact rendered bytes, so it's not *cryptographically* unguessable the way a random token would be. Impractical to exploit, and given you've accepted unguessable-URL privacy for v1 I don't think it changes the calculus — but if it ever does, the fix is a random token in the manifest pointing at the content-addressed key, with no layout change.

**One wart I couldn't design away cheaply.** Published URLs aren't revision-scoped, so `/site/<slug>/assets/x.svg` can't be cached immutably. Deploying a new revision leaves a ≤60s window where a browser can pair new HTML with cached old CSS. Documented in REQ-111 as accepted for v1; the fixes (revision-scoped published asset paths, or purge-on-deploy) are both additive. Draft previews don't have this problem at all — they're SHA-addressed and cached `immutable`.

**`draft` becomes a reserved path segment** within a site, so a published page can't be named `draft`. REQ-110 validates it at deploy time so the collision can't happen rather than merely being unlikely.

One thing still outstanding, and it's yours to greenlight: **DOC-12 says draft output is "author only (private)"**, which the unguessable-URL model contradicts. It also has no concept of a preview snapshot (immutable, GC-able, never entering `history.json`) — that's new vocabulary this design introduces. Both want amending in DOC-12 itself rather than living only in a REQ. Want me to do that now? It's a doc change, so no free-coding ceremony.

On sequencing, I'd start with REQ-109. It's the prerequisite for the other two, it's the smallest, and it carries the only real unknown in the batch — how much the fidelity and round-trip gates need re-baselining once emitted bytes change. Better to learn that before building on top of it. Say the word and I'll pick it up.

<!-- xgd-turn id="b76fa3ec-6b18-43dd-9db0-81eb31f0ffb9-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T23:02:45.709604+00:00" -->
#### You
ok the three reqs have been run can how do I push to cloudflare?

<!-- xgd-chat-end -->