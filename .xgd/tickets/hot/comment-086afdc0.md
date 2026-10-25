---
uid: comment-086afdc0
id: COMMENT-2845
type: comment
title: Comment on bug BUG-86
created_by: xgd
created_at: '2026-09-12T00:45:10.184557+00:00'
updated_at: '2026-09-12T20:39:04.895284+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d763b461
  kind: chat_transcript
---

<!-- xgd-turn id="d4e79e76-70cd-458c-aca8-b7dc4217abf0-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:45:02.444077+00:00" -->
#### You
Hittin "Apply to join the early beta" in 1stcontact website produces "Something went wrong (404). Please try again."

<!-- xgd-turn id="d4e79e76-70cd-458c-aca8-b7dc4217abf0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:49:41.481114+00:00" -->
#### Claude
I've traced it. Let me record the diagnosis on the ticket.

Found it. Diagnosis is on BUG-86.

**The form's action is root-relative, so it lands on a route that doesn't exist.**

`beta-form.config.action` is `/api/lead`. `component.ts` emits that verbatim, and a root-relative action resolves against the *origin*, throwing away the document's directory. In the builder preview the page is served at `/b/<biz>/preview/1stcontact/draft/`, so the submit goes to `https://app.1stcontact.io/api/lead` — which `control-app` has no route for. It falls through the whole route table to `env.ASSETS.fetch()` (router.ts:3218), which answers 404. That's exactly the status `client.js` prints.

The preview endpoint BUG-78 built is at `/preview/<slug>/draft/api/lead` (router.ts:3178). A root-relative action can never reach it.

I confirmed this isn't production: `GET https://1stcontact.io/` is still 404 (nothing published) and `POST /api/lead` there answers 405, not 404. `handleLead` can't return 404 at all — its answer set is 200/400/403/413/415/503.

**BUG-78 wrote this value, and its own text says what it should have been** — its "Two findings" section already names `api/lead` (no leading slash) as correct. Document-relative resolves right in all three surfaces:

| Surface | `api/lead` → | |
|---|---|---|
| preview | `/b/<biz>/preview/<slug>/draft/api/lead` | route exists |
| published apex | `/api/lead` | apex resolves |
| published non-apex | `/site/<key>/api/lead` | **correct tenant** |

That last row matters: all three shipped forms (`1stcontact/home`, `xgd/home`, `xgd/whitepapers`) carry `/api/lead`, and for the two non-apex `xgd` ones that means their leads would land in the *apex* tenant's contact list once published. That's BUG-78's finding 2 — same root cause, same one-character fix.

**Which fix do you want?** I've written three on the ticket:

- **A — data only.** Rewrite the three action values to `api/lead` the way BUG-78 applied its edit. No repo code, no reconciliation. Closes the 404 and the cross-tenant leak. Doesn't stop it recurring.
- **B — data plus a guard.** A, plus either a `contact-form` validation refusing a root-relative `/api/lead`, or a UAT that renders each shipped site and asserts the emitted action resolves to a route that exists.
- **C — stop it being a dial.** `action` is free-text `{type: 'url', required: true}`, and the product's own endpoint isn't a URL an operator should type. A sentinel would let the renderer emit the right relative target itself, keeping free-text for the DOC-47 case (post to a mailbox the client already has). Schema change — bigger than a bug fix.

My recommendation is **B**: A alone leaves a trap that has now sprung twice, and C is a real design decision that deserves its own ticket rather than riding in on a 404.

<!-- xgd-turn id="7806f4bd-ab56-47c0-855f-4b6fb6bdd75c-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:53:54.191380+00:00" -->
#### You
OK, so I am confused. I don't understand why this is "data". This feels like it should be figured out written once correctly, perhaps with parameters associated with the specific site and nailed in place. Are you telling me that we have to get the production AI to get this right every time or the form breaks?

Maybe we need a guard, but I think the model for where these characters come from sounds broken

<!-- xgd-turn id="7806f4bd-ab56-47c0-855f-4b6fb6bdd75c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:56:39.659547+00:00" -->
#### Claude
You're right to push on this, and the answer to your question is yes — that's exactly what the current model requires. Let me verify how these values actually get authored before I propose the fix.

This changes the picture. Let me check one more thing — whether page slugs can nest, since that decides whether a relative action is always correct.

You're right, and it's worse than I framed it. Let me record what I found.

You're right — I mis-framed it as data. It's three defects, and the model is broken in the way you suspected.

**1. There's a real renderer bug, and it's the actual cause of your 404.**

