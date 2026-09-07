# The builder is private — Cloudflare Access on `app.1stcontact.io`

REQ-147. The policy itself lives in Cloudflare, but **which identities are granted and why must
not live only in a dashboard**, so it is recorded here beside the Worker it protects.

## Why Access rather than a login module

Access costs zero application code, enforces at the edge before the Worker runs, and is free to 50
users. It is the **operator** gate, and it is not the same thing as customer login: a customer
signing in to their own builder is a different product surface that belongs with the tenancy model
in REQ-143. Building custom auth now would mean building it twice, and the second one would be the
real one.

## The gate is stated twice, on purpose

Access is attached to a **hostname**. A policy on `app.1stcontact.io` therefore protects
`app.1stcontact.io` — and nothing else the Worker answers on. Two independent controls close that:

| Control | Where | Protects against |
|---|---|---|
| `workers_dev = false` | `wrangler.toml` | `1stcontact-control-app.<subdomain>.workers.dev` serving the builder to anyone who guesses it — a hostname no Access policy covers |
| JWT verification | `src/access.ts` | any request reaching the Worker without having been challenged, whatever route it arrived by |

Either alone is one configuration mistake away from open. Together, opening the builder takes two.

## Configuration

Both values are set in `wrangler.toml`, at the top level and repeated under `[env.production]`
(a named environment inherits neither `vars` nor bindings — REQ-144).

| Var | What it is | Where to find it |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | The Access team domain, e.g. `gendev.cloudflareaccess.com` | Zero Trust → Settings → Custom Pages / team domain |
| `ACCESS_AUD` | The Access **application** AUD tag (64 hex characters) | Zero Trust → Access → Applications → the app → Overview → *Application Audience (AUD) Tag* |

Neither is a secret: the team domain is public and the AUD is an identifier, not a credential.
They are deliberately **not** `wrangler secret` values — a gate configured out of sight is a gate
nobody can audit.

**Empty means deny.** While either var is empty the Worker answers `503` to every request naming
the missing var. It never serves unverified — an unconfigured gate that let traffic through is the
hole this ticket exists to close.

> ⚠️ **Both vars ship empty.** Fill them in from the Cloudflare dashboard when the Access
> application is created. Until then `app.1stcontact.io` is closed, which is the correct state for
> a private builder that is not yet in use.

## The Access application

Create in Zero Trust → Access → Applications → Add an application → Self-hosted.

- **Application domain**: `app.1stcontact.io` (path: all)
- **Session duration**: 24 hours
- **Identity providers**: One-time PIN is sufficient for an operator-only gate; no IdP integration
  is required.

### Granted identities

The policy is an allow-list of individual emails, not a domain rule. A domain rule grants everyone
who ever holds an address at that domain, including people who do not exist yet.

| Identity | Why | Added |
|---|---|---|
| `martin-github@westhead.me` (Martin Westhead, operator) | Sole operator of the platform; builds and publishes every site | REQ-147 |
| `1stcontact-publish` (service token, `non_identity` policy) | `bin/publish` writing a site into the store from a developer machine; no human at the keyboard | BUG-36 |

<!-- Append a row when an identity is added, and say WHY. A row removed here must also be removed
     from the Cloudflare policy — this table is the record, not a copy of one. -->

### Automation

Anything calling `app.1stcontact.io` without a human at the keyboard needs an Access
**service token** (Zero Trust → Access → Service Auth), added to the application's policy as a
*Service Auth* rule. The caller sends `CF-Access-Client-Id` and `CF-Access-Client-Secret`; Access
exchanges them at the edge for a JWT carrying `common_name` instead of `email`, which
`verifyAccessJwt` accepts on the same terms as a human identity (`src/access.ts`, which reports it
as `service-token:<name>`).

**The gate is only the first half — `SERVICE_TOKEN_IDENTITIES` is the second (BUG-59).** A
`common_name` gives `admit` nothing to look up, so it refused every service token `no_email` and
the credential provisioned above passed Access and could then do nothing. A service token is now
resolved to the person whose automation it is, by a deployment var of comma-separated
`name=address` pairs:

