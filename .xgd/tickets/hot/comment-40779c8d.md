---
uid: comment-40779c8d
id: COMMENT-601
type: comment
title: Comment on request REQ-117
created_by: xgd
created_at: '2026-08-01T17:24:47.971677+00:00'
updated_at: '2026-08-06T19:27:33.371576+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-395b67e6
  kind: chat_transcript
---

<!-- xgd-turn id="f934965f-ad42-472c-b25f-485f46b46ba9-user" -->

<!-- xgd-chat role="user" ts="2026-08-01T17:24:45.657027+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="f934965f-ad42-472c-b25f-485f46b46ba9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-01T17:43:56.245539+00:00" -->
#### Claude
I'll start by getting the ticket and understanding the current state of the codebase.

Let me explore what T1 and T2 landed.

T1 (REQ-115) is still `draft`. Let me check what actually exists.

Now let me look at the CLI command structure so I add commands idiomatically.

Now I'll build. First the shared edit-address model in `site-schema`.

Now wire it into `site-schema`'s exports and move the constants out of the renderer.

Now the client half — reading the stamp — kept in the same package as the emitter that writes it.

Now the hover rule in the edit render's stylesheet, and the missing slot marker on `contact-form`.

Now remove the duplicated constant from `edit-client.ts` and add the missing slot marker to `contact-form`.

Now export the client bridge from the framework index, then build the write path.

Now the write path — in the same structured-edit surface the AI's tools use.

Now the CLI dispatch and usage text.

Now the UATs, driving the real CLI entry point plus jsdom against the real edit-render bytes.

All 10 pass. Now the regression scope — the full suite, since I touched the renderer and a module.

Pre-existing on a clean tree — same 4, unrelated. Now a clean rebuild + typecheck verification.

Clean. Now version bump and commit.

Done — REQ-117 is at `free_coded`, commit `1dd851d`, version `0.1.14`.

## What landed

**The edit-address contract moved to `site-schema`** (`packages/site-schema/src/l1/edit.ts`). REQ-116 kept the attribute names and segment vocabulary in the renderer; they're the *contract*, not the rendering of it, so the emitter that writes the stamp and the client that reads it now share one definition site. The framework re-exports what it used to own, so nothing downstream moved. The same module derives a segment's exposed fields and applies a change map — `type` is `'string'` and only `'string'`, which is DOC-28 §3's exposure rule as a type.

**The write path is the AI's surface, not a second one.** `1c copy get|set` lands beside `page`/`config`/`asset`, inheriting that module's atomicity and running the same `validateSite` + `validateL1` call. One `--values` map is one diff: applied, validated, written together, then the edit channel re-renders.

**The client half** (`packages/framework/src/l1/edit-client.ts`) resolves a clicked element to its address — innermost-wins via `closest`, module/slot scoped — and refuses to bind on any document without `data-fc-edit`, so a host that forgets to unmount can't break View mode.

Two gaps the consumer revealed: `contact-form` marked no slot seam, so copy in its `form` slot had an address with no scope (unresolvable — instance- and document-rooted paths reuse the same short forms by design); and the hover treatment had no home, so the rule joins the outline it strengthens in `L1_EDIT_CSS`.

10 UATs, one per AC, across both real entry points: jsdom over the bytes `1c render --edit` wrote, and `1c` itself. Four `reconciliation-*` tests fail — all four fail identically on a clean tree, verified by stashing.

## What I left out, and why

**T1 (REQ-115) is still `draft`** — I checked before starting. `apps/control-app` is a `Hello from app.1stcontact.io` stub, and no `@gendevlabs/webui-*` is consumed anywhere. So two pieces of scope are blocked rather than descoped:

- **The `mountFields` modal.** Your ticket is explicit it is `mountFields`, not hand-rolled; T1's Deliverable 0 (the consumption route) is the unsettled decision. Hand-rolling a form is what the ticket forbids, and I wasn't going to make T1's call inside T3.
- **The shell wiring** — mounting on the iframe document, refreshing after save, the View/Edit toggle. No host to bind to.

