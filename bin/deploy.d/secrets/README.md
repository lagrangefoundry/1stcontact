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

A hook contains the *name* and the *push*. It reads the value from the environment and
fails loudly when it is absent — a deploy that silently skipped a secret is a deploy that
looks fine and 500s later.

```bash
#!/usr/bin/env bash
set -euo pipefail

# One secret per hook, named after it: 10-anthropic-api-key
[[ "$DEPLOY_APP" == "control-app" ]] || exit 0

if [[ "${DEPLOY_DRY_RUN:-0}" == "1" ]]; then
  echo "    would push ANTHROPIC_API_KEY to $DEPLOY_WORKER_NAME"
  exit 0
fi

: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY in your environment before deploying}"
printf '%s' "$ANTHROPIC_API_KEY" |
  (cd "$DEPLOY_APP_DIR" && npx wrangler secret put ANTHROPIC_API_KEY --env "$DEPLOY_ENV")
echo "    pushed ANTHROPIC_API_KEY to $DEPLOY_WORKER_NAME"
```

Two rules that hold for every hook here:

- **Honour `DEPLOY_DRY_RUN`.** A rehearsal must change nothing, or `--dry-run` stops being
  a rehearsal.
- **Never echo the value**, not even truncated. Report the *name* and the destination.

## Who lands what

No secret was required by REQ-144 — that ticket shipped the mechanism, proved with a
throwaway value. `ANTHROPIC_API_KEY` arrived with REQ-146 as `10-anthropic-api-key`,
which needed no change here: the hook contract was already right.
