---
uid: comment-19db7f70
id: COMMENT-2573
type: comment
title: Comment on bug BUG-71
created_by: xgd
created_at: '2026-09-10T17:54:51.607573+00:00'
updated_at: '2026-09-10T18:49:14.845760+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ee954e95
  kind: chat_transcript
---

<!-- xgd-turn id="2928fb35-cc69-4c60-8cc1-8b1d37f41b74-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:54:33.179531+00:00" -->
#### You
# The builder did not start.

**What failed:** could not load http://127.0.0.1:8788/builder/main.js

**GET /api/sites:** 200 [{"slug":"1stcontact","latest":null},{"slug":"gigabytealchemy","latest":null},{"slug":"xgd","latest":null}]

An asset the builder imports is missing. Run `1c assets`, then restart the builder — the assets manifest is read at startup.

The document loaded; its client did not. Full detail is in the browser console.

<!-- xgd-turn id="2928fb35-cc69-4c60-8cc1-8b1d37f41b74-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T17:57:13.298274+00:00" -->
#### Claude
Diagnosed. Here's what happened and what I think the fix is.

**The symptom is real and the boot guard did its job.** `apps/control-app/dist-assets/` was absent, so `/builder/main.js` 404'd, the module graph never loaded, and the guard rendered exactly the right hint. `/api/sites` returning 200 confirms the Worker and store were fine — it was only the client bundle.

**Root cause: `1c builder` never builds assets.** `case 'builder'` in `tools/generate/src/cli/index.ts:816` composes the env-file layering and spawns `wrangler dev` — nothing more. `dist-assets/` is gitignored (`.gitignore:191`), so it does not exist in a fresh checkout, a new worktree, or after a clean. The same gap makes a *stale* build invisible: edit `src/builder/main.js`, restart the builder, and you are still served the old copy, because the assets are a build artifact copied by `1c assets`, not read live.

I ran `./bin/1c assets` — it succeeded, `dist-assets/builder/main.js` now exists, and the whole build takes **1.3s**.

**Proposed fix:** `case 'builder'` calls `cmdAssets()` (already exported, `assets.ts:837`) before spawning wrangler. 1.3s at startup removes both the missing-assets and stale-assets failure classes permanently, and a failed build raises before wrangler starts rather than after — which is right, since a builder that can't serve its client shouldn't bind a port. No flag, no freshness heuristic: one command, always coherent.

**One consequence worth naming now:** `tests/test_UAT_FC_BUG-50_builder_env_files.test.ts` calls `run(['builder'])` ten times with `spawn` stubbed. Unstubbed, that's ~13s of real asset rebuilds against the live repo tree per suite run. I'd stub the assets build in that test at the same boundary spawn already is, and add a BUG-71 UAT asserting the build happens *before* the spawn.

Two things I'd like you to confirm before I cut the branch:

1. Is that the fix you want, or would you rather `1c builder` only *check* for `dist-assets` and refuse with a hint (leaving the stale-assets case unsolved)?
2. Same treatment for `1c serve`/anything else that fronts the assets, or just `builder`?

I've held off writing the ticket body until you've settled 1 — say go and I'll populate BUG-71 with the above, title it `1c builder: starts wrangler dev without building assets`, and implement.

<!-- xgd-turn id="4c3026de-03d2-4ae7-92be-9228f79c37f3-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T18:15:18.457887+00:00" -->
#### You
I believe 1c serve is deprecated - is that correct? We shoudl just delete it so it is not confusing.

I don't understand your explanation so I can't say if the fix is right.

Why is this happening?

<!-- xgd-turn id="4c3026de-03d2-4ae7-92be-9228f79c37f3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T18:16:00.305759+00:00" -->
#### Claude
Two answers.

## `1c serve` — already deleted; the file must stay

You're right that it's deprecated, and it's further gone than you think: there is **no `case 'serve'`** in the CLI. REQ-177 removed the command, and `tests/req177-discontinue-raw-server.test.ts` exists specifically to keep it removed.

