---
uid: bug-3bbffea8
id: BUG-59
type: bug
title: 'Local dev: access-sim blocks 1c push, so a wiped local store cannot be refilled'
created_by: martin-github@westhead.me
created_at: '2026-09-06T23:19:13.324318+00:00'
updated_at: '2026-09-07T20:48:36.235083+00:00'
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

`ACCESS.md`'s claim is corrected in place by this ticket, and the gap itself is
now fixed too — see *A service token acts as a named person* below.

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

## What to build, part two: a service token acts as a named person

Recorded above as a design question and then asked for directly, so it is
answered here rather than deferred: **who is a service token, and what may it
reach?**

The answer that needs no new concepts is that it is a PERSON'S AUTOMATION. That
is literally what `1stcontact-publish` is — an operator's laptop pushing sites —
and saying so lets the whole identity model apply unchanged: membership decides
which businesses, the grant decides whether they are selectable, the terms the
person accepted are the terms it operates under, and revoking the person revokes
the automation. The alternative — a non-human principal with its own account row,
its own memberships and its own grant lifecycle — is a much larger design and
would be a second authorisation path to keep correct forever.

So a new deployment var maps a token's name to an address:

```
SERVICE_TOKEN_IDENTITIES = "1stcontact-publish=martin-github@westhead.me"
```

- **Comma-separated `name=email` pairs**, casefolded and compared through the
  same `normaliseEmail` the `users` index is written through, for the reason
  `isPlatformAdminSeed` gives: a var naming `Martin@Example.com` would name a
  person the database does not contain.
- **Empty means nobody**, like `PLATFORM_ADMINS` and like `ACCESS_TEAM_DOMAIN`. An
  unmapped service token is refused exactly as it is today, so this opens nothing
  by going missing.
- **It is deployment configuration and never caller input.** A caller cannot
  choose who they act as: the name is `common_name` out of a JWT Cloudflare
  signed, and the mapping from that name to a person is written here.
- **Revocation is two-sided** — delete the token in Cloudflare, or remove the
  mapping — and either alone is sufficient.
- **The identity is resolved once, at the gate**, in the same place `admit` is
  already called, so there is no second path through authorisation.
- **The stamp lands on the person.** `admit` writes `last_seen_at` on the mapped
  human, which is right: the automation IS that person's, and inventing a
  separate presence for it would claim a distinction the platform does not make.

The Worker declares the var empty under `[vars]` and names the documented grant
under `[env.production.vars]`, because a named environment inherits neither. This
is not a new grant: `ACCESS.md`'s identity table already records
`1stcontact-publish` as provisioned for `bin/publish`. What changes is that the
grant now works.

### And the simulator stops deviating

Part one bound the local pair to an address because `admit` could not take a
service token. It can now, so `bin/access-sim` mints the FAITHFUL shape — a
`common_name` claim and no email, exactly as Cloudflare does — and
`--print-env` emits the `SERVICE_TOKEN_IDENTITIES` line that maps it, alongside
the two Access vars it already emits. `--service-email` keeps choosing who the
local token acts as; it now chooses the right-hand side of that mapping rather
than the `email` claim.

That removes the one place the simulator was not Cloudflare, which is the whole
justification REQ-192 gave for the tool. It also means the local path exercises
the production path rather than rehearsing a shortcut — which is what would have
caught this bug before a deployment did.

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

For part two, in `tests/test_UAT_FC_BUG-59_service_token_identity.workers.test.ts`
against real bindings, because admission is a question about rows:

- a service token named in the var is admitted as that person, with the same
  businesses that person would be admitted with;
- an UNMAPPED service token is still refused `no_email`, so an empty or missing
  var opens nothing;
- the mapping is casefolded on both sides, so `Name=Martin@Example.com` admits;
- a human's email still wins outright — the mapping is consulted only when the
  token carries no email, so it can never redirect a person;
- a mapped name whose address is not a user is refused `no_user` like anybody
  else, rather than being provisioned by the mapping.

And, on the simulator side, that the minted assertion now carries `common_name`
and no `email`, and that `--print-env` emits the mapping line.

Beyond the suite, the pre-change path was driven live: a real
`bin/access-sim` in front of a real `wrangler dev` behind a real Access gate, with
`bin/publish --origin <sim>` writing all three local sites into the store and
`/api/sites` reading them back. The refusal paths (no credential, wrong secret,
nobody to be) were exercised against the same pair of processes.

**The live run could NOT be repeated after part two**, and the reason is outside
this ticket: `wrangler dev` no longer builds in any checkout, because
`apps/control-app/src/session-knowledge.ts` imports `KnowledgeDocs` from
`generated/ai-knowledge`, and the installed shared package
(`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-knowledge`)
defines that symbol in `src/priming.js` without re-exporting it from
`src/index.js`. The shim `1c assets` generates is a bare `export *` from that
index, so esbuild fails with `No matching export ... for import "KnowledgeDocs"`.
It reproduces in the main checkout too — the same absolute path is bundled from
both — so any restart of the running dev server will hit it. It is the
shared-store install problem, not a code change here.

