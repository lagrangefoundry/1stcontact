---
uid: chat-f7aa2074
id: CHAT-25
type: chat
title: Putting the site builder on cloudflare
created_by: xgd
created_at: '2026-08-15T01:15:48.895288+00:00'
updated_at: '2026-08-15T20:35:23.822640+00:00'
completed_at: null
last_field_updated: body
status: open
fields:
  chat_comment: comment-f49ebbd6
---

---

# Design record — putting the builder on Cloudflare (2026-08-15)

## Where phase 1 left things

`public-site` is live and Cloudflare-native ([[CHAT-11]]). `control-app` is a **pure proxy** to a
Node origin on the operator's laptop, and returns **503 in production** — its `BUILDER_ORIGIN`
sits in a top-level `[vars]`, which named environments do not inherit ([[REQ-144]]).

## Decisions taken in session

- **Cloudflare Access is the operator gate** ([[REQ-147]]), not a custom login module. Customer
  accounts are a different product surface and belong with the tenancy model in [[REQ-143]];
  building auth now would build it twice.
- **No tunnel.** A tunnelled laptop origin was proposed as a staging step and **rejected** — it
  proves nothing that matters and the laptop is not a useful final state. What survived from that
  proposal (Access, the deploy scripts) does not need it.
- **Definitions in D1, bytes in R2** ([[REQ-143]]) — i.e. [[DOC-12]] §7 as already written. This
  needs **no amendment** to [[DOC-1]] #4, and closes [[DOC-5]]'s open question ("D1, R2, or
  both") as *both*, split by kind: definitions D1; asset bytes and revision snapshots R2.
- **An R2-only definition store was considered and rejected.** The case for it was that REQ-7's
  schema was undesigned and files map 1:1 onto objects. It died against
  `@lagrangefoundry/ticketing`, which already ships proven D1 persistence with the two properties
  R2 would have cost: optimistic version CAS and tenant scoping.
- **Pages are not tickets.** Reuse the ticketing component's *storage pattern*
  (`tenant_id` per row, version CAS, scoped handle at construction, `db.batch()`), not its ticket
  type or `TypePack` — sites have their own validator.
- **Two adapters behind one port** ([[REQ-142]]) — filesystem for the `1c` CLI, D1/R2 for the
  Worker. Not a legacy mode: both are live and current, injected at construction, with no mode
  detection. Keeping the fs adapter deliberately preserves `storage/sites/` being git-tracked
  ([[DOC-12]] §3.1). Precedent: `docs_store.js` keeps `node:fs` behind a separate entry point for
  exactly this reason.

## Findings that shaped the plan

- **The L1 renderer is already portable** — no `node:` imports in `packages/framework/src/l1/`,
  and `astro/container` is imported lazily, so a pure-L1 site renders by string templating.
- **The sites are almost entirely L1** — 139 `text`, 55 `box`, 53 `container`, 11 `control`,
  4 `slot`, against exactly **one** behavior module (`contact-form`, 4 instances). So Astro
  precompilation is a tail-end task ([[REQ-148]]), not a prerequisite.
- **`edit.ts` is 79KB but its store surface is four verbs** at ~40 call sites. The real cost is
  **sync→async**: 31 exported functions, none async, propagating into the CLI ([[REQ-142]] §3).
- **[[DOC-12]] §7's "single `SiteStore` accessor" is true for reads, false for writes** —
  `preview.ts` has the seam; `edit.ts` calls `node:fs` directly.
- **A local D1 test environment already exists and passes.** `@cloudflare/vitest-pool-workers`
  runs tests *inside workerd* against real D1/R2 bindings; ticketing's 69 tests pass in ~1.8s.
  Adopting it here is a **two-project vitest split** ([[REQ-141]]), because this repo's single
  config is built on Astro's `getViteConfig` and that transform cannot run in workerd.
- **`workers_dev = true` bypasses Access** on both Workers — a hostname policy alone is not
  sufficient ([[REQ-147]] §2). Latent only while control-app 503s.
- **Remote D1 is unproven.** lagrange-framework has no `wrangler.toml` and no `d1_databases`
  binding anywhere; its showcase uses a `node:sqlite` shim. Local confidence is high;
  first remote deploy is a real, bounded unknown.

## The tickets

| | Status | Pts | |
|---|---|---|---|
| [[REQ-141]] | ready | 3 | Workers-runtime test project — **start here** |
| [[REQ-142]] | ready | 13 | Async `SiteStore` port + fs adapter |
| [[REQ-143]] | ready | 13 | D1 + R2 adapter |
| [[REQ-144]] | ready | 5 | Build/deploy/smoke scripts + the `[vars]` bug |
| [[REQ-147]] | ready | 5 | Cloudflare Access |
| [[REQ-145]] | draft | 21 | control-app becomes the builder; proxy deleted |
| [[REQ-146]] | draft | 13 | AI host + publish in workerd |
| [[REQ-148]] | draft | 8 | `contact-form` precompiled |

[[REQ-144]] and [[REQ-147]] are independent of the store chain and can run alongside it.

## Still open

- [[REQ-7]] (pre-[[DOC-12]] D1 schema sketch) should be **closed or rewritten**, not implemented —
  it carries its own warning that it predates the model. [[REQ-143]] supersedes it.
- [[DOC-12]]'s "author only (private)" wording for draft previews is still unamended
  ([[CHAT-11]] flagged it; draft URLs remain link-private, not authenticated).
- Whether `1c builder` survives as a local dev origin or `wrangler dev` replaces it ([[REQ-145]] §4).

<!-- xgd-chat-end -->