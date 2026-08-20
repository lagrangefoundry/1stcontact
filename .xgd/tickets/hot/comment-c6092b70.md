---
uid: comment-c6092b70
id: COMMENT-1194
type: comment
title: Comment on request REQ-150
created_by: xgd
created_at: '2026-08-20T00:47:15.023004+00:00'
updated_at: '2026-08-20T00:54:26.823035+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-34dd9049
  kind: chat_transcript
---

<!-- xgd-turn id="9ba3f900-e9f1-482f-baa3-d98a36294d88-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:47:11.037651+00:00" -->
#### You
Plesae explain this ticket

<!-- xgd-turn id="9ba3f900-e9f1-482f-baa3-d98a36294d88-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T00:48:02.888255+00:00" -->
#### Claude
**REQ-150 — `1c` CLI: boot a plain Vite SSR server, not Astro's**

It's a small cleanup ticket that became possible the moment REQ-148 landed (it's listed as `depends_on: REQ-148`, and REQ-148 is in the last commit on this branch).

**The situation.** Every `1c` command boots through `tools/generate/bin/1c.mjs`, which spins up a Vite SSR server and loads the CLI via `ssrLoadModule`. That Vite server is configured through **Astro's** `getViteConfig()` — i.e. with Astro's Vite plugin attached. The only reason for that was that the render path imported `.astro` components, which need Astro's transform.

**Why it's now dead weight.** REQ-148 converted the two behavior-module components (and their fixtures) to plain TypeScript. I confirmed it: `find . -name "*.astro"` outside node_modules returns nothing. So the Astro plugin in the bootstrap now transforms zero files — it's pure overhead plus a source of boot noise.

**What the ticket asks for.** Swap `getViteConfig()` for a plain `createServer()` config (TypeScript + workspace resolution only), and delete the workarounds that only existed because Astro was in the path:

- the second inline *Astro* config passed solely to silence Astro's own logger, and the `[WARN] Missing pages directory` it suppresses (REQ-89);
- the `createRequire(import.meta.resolve('astro/package.json'))` dance used to find Vite — with no Astro dep, Vite is resolved directly;
- *possibly* the stdout→stderr diversion — but only after verifying against a `--json` command, since that guard is defense-in-depth against **any** boot chatter, not just Astro's.

Then check whether `astro` can come out of the three `package.json` files that still declare it (root, `tools/generate`, `packages/framework`). `@astrojs/markdown-remark` is a separate package and stays.

**Why it wasn't folded into REQ-148.** REQ-148 was already wide (both modules, 12 fixtures, the render seam, ~8 test files). The bootstrap is a distinct risk surface — every single `1c` invocation goes through it — and it keeps working untouched after REQ-148. Mixing a mechanical conversion with a launcher rewrite would make a boot regression hard to attribute. So the two are deliberately sequenced to fail independently.

**Acceptance criteria (provisional, 4):** no Astro plugin in the server; silent boot on stdout/stderr with `--json` still emitting one clean document; `1c assets` still bootstraps on a fresh checkout without loading the CLI barrel (the REQ-145 cycle); no test regressions, especially the CLI output-hygiene UATs.

Status is `draft`, 2 story points, low priority. Ready to implement whenever you want — say the word and I'll follow the free-coding flow from here.

<!-- xgd-turn id="7ca0924b-0712-43cb-9755-acc462425cd6-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:54:26.685141+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-chat-end -->