---
uid: comment-307fc4a8
id: COMMENT-3049
type: comment
title: Comment on request REQ-271
created_by: xgd
created_at: '2026-09-18T02:42:05.159597+00:00'
updated_at: '2026-09-18T03:26:00.203372+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-caa17b9d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "48dd5dea-d00c-41d2-b9f0-6a2f4d8b9bc4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="591eafeb-06a1-40b6-afad-b6f24352b520-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T02:41:24.487333+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="591eafeb-06a1-40b6-afad-b6f24352b520-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T03:09:29.816451+00:00" -->
#### Claude
I've read the ticket and surveyed the three code sites. Let me start the free-coding process.

Baseline is clean. Now implementing — starting with the capture (issue 1).

Now the capture-schema stamp, so a pre-existing bundle's fabricated white is never mistaken for a measurement:

Now the projections, the band-paint filter, and the section-level comparison:

While the full suite runs, let me update the ticket body to record what landed and the decisions made.

Now let me update the ticket body while that runs.

I found a risk with filtering band paint out of the manifest: the fold reads text-free elements to build backdrop nodes (BUG-27). Moving that recognition to the diff layer instead, where it cannot affect the fold.

Both failures reproduce on the unmodified main checkout — pre-existing and unrelated. Now retargeting the UAT for the relocated band-paint recognition:

A real bug: `fieldToElement` sets `text` to `(generic)`, never empty — my textless guard would never match. Fixing to use the explicit `textless` flag:

Waiting on the full suite. Here's where things stand:

**Implemented (all three issues), on branch `free-REQ-271`:**

1. **`extract.ts`** — neither band path launders `rgbToHex`'s `null` into `bodyBg`. `RawBand.backgroundColor` is the band's own fill or `null`. `colorScheme` now comes from `surfaceFillOf(bandElement)` — the existing helper that composites down the *geometric* surface chain, so the header-over-hero case reads its real backdrop. `sections.ts` projects a measured absence as `background.kind: 'none'`.

2. **`values-diff.ts`** — `SectionValues.surfaceFill` (hex / `null` / `undefined`=unmeasured), projected on both sides and compared in the per-section pass, reusing the element-level `surfaceFill` delta property. `UnpairedObject` carries `box` + manifest `index`.

3. **`fold.ts`** — `buildSolidBands` no longer adopts a run-group fill that *is* the scrim over that band; with no measured base the band node isn't emitted at all.

**Two decisions worth flagging:**

- I bumped **capture schema to 3** (REQ-270's mechanism) and gated the reference-side `surfaceFill` projection on it. Without that, every retained bundle's fabricated `#ffffff` would read as a measurement and the new axis would fire a false delta for every transparent band on its first run — the exact trap your ordering note warns about. This is recorded in the ticket body as a consequence of issue 1.
- For issue 2's third item I first dropped band-paint elements in `flattenSignals`, then backed that out: a full-bleed textless box is exactly what the fold reads to rebuild a **backdrop** (BUG-27), so removing it upstream would take a hero photograph out of the fold's input on a page-builder site. The recognition now lives in the diff's own reporting — the manifest stays faithful, only the "paired with nothing" tally stops double-counting.

**Verified against the real bundle:** re-folding a copy of `gigabytealchemy.ai/index` removes `section-band-0` (`{"surfaceFill":"#030717"}`) and nothing else — `section-bg-0` keeps `overlay #030717 @ 0.3`, the document background stays `#e8dfd3`, 70 nodes → 69. Ticket body updated with what landed and the test plan; title untouched.

Not yet done: version bump, commit, merge back, `free_coded`.

<!-- xgd-turn id="255a1429-b210-4556-8ed9-612555c80262-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T03:13:54.249707+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="255a1429-b210-4556-8ed9-612555c80262-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T03:26:00.142641+00:00" -->
#### Claude
Full `node` suite: 440 passed, 2 failed — both pre-existing (already confirmed failing identically on the unmodified main checkout). Now the `workers` project, since it imports the diff:

All tests green (workers: 127 files / 1166 tests, all pass). Now committing and merging back.

Re-running the full suite post-merge (xgd-working brought in new repro-console code and a new test):

REQ-271 is `free_coded` and landed on `xgd-working`.

## What shipped

**Issue 1 — the capture stops fabricating a fill.** `extract.ts` no longer launders `rgbToHex`'s `null` into `bodyBg` in either band path; `RawBand.backgroundColor` is the band's own fill or `null`, projected as `background.kind: 'none'`. `colorScheme` now comes from `surfaceFillOf(bandElement)` — the existing helper that composites down the *geometric* surface chain, so a header over a scrimmed hero reads its real backdrop instead of an invented white.

**Issue 2 — a band's fill is compared.** `SectionValues.surfaceFill` is three-valued (hex / `null` = paints nothing / `undefined` = unmeasured), projected on both sides and compared in the per-section pass, reusing the existing element-level `surfaceFill` delta property. `UnpairedObject` carries `box` and its manifest index, and an L1 render's own band boxes stop being counted as repro objects that matched nothing. `backgroundImageUrl` needed no work — REQ-270's section comparison had already landed.

**Issue 3 — the fold drops the fabricated plate.** `buildSolidBands` no longer adopts a run-group fill that *is* the scrim over that band; with no measured base it emits no band node. Re-folding a copy of the retained `gigabytealchemy.ai/index` removes `section-band-0` (`#030717` over the whole 800px hero) and nothing else — `section-bg-0` keeps its overlay, the page background stays `#e8dfd3`, 70 nodes → 69.

## Two judgment calls worth your attention

- **Capture schema bumped to 3.** Every retained bundle asserts an opaque fill for bands that paint nothing, so reading `background.color` as a measurement would fire a false delta for every transparent band the moment the new axis went live — the exact trap your ordering note flagged. The reference-side projection is gated on schema ≥ 3 and leaves the axis *unmeasured* otherwise, with `staleCaptureDetail` naming it. Recorded in the ticket as a consequence of issue 1.
- **Band-paint recognition lives in the diff, not the manifest.** My first cut dropped those elements in `flattenSignals`; I backed it out because a full-bleed textless box is exactly what the fold reads to rebuild a backdrop (BUG-27) — it would have removed a hero photograph from the fold's input on a page-builder site. The manifest stays faithful; only the tally changed.

## Verification

- `tests/test_UAT_FC_REQ-271_band_surface_fill.test.ts` (13 legs) + fixture `req271-transparent-bands.html`. Four legs drive a real Chromium and **skip in this sandbox** — `chromiumAvailable()` is false here, so the capture-side claims (`kind: 'none'`, `colorScheme: dark`, the L1 band-box leg) have no executed evidence from this machine and will first run wherever a browser is available.
- Everything else ran: full `node` project **441 passed / 2 failed**, and `workers` **127 files, 1166 tests, all pass**. The two failures are `bug32-webui-scope-rebrand` and `BUG-67 backend_settings` — both reproduce identically on the unmodified main checkout, so they're pre-existing and unrelated.

Commits `a1b4516` (code) and `21553f5` (version 0.2.256), branch cleaned, lock released. The ticket body carries the full "what landed" record, so it's safe to promote to `ready_to_reconcile` when you're ready.

<!-- xgd-chat-end -->