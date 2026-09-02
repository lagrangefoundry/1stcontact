---
uid: comment-a65908b7
id: COMMENT-559
type: comment
title: Comment on request REQ-105
created_by: xgd
created_at: '2026-07-28T22:42:06.224178+00:00'
updated_at: '2026-07-28T22:50:18.875797+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6a8efe0f
  kind: chat_transcript
---

<!-- xgd-turn id="08e7639a-4aec-4ca8-b0b2-7bb84af4d87e-user" -->

<!-- xgd-chat role="user" ts="2026-07-28T22:42:04.011029+00:00" -->
#### You
Please free code a solution to this ticket

<!-- xgd-turn id="08e7639a-4aec-4ca8-b0b2-7bb84af4d87e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-28T22:50:18.844226+00:00" -->
#### Claude
I'll start by reading the ticket and the relevant schema code.

Now the schema change — hoisting the node-level axis groups into one shared shape.

Now I'll add the shared node-axis-group shape just before the node definitions:

Now replace the per-kind declarations with the spread:

Now the two hand-written recursive interfaces and their lazy schemas:

Now the renderer — emit sizing for the `slot` case:

Both typecheck clean. Now the UAT tests:

Both shipped sites render byte-identically. Now version bump and commit:

Now update the ticket body (preserving the original) and move to `free_coded`:

Done. REQ-105 is at `free_coded`, commit `15670772f`.

**What landed**

- **`packages/site-schema/src/l1/schema.ts`** — the nine node-level axis groups (`geometry`, `sizing`, `visibility`, `transform`, `mask`, `padding`, `responsivePadding`, `interaction`, `reveal`) are now declared once as `nodeAxisGroupsShape` / `l1NodeAxisGroupsSchema` and spread into all six kinds. `slot` gains `sizing` by inheriting the shape. The two hand-written recursive interfaces (`L1BoxNode`, `L1ContainerNode`) `extends L1NodeAxisGroups` rather than re-listing the fields, so they can't drift from the Zod shape either. `link` stayed per-kind deliberately — it's a per-kind decision (a `control` is already the module's interactive element; a `slot` is a mount point), not a universal one.
- **`packages/framework/src/l1/render.ts`** — one line: the `slot` case emits the same `axisSizingCss` every other kind already emitted.
- **`tests/req105-node-axis-groups.test.ts`** — 5 UATs, including a mechanical one that walks `Object.keys(l1NodeAxisGroupsSchema.shape)` × all six kinds, so a future omission fails a test rather than shipping.

**Verification** — full suite green (894 tests / 127 files); `pnpm -r build` and `tsc --noEmit` for framework + generate clean; and `1c render` of **xgd** and **gigabytealchemy** is **byte-identical** before and after (rendered, stashed the two source edits, re-rendered, `diff -r`).

**One AC I could not do as written.** AC2 asked me to remove xgd.dev's sizing-only wrapper around the `signup-form` slot — that wrapper isn't in the tree any more. A scan for any `box`/`container` whose single child is a `slot` returns nothing across every shipped page; in `home.json` the slot sits directly in the `signup` container next to the heading run, body run and two spacers, and that container's `maxPx: 520` measures the whole column, so removing it would move the text above the form. It looks to have been folded away in a later REQ-95 pass. I made no site edit and recorded the finding in the ticket body.

<!-- xgd-chat-end -->