```toml
# apps/control-app/wrangler.toml, [env.production.vars]
SERVICE_TOKEN_IDENTITIES = "1stcontact-publish=martin-github@westhead.me"
```

The name is the `common_name` Cloudflare puts in the JWT — the client id without its `.access`
suffix. Everything downstream is unchanged, which is the point: **membership** decides which
businesses it may write to, the **grant** decides whether they are selectable, the **terms that
person accepted** are the terms it operates under, and removing the person removes the automation.
No new principal, no second authorisation path.

Four properties worth knowing, each pinned by a UAT in
`test_UAT_FC_BUG-59_service_token_identity.workers.test.ts`:

- **Empty means nobody**, like `PLATFORM_ADMINS`. An unmapped token is refused exactly as it was
  before the var existed, so nothing switches on when configuration goes missing.
- **It is configuration, never caller input.** The name arrives inside a token Cloudflare signed;
  who that name is, is written here. A caller cannot choose who they act as.
- **A human's own address always wins.** The mapping is consulted only when the token carries no
  email, so no configuration of it can redirect somebody who signed in.
- **It names a person; it does not create one.** An entry pointing at an address with no `users`
  row is refused `no_user` like anybody else.

Revocation is two-sided — delete the token in Cloudflare, or remove the entry here — and either
alone is sufficient.

Provision one — once, by hand, from an environment holding `CLOUDFLARE_API_TOKEN`:

```bash
bin/access-token                 # creates the token and its Service Auth policy
bin/access-token --rotate        # a fresh secret, if the old one is lost
```

It prints the pair once and writes it nowhere. Then:

```bash
export CF_ACCESS_CLIENT_ID='…access'
export CF_ACCESS_CLIENT_SECRET='…'
bin/publish --production xgd
```

**The API token is the provisioner, never the credential.** `CLOUDFLARE_API_TOKEN` authenticates
to `api.cloudflare.com`. It is not an Access credential, and presenting it to `app.1stcontact.io`
earns the same 302 to the login page as presenting nothing at all. `bin/access-token` uses it to
*create* a service token; `bin/publish` never sees it.

> Until BUG-36, `1c push` sent its credential as a `cf-access-jwt-assertion` header. That could
> never have worked against a deployed target: it is the header Access **sets** on the request it
> forwards to the origin, carrying an identity it has already verified — not an inbound credential.
> The symptom was not a clean refusal but a `JSON.parse` error, because the client followed
> Access's 302 to the login page and parsed the HTML as an import result.

The client secret is a real credential: it goes in the operator's password manager and, if a
deploy hook ever needs it, into Cloudflare's own secret store via `bin/deploy.d/secrets/`. Never
into this repository.

### Locally, as a seeded person

`bin/access-token` provisions a *real* service token against the deployed application.
`bin/access-sim` is its counterpart for a laptop: it stands in for the whole gate, so a seeded
person can be signed in as without a Cloudflare account (REQ-192).

It **exercises the real gate rather than bypassing it.** `access.ts` fetches
`<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs` and verifies an RS256 JWT against the published key,
checking `aud`, `iss`, `exp`, `nbf` and `iat`; `normaliseTeamDomain` accepts an `http://` prefix.
Pointing the var at this process therefore runs every one of those checks for real, against keys
it minted at boot. Nothing in the Worker is stubbed, mocked or branched — the only difference from
production is which team domain published the JWKS, and
`test_UAT_FC_REQ-192_a_minted_token_passes_the_real_verifier` calls `verifyAccessJwt` itself to
say so.

It is **not** a backdoor, and that is structural. The keypair is generated at boot and served from
loopback, so a deployment whose `ACCESS_TEAM_DOMAIN` names Cloudflare refuses every token it
mints. The way to misuse it is to repoint a deployment's team domain at localhost, which is not a
mistake — the same standard `wrangler.toml` records for `ACCESS_DEV_OPEN`.

