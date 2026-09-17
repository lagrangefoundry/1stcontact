# Secret hooks

`bin/deploy` runs every **executable** file in this directory before it uploads an app.
This file is not executable, so it is documentation and nothing else.

## The mechanism

A secret value lives in exactly two places: Cloudflare's secret store, and wherever the
operator keeps it (environment, password manager). It is **never** in this repository,
never in a `wrangler.toml`, never in a file under `bin/`, and never printed.

The push:

```bash
printf '%s' "$THE_VALUE" | npx wrangler secret put NAME --env production
```

`printf` rather than `echo` because `echo` appends a newline and the newline becomes part
of the secret. Piping rather than passing an argument because an argument is visible in
`ps` and in shell history.

The only half that is safe to look at is the list of **names**:

```bash
npx wrangler secret list --env production
```

## Presence is not capability

A hook used to answer one question — *is there a value* — and a key with the wrong
scope, the wrong account or an expired lifetime passed all three outcomes below and
shipped. That is how a Resend **Sending access** key reached production: it sends mail
and answers `401` to `GET /domains`, so `Your domain` offered a sending toggle it could
never honour ([[REQ-264]]).

So a value the operator supplies is **probed** before it is pushed, against the
permission the product actually uses. `bin/deploy.d/lib/probe.mjs` holds every probe and
is the only file that knows a provider's API; `bin/deploy.d/lib/secret.sh` is the shell
mechanism the hooks share. Three rules govern a probe:

- **Read-only.** A deploy must not create a DNS record to prove it can write one. Where a
  permission cannot be proven without writing — `Zone:DNS:Edit` is the only one — the
  nearest read is proven and the report says the edit is *inferred*, not verified.
- **The probe is the call the product makes.** `GET /domains` for Resend is the request
  that failed in the field. A synthetic health check on some other endpoint would answer
  `200` for a sending-only key and prove the wrong thing.
- **It runs on a rehearsal too.** Every request is a read, so `bin/deploy --dry-run` is a
  way to find out whether the credentials still work before committing to a deploy.

A probe answers one of four things, and the hook decides what each one costs:

| Probe says | Means |
|---|---|
| **capable** | it can do the thing the product needs |
| **insufficient** | the credential is live but lacks that permission |
| **invalid** | the provider does not recognise it at all |
| **unproven** | nobody answered — this never fails a deploy, because a lost network is not a broken key |

**A stored value cannot be probed.** `wrangler secret list` answers with names; the value
itself is unreadable by design. So a deploy that leaves a secret alone proves nothing
about it, and the report says `unverified` rather than passing it. The probe therefore
runs on a rotation and on a first push, which is exactly when the value is new.

**Every hook writes a row, in every outcome.** They go to `$DEPLOY_CAPABILITY_REPORT` and
`bin/deploy` prints them together under `==> Capabilities` at the end — what each
credential can do, what it cannot, when it expires, and what is consequently off in the
shipped product. One place, at the moment the operator is looking. A capability that is
off and named nowhere in that output is a bug in this directory.

### Expiry, which is the *"up to date"* half

`GET /user/tokens/verify` returns `expires_on`, so a Cloudflare token inside its last
thirty days is reported with the date rather than left to become a deploy that starts
failing on a day nobody wrote down. **This is honestly partial**: Resend keys do not
expire, and neither Anthropic nor OpenAI exposes an expiry over the API. The expiry line
says which of those it is and is never left blank — a blank column would read as
*checked and fine*, which is the one thing it must not say.

## Writing a hook

A hook contains the *name* and the *push*, and decides between three outcomes before it
touches anything:

| The value is | The Worker | Outcome |
|---|---|---|
| in the environment | either way | **push** — supplying a value is how a rotation is expressed |
| absent | already holds the name | **keep** — say so, change nothing |
| absent | does not, or could not be read | **fail**, before anything is uploaded |

A hook may **warn and continue** instead of failing on that last row, and one does:
`20-resend-api-key` ([[REQ-196]]). The rule is that the outcome must match what a
deployment without the value actually does. A control app with no `ANTHROPIC_API_KEY`
cannot take a turn, so that hook aborts; a control app with no `RESEND_API_KEY` selects
the local mail adapter and delivers nothing, which is survivable only for as long as
nothing sends. Warning is not a softer failure — it is a different claim, and it stops
being the right one the moment a route can send.

