---
uid: comment-d70ad543
id: COMMENT-2883
type: comment
title: Comment on request REQ-234
created_by: xgd
created_at: '2026-09-12T23:40:34.696564+00:00'
updated_at: '2026-09-13T00:07:51.724400+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7573c2ab
  kind: chat_transcript
---

<!-- xgd-turn id="be9fdf1a-ac2d-4d1b-acfd-e05161367fd7-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T23:40:11.699478+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="be9fdf1a-ac2d-4d1b-acfd-e05161367fd7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T00:07:50.641565+00:00" -->
#### Claude
Now let me read the existing background-ladder tests so I match their shape.

Now the layer-stack change:

Now the rendition picker and `image-set()` builder:

Now `surfaceLadderDecls`:

Clean. Now run the existing REQ-222 tests to check nothing regressed:

Now let me fix the superseded REQ-222 assertion:

Now the REQ-234 UAT file:

Now the wider regression scope:

Meanwhile, let me update the ticket body with what the build settled.

Now merge back:

Done. REQ-234 is `free_coded` at `7ad2b18`, merged into `xgd-working`, version 0.2.184.

## The support check you asked for first — it's a go

The ticket said to verify `image-set()` **and** `type()` against current documentation and stop if `type()` isn't reliable. Checked against MDN's browser-compat data and webstatus.dev today:

**It's one question, not two.** Every earlier release that shipped `image-set()` is recorded as a *partial implementation whose stated defect is the missing `type()`* — Firefox 88, Safari/iOS 14–16.6 — and each of those entries is `version_removed` at the release that added it. So the floor for both is identical: **Chrome/Edge 113, Firefox 89, Safari/iOS 17**. `image-set()` is Baseline widely-available (interoperable 2023-09-18, past the widely-available line 2026-03-18).

Consequence: no `-webkit-` variant is emitted. The versions that had only the prefixed form are exactly those partial ones that lacked `type()`, so a prefixed declaration would buy nothing.

## The costing section is superseded — this cost nothing

The ticket says the ladder's transform count for backgrounds doubles and must not land before the latency work. Both premises are already satisfied, and the second one more thoroughly than expected:

REQ-222's ladder walks the **snapshot's assets, not the document**. A backdrop is an ordinary raster still in the site's assets, so every publish since REQ-222's typed-source work has already been encoding, writing and paying for a full WebP ladder for every band backdrop — and then emitting a stylesheet that named none of it. **Zero new transforms, zero R2 writes, zero latency.** The saving was already bought; this collects it. That finding is recorded in the ticket body.

## What landed

One rule now carries `background-image` twice — plain `url()` first, `image-set()` second. CSS keeps the last declaration it could parse, so a browser without `image-set()` (or with it but not `type()`) is left holding exactly today's backdrop. A UAT pins the *order*, not the presence of both, because emitting the pair the wrong way round is the one arrangement that breaks and would pass a presence check.

- Alternatives in the manifest's own best-first order; the source format closes the set, typed from the asset's extension — or **untyped** where that yields nothing, since an untyped option is always supported, which is what a fallback wants to be.
- A type outside the `<source>` allowlist is **dropped, not retyped** — silently re-emitting it untyped would offer a browser a format it may not read.
- Fewer than two options emits nothing (`srcset`'s own rule). Every URL still goes through the sole `cssUrl` sink.
- Width stays the per-breakpoint rules' job: no `x`/`dpi`/`dppx` descriptors, asserted rather than asserted-in-prose.
- The whole layer stack is restated through the one stack emitter, so a scrim survives into the `image-set()`.

**Explicit supersession**: REQ-222's UAT *"never paints a typed rendition as a background"* is kept with its claim narrowed — a typed rendition may now be *offered*, but may never be the *whole declaration*. Its original reason (no fallback, no way for the page to find out) is answered rather than overruled.

## Evidence

17 new UATs in two files. The node ones cover the declaration shape, order, fallbacks and the two rejection paths, plus an end-to-end publish. The **workers** ones run against the real Images binding and make the assertion node cannot: the bytes behind `type("image/webp")` really are a WebP (`RIFF`/`WEBP` magic read off the bucket). That failure is unrecoverable — a browser that takes a WebP option and finds a PNG has already committed and the band simply doesn't paint.

Regression scope green: framework typecheck, the REQ-222 ladder suites (node + workers), the L1 render/fold/edit-channel guardrails, and asset delivery. The full node project leaves the same 2 pre-existing failures (`BUG-67 backend settings`, `bug32 webui scope`) that were failing before this change — confirmed against a sweep taken earlier today.

Sources: [MDN image-set()](https://developer.mozilla.org/en-US/docs/Web/CSS/image/image-set) · [caniuse css-image-set](https://caniuse.com/css-image-set) · [WebKit type() support commit](https://github.com/WebKit/WebKit/commit/e3554c53fff0e1d9ed207af749cd1dbaf7853300)

<!-- xgd-chat-end -->