`l1/render.ts` has `relativizeUrl` (line 157), which turns `/x` into `./x`. It exists for REQ-109 relocatability and carries BUG-30's RFC-3986 edge cases. Every URL sink in the renderer goes through it — link `href`, image `src`, CSS `url()`, `srcset` — **except the form action**, which `component.ts:110` emits verbatim through `assertSafeUrl` alone.

So the action is the one reference on a rendered page that doesn't survive being served under a channel prefix. Every asset in the preview resolves fine; the form alone posts to the origin root. That's code, not data — and fixing it also closes BUG-78's cross-tenant leak, since `./api/lead` under `/site/<key>/` names that site instead of the apex.

**2. To your question — yes, the AI has to get it right every time.** The entire guidance it gets is `- action — url; required` (`REF-behaviors.md:27`). No default, no hint the product has a lead endpoint, nothing saying the value must be relative.

**3. And it's currently being told to get it wrong.** DOC-47 — live system knowledge — still says *"the published site is read-only… there is no 1st Contact inbox behind the form yet… that's an address you already have."* REQ-223 built that inbox and never updated DOC-47.

The store reads exactly as that instruction predicts:

| Value | Origin |
|---|---|
| `https://app.1stcontact.io/beta-apply` | AI-authored, never existed (BUG-78) |
| `https://api.gigabytefoundry.ai/contact` | AI-authored external address, as DOC-47 directs |
| `https://example.com/enquiry` | AI-authored placeholder |
| `/api/lead` | **only ever typed by a human** — BUG-78's manual edit, and the xgd seed |

A third-party action also silently loses everything REQ-223 built: no contact record, no asset delivery, no server-side honeypot, no Turnstile (the secret is ours). It looks like lead capture and isn't.

**On your "parameters associated with the specific site" instinct** — it needs no parameter at all. Document-relative `api/lead` is correct for every site in every channel, because page slugs are one flat segment, so a document's directory is always its channel root. That's the same invariant `routes.ts` protects via `htmlFallbackFor`'s trailing-slash refusal and REQ-109 relies on for `theme.css`. Nailing it in place is strictly better than parameterising it.

So the fix I'd propose, all under BUG-86:

1. Route the action through `relativizeUrl` (needs exporting; currently module-private). Fixes the 404 and the leak.
2. Make `action` optional, defaulting to the lead endpoint the component resolves itself — keeping an explicit escape hatch for a genuine third-party endpoint rather than making it the thing you fall into.
3. Update DOC-47 to say the inbox exists, and rebuild the KB.
4. Correct the four stored values.

One judgment call I'd like your steer on before I cut the branch: **should the third-party escape hatch survive at all?** Keeping it means the failure mode that produced `https://example.com/enquiry` stays reachable, just no longer the default. Removing it makes the form always the product's lead capture, and a client needing an external endpoint becomes a new ticket with a real design. I lean toward keeping it — DOC-47's "a form that silently posts nowhere is the worst possible outcome" is still true, and an explicit opt-out is honest — but it's your product call.

<!-- xgd-turn id="5574f085-8387-445b-b7d2-be0d8d4c9b6b-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T19:13:10.985413+00:00" -->
#### You
So in my mind the module should be self-contained, it should be automatically provisioned by the system with the correct URLs etc. etc. The AI has freedom to style and arrange it with any look but it should not need to set up its functionality.

I don't know what the third-party escape hatch is? Are you suggesting we allow the form to post to other locations? Why would we do that? This is an email capture module, it is to capture emails into your site, this is not a general web form module

<!-- xgd-turn id="5574f085-8387-445b-b7d2-be0d8d4c9b6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T19:43:12.775195+00:00" -->
#### Claude
Agreed — I'll drop the escape hatch. I raised it because DOC-47 describes that case, but DOC-47 describes it as a workaround for an inbox that didn't exist yet. It exists now, so the field is vestigial. An email-capture module that can be pointed at someone else's server is just a hole.

Let me check what removing the config key implies for stored instances.

