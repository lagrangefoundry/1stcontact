---
uid: bug-4b0ef37f
id: BUG-50
type: bug
title: 1c builder and pnpm dev:control start the same server differently
created_by: xgd
created_at: '2026-09-02T23:50:14.011344+00:00'
updated_at: '2026-09-02T23:50:14.011344+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
---

# `1c builder` and `pnpm dev:control` start the same server differently

## Why

There are two ways to start the control app's dev server and they do not load
the same environment. The one an operator is most likely to type is the one that
silently drops the API key.

`pnpm dev:control` runs:

```
wrangler dev --port 8788 --env-file .dev.vars \
             --env-file ${ONECONTACT_SECRETS:-$HOME/Documents/secrets/1c.dev.env}
```

`1c builder` composes `['wrangler', 'dev', '--port', port]` (plus `--remote` when
asked) and no `--env-file` at all (`tools/generate/src/cli/index.ts:729-735`).

`--env-file` **replaces** wrangler's default `.dev.vars` lookup rather than
adding to it, so the two paths diverge like this:

| | `.dev.vars` | secrets file | Access | `ANTHROPIC_API_KEY` |
|---|---|---|---|---|
| `pnpm dev:control` | named explicitly | named explicitly | off | **loaded** |
| `1c builder` | default lookup | never named | off | **absent** |

Access ends up off either way, which is correct locally and is why this has gone
unnoticed: the builder comes up, looks right, and serves. `.dev.vars` carries
only `ACCESS_TEAM_DOMAIN=` and `ACCESS_AUD=` (both deliberately empty, so
`ACCESS_DEV_OPEN=1` from `wrangler.toml [vars]` takes effect). The key lives
only in `~/Documents/secrets/1c.dev.env`, which nothing in the `1c builder` path
ever names.

## What actually breaks, including the half that is silent

**The assistant cannot take a turn.** `ai.ts:196` passes no `apiKey`, and the
chat panel reports the assistant is not switched on. Annoying, but it says so.

**Uploaded images are never looked at, and nothing says so.**
`defaultDescriber` (`router.ts:341`) returns `undefined` when the key is absent,
so ingestion stores the file and writes a material body saying nothing has
looked at it yet. That is correct behaviour for a deployment with no key — and
badly misleading here, because the operator has a key, put it where the
documentation said, and is testing the exact ingestion-vision path that
[[CHAT-35]] turned on. The symptom is indistinguishable from the feature being
broken.

Both consequences are attributable to a missing flag in a wrapper, which is the
worst kind of bug to debug: everything about the configuration is correct.

## What to change

**One definition of the env-file layering, used by both entry points.**
`1c builder` must compose the same two `--env-file` flags the package script
does, honouring `ONECONTACT_SECRETS` with the same default. Whether the CLI
grows the knowledge or the package script becomes the single caller is an
implementation choice; what must not survive is two places that each know half
of it. The current split is exactly how the divergence arose.

**Say when the secrets file is absent — do not fail.** Print the path that was
looked for and the consequence ("the assistant cannot take a turn; uploaded
images will not be described"). A missing key is an ordinary runtime state in
this codebase — the Worker is built to open, serve and explain itself without
one — so this is a warning at startup, not an error. It is the *silent* version
that this ticket exists to remove.

`--remote` is unaffected and keeps its current meaning and warning.

## Done means

1. `1c builder` starts a server whose environment matches `pnpm dev:control`,
   including `ONECONTACT_SECRETS`.
2. The env-file layering is defined once.
3. Starting `1c builder` with no secrets file names the path it looked for and
   what will not work; it still starts.
4. A UAT named `test_UAT_FC_TICKETID_*` asserts the composed argv carries both
   `--env-file` flags and that `ONECONTACT_SECRETS` overrides the default.
5. **[[DOC-41]] §2 is updated**: the subsection *"Gotcha: `1c builder` is not
   `pnpm dev:control`"* is removed or rewritten, because it stops being true.
   Leaving a runbook describing a trap that no longer exists is its own defect —
   the next operator works around something that was fixed.
