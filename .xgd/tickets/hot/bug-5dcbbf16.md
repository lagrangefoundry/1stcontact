---
uid: bug-5dcbbf16
id: BUG-391
type: bug
title: 'bin/deploy: leaves the terminal''s keyboard handling broken until Ctrl-C'
created_by: EPIC-16
created_at: '2026-11-08T22:12:08.596790+00:00'
updated_at: '2026-11-08T22:12:08.596790+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: low
  parent_uid: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-75733172
---

## Symptom

After running `bin/deploy`, the operator's terminal stops handling control
characters properly: keys such as arrows, backspace and Ctrl-combinations come
out as raw escape sequences or do the wrong thing. Pressing Ctrl-C once puts
it right. It happens repeatedly, so it's a nuisance rather than a one-off.

Not yet narrowed down: which `--env` it happens with (dev, production, or
both), and whether it starts during the deploy or only once it has finished.

## What's ruled out

- The dev services restarted by `bin/deploy --env dev` (`1c dev serve` /
  `1c dev front`) are started with `stdio: ['ignore', log, log]`
  (`tools/generate/src/cli/dev.ts`), so their own `wrangler dev` sessions
  never see the terminal and can't turn on its interactive hotkey mode.
- `bin/deploy` itself only writes plain bold `\033[1m … \033[0m` headings,
  which can't change keyboard modes.

## Likely causes (to confirm)

Child processes `bin/deploy` runs with the terminal attached, any of which
could switch the terminal into a different mode (raw mode, hidden cursor,
bracketed paste, an extended keyboard protocol) and exit without switching it
back:
- `npx wrangler deploy` (and `--dry-run`), including its interactive
  prompts, spinner and container-build progress output;
- the container image build that wrangler starts (`docker buildx` progress
  display) and the `20-control-app-container` hook;
- other hook scripts under `bin/deploy.d/` that run `npx`/node tools on the
  terminal, and `1c images prune`.

That Ctrl-C fixes it suggests a process still holding the terminal (or a
mode the shell resets once interrupted).

## Fix

- Find which child leaves the terminal changed (run each step and compare
  `stty -a` and the terminal's behaviour before and after).
- Stop it from changing the terminal: give that child no terminal for input
  (`</dev/null`) or turn off its interactive mode with a flag/environment
  setting. Keep the progress output the operator reads.
- As a backstop, `bin/deploy` saves the terminal's settings at the start
  (`stty -g`, only when stdin is a terminal) and restores them in its EXIT
  trap, on success and on failure.

## Test plan

- UAT `test_UAT_FC_<id>_terminal_settings_restored_after_deploy`: run
  `bin/deploy --dry-run` under a pseudo-terminal with a child stand-in that
  switches the terminal to raw mode and exits; assert the terminal's
  settings after the deploy match those before it, both for a deploy that
  succeeds and one that fails.
- Existing `bin/deploy` suites stay green (run them with
  `--no-file-parallelism`, since they collide when run in parallel).