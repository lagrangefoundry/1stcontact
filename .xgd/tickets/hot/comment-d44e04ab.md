---
uid: comment-d44e04ab
id: COMMENT-3032
type: comment
title: Comment on bug BUG-101
created_by: xgd
created_at: '2026-09-17T21:35:31.205901+00:00'
updated_at: '2026-09-17T21:55:20.122175+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4bebb3a4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6da3fa37-5330-49d2-aa8c-ae74f251eb53",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="97d8ec53-384a-4bdb-8b2b-fa17454ccbc6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:34:33.169870+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="97d8ec53-384a-4bdb-8b2b-fa17454ccbc6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:41:27.992297+00:00" -->
#### Claude
Investigated. The ticket's diagnosis is correct in every particular; here's what I added by measuring rather than reasoning.

## Confirmed, and confirmed on a *committed* fixture

```
./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json | wc -c   →  65536
./bin/1c page get gigabytealchemy       home           --json | wc -c      →  65536
./bin/1c page get gigabytealchemy       home           --json > f          →  71219
```

`gigabytealchemy/home` is in `git ls-files storage/sites` (190 KB on disk, 71 KB as `--json`). That matters for the fix: a regression test can use it with **no sandbox and no browser**, and `spawnSync` truncates identically to an async `spawn` — so the test fits the existing `tests/test_UAT_FC_REQ-150_plain_vite_bootstrap.test.ts` shape exactly.

## The line has never had a job

`tools/generate/bin/1c.mjs:101` is the only `process.exit()` in the CLI. `git log -S` shows it arrived in `0baf0db1f1`, the commit that created the CLI — it was never added to kill a hanging handle, so there is no known behaviour it is holding up.

Mechanism detail worth recording: the 70 KB document is one `console.log`; libuv writes 65536 into the pipe synchronously, queues the tail, and `await server.close()` evidently resolves without ever reaching a poll-phase turn, so the queued tail is still queued when `process.exit` discards it. That's why a redirect to a file (synchronous fd) is unaffected.

## Both proposed fixes verified by running patched copies

| variant | bytes through a pipe | wall clock | exit codes |
|---|---|---|---|
| today | 65536 | 3.6 s | — |
| `process.exitCode = exitCode` | **71219 / 70145** | 2.1 s | identical on `list`, `page get` (0), `status`, `fonts check`, `nosuchcommand` (1) |
| drain stdout+stderr, then `process.exit` | **71219** | — | — |

## The one residual risk, and I could not close it here

Option A's failure mode if some command *does* leave a live handle is a hang instead of a fast exit. I measured `getActiveResourcesInfo()` after `server.close()` for `list`, `status`, `kb status`, `fonts check` — one or two `Timeout`s each, all unref'd or short, every process still exited promptly.

What I could **not** measure is the browser-driving class (`capture`, `shot`, `gate`, `aligned-crops`, `values-diff`) — chromium can't launch in this sandbox. Code inspection is clean: every `chromium.launch` has a matching `browser.close()`, and `shot.ts` awaits `handle.server.close()`. But that's inspection, not evidence.

## Consumer side is not implicated

`tools/repro-console/src/run.ts`'s `spawnCommand` accumulates every chunk with no `maxBuffer` cap. The defect is entirely producer-side, so the one launcher fix repairs `iteration.ts:394`'s `writeFileSync(step.saveStdoutAs, result.stdout)` and every other consumer at once.

## A sibling instance of the same shape

`tools/repro-console/bin/boot.mjs:59` — `await server.close(); process.exit(process.exitCode ?? 0)` — is the same pattern, and `repro-rail --json` prints its whole report through it (`rail.ts:801`). Under 64 KiB today, but the rail report grows with the number of sites on it. `smoke.mjs:525`, `bin/deploy.d/lib/probe.mjs` and the two `bin/verify_*.mjs` scripts share the shape but print a line or a short table — latent only.

## What I'd do, and the open choice

I lean to **option A** (`process.exitCode = exitCode`): it deletes a line rather than adding five, it makes the launcher match `cli/index.ts`, which uses `process.exitCode` exclusively and never calls `process.exit`, and its failure mode — a hang — is loud, where today's is silent.

