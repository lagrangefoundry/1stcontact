---
uid: bug-4b0ef37f
id: BUG-50
type: bug
title: 1c builder and pnpm dev:control start the same server differently
created_by: xgd
created_at: '2026-09-02T23:50:14.011344+00:00'
updated_at: '2026-09-04T01:27:38.786517+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b3022042
  commits:
  - working_sha: a922dac72f6570c8d9bb316d4a56f9e0751f04c2
    reconcile_sha: null
    main_sha: null
  version: 0.2.64
---

# `1c builder` and `pnpm dev:control` start the same server differently

## Why

There are two ways to start the control app's dev server and they do not load
the same environment. The one an operator is most likely to type is the one that
drops the API key.

The intended layering — the one `.dev.vars` and [[DOC-41]] §2 both describe — is:

```
wrangler dev --port 8788 --env-file .dev.vars \
             --env-file ${ONECONTACT_SECRETS:-$HOME/Documents/secrets/1c.dev.env}
```

`1c builder` composes `['wrangler', 'dev', '--port', port]` (plus `--remote` when
asked) and no `--env-file` at all (`tools/generate/src/cli/index.ts`, `case
'builder'`).

`--env-file` **replaces** wrangler's default `.dev.vars` lookup rather than
adding to it. Confirmed against wrangler 4.106's own `getVarsForDev`: the default
`.dev.vars` read is guarded by `if (!envFiles?.length)`, the explicit list is
loaded through `dotenv` with `override: true` so later files win, and the whole
mechanism is on by default (`CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV` defaults to
`true`). Paths resolve against the **wrangler config directory**, not the caller's
cwd, so `.dev.vars` means `apps/control-app/.dev.vars` from anywhere and an
absolute secrets path is unaffected. Composing the same two flags inside the CLI —
which already spawns with `cwd: apps/control-app` — is therefore exactly
equivalent to composing them in the package script.

The two paths therefore differ like this:

| | `.dev.vars` | secrets file | Access | `ANTHROPIC_API_KEY` |
|---|---|---|---|---|
| intended layering | named explicitly | named explicitly | off | **loaded** |
| `1c builder` | default lookup | never named | off | **absent** |

Access ends up off either way, which is correct locally and is why this has gone
unnoticed: the builder comes up, looks right, and serves. `.dev.vars` carries
only `ACCESS_TEAM_DOMAIN=` and `ACCESS_AUD=` (both deliberately empty, so
`ACCESS_DEV_OPEN=1` from `wrangler.toml [vars]` takes effect). The key lives
only in `~/Documents/secrets/1c.dev.env`, which nothing in the `1c builder` path
ever names.

### The starting state is worse than "they diverge"

Investigation found the layering is **not committed**. At `HEAD`,
`apps/control-app/package.json` reads `"dev": "wrangler dev --port 8788"` — byte
for byte what `1c builder` composes. So the committed defect is not that two
paths disagree; it is that **no** path names the secrets file, and the divergence
above exists only where the fix has been applied to one side and not the other.
That is the same bug seen one step earlier, and it is what this ticket closes: not
by making the second path match the first, but by giving both one definition
neither can drift from.

## What actually breaks

**The assistant cannot take a turn.** `ai.ts` passes no `apiKey`, and the chat
panel reports the assistant is not switched on.

**Uploads are refused.** Since [[REQ-173]], `POST /api/material` and
`/api/material/fetch` answer `503` with `NO_API_KEY_MESSAGE` before the bytes are
read, and `GET /api/status` reports `{ai: false}` so the chrome can state the
fact once at the top of the screen.

This ticket was filed before REQ-173 landed and originally described a silent
half: `defaultDescriber` returning `undefined`, ingestion storing a file and
writing a material body saying nothing had looked at it, indistinguishable from
the feature being broken. **That half is gone.** REQ-173 merged roughly two hours
after this ticket was written and made the missing key a deployment-wide fact
that is announced rather than discovered one surface at a time. `defaultDescriber`
still returns `undefined` with no key; nothing reaches it.

