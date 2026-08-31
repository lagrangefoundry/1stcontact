---
uid: acceptance_criterion-c7e51d45
id: AC-738
type: acceptance_criterion
title: Every 1c command boots with clean streams — no boot chatter from any source,
  and stderr is empty
created_by: xgd
created_at: '2026-07-29T04:32:56.846020+00:00'
updated_at: '2026-08-31T11:18:08.695888+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

Every `1c` invocation boots without emitting boot chatter of any kind, from any
source, on either stream.

For a non-rendering command — `help`, `list`, `assets --json`, and the other verbs
that never build a site — the invocation exits 0, its own output appears on
stdout, and **stderr is empty**. Nothing from the server's startup reaches either
stream: no `[vite]` notice, no `[WARN]` line, and in particular no "Missing pages
directory" warning, which is absent because the plugin that scanned the working
root for a pages directory is no longer in the repository at all — not because it
was muted or diverted.

Empty stderr is the strong form of this claim, not an incidental one: the launcher
diverts stdout to stderr for the whole of the server's startup, so anything the
bootstrap emitted — on either stream, from any source — would arrive on stderr.
An empty stderr therefore says the boot produced no output at all, rather than
saying one named warning was suppressed.

The quiet is scoped to chatter: genuine bootstrap errors still surface on stderr,
and a command that fails to boot still reports a non-zero exit status.

## Verification
Run non-rendering commands (`1c help`, `1c list`) as subprocesses from the repo
root, capturing stdout and stderr separately. Confirm each exits 0, produces
non-empty stdout, and produces an entirely empty stderr; confirm stdout contains
none of `[vite]`, `[WARN]`, or "Missing pages directory". Confirm `1c help` really
emitted its usage text, so the clean streams were not bought by a command that
printed nothing.
