---
uid: bug-3bbffea8
id: BUG-59
type: bug
title: 'Local dev: access-sim blocks 1c push, so a wiped local store cannot be refilled'
created_by: martin-github@westhead.me
created_at: '2026-09-06T23:19:13.324318+00:00'
updated_at: '2026-09-06T23:51:17.751702+00:00'
completed_at: null
last_field_updated: body
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
(BUG-36 — that header is what Access *sets* on the forwarded request, and a
deployed edge refuses a request that arrives carrying one).

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

## What to build

**`bin/access-sim` becomes what the real Access edge is: a reverse proxy in front
of the builder that turns a credential into an identity on the forwarded
request.** Nothing changes in `push.ts`, in `1c push`, or in the Worker — the
credential shape the client sends is already the production one, and the missing
half was always on the far side.

The simulator keeps its own endpoints and proxies everything else to the builder
origin it already knows about (its `--builder` flag, today used only for the
`/login` redirect). Concretely:

1. **Service-token exchange.** A proxied request carrying `CF-Access-Client-Id`
   and `CF-Access-Client-Secret` that match the simulator's configured pair is
   forwarded to the builder with a freshly minted `cf-access-jwt-assertion`
   header. That is precisely what Cloudflare does at the edge, and it is why the
   header belongs here and not in `push.ts`.

2. **A wrong or half credential is refused and nothing is forwarded.** A client
   id with the wrong secret must not reach the builder at all. Half a pair is
   treated as no pair, matching `1c push`'s own "both or neither" rule.

3. **A browser cookie is passed through untouched.** A request carrying
   `CF_Authorization` is forwarded as it arrived and the Worker verifies it, as
   it does today. The simulator does not re-sign what it has already minted.

4. **A proxied request with no credential at all gets a 302 to `/login`**, which
   is the shape real Access answers a browser with, and which turns the current
   dead end — a bare 401 naming Cloudflare — into a way in.

5. **The simulator's own endpoints keep priority** over the proxy:
   `/cdn-cgi/access/certs`, `/login` and `/mint` are answered by the simulator
   and are never forwarded. The control app's router has no route of any of those
   names, so nothing is shadowed.

6. **`--print-token` prints the pair**, in `NAME=value` form for `eval`, and the
   startup banner names it alongside the existing lines. The pair defaults to
   well-known values (`--client-id`, `--client-secret` override them). A
   well-known default is not a weakening here and the reason is structural:
   `/mint` already hands anyone a token for any address with no credential at
   all, and the process binds to loopback. What the pair buys is that the
   *client* side is byte-identical to production.

### The one place the simulator deliberately differs from Cloudflare

A real Access service token authenticates as a non-human `common_name` and
carries no email. `verifyAccessJwt` accepts that — it reports the identity as
`service-token:<name>` — but `admit` does not: it opens with
`if (!email) return { ok: false, reason: 'no_email' }`, because DOC-40 §2 makes
the verified email the identity and there is nothing to look a service token up
by. So a faithfully-shaped service token is refused one layer further in.

The simulator therefore binds its pair to an **address** and mints an ordinary
identity token, defaulting to the first entry of `PLATFORM_ADMINS` (read from
`apps/control-app/.dev.vars`, falling back to `wrangler.toml`) and overridable
with `--service-email`. Local automation stands for a person, because a person is
the only thing this platform can currently admit. When no address can be
determined the exchange refuses and says so rather than minting for nobody.

This difference is stated in the banner and in `ACCESS.md` rather than left to be
discovered.

### Related finding, recorded and NOT fixed here

**`bin/publish --production` is refused by `admit` for the same reason.** The
deployed path sends a real service token, Access mints a `common_name` JWT, and
`admit` answers `no_email` — so the automation identity BUG-36 provisioned has no
seat in the identity model REQ-167 onwards built. `ACCESS.md`'s claim that a
service token is accepted "on the same terms as a human identity" is true of
`verifyAccessJwt` and false of the request as a whole.

Giving a service token a seat is a design question — which account owns it, which
businesses it may write to, how it is granted and revoked — and it is not this
bug's. Recorded here so it is not rediscovered from the symptom. `ACCESS.md`'s
claim is corrected in place by this ticket.

**A first push against a fresh database is refused by the terms gate.** Found
while proving this fix end-to-end: with the exchange working and the caller
admitted, REQ-169's gate refuses every route until the account has accepted, and
accepting is a browser action `1c push` has no way to perform. It is not a
blocker — `POST /api/terms/accept` with the same service-token pair clears it in
one call, and it only arises once per account — so it is documented as a step in
`ACCESS.md` rather than worked around in code. Whether automation should be able
to accept terms on a human's behalf at all is the same design question as the
service-token seat above, and is deliberately not answered here.

**`1c push`'s refusal advice is production-only.** After a local 403 it still
prints "Run bin/access-token to provision one", which provisions against real
Cloudflare. The simulator's own body reads first and is the actionable line, so
this is left alone rather than teaching `push.ts` about a local tool it should
not know exists.

## Test plan

UATs in `tests/test_UAT_FC_BUG-59_access_sim_service_token.test.ts`, driving a
real `bin/access-sim` process pointed at a stub builder started by the test, so
what is asserted is what the simulator actually forwards:

- a matching pair is exchanged for a `cf-access-jwt-assertion` the product's own
  `verifyAccessJwt` accepts, carrying the bound address;
- a wrong secret is refused and the stub builder sees no request at all;
- a `CF_Authorization` cookie is forwarded byte-for-byte and no assertion header
  is added;
- an uncredentialed proxied request answers 302 to `/login`;
- `/cdn-cgi/access/certs` and `/login` are still the simulator's own once the
  proxy exists;
- `--print-token` emits both halves of the pair;
- the method, path and body of a POST survive the hop, which is the property
  `1c push` depends on;
- the pair is spent at the edge and does not reach the builder, as at the real
  one;
- with no address to be, the exchange refuses and says which two ways to give it
  one;
- the address defaults to the first `PLATFORM_ADMINS` entry, read from `.dev.vars`
  ahead of `wrangler.toml` — the order the Worker reads them in.

Beyond the suite, the whole path was driven live before commit: a real
`bin/access-sim` in front of a real `wrangler dev` behind a real Access gate, with
`bin/publish --origin <sim>` writing all three local sites into the store and
`/api/sites` reading them back. The refusal paths (no credential, wrong secret,
nobody to be) were exercised against the same pair of processes.

## Notes

- A throwaway proxy is still listening on `127.0.0.1:8790` from the diagnosis
  session; the sandbox refused to kill it. Run `kill 83847` to stop it. It holds a
  30-day sim-minted token for `martin@westhead.me` and forwards to 8788. It is
  superseded by this ticket's work.
- `apps/control-app/.dev.vars` was edited at 15:38 on 2026-09-06, changing
  `PLATFORM_ADMINS` from `martin-github@westhead.me` to `martin@westhead.me`
  (`.dev.vars~` holds the previous version). Not a cause here — the running
  server admits `martin@westhead.me` fine.