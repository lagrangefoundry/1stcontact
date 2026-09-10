---
uid: comment-590859ba
id: COMMENT-2620
type: comment
title: Comment on request REQ-221
created_by: xgd
created_at: '2026-09-10T22:11:20.853946+00:00'
updated_at: '2026-09-10T22:17:04.941710+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4502c34e
  kind: chat_transcript
---

<!-- xgd-turn id="5600065d-be32-4897-817d-d04324c4bb21-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:11:03.413493+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="5600065d-be32-4897-817d-d04324c4bb21-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:17:04.458073+00:00" -->
#### Claude
Now let me look at the router upload route and check for an Images binding.

Now the client-side upload overlay and what it advertises as accepted.

## Findings — REQ-221

I traced the upload path end to end and checked the external dependency the ticket rests on. Summary: **the gap is real and slightly worse than described, but the central premise — "the Images binding does it" — is at risk on plan grounds and needs settling before anything is written.**

---

### 1. The blocker: Cloudflare Images HEIC input is Enterprise-only

Cloudflare's own limits page lists supported input formats as PNG, JPEG, GIF, WebP, SVG, **AVIF (Enterprise plan only)** and **HEIC (Enterprise plan only)**. The HEIC changelog announces ingest but is silent on tiering; the limits page is explicit.

Two consequences:

- If our account is not Enterprise, `env.IMAGES.input()` on HEIC bytes fails and this ticket has no implementation as written.
- It also undercuts a load-bearing sentence in **REQ-219**: *"Browser Rendering … cannot decode HEIC — so it would have solved this and left the upload path needing a second answer."* If Images can't decode HEIC on our plan either, that argument for choosing the Images binding over Browser Rendering evaporates — REQ-219 still has good reasons (per-publish cost, transform-chain fit), but not that one.

**This is the first thing to confirm.** Everything below is conditional on it.

Also: `.input()` caps at **20 MB**, while `MAX_MATERIAL_BYTES` is `MAX_BLOB_BYTES` = **26,214,400 (25 MiB)**. A 22 MB HEIC passes our own ceiling and fails the binding — needs its own refusal, not a 500.

---

### 2. The gap is real, and fails in *two* different ways

- **When the browser says `image/heic`**: `kindOf` (material.ts:186) sees `image/` and files it as an image. The Library renders `<img src>`, Chrome fails to decode, and the `error` handler at `library.js:751` prints **"That file is no longer in storage."** — a message that is actively false and sends the client looking for the wrong problem.
- **When the browser says nothing** (`''` / `application/octet-stream`): `TYPE_BY_EXTENSION` (material.ts:264) has no `heic` row, so `resolveContentType` leaves it octet-stream and `kindOf` files it as a **document**. Same file, different wrong outcome.
- `describe.ts:237` (`VISION_MEDIA_TYPES`) already excludes HEIC and refuses honestly — *"Image stored but not described: image/heic is not a format that can be looked at."* That one is correct today.
- **Promotion has no allowlist.** Nothing between `promoteToSiteAsset` and the public site checks content type, so a HEIC can be placed on a site and served as `image/heic` to every visitor. That's the "the site cannot serve" bullet, confirmed.

---

### 3. Where the conversion belongs — it fits cleanly

`ingestUpload` (material.ts:353) is the right seam. It runs *before* `ingest`, and `ingest` is where `store.create()` then `store.attach()` happen — so converting there gives the ticket's "a refusal, not a broken row" for free: no material ticket exists yet to be orphaned.

The dependency-injection pattern is already there — `IngestDeps` (`describeImage`, `describeText`, `index`), wired at `router.ts:1444`. A `convertImage` dep fits exactly and keeps `material.ts` free of `env`.

Two details:

- **Filename and content type must both change** (`photo.heic` → `photo.webp`). `ingest` resolves the type once at the head and hands the same value to `classify`, `describe` and `attach` (the BUG-41 fix), so changing both before that call is sufficient — everything downstream agrees automatically.
- **Output format cannot be AVIF.** `VISION_MEDIA_TYPES` is jpeg/png/gif/webp. An AVIF conversion would land undescribed. **WebP** is the right default — in the vision set, in `TYPE_BY_EXTENSION`, smallest.

Aside worth naming: `ingest` does create-then-attach, which is the *reverse* of DOC-38 §7.3's "write blob first, then the record". Pre-existing, out of scope, but the ticket's prose brushes against it.

---

### 4. Detection must be by magic number, not content type

Case 2 above never says `image/heic`, so a content-type test misses it. There is already a correct sniffer — `sniffImageFormat` at `tools/generate/src/cli/png.ts:83`, which tests the `ftyp` brand for `heic/heix/hevc/hevx/heim/heis/mif1/msf1` (and `avif/avis`). It lives in a Node CLI package the Worker doesn't import, so it needs lifting somewhere shared or duplicating (~12 lines).

---

### 5. Testing is the second real risk

- `wrangler dev` and `vitest-pool-workers` use the **offline low-fidelity** Images implementation, which supports only `width`, `height`, `rotate`, `format`. HEIC decode is not in it. Only `wrangler dev --remote` hits the real API.
- The workers vitest project can't run in this sandbox at all (`EPERM: listen`).

So the honest UAT shape is: node-project tests proving the *routing* with an injected fake converter (HEIC-by-magic-number is routed to it; converted bytes/filename/type are what `ingest` sees; a converter failure is a `MaterialRejectedError` and **no ticket is created**), plus one workers test of the wiring. That the binding genuinely decodes HEIC is provable only against the live API — worth stating in the ticket rather than pretending a green suite covers it.

---

### 6. The "worth checking while in here" note — both halves are real defects

1. **The picker advertises nothing.** `upload.js:102` sets `type='file'` and `multiple=true` and **no `accept` attribute** — despite the module comment at line 96 discussing "the accept list" as though it existed. Every file on the disk is offered.
2. **A Library-route failure is completely silent.** `receiveFiles` (app.js:743–751) catches the error, then surfaces it only `if (source === 'chat')`. A drop on the Library area that 400s or 503s produces *nothing* — `library.refresh()` runs and the row simply never appears. Chat-route drops do get the reason (`CopyError` carries `envelope.error`). This is exactly the silence the ticket names, and it is independent of HEIC.

---

### What I'd like settled before coding

1. **Is the account Enterprise for Images?** If not — wasm decode (libheif, the thing the ticket wants to avoid), or an honest refusal carrying the *Settings → Camera → Formats → Most Compatible* advice? A refusal already has a home in `MaterialRejectedError` and is strictly better than today's false "no longer in storage".
2. **WebP as the output format** — agreed? (Not AVIF, per §3.)
3. **Does `ingestFetch` convert too**, or only the upload path?
4. **The 20 MB binding ceiling** — pre-check with its own message, or let the binding error and translate it?
5. **Are the two §6 UI defects in scope for this ticket** (they'd need their own UATs and ticket-body language), or a separate one?

Sources: [Images limits and formats](https://developers.cloudflare.com/images/get-started/limits/), [HEIC support changelog](https://developers.cloudflare.com/changelog/post/heic-support/), [Images binding](https://developers.cloudflare.com/images/transform-images/bindings/)

<!-- xgd-chat-end -->