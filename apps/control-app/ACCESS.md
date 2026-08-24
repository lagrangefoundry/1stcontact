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

Both values are declared in `wrangler.toml` twice, because a named environment inherits neither
`vars` nor bindings (REQ-144) — but only one of the two declarations carries the identifiers.

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

> ⚠️ **The values go under `[env.production.vars]`, and the top-level `[vars]` pair stays empty.**
> That is not an oversight to tidy up later. `wrangler dev` reads the top-level block, and
> `ACCESS_DEV_OPEN` — the var that lets an operator reach their own builder on `127.0.0.1`, which
> no Access policy fronts and which therefore presents no token — is **inert unless both
> identifiers are empty**. Fill them in at the top level and `1c builder` comes up and answers
> `401` to every request; the deployed gate is unaffected either way, because production inherits
> nothing from that block. A UAT pins both halves
> (`tests/test_UAT_FC_REQ-145_build_artifacts.test.ts`).

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

## What Access does *not* change

- **Draft snapshots served by `public-site` stay link-private, not authenticated** — an
  unguessable, content-addressed URL (DOC-12 §5.1). Access sits in front of `control-app` only,
  and this ticket does not revisit that decision.
- **`wrangler dev` is unaffected at the edge** — Access is in front of the *deployed* Worker. The
  in-Worker check still applies, and there is no longer a separate local surface for it to miss:
  REQ-145 deleted the Node origin, so `1c builder` **is** this Worker under `wrangler dev`
  (`http://localhost:8788`). What lets an operator reach it is `ACCESS_DEV_OPEN = "1"` together
  with the empty top-level identifiers described under [Configuration](#configuration); with the
  identifiers filled in locally the gate correctly refuses a loopback request that carries no
  Access token, which is why they are not filled in there.
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
