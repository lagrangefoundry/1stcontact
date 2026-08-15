---
uid: comment-f49ebbd6
id: COMMENT-1015
type: comment
title: Comment on chat CHAT-25
created_by: xgd
created_at: '2026-08-15T01:19:22.424980+00:00'
updated_at: '2026-08-15T01:26:34.997873+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-f7aa2074
  kind: chat_transcript
---

<!-- xgd-turn id="ce1f4438-b8ef-46cd-b0ad-f2f41c2bbc68-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T01:19:15.218229+00:00" -->
#### You
I would like to start the conversation about putting the 1c application that we have onto cloudflare so we can start serving it from there. I'd like to prove this out sooner rather than later.

The key missing feature is login - I don't want it publicly visible so we need a login module first and the ability to asign access permissions. (see previous chat) Once we have that, what else needs to happen?

Note I want a scripts for build/deploy.

<!-- xgd-turn id="ce1f4438-b8ef-46cd-b0ad-f2f41c2bbc68-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T01:26:34.683100+00:00" -->
#### Claude
I'll dig into the current state before proposing anything — the app structure, what's already Cloudflare-aware, and the prior login discussion.

Good — public-site is already Cloudflare-native. Let me read the control-app worker and find the prior login discussion.

CHAT-23 "Login" and CHAT-11 "Starting the migration to Cloudflare" are both directly relevant. Reading those plus the storage doc that gates everything.

CHAT-23's body is empty — the transcript may be in a comment. Let me check that and this session's own ticket.

The login chat (COMMENT-1014, created 4 minutes before this session) is empty — no transcript was captured. Let me gather the actual blockers instead.

Now the crux: what the builder origin actually does in Node, and why it can't run in a Worker today.

No auth code exists and `db/migrations` is empty. Let me verify the specific portability blockers rather than guess at them.

I've got a complete picture. Here's what I found, then the decisions I need from you.

## Where things actually stand

| Piece | Runs where | Cloudflare-ready |
|---|---|---|
| `public-site` | Cloudflare, **live** | ✅ Done — R2-backed, apex + wildcard routes, verified in prod |
| `control-app` | Cloudflare | ⚠️ It's a **pure proxy**, nothing else |
| Builder origin (`1c builder`) | Node on your laptop | ❌ 700-line `node:http` server |
| Site store | `storage/sites/` on disk | ❌ `edit.ts` writes via `writeFileSync` |
| L1 render | Node | ✅ **Portable** — `packages/framework/src/l1` has zero `node:` imports |
| Behavior-module render | Node + `astro/container` | ❌ Needs the Vite transform; workerd has none |
| AI host | Node | ⚠️ Backend is fetch-based (portable); tools bottom out in `edit.ts` |
| Auth | — | ❌ Nothing exists |
| D1 | — | ❌ `db/migrations/` is empty; REQ-7 still `draft` |

**One bug worth knowing now:** `app.1stcontact.io` returns **503 in production today.** `BUILDER_ORIGIN` is declared under top-level `[vars]`, and named environments don't inherit `vars` — public-site's own config comments this exact fact ("a named environment does not inherit bindings") but control-app doesn't repeat it under `[env.production]`. And even if it did, a deployed Worker can't reach `localhost`.

**One doc claim that isn't true yet:** DOC-12 §7 says "the Worker reaches storage through a single `SiteStore` accessor; phase 2 swaps only its implementation." That seam exists on the *read* path (`DraftStore` in `preview.ts`) but **not on the write path** — `edit.ts` (79KB) calls `node:fs` directly. That's the single largest piece of unbudgeted work in phase 2.

## The decisions I need from you

**1. What is "login" for, in v1?** Two genuinely different things, and I'd do them at different times:

| | **Cloudflare Access** (operator gate) | **Custom auth** (customer accounts) |
|---|---|---|
| Work | Zero code — dashboard policy | D1 users/sessions, magic link, email sending |
| Assign permissions | Add emails/groups to a policy | Your own model |
| Enforced | At the edge, before the Worker | In the Worker |
| Good for | Making it not-publicly-visible **today** | Customers logging into their own builder |
| Cost | Free to 50 users | Real security surface to own |

**My recommendation: Cloudflare Access now.** It makes the thing private today for zero code, it's a real boundary (edge-validated JWT), and it isn't throwaway — a customer-facing login is a *different product surface* that belongs with the D1 tenancy model (DOC-10 §4.1: tenant = account is the hard barrier, site is a predicate inside it). Building custom auth now means building it twice.

The catch: if any automation ever calls `app.1stcontact.io`, it needs an Access service token.

**2. Does the laptop stay in the loop for the proving run?** The fastest path to a live private builder is a Cloudflare Tunnel from your laptop, with the Worker fronting it. That gets you a real URL, real auth, real deploy scripts — but the laptop must be up. Removing it is stages 2–4 below.

## What else needs to happen (full list)

Beyond auth:

- **B. Origin reachability** — tunnel, or move the origin into the Worker.
- **C. Store → D1 + R2** — the big one. Needs a write-path port that doesn't exist; REQ-7's schema needs reconciling to DOC-12 first (it says so itself).
- **D. Render in workerd** — L1-only sites work today. Behavior-module sites need the catalog **precompiled at build time** into the Worker bundle. This is a real architectural decision, not just work.
- **E. Static assets** — three routes serve from places a Worker can't reach: `/webui/*` (out-of-repo node_modules), `/builder/*` (repo source), `/framework/*.js` (**type-strips TypeScript at request time**). All must become a build step + Workers Static Assets. Most likely to be underestimated.
- **F. AI host** — `fileAuditSink` uses `appendFileSync`; sessions need a home (DOC-10 says tickets in D1); `ANTHROPIC_API_KEY` becomes a Worker secret.
- **G. Publish** — `cmdPublish` writes revisions to disk. `1c deploy` already writes R2, so this is half-done.
- **H. Scripts** — `deploy:public`/`deploy:control` exist, but nothing builds the builder client, runs D1 migrations, pushes secrets, or smoke-tests after deploy.

## Suggested staging

| Stage | Delivers | Cost |
|---|---|---|
| **1** | Access + tunnel + fix the `vars` bug + build/deploy scripts → **private, live, laptop-dependent** | Days |
| **2** | Builder client as a build artifact (E) + L1 read path in workerd + D1/R2 store reads → **viewing needs no laptop** | Weeks |
| **3** | `edit.ts` behind a store port, publish + AI host in workerd → **editing needs no laptop** | The bulk |
| **4** | Precompiled behavior-module catalog (D) | Separable |

Stage 1 is small, almost entirely non-throwaway, and proves the shape end-to-end. I'd do it first regardless of what you decide about stages 2–4.

Two things before I ticket any of this: **do you want Access or custom auth**, and **is a tunnelled laptop acceptable for the proving run?** If Access + tunnel, I'd scope stage 1 as one ticket and get you a live private URL quickly.

<!-- xgd-chat-end -->