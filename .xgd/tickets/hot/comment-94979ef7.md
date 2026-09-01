---
uid: comment-94979ef7
id: COMMENT-2023
type: comment
title: Comment on bug BUG-40
created_by: xgd
created_at: '2026-09-01T19:02:28.040793+00:00'
updated_at: '2026-09-01T19:30:35.702901+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3ade1af4
  kind: chat_transcript
---

<!-- xgd-turn id="70d66e88-283f-4b9c-bb15-497fb80ab9e7-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T19:01:50.770647+00:00" -->
#### You
We currently have 23 test failures, please can you fix them

<!-- xgd-turn id="70d66e88-283f-4b9c-bb15-497fb80ab9e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T19:30:35.602302+00:00" -->
#### Claude
Now I have the full picture. Let me populate the ticket.

Now let me apply the smoke-suite changes.

Now the three AC bodies:

Now let me verify the full suite in the main checkout, on the merged result.

The suite is green: **280 files, 2151 tests, 0 failures** (was 27 failing tests + 30 collection errors).

## Three causes, not one

**1. A half-finished `pnpm install` (environment).** `iconv-lite` was missing from `node_modules`, so jsdom couldn't load and **17 test files died at import**. The same aborted install left `node_modules/.pnpm/lock.yaml` disagreeing with `pnpm-lock.yaml`, which REQ-44's preflight compares byte-for-byte — that made every browser/imaging-gated `1c` verb refuse with `ENVIRONMENT`, failing ~11 more tests.

`pnpm install` **cannot complete in this sandbox**: the `iconv-lite@0.6.3` tarball ships a `.idea/codeStyles/` directory, and creating any `.idea` path under the project is denied. I repaired the tree by hand. **Please run `pnpm install` yourself outside the sandbox** so it's pnpm-managed again.

**2. A stale `1c assets` build (environment + one real defect).** `dist-assets/` held only `builder/`. Rebuilding fixed the isolated runs but not the full one, which exposed a genuine bug: `1c assets` `rm -rf`'d the directory it was about to fill and then spent seconds refilling it, so anything reading it meanwhile got 404s — and a build that failed part-way left the hole permanently. The smoke UAT drives `bin/build` against the real tree, so it raced the builder-origin suite. It now stages into `dist-assets.staging/` and swaps in once whole.

**3. Eleven UATs left behind by later intents.** In each case the implementation is current and the test was stale, so the test moved — BUG-38 replaced the per-isolate session registry with a store read (AC-1055, REQ-127); REQ-147 added two smoke checks (AC-1336/7/8); REQ-145 made `1c assets` a build stage and retired `BUILDER_ORIGIN` (AC-1331, AC-1341); REQ-149 moved the secret-push messages into the hook (AC-1342); the palette work added a colour descriptor (AC-1123); the knowledge components brought the org scope into prose (AC-960). Plus AC-964, which required a preview route to answer 200 — it only passed on a checkout carrying a site left behind in local miniflare state, and failed on a clean one.

Committed as `e5d76233` on `xgd-working`, version 0.2.33, ticket at `free_coded`.

Two things worth a separate ticket if you want them, which I did **not** do:
- Nothing in the suite builds `dist-assets`, so a fresh checkout still needs `./bin/1c assets` first.
- The `--skip-preflight` scenario now proves the flag skips the *check*, not that an incomplete store can build — which is the honest claim, but it means there's no path to building without the shared components at all.

<!-- xgd-chat-end -->