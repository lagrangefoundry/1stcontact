---
uid: comment-40779c8d
id: COMMENT-601
type: comment
title: Comment on request REQ-117
created_by: xgd
created_at: '2026-08-01T17:24:47.971677+00:00'
updated_at: '2026-08-03T00:04:43.087904+00:00'
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

<!-- xgd-chat-end -->