What's left is `tools/generate/src/cli/serve.ts`, and that is not the deprecated thing. It's a library function, `startServe`, that binds a throwaway loopback port so a headless browser has somewhere to point. Live callers: `1c shot`, `1c aligned-crops`, and the module conformance harness (`tools/generate/src/conformance/harness.ts:196`), plus four test files. Deleting the file breaks screenshots and crops.

There is one genuinely confusing leftover, and it's a doc bug: the CLI's own usage text still lists `serve` as a command (`index.ts:508`, in the "offline commands are never gated" sentence). That's one stale word advertising a command that doesn't exist. Worth deleting; it's a text edit, not a code change.

## Why the builder didn't start

The builder's browser code is written in one place and served from another.

- **You edit** `apps/control-app/src/builder/` — 27 files, `main.js` among them.
- **The Worker serves** `apps/control-app/dist-assets/builder/` — `wrangler.toml:56` points the assets binding there.

`1c assets` is what copies one into the other. Nothing else does. And `dist-assets/` is gitignored (`.gitignore:191`), because it's a build output — so it does not exist in a fresh checkout, a fresh worktree, or after a clean.

That's the whole failure. `1c builder` starts `wrangler dev` and nothing more. The server came up correctly, served the HTML correctly, answered `/api/sites` correctly with your three sites — and then the page asked for `/builder/main.js`, and there was no `dist-assets/` for it to come from. 404. The page had no client, so it sat there blank until the boot guard wrote the message you pasted.

I ran `./bin/1c assets`; it took **1.3 seconds** and the directory is there now. So your builder will start.

**Why it will happen again.** Two ways, and the second is the nastier one:

1. The directory is absent — any fresh checkout or worktree. Blank page, as you just saw.
2. The directory is present but **stale**. You edit `src/builder/main.js`, restart the builder, and you are still served the old copy — because the restart doesn't copy anything. No error, no blank page, just your change apparently not working.

So the fix I proposed is: have `1c builder` run that 1.3-second copy itself, before it starts the server. Then the served copy is never missing and never behind the source, and neither failure can happen. That's the whole change — it's not clever, it just stops making the operator remember a step the machine can do.

Does that make sense now? If so I'll write BUG-71 up and implement it.

<!-- xgd-turn id="ae722b75-32e2-43a9-9f4f-ed876e0936fb-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T18:19:16.645991+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % bin/1c assets  
modules    4 css, 4 client.js → packages/framework/src/modules/module-assets.ts
builder    30 files
webui      59 files, 7 import-map entries, 6 stylesheets
framework  edit-client.js, site-schema-edit.js, site-schema-shade.js, marked-points.js, site-schema-anchors.js, measure-svg.js
ai         /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/workers.js
ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js
knowledge  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/knowledge/src/index.js
bridge     /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-knowledge/src/index.js
auth       /Users/martin/lagrangefoundry/1stcontact/node_modules/@lagrangefoundry/auth-passwordless/src/index.js
imagegen   /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-imagegen/src/index.js
kb         12 document(s), 1196KB inlined, awareness primed not indexed
out        /Users/martin/lagrangefoundry/1stcontact/apps/control-app/dist-assets
((.venv-working) ) martin@nyx 1stcontact % bin/1c assets
modules    4 css, 4 client.js → packages/framework/src/modules/module-assets.ts
builder    30 files
webui      59 files, 7 import-map entries, 6 stylesheets
framework  edit-client.js, site-schema-edit.js, site-schema-shade.js, marked-points.js, site-schema-anchors.js, measure-svg.js
ai         /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/workers.js
ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js
knowledge  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/knowledge/src/index.js
bridge     /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-knowledge/src/index.js
auth       /Users/martin/lagrangefoundry/1stcontact/node_modules/@lagrangefoundry/auth-passwordless/src/index.js
imagegen   /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-imagegen/src/index.js
kb         12 document(s), 1196KB inlined, awareness primed not indexed
out        /Users/martin/lagrangefoundry/1stcontact/apps/control-app/dist-assets
((.venv-working) ) martin@nyx 1stcontact % bin/1c kb build
index:  11 document(s), 0 embedded
chunks: 351
map:    5 territories, 19 access point(s), written by claude_code
((.venv-working) ) martin@nyx 1stcontact %

