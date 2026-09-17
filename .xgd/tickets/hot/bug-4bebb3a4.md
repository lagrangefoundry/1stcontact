---
uid: bug-4bebb3a4
id: BUG-101
type: bug
title: '1c: process.exit truncates piped stdout at 64 KiB, silently cutting every
  large --json document'
created_by: martin-github@westhead.me
created_at: '2026-09-17T02:59:27.536394+00:00'
updated_at: '2026-09-17T02:59:27.536394+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d44e04ab
---

`tools/generate/bin/1c.mjs` ends with `process.exit(exitCode)`. Node's
`process.exit()` does not flush pending asynchronous writes to stdout. When
stdout is a **pipe** it is asynchronous, so everything past the OS pipe buffer
(65536 bytes on macOS) is discarded. When stdout is a **file** it is
synchronous, so it all lands.

Every consumer that spawns `1c` with `stdio: 'pipe'` — which includes the
reproduction console's own `spawnStepRunner` — therefore receives at most
64 KiB of any `--json` document, with **no error and exit code 0**.

## Reproduction — two commands, same invocation

```
cd /Users/martin/lagrangefoundry/1stcontact

./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json | wc -c
#    65536        <- through a pipe

./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/t.json; wc -c /tmp/t.json
#    70145 /tmp/t.json   <- to a file
```

65536 is exactly 64 KiB. It is not a general Node behaviour — the same shell
pipes 200000 bytes fine:

```
node -e "process.stdout.write('x'.repeat(200000))" | wc -c
#   200000
```

## What it broke this round

`tools/repro-console/src/iteration.ts:369` writes the round's copy of the L1
document from a piped step's stdout
(`writeFileSync(step.saveStdoutAs, result.stdout)`), so this round's
`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/page.json` is
**exactly 65536 bytes** and is a byte-identical prefix of the real 70145-byte
document. It ends mid-string:

```
…"segments":["interpolate",…],"axes":{"borderRadiusPx":8,"border":{"widthPx":1,"color":"#
```

`json.load()` on it raises
`JSONDecodeError: Unterminated string starting at: line 1 column 65504`.

`tools/repro-console/src/digest.ts` then derived **two false statements** from
it, both of which appear in the round's `ai/evidence-digest.md` and both of
which point a reader at a defect that does not exist:

- *"the reproduction's own L1 names it at: **nowhere**"* for
  `assets/AlchemistLabWithTech.png` (`digest.ts:222`, `describePaths`). The L1
  does name it — `{"kind":"box","id":"section-bg-0","axes":
  {"backgroundImageUrl":"/assets/AlchemistLabWithTech.png","overlay":
  {"color":"#030717","opacity":0.3}}}` — at **byte 4113**, well inside the
  truncated prefix. The statement is false because the parse failed, not because
  the string was cut.
- *"no `kind` fields — check the document really is the L1 page."*
  (`digest.ts:258–262`, `valueCensus`). The document has 66 `kind` fields.

The first of these compounds `BUG-100`: the gate already reports a false
`unreferenced-image` coverage finding for that same asset, and the digest —
which a round reads to shortcut exactly this question — independently
"confirms" it. A round reading only the brief's recommended path sees two
instruments agreeing that a hero background image was dropped, when it is
present in L1 and painted in the render.

## Blast radius

Any `1c` command whose stdout exceeds 64 KiB and is consumed through a pipe.
`page get --json` here is 70 KiB; `gate --json`, `values-diff --json`
(this round's `values-diff.json` is 90.3 KB) and `capture page --json` are all
candidates, as is any shell pipeline a human types (`1c … --json | jq …`).

Silence is the problem: the exit code is 0 and the output is valid-looking JSON
right up to the cut.

## Proposed fix

Do not `process.exit()` with output outstanding. Either:

- set `process.exitCode = exitCode` and let the process end naturally once the
  streams drain (the CLI already uses `process.exitCode` everywhere internally —
  `cli/index.ts` has ~20 assignments to it and no `process.exit()` call at all);
  or
- if an explicit exit is needed to kill the Vite SSR server's handles, await a
  stdout drain first (`await new Promise(r => process.stdout.write('', r))`, or
  listen for `'drain'` when `write` returns false) before exiting.

The first is the smaller change and matches what the rest of the CLI already
does.

## How to know it is fixed

```
./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json | wc -c
```
**Wrong result (now):** `65536`
**Right result (fixed):** `70145` — the same count the file redirect gives,
and `… | python3 -c "import json,sys; d=json.load(sys.stdin); print('ok')"`
prints `ok` instead of raising.

A regression test can assert it without a browser: spawn the CLI with
`stdio: 'pipe'` on any command whose JSON exceeds 64 KiB and assert the captured
stdout parses.

Found while diagnosing loop-1 iteration 2 of `repro-gigabytealchemy-ai`.