What that leaves unproven live is only the composition — sim plus `wrangler dev`
plus `bin/publish` in one run, with the NEW token shape. Both halves are covered
by suites that drive the real thing rather than a double: the workers suite puts
a real signed `common_name` token through the Worker's own `fetch`, the real gate
and real D1; the node suite puts a real `bin/access-sim` process in front of a
stub origin and verifies what it forwards with the product's own verifier.

## Notes

- A throwaway proxy is still listening on `127.0.0.1:8790` from the diagnosis
  session; the sandbox refused to kill it. Run `kill 83847` to stop it. It holds a
  30-day sim-minted token for `martin@westhead.me` and forwards to 8788. It is
  superseded by this ticket's work.
- `apps/control-app/.dev.vars` was edited at 15:38 on 2026-09-06, changing
  `PLATFORM_ADMINS` from `martin-github@westhead.me` to `martin@westhead.me`
  (`.dev.vars~` holds the previous version). Not a cause here — the running
  server admits `martin@westhead.me` fine.


## A committed-credential scan reads the NAME, and this var's name says TOKEN

Found by the suite once `SERVICE_TOKEN_IDENTITIES` had a production value, and
recorded here because the fix edits two other stories' UATs rather than this
ticket's own.

Both `tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` and AC-1342 in
`tests/reconciliation-platform-build-deploy-smoke.test.ts` scan the committed
`wrangler.toml` files for a credential, and one of the three shapes they use
matches on the **name** of an assignment:

```
\b[A-Za-z0-9_-]*(?:SECRET|TOKEN|API_KEY|PASSWORD)[A-Za-z0-9_-]*\s*=\s*["'][^"'$][^"']{7,}
```

`SERVICE_TOKEN_IDENTITIES = "1stcontact-publish=martin-github@westhead.me"`
matches it, and the match is a false positive: what the var carries is a
`name=address` pair whose halves are a Service Auth token's `common_name` and an
operator's address. Both are public, neither authenticates anything, and the
Cloudflare identity table in `ACCESS.md` already records both.

**A `*_IDENTITIES` var names WHO a credential is, never WHAT it is**, and that is
the exception the scans now carry. The alternative was to rename the var away
from `TOKEN` — the word Cloudflare uses for the credential being mapped — to dodge
a regex, which would cost every future reader more than the exception costs.

The exception is narrow in the two ways that matter:

- **It applies to the name-matched shape only.** The provider-prefixed-key and
  private-key shapes still read the file whole, exempted var included, because
  those match on the VALUE and a value is exactly what an exception must not stop
  looking at. A UAT asserts that an `sk-…`-shaped string assigned to the exempted
  name is still caught.
- **It polices itself.** Every entry an exempted var carries is held to the
  `name=address` grammar the var documents, so a secret parked in it fails in the
  same run, at the same assertion, rather than passing quietly.

**And the scan gets one definition site.** REQ-144 wrote it; AC-1342 restated the
same three regexes and the same loop verbatim over a wider file list. That was
tolerable while it was four lines and stopped being tolerable the moment it had
to learn something, because a rule taught in two places is one that will
eventually be taught in one. Both now read the shapes and the exception from
`tests/support/credential-scan.ts` and keep their own file lists, which is the
part that genuinely differs between them. The split assembly of the shapes — so
that no file scanning for `sk-ant-api` is its own counter-example — moved with
them.

## Verification of this ticket's work

The whole suite was run in this branch after merging `xgd-working` in: 389 test
files, in batches, in the foreground. Every failure was reproduced on
`xgd-working` itself before being set aside, so what is claimed pre-existing was
observed pre-existing rather than assumed:

- `bug32-webui-scope-rebrand` (names three files, none of them this ticket's),
  `req115-builder-shell`, `reconciliation-draft-change-journal`,
  `reconciliation-builder-workspace-origin`, `reconciliation-assistant-*`,
  `test_UAT_FC_BUG-38/39/43/46`, `test_UAT_FC_REQ-122/123/127/131/146/158/160/173/174`
  — all fail identically on `xgd-working`.
- `reconciliation-platform-build-deploy-smoke` and
  `test_UAT_FC_REQ-144_deploy_scripts` failed HERE and passed on `xgd-working`.
  Both were this ticket's doing — the credential scan above — and both pass now.

The KB-backed suites in that list fail because `1c kb build` has not been run in
this checkout; the builder-origin ones because the shared-store install is
incomplete. Neither is this ticket's to fix.

`apps/control-app/src/index.ts` conflicted with REQ-202, which put a passwordless
session ahead of the Access gate. `actingEmail` is called on the **gate branch
only**: a session is a person by construction, since `sessionIdentity` reads a row
somebody signed in to create and no service token has one, so resolving above the
join would ask a question that could only be answered `null` there and would imply
a token might arrive holding a session cookie.
