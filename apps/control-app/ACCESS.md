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

<!-- Append a row when an identity is added, and say WHY. A row removed here must also be removed
     from the Cloudflare policy — this table is the record, not a copy of one. -->

### Automation

Anything calling `app.1stcontact.io` without a human at the keyboard needs an Access
**service token** (Zero Trust → Access → Service Auth), added to the application's policy as a
*Service Auth* rule. The caller sends `CF-Access-Client-Id` and `CF-Access-Client-Secret`; Access
exchanges them at the edge for a JWT carrying `common_name` instead of `email`, which
`verifyAccessJwt` accepts on the same terms as a human identity.

The client secret is a real credential: it goes in the operator's password manager and, if a
deploy hook ever needs it, into Cloudflare's own secret store via `bin/deploy.d/secrets/`. Never
into this repository.

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