```bash
./bin/seed                                     # the people to sign in as (REQ-192)
./bin/access-sim --print-env > .dev.vars.local  # the two Access vars + SERVICE_TOKEN_IDENTITIES
./bin/access-sim &
cd apps/control-app && npx wrangler dev --port 8788 \
  --env-file .dev.vars --env-file ../../.dev.vars.local
```

Then open <http://127.0.0.1:8799/login> and pick a person. The list is read out of the local D1 at
request time — through `wrangler d1 execute`, not by opening the SQLite file — so it cannot drift
from what the seed wrote, and a missing store degrades to `/login?email=…` rather than to a broken
page. The cookie it sets reaches the builder because cookies are scoped by host and ignore the
port; browse `127.0.0.1:8788`, not `localhost:8788`, or it is a different cookie host.

Tokens last 30 days by default (BUG-52): a test session that expires inside a sitting makes every
bug look like the harness running down. Deployed session lifetime is a separate question and is
REQ-187's.

#### Getting a site in, with the gate on

`bin/seed` writes people and no sites — `db/dev-seed.sql` says so — so a fresh clone's builder
comes up signed-in and empty, and `1c push` is how a site gets there. Until BUG-59 that was
impossible with the simulator running: `push.ts`'s one inbound credential is the service-token
pair, and nothing here exchanged it, so every push answered 401 with advice (`bin/access-token`)
that cannot be followed against a laptop.

**So the simulator is the edge, not only the issuer.** Anything that is not one of its own three
routes (`/cdn-cgi/access/certs`, `/login`, `/mint` — the control app's router defines none of those
names) is forwarded to the builder, credential first, exactly as Cloudflare forwards it. Aim the
client at the *simulator*, the way a production push is aimed at the edge and not at the Worker:

```bash
eval "$(./bin/access-sim --print-token)"        # CF_ACCESS_CLIENT_ID + CF_ACCESS_CLIENT_SECRET
./bin/publish --origin http://127.0.0.1:8799   # every local site → the local builder
```

`--print-env` and `--print-token` configure opposite sides of the wire and are deliberately
separate: the first is read by the **Worker** and belongs in `.dev.vars.local`, the second is read
by whoever is **calling** and belongs in a shell.

Three outcomes, and the order matters. A complete pair is exchanged for a
`cf-access-jwt-assertion` on the forwarded request and the pair itself is spent here, as at the
real edge. A complete but *wrong* pair is a **403**, never a redirect — BUG-36 records what a 302
costs a client, which follows it, receives the login page as 200, and parses HTML as its result. A
request with no credential gets the 302 to `/login` a browser wants. Half a pair is no pair, which
is the rule `1c push` already enforces on the way out.

The default pair is well known (`local-dev.access` / `local-dev-secret`, overridable with
`--client-id` / `--client-secret`), and that is not a weakening: `/mint` already hands anyone a
token for any address with no credential at all, and the listener binds to loopback. What the pair
buys is that the client side is byte-identical to production.

**The minted token is the faithful shape** — `common_name`, no email, exactly as Cloudflare's is —
so the local path exercises `SERVICE_TOKEN_IDENTITIES` rather than a friendlier shortcut. That
mapping is the third line `--print-env` emits, with the name derived from `--client-id` and the
address from `--service-email` (defaulting to the first `PLATFORM_ADMINS` entry, read from
`.dev.vars` then `wrangler.toml` in the order the Worker reads them). Pass the same flags to both
invocations of the script, or pass none to both and let the defaults agree; the startup banner
prints the mapping this process would exchange, so a disagreement is visible rather than a puzzling
refusal. With no address to map the name to, the exchange refuses here rather than minting a token
the Worker will turn away.

A first push against a fresh database also has to clear the terms gate once (REQ-169), which
refuses every route until the account has accepted — and accepting is a browser action `1c push`
has no way to perform. Sign in at `/login` and accept at `/terms`, or do it from a shell with a
minted cookie:

```bash
curl -X POST -H 'content-type: application/json' -d '{}' \
  --cookie "CF_Authorization=$(curl -s 'http://127.0.0.1:8799/mint?email=you@example.com')" \
  http://127.0.0.1:8799/api/terms/accept
```