What T1 has to wire is small and named: `mountL1EditBridge(iframe.contentDocument, hit => …)` → `1c copy get` for descriptors → `mountFields` in `buffered` commit → `1c copy set` → reload. Everything but the modal is landed and tested. Both blockers are written up on the ticket.

<!-- xgd-turn id="cd0b6d98-a169-4546-8558-c8774fc5611d-user" -->

<!-- xgd-chat role="user" ts="2026-08-02T23:32:38.111515+00:00" -->
#### You
Does this ticket give me something I can see? How do I try it?

<!-- xgd-turn id="cd0b6d98-a169-4546-8558-c8774fc5611d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-02T23:34:54.604830+00:00" -->
#### Claude
Yes — partially. The definition half is fully drivable today; the clickable modal isn't (blocked on T1/REQ-115). I just ran the whole thing end-to-end on `storage/sites/xgd` and reverted, so these commands are verified.

## 1. See the edit render

```bash
./bin/1c render xgd --edit
open storage/dist/sites/xgd/edit/index.html
```

You get the page with every editable region faintly outlined in indigo (87 stamped nodes on `home`), links dead, forms inert, no motion, all content shown at once. That's REQ-116's channel; REQ-117 added the hover rule to it.

## 2. Find a region's address

Inspect any element in devtools and read `data-l1-path` (plus `data-fc-module` / `data-l1-slot` if it's inside a behavior module's slot). That attribute *is* the address the click handler would resolve.

## 3. Drive the edit loop

```bash
./bin/1c copy get xgd home 0.1.0 --json
# {"ok":true,"data":{"kind":"text","fields":[{"name":"text","label":"Text","type":"string"}],
#                    "values":{"text":"Extreme Generative Development"}}}

./bin/1c copy set xgd home 0.1.0 \
  --values '{"text":"Extreme Generative Development — edited live"}' --json
```

`copy get` returns exactly the `mountFields` descriptor list the modal would render. `copy set` validates the whole definition, writes the draft, and re-renders the edit channel — reload the browser tab and the copy has changed. Revert with `git checkout storage/sites/xgd/draft/pages/home.json && ./bin/1c render xgd --edit`.

Worth trying for the shape of it:
- `./bin/1c copy get xgd home 0.1` — a container segment, returns `fields: []`. That's AC1's "clicking a non-editable segment opens nothing."
- Give `--values` a non-string and watch it refuse — nothing is written.

## What you can't see yet

**Hover highlight and the modal.** The client bridge (`mountL1EditBridge`) resolves a clicked pixel to that address and is tested, but nothing mounts it — `apps/control-app` is still a `Hello from app.1stcontact.io` stub and the `@gendevlabs/webui-*` consumption route is T1's unsettled decision. So there's no iframe to bind to and no `mountFields` to open.

What T1 has to wire is one line plus the two commands above: `mountL1EditBridge(iframe.contentDocument, hit => …)` → `copy get` for descriptors → `mountFields` buffered → `copy set` → reload.

<!-- xgd-turn id="3f182d1c-774a-460c-9629-52c59c85f43a-user" -->

<!-- xgd-chat role="user" ts="2026-08-02T23:44:37.377476+00:00" -->
#### You
Is this ticket fully implemented - when do we get editing and highlighting?

<!-- xgd-turn id="3f182d1c-774a-460c-9629-52c59c85f43a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-02T23:45:55.855459+00:00" -->
#### Claude
## Is it fully implemented?

No — about two-thirds. All 10 UATs pass (just ran them: `10 passed`), one per acceptance criterion, but the ACs were tested at the seam *below* the UI:

| AC | What it says | What's actually tested |
|---|---|---|
| 1 | clicking a segment **opens a modal** | `copy get` returns field descriptors; a container returns `[]` |
| 2 | iframe shows the new copy | `copy set` writes the draft and re-renders the bytes |
| 4 | invalid edit leaves iframe at pre-edit state | rejected write leaves draft + rendered files byte-identical |