What survives is a plain wrapper bug with loud symptoms — and it is still worth
fixing, because the loudness is the problem. The operator has a key, put it where
the documentation said, and the builder truthfully reports having none. Everything
about the configuration is correct and the tool says otherwise; that is a
debugging trap whether or not it is silent.

## `.dev.vars` is not committed, and something has to give

[[DOC-41]] §2 states that "`.dev.vars` is committed and holds no secrets", and the
file's own header says it "holds the local-dev config every clone needs". Neither
is true of the repository: the file has never been tracked, and the header
simultaneously claims it is "Ignored by git (.gitignore)".

This matters to requirement 1. `isUnconfiguredLocalDev` (`apps/control-app/src/index.ts`)
requires **both** `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` to be empty, and
`wrangler.toml [vars]` fills both in. A clone with no `.dev.vars` therefore gets
`ACCESS_DEV_OPEN=1` with no effect, the Access gate runs, and there is no token on
loopback — the local builder is unreachable by **either** entry point.

Whether `.dev.vars` becomes a tracked file is a separate decision and is NOT
settled here. What this ticket does is make the state legible rather than
inferred: a missing `.dev.vars` is named at startup alongside a missing secrets
file, with its own distinct consequence, so the fresh-clone trap announces itself
instead of presenting as an Access misconfiguration.

## What to change

**One definition of the env-file layering, used by both entry points.** The CLI
grows the knowledge and the package script becomes the single caller:

1. `1c builder` composes both `--env-file` flags — `.dev.vars` first, then the
   secrets file — honouring `ONECONTACT_SECRETS` with
   `$HOME/Documents/secrets/1c.dev.env` as the default.
2. Root `dev:control` invokes `1c builder` rather than composing `wrangler dev`
   itself, and `apps/control-app`'s own `dev` script is removed. Leaving it would
   be the third place that knows half of this, which is how the split arose.
3. `1c builder` resolves the repo root from the CLI module's own location instead
   of `process.cwd()`. It derives `apps/control-app` from the working directory
   today, so it only works when typed at the repo root — which the delegation in
   (2) would otherwise depend on silently.

**Say when an env file is absent — do not fail.** Wrangler tolerates a named
`--env-file` that does not exist (`ENOENT` is logged at debug level and loading
continues), so both flags are passed unconditionally and the check exists only to
produce the message. Print the path that was looked for and the consequence:

- secrets file missing → "the assistant cannot take a turn; uploads will be
  refused".
- `.dev.vars` missing → Cloudflare Access will not be open on loopback.

A missing key is an ordinary runtime state in this codebase — the Worker is built
to open, serve and explain itself without one — so these are warnings at startup,
not errors. It is the *unstated* version this ticket exists to remove.

`--remote` is unaffected and keeps its current meaning and warning.

## Done means

1. `1c builder` starts a server whose environment matches the intended layering,
   including `ONECONTACT_SECRETS`.
2. The env-file layering is defined once, in the CLI, with the package scripts as
   callers.
3. Starting `1c builder` with no secrets file names the path it looked for and
   what will not work; it still starts. The same holds for a missing `.dev.vars`,
   with its own consequence named.
4. `1c builder` composes the same argv regardless of the directory it is typed in.
5. UATs named `test_UAT_FC_BUG-50_*` assert, through `run(['builder'])` with the
   process boundary stubbed, that the composed argv carries both `--env-file`
   flags in order, that `ONECONTACT_SECRETS` overrides the default, that each
   absent env file is named with its consequence and the server still starts, and
   that `--remote` survives.
6. **[[DOC-41]] §2 is updated**: the subsection *"Gotcha: `1c builder` is not
   `pnpm dev:control`"* is removed, because it stops being true. Leaving a runbook
   describing a trap that no longer exists is its own defect — the next operator
   works around something that was fixed. §2's claim that `.dev.vars` is committed
   is corrected to describe what the repository actually does.