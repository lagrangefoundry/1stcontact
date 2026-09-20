---
uid: comment-c918bdc5
id: COMMENT-3326
type: comment
title: Comment on bug BUG-126
created_by: xgd
created_at: '2026-09-20T19:50:29.618306+00:00'
updated_at: '2026-09-20T20:21:43.542851+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b0b825ac
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7933b516-f2e4-4734-914c-798c12fcba34",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="034197bc-4245-45b7-be61-d913fb8537e7-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T19:49:34.926999+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="034197bc-4245-45b7-be61-d913fb8537e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T20:21:42.012141+00:00" -->
#### Claude
Now let me add `read_attachment` to the store interface.

Now the store itself.

Now add the three read methods to the returned object.

Now the composition-time check and derived grant in `imageSurface`.

Now the shim exports list.

Now the second half — a site file's adjustment needs somewhere to land.

Now image-core.ts: the refusal that names the origin.

Now wire it in the router.

Now the node-side test for the method set and the grant.

Now the workers test.

Now bump the version and commit.

Done — BUG-126 is at `free_coded`, merged into `xgd-working` as `2773c602b9`, version `0.2.294`.

## What I built

**1. The handle, widened.** `generatedMaterialStore` now returns `get`, `attachments` and `read_attachment` alongside `create` and `attach`. Each one resolves the name, checks the record, then asks the real store, so the read scope is enforced in one place.

Two judgement calls I made inside this:

- **Read scope is `MATERIAL_TYPES`** — `material` *and* `reference` — not the single type `create` is narrowed to. `listMaterial` reads both, so the narrower rule would have refused a client's own uploaded photo filed as a reference, which is literally the request that opened the ticket. An attachment is readable exactly when the record it hangs off is (via `fields.subject_uid`).
- **A picture answers to every name it answers to elsewhere.** The consultant burned attempts by filename and by ticket id. On a miss the handle falls through to `resolveStoredImage` — REQ-218's one naming rule, which already declares the catalogue label and filename as spellings of the same picture. Canonical-uid-only would have left two of their three attempts still failing.

**2. The gap closed by the type.** `generatedMaterialStore` declares `ImagePluginStore`, so a short handle is a compile error. I wrote a runtime composition-time assertion and then removed it — it restates what the compiler refuses, and the one case the compiler can't see (upstream growing a sixth call) is equally invisible at composition. That case is covered by a UAT that reads the shipped executor's own source for `this.store.<name>` and holds it against `IMAGE_STORE_METHODS`. Failure lands in CI, earlier than composition.

**3. The grant derived from the handle too.** `imageGrantFor(store)` grants only the groups the handle can actually serve; group names come from upstream's `CREATE_GROUP`/`EDIT_GROUP` (added to the generated shim's export list) so none is spelled here.

**4. The second half.** `NOT_EDITABLE` on a placed picture now names the Library original the bytes came from — read back out of `placed_as` — with its title, and states that editing it republishes over the file on the page. That last clause is true because `republishingRecipes` already does it. I rejected both alternatives: a recipe on the copy (two editable versions drifting, next republish clobbers one) and silently redirecting the edit (reports about a picture the caller didn't name).

Also named `read_attachment` on `TicketStore` — a call the type doesn't name is a call nothing can check, which is where the bug hid.

## Verification

- 10 new UATs pass (7 workers through `route()` over real D1/R2, 3 node).
- Full workers suite: 137 files / 1239 tests, all pass.
- Node suite: 4 failures, all pre-existing on `xgd-working` before my branch (`bug32-webui-scope-rebrand`, `BUG-67 backend settings` ×2) or flaky only under full-suite parallelism (`platform-build-deploy-smoke` — passes in isolation on both branches).
- Typecheck clean on the merged tree.

One note: the version bump raced three other sessions bumping `package.json`; I resolved the merge conflict by taking my `0.2.294` (the higher value) and verified the gate's ancestry and version checks before promoting.

<!-- xgd-chat-end -->