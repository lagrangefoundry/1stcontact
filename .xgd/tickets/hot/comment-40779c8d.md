---
uid: comment-40779c8d
id: COMMENT-601
type: comment
title: Comment on request REQ-117
created_by: xgd
created_at: '2026-08-01T17:24:47.971677+00:00'
updated_at: '2026-08-01T17:43:56.276672+00:00'
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

<!-- xgd-chat-end -->