So the loop's machinery is real and proven — address resolution, descriptor derivation, atomic diff, shared validator, re-render. Three things from the ticket's own §2/§1 scope did not land: **the `mountFields` modal**, **click wiring to a live iframe**, and **mounting the hover treatment**. The CSS rule for hover exists (`[data-l1-segment].fc-edit-hot`) and `resolveEditTarget` exists and is tested against real rendered bytes — nothing puts them together, because there's no document to attach to.

## Why

REQ-117 is **T3** in DOC-28 §12, and its graph is `T1 + T2 → T3`. T2 (REQ-116, the edit render) is `free_coded`. **T1 (REQ-115, the builder shell) is still `draft`** — so T3 landed out of order and could only build the half that doesn't need a host. That's the honest status: the ticket is marked `free_coded` but its body doesn't record the deferred scope; only the commit message does.

## When you get editing and highlighting

Both arrive with **REQ-115**, plus a wiring step measured in a handful of lines:

```
mountL1EditBridge(iframe.contentDocument, hit => …)   ← hover highlight, immediately
  → 1c copy get   → descriptors
  → mountFields   (buffered)
  → 1c copy set   → reload iframe
```

The gating item isn't code. DOC-28 says it plainly: *"T1's real content is a decision, not code"* — the `@gendevlabs/webui-*` consumption route (DOC-8 §13 Q1). Until that's settled there's no shell, no display panel, no View/Edit toggle, no iframe. Everything downstream (T4 image selection, T5 request-time renders) queues behind it too.

After that it's short: T1 deliberately avoids the render question by pointing the iframe at the already-rendered draft on disk, so no new render work is needed to get a real page on screen.

Two things I can do now — say which:
1. **Work Q1** — lay out the webui consumption options with a recommendation, so REQ-115 can leave `draft`.
2. **Update REQ-117's body** to record the blocked scope (modal, click wiring, hover mount) against REQ-115, so the gap is visible on the ticket and not just in a commit message. Doc change, no code.

<!-- xgd-turn id="69c65d16-35b9-471f-9ded-ba17460969d1-user" -->

<!-- xgd-chat role="user" ts="2026-08-03T00:02:29.025258+00:00" -->
#### You
OK 115 should be finished, do you have what you need to finish up?

<!-- xgd-turn id="69c65d16-35b9-471f-9ded-ba17460969d1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-03T00:04:42.996002+00:00" -->
#### Claude
Yes — REQ-115 landed as `0647b9de3` and is `ready_to_reconcile` (it was still `draft` when I looked earlier). I'm unblocked. I checked the seams rather than assuming:

**What T1 actually gives me**
- `edit` is already a registered mode pointing at `/preview/<slug>/edit/` — so the pane shows the edit render with its outlines today. The stub is the *editing*, not the mode.
- Same-origin iframe by construction, `panel.frame`, and `panel.on('mode')` for mount/unmount — which is exactly what AC10 (View untouched) needs.
- `/api/sites` + `/api/publish` establish the Node-side route pattern.

**webui-fields is installed** in the shared artifact store (`/Users/martin/lagrangefoundry/node_modules/@gendevlabs/webui-fields`) and fits without an adapter: `commit: 'buffered'`, host-owned flush via `commit()`, `onCommit` rejection rolls back — and its descriptor shape is `{name, label, type}`, which is byte-for-byte what `1c copy get` already emits. `widget: 'textarea'` covers AC8.

**One decision I have to make, and my call**

`mountL1EditBridge` lives in `packages/framework/src/l1/edit-client.ts`, and `@1stcontact/framework` has no build — its `exports` point at `.ts`, fine for Astro/vitest, unusable from a browser. The bridge must run host-side (the iframe's document is passed in; there's no postMessage), and I won't inject it into the edit render — T2 makes that channel deliberately script-free.