Against that: a hang in `1c capture` inside the repro console is a genuinely nasty operational failure, and it's precisely the class I can't test here. Option B (drain both streams, then exit) costs ~5 lines and has no such failure mode at all.

Three things to decide before I cut a branch:

1. **A or B.** If A, it'd be worth you running `1c gate` / `1c capture` / `1c shot` once each against the patched launcher outside the sandbox first — that's the only evidence gap.
2. **Does `boot.mjs` come in scope on this ticket**, or a separate one? Same defect, same one-line fix, different package.
3. **The regression test target.** I'd pin `gigabytealchemy home` and assert both that the piped stdout parses *and* that it exceeds 65536 — so if the fixture ever shrinks below the pipe buffer the test fails loudly rather than going quietly vacuous.

No code changed; the two probe copies I ran are deleted and the tree is clean.

<!-- xgd-turn id="94168791-2aef-4b57-b77c-ee9f7f261ab2-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:48:12.775004+00:00" -->
#### You
Option A it is

<!-- xgd-turn id="94168791-2aef-4b57-b77c-ee9f7f261ab2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:55:19.499833+00:00" -->
#### Claude
Decision noted — Option A. Starting the free-coding flow with Step 1: scope the ticket.

Now the UAT file.

Done. BUG-101 is landed on `xgd-working` and the ticket is `free_coded`.

## The change

`tools/generate/bin/1c.mjs` — `process.exit(exitCode)` → `process.exitCode = exitCode`, with a comment carrying the reason, the measurement, and the accepted trade-off.

```
./bin/1c page get gigabytealchemy home --json | wc -c   →  71219   (was 65536)
… | python3 -c "import json,sys; json.load(sys.stdin)"  →  ok
```

## The UATs

`tests/test_UAT_FC_BUG-101_piped_stdout_not_truncated.test.ts`, five tests, all driving the real binary as a subprocess against the committed `gigabytealchemy/home` fixture — no sandbox, no capture, no browser.

1. **`a_piped_json_document_arrives_whole`** — piped bytes are byte-identical to the same command redirected to a file, with a floor assertion that the fixture still exceeds 65536 so it can't go quietly vacuous.
2. **`the_piped_document_parses_as_the_l1_page`** — parses, `ok: true`, `data.page` present, `"kind"` fields countable; the two false statements the digest derived.
3. **`the_process_ends_on_its_own`** — exits by status, not by signal. This is the guardrail for the new risk.
4. **`the_exit_status_is_still_the_commands`** — `list` → 0, unknown verb → 1.
5. **`the_launcher_never_forces_an_exit`** — no `process.exit(` in the comment-stripped source.

I checked they're real evidence by reverting the launcher and re-running: 1, 2 and 5 fail against the old build; 3 and 4 pass on both, which is correct — they exist to hold the trade-off in place, not to distinguish the builds.

Regression scope, all green: the three launcher suites (`REQ-150`, `req37-launcher`, `req89-astro-lazy`) and the four CLI-spawning suites (`reconciliation-1c-install-preflight`, `reconciliation-1c-astro-free-render`, `reconciliation-scaffold-starter-l1`, `REQ-255 regression rail`) — 59 passed, 2 skipped.

Version bumped 0.2.232 → 0.2.233. Commit `db7e693184`, merged by `git merge` (SHA preserved), branch cleaned, lock released.

## Two things I decided without you, since you'd only answered Q1

**Q2 — `boot.mjs` is out of scope**, and the ticket body now says so and why. It's the identical shape and `repro-rail --json` prints its whole report through it, but the rail's output is under 64 KiB today and I couldn't measure its spawn/vitest path here — so changing it would have been the same blind edit I argued against. It's a real latent bug; say the word and I'll file it as its own ticket.

**Q3 — the regression test target** is what I recommended: `gigabytealchemy/home`, assert parses *and* exceeds the pipe buffer.

One incidental find: a fresh branch worktree can't run the CLI at all — `apps/control-app/src/generated/` is gitignored, so `1c` dies at `Failed to load url ./generated/ticketing`. I copied it in from the main checkout. Same class as the webui-resolution problem, different directory.

<!-- xgd-chat-end -->