```

The builder did not start.

**What failed:** could not load http://127.0.0.1:8788/builder/main.js

**GET /api/sites:** 200 [{"slug":"1stcontact","latest":null},{"slug":"gigabytealchemy","latest":null},{"slug":"xgd","latest":null}]

An asset the builder imports is missing. Run `1c assets`, then restart the builder — the assets manifest is read at startup.

The document loaded; its client did not. Full detail is in the browser console.

<!-- xgd-turn id="ae722b75-32e2-43a9-9f4f-ed876e0936fb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T18:22:07.810495+00:00" -->
#### Claude
That changes the diagnosis. Let me check whether the server is up so I can ask it directly.

The report names `main.js`, but a module script's error event fires on the *top-level* script even when a nested import 404s. Let me walk the actual import graph.

That's the bug, and it isn't about assets being missing.

I was wrong about the cause. Running `1c assets` could never have fixed this, which is exactly what you observed. Here is the real one.

## The actual bug

`apps/control-app/dist-assets/framework/site-schema-edit.js`, line 1:

```js
import { l1TextRuns } from './text';
```

In a browser that means `GET /framework/text`. There is no such file — `dist-assets/framework/` contains exactly six files, and `text.js` is not one of them. So that request 404s, the module graph fails, and the error event fires on the *top-level* script, which is why the page blamed `main.js`. `main.js` is fine. I walked the whole graph: 71 modules and 6 stylesheets resolve, and `./text` is the single break.

**Why it broke today.** Commit `df9862ce77` — *"feat(l1): one string of page copy can vary within itself"*, dated 2026-09-10 — added `text.ts` next to `packages/site-schema/src/l1/edit.ts` and imported it.

**Why the asset build didn't notice.** `tools/generate/src/cli/assets.ts:68` has `FRAMEWORK_SOURCES`, a hand-written list of six files. `transpileForBrowser` (line 114) type-strips **one file at a time** and rewrites **one** specifier pattern, `@1stcontact/site-schema` → `/framework/site-schema-edit.js`. It does not follow imports. So `text.ts` was never emitted, and `./text` was never rewritten.

**Why this is the first time it's bitten.** Every other relative import in those six sources is `import type` — the TypeScript transpiler erases those, so they never became browser fetches. `l1TextRuns` is the first *value* import to a sibling module. The build has always had this hole; nothing had stepped in it.

That's also why the boot guard's hint was misleading rather than wrong: an asset in the import graph really was missing. It just wasn't one `1c assets` knows how to produce.

## What I'd fix

Two parts, and I'd rather do both:

1. **Follow the graph.** Transpile the transitive closure of relative value imports rather than a fixed list, emitting each sibling and rewriting its specifier to the emitted URL — including adding the `.js` a browser needs and TypeScript doesn't. That makes the build self-maintaining.
2. **Refuse to ship a broken tree.** After the build, resolve every specifier in every emitted file against what was actually emitted, and fail `1c assets` if one dangles. That is roughly the check I just ran by hand, and it converts this entire failure class from a blank page into a build error at the moment it's introduced.

(1) alone would fix today's break. (2) is what stops the next one. I'd skip the tempting third option — just adding `text.ts` to the list — because it re-arms the same trap for whoever adds the next sibling.

Two smaller things I found on the way, neither part of this bug:

- Your instinct on `1c serve` was right, and it's already done: REQ-177 deleted the command, `req177-discontinue-raw-server.test.ts` keeps it deleted. The file that remains is `startServe`, a library used by `1c shot`, `1c aligned-crops` and the conformance harness — deleting it breaks screenshots. The only stale thing is the CLI usage text at `index.ts:508`, which still lists `serve` as a command. Text edit.
- `1c builder` still doesn't build assets before starting `wrangler dev`. Real papercut, worth ~1.3s, but unrelated to this — I'd have been fixing the wrong thing.

Say go and I'll scope BUG-71 to the framework asset graph, cut the branch, and implement (1) and (2) with UATs. If you'd rather ship just (1) first, say so and I'll leave the guard out.

<!-- xgd-turn id="a8a0df7b-7dab-4a06-9180-e15a234884fc-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T18:30:04.407625+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a8a0df7b-7dab-4a06-9180-e15a234884fc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T18:49:14.573486+00:00" -->
#### Claude
Protocol read. Now the project's own conventions.

Now scoping the ticket.

Now the implementation.

Now let me run the real build and see whether it fixes the bug.

The regex matched inside a comment. TypeScript ships a scanner — better to use it than to harden a regex.

The build is correct. Now the UATs.

Now proving these fail against the unfixed build.

All pre-existing — identical 11 files / 13 tests with and without my change. Now bringing the ticket body in line with what actually landed.

Version raced with BUG-67 landing concurrently. Re-bumping.

Now rebuilding the assets in your actual checkout, so the running builder has something correct to serve.

Done — BUG-71 is at `free_coded`, merged into `xgd-working`.

**Restart the builder.** The assets are rebuilt in your checkout, but the manifest is read at `wrangler dev` startup, so the running process is still serving the old tree.

## What changed

`tools/generate/src/cli/assets.ts` — the framework emit now follows the import graph instead of a list.

`FRAMEWORK_SOURCES` keeps its six names, but they're now *entry points* rather than the inventory. From each one the build follows the imports that survive transpilation, emits every dependency under its repo-relative source path, and rewrites the specifier to the URL it landed at. So `l1/text.ts` is emitted, and `./text` becomes `/framework/packages/site-schema/src/l1/text.js` — a browser can't resolve `./text` even when the file exists, which was the second half of the bug.

Following the *transpiled* output rather than the source is what keeps type-only modules out: `import type` is already erased by then, so what's followed is exactly what the browser will fetch.

The build also refuses to ship a tree that can't load. Before the staged tree is swapped in, it walks from `/builder/main.js`, resolves every specifier and stylesheet, and fails naming *all* dangling edges with their importers. Refusing before the swap means your working `dist-assets` survives the refusal.

`1c assets` now prints `graph 71 modules, 6 stylesheets — every import resolves`.

## Two things worth knowing

**The first cut used a regex and it was wrong.** It matched an import quoted inside a doc comment, rewrote the comment, followed the specifier out of it, emitted `palette.js` — which imports `zod`, which can't be served — and failed the build over a line of prose. Specifiers are now read with the TypeScript compiler's own scanner, which is already loaded to do the type-stripping. Telling code from comments is what a scanner is for.

**`preProcessFile` reports the specifier span off by one** — `pos` is the opening quote, `end` is `pos + text.length`, so slicing verbatim eats the quote and keeps the last character. The code derives the span from the text and asserts the slice matches, so a future TypeScript changing this fails loudly instead of silently emitting mangled imports.

## Verification

Six UATs in `tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts`, driving `1c assets` once and asserting against the bytes on disk. The graph walk in the test is independently written, so it's evidence about the tree rather than the checker agreeing with itself.

I confirmed they go red against the unfixed build — the regression test fails with exactly `/framework/text <- /framework/site-schema-edit.js`, the original symptom.

Full `node` suite: 11 files / 13 tests fail, and I verified the identical set fails on the same tree with my change reverted. All pre-existing, none related.

## Still outstanding, deliberately

Neither is part of this bug, and I left both alone rather than widening the ticket: `1c builder` still doesn't build assets before starting `wrangler dev` (the ~1.3s papercut from earlier), and the CLI usage text at `index.ts:508` still lists the `serve` command REQ-177 deleted. Say the word on either.

<!-- xgd-chat-end -->