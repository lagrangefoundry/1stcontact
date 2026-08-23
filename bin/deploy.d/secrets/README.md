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

## Writing a hook

A hook contains the *name* and the *push*, and decides between three outcomes before it
touches anything:

| The value is | The Worker | Outcome |
|---|---|---|
| in the environment | either way | **push** — supplying a value is how a rotation is expressed |
| absent | already holds the name | **keep** — say so, change nothing |
| absent | does not, or could not be read | **fail**, before anything is uploaded |

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

# Names are the only half that is safe to look at, and reading them changes
# nothing — so this runs unchanged on a rehearsal. Not called at all when the
# environment has the value, so the common path adds no round-trip.
probe_store() {
  local json
  if ! json="$(cd "$DEPLOY_APP_DIR" && npx wrangler secret list --env "$DEPLOY_ENV" 2>/dev/null)"; then
    echo unreadable
  elif printf '%s' "$json" | grep -q '"name"[[:space:]]*:[[:space:]]*"NAME"'; then
    echo present
  else
    echo absent
  fi
}
```

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

REQ-149 corrected the guard itself. `10-anthropic-api-key` had tested the environment and
nothing else, so a deploy from a shell without the key was refused even when the Worker had
held the secret since the previous deploy — the operator was asked to re-supply a value in
order to overwrite it with itself. It now reads the name back out of the store, and only a
value the operator actually supplies causes a push.