The guard is about the *store*, not the operator's shell. A hook that tests only the
environment fails deploys whose secret has been in place for weeks, demanding the operator
re-supply a value Cloudflare already holds in order to overwrite it with itself.

Only a **positive** read satisfies it: the store answered, and the name was in the answer.
A `secret list` that fails for any reason — no such Worker on a first deploy, no network, a
token without Workers Scripts read — counts as absent, because the failure mode being
guarded against is a confident skip based on an answer nobody actually got.

```bash
#!/usr/bin/env bash
set -euo pipefail

# One secret per hook, named after it: 10-anthropic-api-key
[[ "$DEPLOY_APP" == "control-app" ]] || exit 0

# The shared mechanism — store reads, capability probes, report rows. The
# decision table stays in the hook, because it is this credential's own claim
# about what its absence costs.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../lib" && pwd)/secret.sh"

if [[ -n "${NAME:-}" ]]; then
  action=push
else
  case "$(secret_in_store NAME)" in
    present) action=keep ;;
    absent) action=fail state=absent reason="the Worker has no NAME either" ;;
    unreadable) action=fail state=unreadable reason="and its secrets could not be read to check" ;;
  esac
fi

# Probed BEFORE the push and before the upload, so a credential that cannot do
# the job is reported before anything is uploaded.
capability=0
if [[ "$action" == "push" ]]; then
  set +e
  capability_probe NAME
  capability=$?
  set -e
  if [[ "$capability" == "3" ]]; then action=refused; fi
fi
```

Four copies of a store read lived in four hooks before [[REQ-264]]; the mechanism is
shared now and only the decision table is per-hook. `secret_in_store` keeps the
asymmetry described above — a read that failed is `unreadable`, never `present`.

See `10-anthropic-api-key` for the whole shape, including the failure message.

Three rules that hold for every hook here:

- **Honour `DEPLOY_DRY_RUN`.** A rehearsal must change nothing, or `--dry-run` stops being
  a rehearsal. It reports the decision it *would* have acted on, and reaches that decision
  by the same route — including the failure, so a rehearsal tells you whether the real
  deploy would stop.
- **Never echo the value**, not even truncated. Report the *name* and the destination.
- **Fail before the upload, never after.** Hooks run ahead of `wrangler deploy` precisely
  so a missing credential stops the code that assumes it.

## Who lands what

No secret was required by REQ-144 — that ticket shipped the mechanism, proved with a
throwaway value. `ANTHROPIC_API_KEY` arrived with REQ-146 as `10-anthropic-api-key`,
which needed no change here: the hook contract was already right.

`RESEND_API_KEY` arrived with [[REQ-196]] as `20-resend-api-key` — the same shape, with
the absent-everywhere row warning rather than failing, for the reason above.

`CLOUDFLARE_DNS_TOKEN` arrived with [[REQ-257]] as `40-cloudflare-dns-token`, warning for
the same reason and saying in the same breath what would end it — *"the moment serving a
custom domain depends on it"*. [[REQ-259]] is that moment: `Your domain` is a customer
surface and every control in it goes through the zone credential, so the hook now
**fails** the absent-everywhere row. `20-resend-api-key` deliberately did not move with
it. REQ-259 calls that key too and is survivable without it — the domain still attaches
and the toggle reports `off` — which is the test the table above actually states: the
outcome must match what a deployment without the value does.

[[REQ-264]] gave every hook a capability probe and gave `bin/deploy` the report. It also
moved two hooks' verdicts: a Resend key the provider REFUSES now fails (an absent key is
a deliberate state and still only warns — a refused one is an operator error, and the
Worker would select the Resend sender and error on every message), and an OpenAI key the
provider refuses fails for the same reason (an absent key drops the image tool cleanly;
a dead one offers it and fails every call). `40-cloudflare-dns-token` refuses a token
that cannot read the account's zones on REQ-259's own argument, arrived at from the other
direction: the section ships either way.

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` have a probe and deliberately no hook.
Production selects the Worker's `AI` binding ([[BUG-73]]), so that pair is the operator's
own build credential for `1c kb build` rather than something this deploy pushes — there
is no secret here to guard, and the probe exists for the caller that has one.

REQ-149 corrected the guard itself. `10-anthropic-api-key` had tested the environment and
nothing else, so a deploy from a shell without the key was refused even when the Worker had
held the secret since the previous deploy — the operator was asked to re-supply a value in
order to overwrite it with itself. It now reads the name back out of the store, and only a
value the operator actually supplies causes a push.
