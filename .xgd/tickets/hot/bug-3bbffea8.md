---
uid: bug-3bbffea8
id: BUG-59
type: bug
title: 'Local dev: access-sim blocks 1c push, so a wiped local store cannot be refilled'
created_by: martin-github@westhead.me
created_at: '2026-09-06T23:19:13.324318+00:00'
updated_at: '2026-09-06T23:27:01.108792+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c99a0bd1
---

## Symptom

Browsing the local builder at `http://127.0.0.1:8788` shows no site content and no
chat panel.

## What is actually happening — two independent causes

### 1. Every request is 401ing, including the shell and every asset

The running dev server was started as:

```
wrangler dev --port 8788 \
  --env-file .dev.vars \
  --env-file ../../.dev.vars.local \
  --env-file /Users/martin/Documents/secrets/1c.dev.env
```

`.dev.vars.local` is `bin/access-sim --print-env` output:

```
ACCESS_TEAM_DOMAIN="http://127.0.0.1:8799"
ACCESS_AUD="local-dev-aud"
```

Those are non-empty, so `isUnconfiguredLocalDev` (index.ts:97) is false and
`ACCESS_DEV_OPEN` does not apply — which is exactly what access-sim is for. The
real gate runs, and `bin/access-sim` (pid 37872, port 8799) is up and serving a
valid JWKS. With no `CF_Authorization` cookie every path answers:

```
401  Cloudflare Access rejected this request: no Access token was presented.
```

`run_worker_first = true` means that covers the static assets too, so there is no
partial render — the browser gets bare 401 text for `/`, `/builder`, `/webui/*`
and every `/api/*` call alike.

**Operator fix**: sign in at `http://127.0.0.1:8799/login`. The cookie is set on
host `127.0.0.1`, so the builder must then be browsed at `http://127.0.0.1:8788`
and not `http://localhost:8788` — those are different cookie hosts. A restarted
sim mints a new keypair under a new `kid`, so a cookie from a previous sim run
also has to be replaced.

Verified: with a sim-minted token, `/` → 200, `/api/businesses` → 200 (`1st
Contact`, selectable), `/api/status` → `{"ai":true,"message":null}`.

### 2. There were no sites at all

`SELECT * FROM sites` on the local D1 returned zero rows, so `/api/sites`
answered `[]` even for an authenticated caller. This is the documented
post-REQ-190 state — `db/dev-seed.sql` says so directly:

> businesses come up empty and `1c push <slug>` puts a site in one

The four seeded tenants (1st Contact, Alice's Plumbing, Alice's Lettings, Alice's
Old Salon) were written by the fixture SQL rather than by `provisionBusiness`, so
none of them got the starter site that path creates.

**Resolved during this session**: all three local sites were pushed into the
builder store and `/api/sites` now returns `1stcontact`, `gigabytealchemy`, `xgd`.

## The defect worth fixing

**`1c push` / `bin/publish` cannot reach a local builder that is running behind
access-sim.** The two documented local-dev tools are mutually exclusive:

- `bin/access-sim` exists so the identity surfaces can be exercised locally, and
  it works by turning the real Access gate on.
- `bin/publish` is the only way to get a site into the local store, and it is the
  documented recovery for the empty-`sites` state above.

But `push.ts` only knows one inbound credential: the `CF-Access-Client-Id` /
`CF-Access-Client-Secret` service-token pair, which the real Access edge exchanges
for a JWT. access-sim implements no such exchange, and the raw
`cf-access-jwt-assertion` header path was deliberately removed from `push.ts`
(its doc comment explains why: that header is what Access *sets* on the forwarded
request, and a deployed edge refuses a request that arrives carrying one).

So against a sim-gated local builder, `bin/publish` fails with:

```
Import of '1stcontact' was refused with 401: Cloudflare Access rejected this
request: no Access token was presented.
The target is behind Cloudflare Access. Set CF_ACCESS_CLIENT_ID and
CF_ACCESS_CLIENT_SECRET to a service token, or pass --client-id and
--client-secret. Run bin/access-token to provision one.
```

— advice that cannot be followed, because `bin/access-token` provisions against
real Cloudflare and the sim would not honour the result.

Getting a site in required hand-rolling a throwaway loopback proxy that injects a
sim-minted `cf-access-jwt-assertion` header and forwards to 8788. That is the gap:
the local harness has no supported path from `1c push` to a gated local builder.

The shape of the fix is not yet decided. Candidates:

- `bin/access-sim` grows a service-token exchange, so `--client-id` /
  `--client-secret` work locally exactly as they do against Cloudflare. Keeps one
  credential shape everywhere and needs no change to `push.ts`.
- `1c push` regains a local-only raw-JWT option, gated so it cannot be aimed at a
  non-loopback origin.
- `1c push` learns to fetch a token from a sim named by an env var.

Preference is the first: it leaves `push.ts`'s reasoning about inbound
credentials intact and confines the local-only behaviour to the local-only tool.

## Secondary: a signed-out builder gives the operator nothing to act on

The 401 body names Cloudflare Access, which is accurate but not actionable when
the gate is a loopback simulator the operator started themselves. Worth
considering: when `ACCESS_TEAM_DOMAIN` resolves to loopback, say so and name
`<team-domain>/login`.

## Test plan

To be settled once the fix shape is chosen. Whatever lands needs a UAT that
drives the real entry point — `1c push` against a sim-gated Worker — and asserts
the site actually appears in the store, not merely that the request was accepted.

## Notes

- A throwaway proxy is still listening on `127.0.0.1:8790` from this session; the
  sandbox refused to kill it. Run `kill 83847` to stop it. It holds a 30-day
  sim-minted token for `martin@westhead.me` and forwards to 8788.
- `apps/control-app/.dev.vars` was edited at 15:38 today, changing
  `PLATFORM_ADMINS` from `martin-github@westhead.me` to `martin@westhead.me`
  (`.dev.vars~` holds the previous version). Not a cause here — the running
  server admits `martin@westhead.me` fine.
