---
uid: acceptance_criterion-ce053e5e
id: AC-2163
type: acceptance_criterion
title: 1c builder names each missing env file with its resolved path and consequence,
  and still starts the server
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T12:35:48.127441+00:00'
updated_at: '2026-11-01T12:41:14.703357+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c builder` names each missing env file at startup, says what will not work without it, and still starts the server. A missing env file is a warning, never a refusal.

- **Where the warning goes.** On stderr, after the builder banner and before wrangler's own output. There is one line per absent file. Each line names the *resolved* path that was looked for, not just the bare argument.
- **Each file's consequence.**
  - Secrets file absent: the assistant cannot take a turn, and uploads will be refused.
  - `.dev.vars` absent: Cloudflare Access will not be open on loopback, so the builder will refuse every request.
- **Startup is unaffected.**
  - An absent file is still passed to `wrangler dev` as its `--env-file`. The argv is the same whether or not the files exist.
  - `wrangler dev` is started.
- **No noise when both are present.** When both files exist, no env-file warning is printed.

## Verification
Run `1c builder` with `spawn` stubbed and the env files placed or removed in scratch directories.

With no secrets file at the resolved path, confirm that:
- stderr names that path and states that the assistant cannot take a turn and that uploads will be refused;
- `wrangler dev` was still spawned, with both `--env-file` flags.

With the secrets file present, confirm that stderr names neither the file nor its consequence.

With no `.dev.vars` in the control app directory, confirm that:
- stderr names `.dev.vars` at its resolved path and states that Access will not be open on loopback;
- the server was still spawned.