So: **give the framework the same `tsc`→`dist/` build `@1stcontact/site-schema` already has**, serve it from a `/framework/*` route, and add the two import-map entries. No new tooling, no copied source, mirrors the existing pattern.

**Then the work is five pieces**
1. Framework browser build + `/framework/*` route + import map.
2. `GET/POST /api/copy` on the builder origin, wrapping the existing `editCopyGet` / `editCopySet` — the validator and atomicity come along unchanged.
3. Modal chrome — there's no webui dialog component, so a small `<dialog>` with Save/Cancel; `mountFields` supplies everything inside it (the ticket's "derive descriptors, don't build forms").
4. Mount the bridge on mode→`edit`, tear it down on mode→`view`; hover class + click → `copy get` → modal → `commit()` → `copy set` → reload frame; error surfaced, nothing applied.
5. UATs `test_UAT_FC_REQ-117_*` over the mounted path, and the ticket body updated to record that the deferred half is now landing.

**One thing I'll flag, not silently fix:** `copy set` re-renders only the `edit` channel, so after an edit the View mode shows a stale draft until something re-renders it. The ticket scopes the re-render to the edit channel, so I'll leave the behaviour as specified and note it — unless you want View refreshed too.

Say go and I'll start with the framework build (it's the only piece with any chance of a surprise).

<!-- xgd-turn id="56586ecd-9e8f-4eb7-a9b2-e3ca2297edc7-user" -->

<!-- xgd-chat role="user" ts="2026-08-03T00:16:26.207792+00:00" -->
#### You
Lets see what we have, is it ready for demo?

<!-- xgd-turn id="56586ecd-9e8f-4eb7-a9b2-e3ca2297edc7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-03T00:18:06.292251+00:00" -->
#### Claude
**Yes for the chrome and both renders. No for editing.** The builder is running now — I backgrounded it:

```
http://localhost:4173/          # stop it with: pkill -f "1c builder"
```

**What's actually on screen:** the `Site` tab, the toolbar (site selector · View/Edit · open-in-new-tab · Publish), and the split with the chat placeholder. View shows the draft render; Edit shows the edit render with every editable region outlined and the page inert. Toggling swaps the frame `src` without rebuilding the pane, and open-in-new-tab tracks it exactly. All routes verified 200: chrome, `/api/sites`, `/builder/*`, `/webui/*`, both preview channels. 19/19 REQ-115 tests pass against the *real* webui components (they'd have skipped with a visible reason if the artifact store were missing — they didn't).

**Demo on `xgd` or `gigabytealchemy`.** 87 and 70 stamped segments respectively. I pre-rendered their edit channels just now.

Two things I hit while checking, both worth knowing before you show anyone:

1. **Edit mode needs the channel pre-rendered on disk.** The site selector defaults to `1stcontact`, and `/preview/1stcontact/edit/` was a 404 until rendered. That's T1's static-serving model working as designed — REQ-119 (T5) is what replaces it with request-time renders. Until then, `1c render <slug> --edit` is a prerequisite for the demo.

2. **`1stcontact` and `harbor-cafe` can't render an edit channel at all** — both fail with `Module not found in catalog: 'header' v2`. Their definitions still reference the layout modules the framework pivot deleted (REQ-84); the draft renders sitting on disk are pre-pivot leftovers, which is why View still looks fine for them. That's stale site content, unrelated to REQ-115 or REQ-117 — but it means those two sites are broken for *any* re-render, not just edit. Worth its own ticket; say the word and I'll file one.

**What you won't be able to do:** click anything. No hover highlight, no modal, nothing writes. The outlines are the renderer's, drawn statically.

That's the gap the five pieces close — framework browser build, `/api/copy`, the `<dialog>` + `mountFields`, bridge mount/unmount on mode change, UATs. Ready to start on your go.

<!-- xgd-turn id="3598edc5-3927-4bfb-be09-38a7d0a372d0-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T19:12:12.675091+00:00" -->
#### You
Can I see the demo now? Please tell me how to run it

