---
uid: comment-64cb2bfb
id: COMMENT-747
type: comment
title: Comment on request REQ-118
created_by: xgd
created_at: '2026-08-07T00:53:06.580220+00:00'
updated_at: '2026-08-08T21:23:06.788507+00:00'
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

<!-- xgd-turn id="aa2eeb0f-7e00-4c43-9960-6e72445813f7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-08T21:15:35.010372+00:00" -->
#### Claude
I'll check how backgrounds are expressed in L1 and what the current derivation covers.

Correct — it doesn't, and the reason is structural rather than an oversight.

## Why not

A background image isn't an `image` node. It's `backgroundImageUrl`, one axis in the shared surface group (`packages/site-schema/src/l1/schema.ts:612`) that REQ-98 spread across every box-rendering kind. A node carrying it stamps as a **container** segment, not an image one:

```ts
// packages/framework/src/l1/render.ts:1748
case 'box':
case 'container':
  return surfaceDecls(node.axes ?? {}).length > 0 ? 'container' : null
```

And `copyFieldsOf` returns `null` for those kinds, so clicking a painted container today gets you `editor.js:114` — *"Nothing to edit on this container segment yet."* The outline appears; the modal has nothing in it.

DOC-28 §6.2 is where this was decided: the container segment's controls are "background colour/image, default text parameters" — all **phase 2**.

## Could it — yes, and cheaply

The phase-2 gate is really about *colour*, not images. Colour is blocked on two things that don't exist yet: the site palette (REQ-114) and an upstream colour-valued control (`xgd-framework` REQ-55, DOC-8 §9.4.1). A background image needs neither. It's the same "which image goes here" question phase 1 already answers, using the exact enum-over-site-assets control REQ-118 built.

The change is three edits, all in the derivation:

- `copyFieldsOf` — a branch for `box`/`container` returning one `backgroundImageUrl` field, `type: 'enum'`, options from the same `opts.assets` already threaded in, plus the node's current handle for the same reason images need it.
- `applyCopyFields` — one write branch onto `node.axes`.
- Nothing else. No new command, no new route, no `editor.js` change — the loop is kind-agnostic and `/api/copy` already carries it.

## Two things worth your call first

**Removal is a trap.** If a box's only paint *is* its background image, offering an empty option means removing it drops `surfaceDecls` to zero — the node stops being a segment on the next render, vanishes from the editor, and can't be re-added. I'd ship selection only (`required`, no empty option) and leave removal to the AI. Cleaner than a special case.

**You can only change a background, never add one.** An unpainted container isn't a segment at all, so it has no address to click. That's a real limit of derived segmentation (DOC-28 §6.4's known weakness, from the other direction) and closing it means widening what counts as a container segment — bigger than this, and I'd keep it out.

## Ticket

REQ-118 is `free_and_reconciled` — past the reconcile pipeline, so I can't append commits to it. This needs its own ticket. Say the word and I'll create one (a small `request`, likely 1–2 points) with the scope above; I won't create one unprompted.

<!-- xgd-turn id="07e623c1-ee6b-42e0-9468-5102d606cd87-user" -->

<!-- xgd-chat role="user" ts="2026-08-08T21:18:18.702269+00:00" -->
#### You
Yes, and it sounds like this ticket was not completed?? If so can you add the missing requirements to the new ticket

<!-- xgd-turn id="07e623c1-ee6b-42e0-9468-5102d606cd87-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-08T21:23:06.652335+00:00" -->
#### Claude
Let me read the rest of REQ-118 — its acceptance criteria and the non-goals section that got truncated.

Q5 is still open, so framing remains genuinely blocked. Creating the ticket now.

**REQ-128** created (`request-de67e1a1`), status `draft`, 2 points, depends on REQ-118.

On the premise, though — REQ-118 *was* completed. It shipped 7 ACs and 11 UATs and is `free_and_reconciled`. Background images were never in its scope: DOC-28 §6.2's segment table assigns the container segment's "background colour/image" to phase 2, and §12 states "phase 1 is functionally complete at T4." REQ-118's own test suite even repurposed the painted container as its example of *a segment with nothing to edit yet*.

What's actually true is subtler, and it's what REQ-128 argues: **phase 2's gate is colour, not images.** Colour needs the palette (REQ-114) and a colour-valued control (`xgd-framework` REQ-55). A background image needs neither — it's a handle from a closed asset list, which is precisely what REQ-118 built. So one axis can move forward a phase without dragging the rest of phase 2 with it.

I checked DOC-28 §13 Q5 directly rather than trusting REQ-118's note: still open. It asks about image *params* — crops and scrims against the capture/fold vocabulary — so it correctly blocks framing but doesn't touch a background *handle*.

## Deferred requirements carried into REQ-128

I recorded these as explicit non-goals rather than folding them into the ACs, since none are unblocked:

- **Framing** (crop, scale, scrim, rotation, edge effects, free positioning) — still blocked on Q5, verified.
- **Asset upload** — the picker lists what exists.
- **Background colour**, and the rest of the surface group (`pattern`, `overlay`, `surfaceGradient`) — genuinely phase 2.
- **Enum option labels/thumbnails** — the `webui-fields` gap REQ-118 logged. It bites harder here, since a background is exactly the case where you're choosing by look and `/assets/hero.png` tells you least. Per DOC-8 §9.4 that's closed upstream, never wrapped locally, so it strengthens the existing REQ-55 ask rather than changing this ticket.

The two design calls from my last message are written in as decisions: **selection only, no "none" option** (removal would make a background-only box stop being a segment and vanish), and **change-never-add** (an unpainted container has no address to click). AC-7 pins that second one so it's a tested property rather than an accident.

Ticket's at `draft` and I haven't written code. Want me to implement it?

<!-- xgd-chat-end -->