The machinery for this already exists (BUG-85's migrations). Let me scope the decision onto the ticket.

node_modules is present. Now the implementation — starting with the endpoint constant.

Now the meta — removing `action`, bumping to v5 with a migration.

Now the component — it emits the endpoint itself.

Now point `public-site` at the single definition.

Let me typecheck before going further.

Pre-existing lib/types noise, nothing from my change. Let me see the blast radius on existing tests.

145 failed files needs a baseline before I trust it. Let me get one and classify my failures at the same time.

Baseline is 9 failed files; mine is 145. The version bump orphaned every `v4` fixture in the suite — the exact BUG-85 failure. That churn is real, so let me see its shape before deciding how to absorb it.

The JSON reporter is too slow. Let me fix the known fixtures and re-measure.

Storage files only — my grep missed the test files' unquoted form. Let me redo those.

More fixtures reference `action` without a version pin. Let me look at the semantics before bulk-editing.

These assertions encode the contract being removed, so they have to move. Let me sweep the configs first.

Configs are clean. Now the assertions — let me re-run and see what's left.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="4ba2bb71-881f-4a2a-bb00-7c6fc0deddf8-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T19:48:59.560435+00:00" -->
#### You
Please continue. Can you also update DOC-47 so we don't confuse ourselves going forward, please.

<!-- xgd-turn id="4ba2bb71-881f-4a2a-bb00-7c6fc0deddf8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T20:06:18.643158+00:00" -->
#### Claude
The full-suite run got OOM-killed (137). Let me run the affected files in smaller batches instead.

Let me handle DOC-47 now, then continue the sweep.

The `.xgd` stores are per-worktree, and a doc ticket is xgd-managed data. Let me apply it through the CLI instead of editing the file directly.

DOC-47 is updated. Back to the sweep — let me find what still references the old contract.

Let me verify that insertion bug didn't hit the other files.

Now let me write the BUG-86 UATs.

All 9 UATs pass. Now the full node suite, to see where the sweep stands against the 9-file baseline.

From 145 failed files to 3. Let me check the contact-form one.

Let me check whether those two are pre-existing by running them against the unmodified branch.

Both pre-existing. Let me run the full node suite plus the workers suite, which I haven't exercised yet.

Workers suite is fully green. Let me check whether the DOC-47 edit reached the branch worktree, since the KB artefacts are git-tracked.

KB artefacts aren't git-tracked — they're build output. Let me verify the JSON I edited is still valid, then review the diff.

Let me commit, then handle the stored data.

There's a dedicated command that enforces a version bump. Let me bump and amend.

The branch base was already at 0.2.176, so that wasn't a bump. Let me actually bump it.

Protocol complete. Now the live store — those v4 instances will fail to resolve against the v5 catalog, so let me preview the upgrade.

`1c` reads the file store, which I already updated. The D1 the builder actually serves is separate — let me check it.

Five sites in the live builder store are on v4 and will now fail to resolve. Let me find how to run the upgrade against D1.

There's a proper route for this — `POST /api/modules/upgrade`, which BUG-85 built to run through the real D1 store. Let me check if the builder is up.

The builder is live on 8788. Let me run the read-only dry run against it.

Access gates it even locally, so the live-store upgrade needs the operator's session. Let me rebuild the KB, which is local.

Done. The AI's reference now reads `version 5` with no `action` setting at all — there's nothing left for it to get wrong.

## What was wrong

Three defects, and only one was data:

1. **The renderer skipped relativisation for exactly one sink.** `relativizeUrl` reduces every URL the renderer emits to document-relative (REQ-109, so a snapshot is relocatable under any prefix) — link `href`, image `src`, CSS `url()`, `srcset`. The form's `action` was the one that bypassed it. So in the preview, served at `/b/<biz>/preview/<slug>/draft/`, every asset resolved correctly and the form alone posted to the origin root → no matching route in `control-app` → fell through to the asset binding → **404**.
2. **`action` was `{ type: 'url', required: true }`**, and the whole of the guidance the builder AI got was `- action — url; required`.
3. **DOC-47 told it to point the form away** — "the published site is read-only… there is no 1st Contact inbox behind the form yet". REQ-223 built the inbox and never updated DOC-47.

## What changed

`config.action` is deleted. The module emits `LEAD_ACTION` (`./api/lead`) itself — one constant correct on every surface with nothing configured per site, because a page slug is a single flat segment so a document's directory is always its channel root. That also closes BUG-78's finding 2: on a published non-apex site the resolved path now carries *that site's* key, so its leads stop landing in the apex tenant.

`LEAD_PATH` moved down into the module's `fields.ts` beside the field names, on that file's own reasoning; `public-site` imports it. Removing a required key is breaking, so contact-form went to **v5** with a declared migration — BUG-85 makes that the precondition for a bump.

Your design freedom is untouched: the `form` slot, every `control` node, the whole L1 subtree. Only the functionality stopped being authorable.

**Tests:** 9 new UATs, including resolution against real document URLs for all three surfaces plus a counter-proof that the shipped root-relative value missed every prefixed one. Node suite 2990 passed with 2 failures that fail identically on unmodified `xgd-working`; workers suite 759 passed, fully green. The contract change rippled into ~25 existing test files — I updated each deliberately rather than mechanically, and two are worth flagging: REQ-148's "unsafe endpoint is refused loud" had no subject left, so I repurposed it to assert that nothing in `config` reaches the action sink at all; and BUG-28's enhancement-gate tests now set the action on the rendered form instead of configuring it, since the module can no longer emit a `mailto:`.

Merged to `xgd-working`, ticket at `free_coded`, v0.2.177.

## Two things still need you

**1. Your live builder store is on v4 and will now fail to resolve.** Five sites in the local D1 still hold `version: 4` contact-form instances — against the v5 catalog that's the exact BUG-85 failure, an unresolvable instance taking the page down. `1c module upgrade` only reaches the file-backed store (already updated). The live store goes through the route BUG-85 built, but Cloudflare Access rejects it even on localhost, so it needs your session:

```
POST /api/modules/upgrade  {"slug":"1stcontact","write":true}
```
for `1stcontact`, `xgd`, `gigabytealchemy`, `alpha` and the two `unnamed` sites. Drop `"write":true` for a dry run first — read-only is the default. Your builder is running on 8788 right now, so I left it alone rather than mutating your store behind a live server.

**2. The KB prose is rebuilt; the vector index isn't.** `kb/system/DOC-47.md` and `REF-behaviors.md` regenerated correctly, but `1c kb build`'s indexing step needs `CLOUDFLARE_API_TOKEN`. Until you re-run it with that set, retrieval still searches the old embeddings.

<!-- xgd-turn id="0e949d5d-02f5-45ba-bfde-9f87ecc9ee78-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T20:09:30.117731+00:00" -->
#### You
I did:

```
((.venv-working) ) martin@nyx 1stcontact % bin/1c assets  
The system KB corpus and its index disagree, so this bundle would ship documents the assistant cannot retrieve.

  STALE in the index (2) — ranked by vectors built from text they no longer have:
    DOC-47
    REF-behaviors

Run `1c kb build` (or `bin/kb-release`, which runs the whole build in order).
((.venv-working) ) martin@nyx 1stcontact % bin/1c kb build
index:  11 document(s), 2 embedded
chunks: 352
map:    5 territories, 17 access point(s), written by claude_code
((.venv-working) ) martin@nyx 1stcontact %

```

And restarted wrangler. However, all my sites show me:

Module not found in catalog: 'contact-form' v4. Known modules: contact-form@5, carousel@3, account-portal@1, account-chrome@2.

<!-- xgd-turn id="0e949d5d-02f5-45ba-bfde-9f87ecc9ee78-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T20:11:56.160880+00:00" -->
#### Claude
KB's sorted. The remaining blocker is the live store. Let me find how local dev gets past Access.

That explains it: their browser has a session cookie, my curl has neither that nor an Access token. Let me map the sites to their businesses so the fix covers all of them.

Five sites across three businesses are affected. Let me correct the ticket, since the route — not the CLI — is what reaches the live store.

That error is my change landing on your live store, and I gave you the wrong command for it.

**`1c module upgrade` audits the file store, not the one the builder serves.** `1c` edits `storage/sites/`; your builder's sites live in the local D1 inside miniflare, which `1c` can't open. So it told me "Every module instance is on the current contract" for all three slugs while five sites in D1 were still pinned to v4. It was answering about a different copy of the site. BUG-85's own lesson — *a migration performed by editing files can only ever reach the fixtures* — applies to its own CLI driver.

The driver that does reach it is the route BUG-85 built, running the same `upgradeSiteModules` through the store an edit lands through. It needs your browser, because a shell `curl` has neither an Access token nor your session cookie — your browser reaches the builder on the session, which is why the builder still loads for you.

**In the devtools console, on any builder page.** Dry run first:

```js
const targets = [
  ['biz_51a6746495c8057e886ff98d4208e6b9', '1stcontact'],
  ['biz_51a6746495c8057e886ff98d4208e6b9', 'xgd'],
  ['biz_51a6746495c8057e886ff98d4208e6b9', 'gigabytealchemy'],
  ['biz_96fc32af73335ad5e315d58acc2d5c92', 'xgd'],
  ['biz_5b101742d436573a04a2512fb7ecdbb5', 'unnamed'],
]
for (const [biz, slug] of targets) {
  const r = await fetch(`/b/${biz}/api/modules/upgrade`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, write: false }),
  })
  console.log(biz, slug, r.status, await r.json())
}
```

Each should report `contact-form v4 → v5 (dropped undeclared config.action)`. Then re-run with `write: true`.

The business prefix matters: two of the affected slugs are both `xgd` in different businesses, and a bare slug resolves to whatever you're currently scoped to and would silently skip the other. `alpha` and `site_877dba…` carry no contact-form and need nothing.

I audited the five from your D1 directly:

| Business | Slug |
|---|---|
| `biz_51a6746…` | `1stcontact`, `xgd`, `gigabytealchemy` |
| `biz_96fc32a…` | `xgd` |
| `biz_5b10174…` | `unnamed` |

I didn't run it myself: the route is gated, and the offline alternative means writing to SQLite files your running wrangler holds open, which is the corruption `1c reset` warns about. If you'd rather not do it by hand, stop wrangler and say so — I'll run it through the real `upgradePageModules` against the D1 and you can restart.

Both the correction and the five-site audit are on BUG-86. I also recorded a gap I did **not** fix: nothing warns that the two stores have diverged. `1c module upgrade` reporting the file store clean reads as "this site is fine," and that's how I came to tell you the store was already upgraded. It probably wants either a "which store did I just audit" line or a refusal when the slug also exists in a visible D1 — but that's a separate defect, and building it inside a bug about a form's endpoint would make neither reviewable.

<!-- xgd-turn id="de9ae75f-e84b-48fe-a000-bd41c1d0846f-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T20:38:45.335240+00:00" -->
#### You
onst targets = [ ['biz_51a6746495c8057e886ff98d4208e6b9', '1stcontact'], ['biz_51a6746495c8057e886ff98d4208e6b9', 'xgd'], ['biz_51a6746495c8057e886ff98d4208e6b9', 'gigabytealchemy'], ['biz_96fc32af73335ad5e315d58acc2d5c92', 'xgd'], ['biz_5b101742d436573a04a2512fb7ecdbb5', 'unnamed'], ] for (const [biz, slug] of targets) { const r = await fetch`/b/${biz}/api/modules/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, write: false }), }) console.log(biz, slug, r.status, await r.json()) }

biz_51a6746495c8057e886ff98d4208e6b9 1stcontact 200

Object { slug: "1stcontact", pages: (1) […], stale: 1, written: false }

debugger eval code:15:13

biz_51a6746495c8057e886ff98d4208e6b9 xgd 200

Object { slug: "xgd", pages: (2) […], stale: 2, written: false }

debugger eval code:15:13

biz_51a6746495c8057e886ff98d4208e6b9 gigabytealchemy 200

Object { slug: "gigabytealchemy", pages: (1) […], stale: 2, written: false }

debugger eval code:15:13

biz_96fc32af73335ad5e315d58acc2d5c92 xgd 200

Object { slug: "xgd", pages: (2) […], stale: 2, written: false }

debugger eval code:15:13

biz_5b101742d436573a04a2512fb7ecdbb5 unnamed 200

Object { slug: "unnamed", pages: (1) […], stale: 1, written: false }

debugger eval code:15:13

undefined

<!-- xgd-turn id="de9ae75f-e84b-48fe-a000-bd41c1d0846f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T20:39:04.704337+00:00" -->
#### Claude
Dry run matches my audit exactly — 8 stale instances across the five sites, and the per-site counts line up (gigabytealchemy's 2 are both in `home.json`, which is why it reports 1 page / 2 stale).

Go ahead with the write — same snippet, one word changed:

```js
const targets = [
  ['biz_51a6746495c8057e886ff98d4208e6b9', '1stcontact'],
  ['biz_51a6746495c8057e886ff98d4208e6b9', 'xgd'],
  ['biz_51a6746495c8057e886ff98d4208e6b9', 'gigabytealchemy'],
  ['biz_96fc32af73335ad5e315d58acc2d5c92', 'xgd'],
  ['biz_5b101742d436573a04a2512fb7ecdbb5', 'unnamed'],
]
for (const [biz, slug] of targets) {
  const r = await fetch(`/b/${biz}/api/modules/upgrade`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, write: true }),
  })
  console.log(biz, slug, r.status, await r.json())
}
```

Expect the same `stale` counts with `written: true`. Re-running it afterwards is safe and should report `stale: 0` — that's the confirmation it took.

Then reload a site. Two things worth checking once it renders:

- The form's `action` is `./api/lead` — that's the fix itself.
- Submitting from the draft preview now gets an acknowledgement instead of the 404. That's the original bug, end to end, and it's the one thing none of the tests can prove for your actual store.

Tell me the counts and I'll verify against the D1 read-only from here.

<!-- xgd-chat-end -->