<!-- xgd-turn id="3598edc5-3927-4bfb-be09-38a7d0a372d0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:13:26.923667+00:00" -->
#### Claude
I'll verify the current state and get it running.

The builder is already running — it survived from the earlier session (node, PID 28730). Just open it:

```
http://localhost:4173/
```

If it isn't up, start it from the repo root:

```bash
cd /Users/martin/lagrangefoundry/1stcontact
./bin/1c builder --port 4173      # stop with: kill 28730   (or: lsof -ti:4173 | xargs kill)
```

**Pick `xgd` or `gigabytealchemy` in the site selector** — those two have their edit channels rendered on disk (87 and 70 stamped segments). Both are 200 right now; I probed every route before writing this.

**What you'll see:** the `Site` tab, the toolbar (site selector · View/Edit · open-in-new-tab · Publish), and the split with the chat placeholder. **View** shows the draft render — the page behaving normally. **Edit** shows the edit render: every editable region faintly outlined in indigo, links dead, forms inert, no motion, all content shown at once. Toggling swaps the frame `src` without rebuilding the pane; open-in-new-tab resolves to the identical URL.

**What you still can't do: click anything.** No hover highlight, no modal, nothing writes. Those outlines are drawn statically by the renderer. I confirmed nothing has landed since we last spoke — the last code commit is still `4cb83ec68` (T1), and `apps/control-app/src/builder/` has no reference to `mountL1EditBridge`, `mountFields`, or `/api/copy`. The five pieces I scoped last time are unstarted; you said "say go" was next and we went to demo instead.

Two carry-overs, unchanged:

- **`1stcontact` is the selector's default and its Edit mode 404s.** Its edit directory holds only `theme.css` — the render fails on `Module not found in catalog: 'header' v2`. Same for `harbor-cafe`. Both definitions still reference layout modules the pivot deleted (REQ-84); their View renders look fine only because they're pre-pivot leftovers on disk. Not a REQ-115/117 problem — stale site content — but it means those two are broken for *any* re-render. Still worth its own ticket.
- **Edit mode requires the channel pre-rendered** (`./bin/1c render <slug> --edit`). That's T1's static-serving model as designed; REQ-119 replaces it with request-time renders.

The definition half of this ticket is fully drivable from the CLI if you want to see an edit actually take effect — `1c copy get/set` against a `data-l1-path` you read off the DOM, then reload the frame. Say the word and I'll walk it, or say go and I'll build the modal.

<!-- xgd-turn id="a2e8c228-0126-4d11-b924-c0573ea4452d-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T19:15:25.848140+00:00" -->
#### You
ok the view/edit area is tiny. I can only see about 4 lines. It needs to be tied to the browser window size. Can you fix that first please

<!-- xgd-turn id="a2e8c228-0126-4d11-b924-c0573ea4452d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:27:33.224840+00:00" -->
#### Claude
Let me look at the layout before touching anything.

Found it — the shell ships a supported affordance for exactly this. Let me confirm the config key.

Now the fix. The shell ships a supported affordance for exactly this — we just never opted in.

