---
uid: comment-64cb2bfb
id: COMMENT-747
type: comment
title: Comment on request REQ-118
created_by: xgd
created_at: '2026-08-07T00:53:06.580220+00:00'
updated_at: '2026-08-08T21:14:01.417942+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-66e4c630
  kind: chat_transcript
---

<!-- xgd-turn id="2663735b-16b3-4b2c-8c4a-87b4790705de-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T00:53:02.862816+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="2663735b-16b3-4b2c-8c4a-87b4790705de-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-07T01:09:51.356527+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Let me look at the dependency (T3) and the current codebase state.

Now let me explore the T3 implementation to understand the existing edit loop.Let me read the key files directly.

Now let me check what `mountFields` supports and the server-side edit/asset code.

webui-fields is installed. Let me inspect its schema surface.

Let me confirm the image `src` convention and how the renderer resolves it.

I have a complete picture. Let me implement, starting with the field vocabulary in site-schema.

Now the derivation and apply functions:

Now export the new type from the barrel:

Now the asset listing in `tools/generate/src/cli/edit.ts`:

Now wire the options into the copy get/set path:

Now the import of the new type:

Now the `/api/assets` route:

Now the client transport:

My files are clean (the 597 errors are pre-existing repo-wide tsconfig noise). Now let me look at the closest existing test for style.

Now let me write the UAT suite.

Now update the REQ-117 test whose image assertion this ticket deliberately supersedes:

My assertion was wrong — `status` diffs against the last published revision, and this test never publishes. Fixing:

All 11 pass. Now the regression scope:

That failure looks pre-existing (the `data-fc-page` stamp is REQ-117's). Let me verify against a clean tree.

Confirmed pre-existing (fails identically on a clean tree — a REQ-117 stamp regression, not mine). Let me launch the full suite in the background while I finish up.

Let me check on the full suite:

While that runs, let me update the ticket body.

Still running. Let me review my diff while waiting.

No formatter configured, but the file wraps ~100 chars. Let me match:

Vitest is running (output buffers until the end). Let me wait for it.

Full suite: **1215 passed, 1 failed** — the single failure is the pre-existing REQ-117 one. Let me re-verify my suite after the formatting edit, then commit.

Now let me commit:

REQ-118 is free-coded and parked. Commit `6638691e3`, version `0.1.24`.

## What landed

The ticket's central claim — that this is the *second half of phase 1, not a second mechanism* — is enforced structurally: there is **no `image set` command and no `/api/image` route**. An image edit travels T3's `1c copy get|set` / `/api/copy` surface, the same whole-definition validator, the same write-then-re-render order. The entire change is in the **derivation** plus the asset listing that feeds it.

**The field vocabulary widened by exactly one shape.** `L1FieldDescriptor.type` was `'string'` and only `'string'`, deliberately, as the exposure rule expressed as a type. It is now `'string' | 'enum'`. That is not a loosening — an enum can only return an option the derivation offered, so it is *narrower* than a string, and it is the same shape phase 2's parameters (a palette colour, a module `config` value) will need.

**Three things worth flagging:**

1. **The current handle is always in its own picker.** A folded reproduction can hold a handle the mirror never got. A `<select>` whose options omit its own value renders with the *first* option selected — so a user editing only the alt text would have silently swapped the image. This is the one non-obvious correctness detail; there's a fixture image pointing off-disk specifically to pin it.

2. **Enum membership is checked server-side, before the shared validator.** `/assets/ghost.png` is a perfectly *safe* URL, so the envelope accepts it — without this check a stale client lands a broken image with no error. The validator structurally cannot catch this class.

3. **`1c asset list` now returns the union of the registry and `draft/assets/`.** Every real site in `storage/` has `"assets": []` beside a full directory, so a registry-only picker would have offered nothing on the sites we actually build. I replaced the partial truth rather than adding a second listing.

`/api/assets` and `fetchAssets` exist for AC-7 but are **not used by the modal** — `editCopyGet` already embeds the choices, so a picker costs zero extra round trips.

**No editor changes were needed.** `editor.js` passes descriptors straight to `mountFields`, which already supports `type: 'enum'`. The T3 loop turned out to be genuinely kind-agnostic.

## Tests

11 new UATs in `tests/req118-image-selection.test.ts` (7 CLI/jsdom, 4 over the real `startBuilder` origin), one per AC. AC-3 is proved by consequence: an unrelated L1 range violation makes an *image* edit fail with the identical code/message/path as `config set`. AC-6 fingerprints every asset file's bytes/size/mtime across the edit and deep-compares the node to `{...before, src}`.

Full suite: **1215 passed, 5 skipped, 1 failed**.

## Two things you should know

**The one failure is pre-existing, not mine.** `reconciliation-edit-render-channel.test.ts:316` expects `<body data-fc-edit>` but the render emits `<body data-fc-edit data-fc-page="home">`. That stamp is REQ-117's and the regex was never widened. I verified it fails identically with my changes stashed. It belongs to REQ-117's reconciliation — say the word if you'd rather I fold the fix in here.

**I deliberately changed one REQ-117 test.** Its AC1 used the image as the "segment with nothing to edit" example, with the comment *"its asset and framing are T4"*. T4 took that role away, so it now uses the painted container (background is phase 2). The property under test is unchanged.

**Known upstream limitation, not worked around:** `webui-fields`' enum control renders each option's text as the value verbatim, so the picker shows `/assets/hero.png` rather than a friendly name or thumbnail. Per DOC-8 §9.4 a component gap is closed upstream, never patched here — I've recorded it in the ticket as an upstream ask alongside REQ-55 rather than wrapping the component.

The ticket body is current and reflects the implementation as it stands. Promotion to `ready_to_reconcile` is yours to make.

<!-- xgd-turn id="aa2eeb0f-7e00-4c43-9960-6e72445813f7-user" -->

<!-- xgd-chat role="user" ts="2026-08-08T21:14:01.213190+00:00" -->
#### You
Image selection does not appear to support the selection of background images? Could it?

<!-- xgd-chat-end -->