<!-- The cookie, not the service-token headers: a credential value has no place in this file and
     `test_UAT_FC_REQ-147_the_access_policy_is_recorded_in_the_repository` enforces that. -->

**There is no operator in the seed.** `PLATFORM_ADMINS` is how somebody privileged comes to exist
in an empty database (REQ-185) — set it in `.dev.vars.local` alongside the two vars above, sign in
once, and empty it. Using it *writes* the membership, so the repair outlives the var.

## The sign-in paths must bypass Access ([[REQ-202]])

Access is now the **second** producer of a verified identity, not the only one. `src/sessions.ts`
mints passwordless sessions, and `src/index.ts` reads a session cookie first and falls back to the
Access JWT — both produce the same verified email and nothing downstream can tell which answered.
Access **stays**: it is the operator's own route in, and the way back if the session path breaks.

But Access enforces on a **hostname**, and the sign-in routes are exactly the routes a person with
no identity has to be able to reach. Left under the blanket policy, an invitee clicking their
invitation meets Access first and is challenged with its **own one-time-PIN email** — two messages
per invite, the first of them Cloudflare-branded, and the invitation never delivers the person it
was sent to.

So the Access application needs a **Bypass** policy, ahead of the allow-list, scoped to these
paths on `app.1stcontact.io`:

| Path | Method | What it is |
|---|---|---|
| `/sign-in` | `GET`, `POST`, `OPTIONS` | the address form, and the endpoint the address is posted to |
| `/sign-in/*` | `GET`, `POST` | the emailed link's Continue page, and the redeem it posts to |
| `/sign-out` | `POST` | ending a session |

Zero Trust → Access → Applications → the app → **Policies** → Add a policy → Action **Bypass**,
Include **Everyone**, and add the paths under the application's *Path* configuration (or add a
second self-hosted application scoped to those paths with a Bypass policy, which is the shape
Cloudflare's UI makes easier).

**What replaces the gate is the token.** Holding a sign-in link is the whole credential — 256 bits
used as a primary key, single-use, enforced by a conditional `UPDATE` in the database rather than
by application code (REQ-134). Nothing behind these paths reads a store handle, resolves a scope or
touches a site; the most a caller reaches is a session for a person the database already knows, and
an address the database does not know sends nothing and mints nothing.

> ⚠️ **Without the bypass, this deployment's invitations do not work.** The code is complete and
> the edge refuses the request before the Worker sees it. `wrangler dev` is unaffected — Access is
> in front of the *deployed* Worker only — so the failure appears first in production.

## What Access does *not* change

- **Draft snapshots served by `public-site` stay link-private, not authenticated** — an
  unguessable, content-addressed URL (DOC-12 §5.1). Access sits in front of `control-app` only,
  and this ticket does not revisit that decision.
- **`wrangler dev` is unaffected at the edge** — Access is in front of the *deployed* Worker. The
  in-Worker check still applies, so a locally-run `control-app` with empty vars answers 503. The
  local builder surface is the Node origin itself (`1c builder`, `http://localhost:8790`), which
  is unproxied and unaffected.
- **The preview iframe is same-origin**, so it inherits the Access cookie. The SSE streaming turn
  (`/api/ai/prompt`) surviving Access is *confirmed*, not presumed, by REQ-146 — it needs a
  running assistant to confirm against.

## Verifying it

```bash
# 1. Unauthenticated → challenged, never served.
curl -sSI https://app.1stcontact.io/ | head -1        # expect 302 to <team>.cloudflareaccess.com

# 2. The workers.dev door is shut.
curl -sSI https://1stcontact-control-app.<subdomain>.workers.dev/   # expect DNS failure / 404

# 3. Both, as part of a deploy.
bin/smoke --control-origin https://app.1stcontact.io \
          --workers-dev-origin https://1stcontact-control-app.<subdomain>.workers.dev
```

An identity that authenticates but is not on the policy is refused by Access with its own
"you do not have access" page; the Worker never sees the request.