All three of my edits were reverted on disk — and the measurement confirms it (`panelIsFill: false`, frame stuck at the iframe's intrinsic 150px). Let me find out what undid them before re-applying.

My edits are intact on disk — the browser was serving cached JS/CSS. Re-measuring with the cache bypassed:

Layout now tracks the viewport. Let me confirm it follows a live window resize, and check how the repo runs browser-based tests.

Playwright isn't resolvable from `tests/` — vite resolves the bare specifier at transform time. I'll anchor resolution at the package that actually owns the dependency.

3 tests pass — but 1.34s is too fast for a browser launch. Let me confirm whether the measurement test actually ran or skipped silently.

Confirmed — it was skipping silently (CJS interop returns `undefined`, and the cached browser build doesn't match this playwright version). Fixing both, and making any skip loud rather than silent.

No skip warning, so it ran. The only trustworthy proof is that it fails when the fix is absent — let me verify it actually catches the bug.

The measurement is real — without the fix it reports `expected 150 to be greater than 700`, exactly the collapsed intrinsic iframe height. All 3 fail without the fix, pass with it. Now the full suite:

One is definitively mine. Let me get the full failure list and check the rest against a clean baseline.

Those reconciliation failures are pre-existing — they fail identically with my changes stashed. Now the builder suites:

All 22 builder tests green. Running the project quality gate before committing:

Typecheck is pre-existing noise (379 errors repo-wide; the neighbouring REQ-115 tests share the same classes — no DOM lib in `tsconfig.base.json`). But two of mine are self-inflicted by copying a `never` return type, so let me not add sloppiness:

Committing only my files — there's a concurrent session with unrelated changes in `tools/generate/` that I must not sweep in.

Now the ticket. Reading the current body first so I preserve it:

The appended entry landed as a string, not a dict — inconsistent with the first and likely to break reconcile parsing. Fixing:

Fixed and committed as `94ae6fee`.

**Reload the page — hard-reload it** (`Cmd+Shift+R`). The server serves the client straight off disk so there's nothing to restart, but your browser has the old CSS and JS cached. That caching bit me mid-investigation: my first measurement reported the frame still collapsed, and I briefly misread that as my edits having been reverted. They hadn't — it was the cache.

**The cause.** An iframe's intrinsic height is 150px, and nothing inside it can recover a height its ancestors never had. Your "about four lines" was exactly that 150px. The height chain from the viewport down to the frame had one `auto` link: `.shell` ships `min-height: 100%` and *no* height, so every `flex: 1` beneath it resolved against content instead of the window.

**The fix** is the shell's own `tabs[].fill` opt-in, which exists for precisely this case — a tab hosting an app-shaped thing that must scroll internally. No override, no reaching into shell internals. Declaring it wasn't enough, though: `app.js` was rebuilding each tab as `{id, label}` and **silently dropping `fill`** — nothing threw, nothing warned, the option just never arrived. So `TABS` now passes straight through. Plus `.builder-layout` grows as a flex item rather than leaning on a percentage, and `body` forbids a page-level scrollbar, since one appearing means the chain has leaked again.

**Measured in a real browser**, not asserted in jsdom (which does no layout and would happily report a collapsed pane as fine):

| viewport | frame | page scroll |
|---|---|---|
| 1440×900 | 789px | 0 |
| 1024×1200 | 1089px | 0 |
| 1440×600 | 489px | 0 |

Live resize tracks too: 1000px window → 889px frame, drag to 500 → 389, back to 1000 → 889.

Three UATs in `tests/req117-builder-viewport-fill.test.ts`, including one that guards the exact silent-drop regression by asserting on *every* declared tab key. I mutation-checked them: with `fill: true` removed, all three fail and the measurement reports `expected 150 to be greater than 700`. Worth noting because my first version of that test was passing green while never launching a browser at all — CJS interop returned `undefined` and it skipped itself. It now falls back to system Chrome and warns loudly if it can't measure.

Two things to flag:

- **This is T1 (REQ-115) chrome, not copy editing.** I committed it against REQ-117 because that's this session's scope ticket, and noted in the ticket body that reconcile may want it attributed to T1 instead. Your call.
- **The full suite has 10 pre-existing failures** across 5 `reconciliation-*` L1/palette files (`theme.palette.bg` undefined). Not mine — I confirmed by stashing my changes and reproducing them identically. I also left `tools/generate/src/cli/{errors,index,preflight}.ts` and `tests/req44-install-preflight.test.ts` unstaged; those are uncommitted work from another Claude session running in this repo right now (PID 3368), so I kept them out of my commit.

Version bumped 0.1.16 → 0.1.17; ticket updated with the commit.

Still unchanged from before: pick **xgd** or **gigabytealchemy** in the selector (1stcontact and harbor-cafe still fail to render their edit channel), and clicking a segment still does nothing — that's the five pieces I scoped last time, unstarted.

<!-- xgd-chat-end -->