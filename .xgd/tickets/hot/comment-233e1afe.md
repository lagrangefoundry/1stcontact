---
uid: comment-233e1afe
id: COMMENT-1438
type: comment
title: Comment on request REQ-156
created_by: xgd
created_at: '2026-08-23T23:40:37.090863+00:00'
updated_at: '2026-09-01T22:11:20.411987+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-51514090
  kind: chat_transcript
---

<!-- xgd-turn id="ba279039-6506-4e84-9474-3b9a49bd46bb-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T23:39:03.865335+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="ba279039-6506-4e84-9474-3b9a49bd46bb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-23T23:48:01.351983+00:00" -->
#### Claude
I read the ticket, then read the actual code and ran two experiments. Findings below — no code changed.

## The scope is real, and smaller than "seven call sites" suggests

`sharp` appears in exactly two source files. All of it is PNG-shaped:

| Op | Site |
|---|---|
| decode file → raw | `perceptual.ts:308` |
| decode bytes → raw | `perceptual.ts:319` |
| encode RGB(A) raw → PNG | `perceptual.ts:334` |
| encode gray raw → PNG | `perceptual.ts:360` |
| dimensions | `perceptual.ts:384` |
| extract rect | `perceptual.ts:393`, `aligned-crops.ts:156/163` |

`computeDiff` is already documented and written as pure ("core diff (pure — no I/O, no browser)"), and `reconcileGates` in `gate.ts:271` is already pure ("Pure input — no I/O, no browser"). The verdict maths is not the problem. The problem is the codec and the filesystem shell around it.

## AC2 is not "within a stated bound" — it can be bit-identical, and I proved it

I wrote a throwaway PNG decoder (chunk walk → inflate → per-scanline unfilter, ~40 lines) and diffed its output against `sharp`'s `.raw()` on all 15 reference screenshots in `storage/references/`:

```
15/15 IDENTICAL=true   — same bytes, same width/height, same channels (3)
```

Every reference screenshot is `bitdepth=8 colortype=2 interlace=0` — truecolour RGB, no alpha, non-interlaced. That's the simplest case in the PNG spec, and decode is exactly defined by it, so any conforming decoder produces the same bytes. `sharp` reports `channels: 3` for these, and a decoder that derives channels from colour-type reports 3 too — so even the *stride* in `computeDiff` (`ref.data[i * rc]`) is unchanged.

The ticket's hedge about a "stated bound" is only needed for **re-encoded PNG bytes** (different deflate → different file, identical pixels). Nothing in the test suite hashes PNG bytes — the only byte-level assertions are 8-byte magic-number checks (`capture.test.ts:96`). So the fixture corpus can assert *equality*, not tolerance.

## Decode cost, measured

Same machine, same files:

| | `screenshot.full.png` 1280×4744 | `screenshot-1440.png` 1440×4844 |
|---|---|---|
| `sharp` (native libvips) | 61 ms | 71 ms |
| hand-rolled JS + native inflate | 173 ms | 191 ms |

~2.7× slower, ~350 ms for a diff's image pair. Against a verb that also boots a headless browser, that is not a cost worth optimising. It also means neither WASM (`@jsquash/png`) nor a JS library is obviously required — `DecompressionStream('deflate')` / `CompressionStream('deflate')` exist natively in **both** workerd and Node 18+, so a dependency-free codec that runs identically in both runtimes is on the table. That is worth weighing against the ticket's four candidates, because it removes a dependency rather than swapping one.

## The thing the ticket doesn't mention: the 128 MB isolate cap

This is the constraint I'd want settled before we design.

A 1280×4744 diff currently materialises: two 17.4 MB rasters + a 17.4 MB transient inflate buffer + a 6.1 MB diff raster ≈ **60 MB peak**. At 1440 wide it's ~70 MB. A Worker isolate gets 128 MB, so the ceiling is roughly a 2000×8000 page before it OOMs — and the mobile ladder shots are the *tall* ones (320×7555 today).

The mitigation is available precisely *because* we'd own the codec: PNG unfiltering only needs the previous scanline, and `computeDiff`'s per-pixel pass is row-local. Decoding both images in lockstep and folding each row straight into `diffData` drops peak from ~60 MB to ~7 MB. `sharp` cannot do that — it hands you a whole buffer. So "replace sharp" and "make it fit in a Worker" may be the same piece of work, or may be two, and that's a design decision, not a detail.

## AC4's sequencing note looks wrong

The ticket says only AC5 needs REQ-155. I don't think that holds:

- `cmdL1Gate` (`repro.ts`) reads the reference through `capture/bundle.ts` — `readCapture`, `readL1`, `readMultiState`, all `readFileSync`.
- `cmdValuesDiff` (`fidelity.ts`) reads the reference manifest the same way.
- `referenceCoverage` (`gate.ts:208`) → `readMultiState` → filesystem.

`capture/bundle.ts` *is* the filesystem ReferenceStore, unported. So l1-gate and values-diff are workerd-clean only in their **pure comparison cores**; their entry points are not, and porting them is REQ-155's job. AC4 as written ("confirmed workerd-clean, or ported") would silently absorb REQ-155's scope. I'd narrow it to the arithmetic cores and let REQ-155 own the bundle reads.

Same shape for `perceptual.ts` itself: it imports `./shot` (which imports playwright and `node:fs/promises`) and `./capture`, so the module graph has to be split — pure core + codec in one module, the fs/browser shell in another — before AC3's workerd UAT can import anything at all.

## Two smaller judgement calls

1. **PNG-only is a narrowing.** `decodeImage`'s docstring says "or any sharp-readable image", and `1c crop` takes an arbitrary `--input`. Nothing in the pipeline produces JPEG/WebP (those extensions only appear in asset mirroring, never on a decode path), so I think PNG-only with an explicit refusal is right — but it is a behaviour change and should be stated, not discovered.
2. **`1c crop` and `aligned-crops` stop being "extract a rectangle" and become decode→slice→encode.** `aligned-crops.ts:155-163` currently decodes twice (once for metadata, once to extract). Owning the codec makes that one decode.

## What I'd want to agree before writing anything

- Codec strategy: dependency-free (`Compression/DecompressionStream` + ~200 lines) vs. a WASM/JS package. I lean dependency-free given the measurement above and that the whole point is removing the last native dep.
- Whether streaming row-lockstep decode+diff is in scope now, or a follow-up once a page actually OOMs.
- Whether AC4 gets narrowed to the pure cores, with the bundle reads handed to REQ-155.
- Whether AC2's fixture corpus asserts bit-equality (I think it should) rather than a bound.

Want me to fold this into the ticket body once we've settled those?

<!-- xgd-turn id="ba4918ea-d4aa-4211-9cd0-186f0252d378-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:19:04.548534+00:00" -->
#### You
Lets go dependency free for now and revisit later if things are too slow
PNG only is too narrow - we need at least jpeg, giff and WebP too. Can we do the apple format HEIC?

2. Ok

Whether streaming row-lockstep decode+diff is in scope now, or a follow-up once a page actually OOMs. <-- what??

On AC4 and AC2 whatever makes most sense to you

<!-- xgd-turn id="ba4918ea-d4aa-4211-9cd0-186f0252d378-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T21:21:20.331861+00:00" -->
#### Claude
No code changed. Answering the "what??" first, since that was my jargon rather than your question.

## Streaming row-lockstep — what I meant

Right now `decodeImage` hands back the *whole* pixel buffer. A diff of a 1280×4744 screenshot therefore holds two 18 MB rasters plus a 6 MB diff buffer at once — ~60 MB peak. A Cloudflare Worker isolate gets 128 MB total, so around 2000×8000 the diff simply dies, and the mobile ladder shots are exactly the tall ones.

PNG stores pixels row by row, and the diff compares pixel *(x,y)* against pixel *(x,y)*. So instead of "decode both fully, then compare", you could decode row 1 of each, compare it, write the diff row, discard, move to row 2. Peak drops from ~60 MB to ~7 MB. `sharp` can't do this — it only hands you a finished buffer — so owning the codec is what puts it on the table.

My question was just: build that now, or build the simple version now and add it when a page actually OOMs? **Recommendation: simple now.** The decoder unfilters row-by-row internally regardless, so folding rows straight into the diff later is a change to one function, not a rewrite. Not worth complicating the first version for a ceiling we haven't hit.

## Dependency-free: agreed, and here is what that actually buys

For **PNG** it's genuinely free — `DecompressionStream('deflate')` is native in both Node and workerd, so the codec is ~200 lines and I've already measured it bit-identical to `sharp` on all 15 reference screenshots. **GIF** is a similar shape: LZW plus palette plus interlace, ~250 lines, fully specified, exact.

Past that the cost curve breaks:

| Format | Hand-rolled cost | Bit-exact? |
|---|---|---|
| PNG | ~200 lines | yes, measured |
| GIF | ~250 lines | yes |
| JPEG baseline | ~1200 lines | **no** — the IDCT is only specified to a precision *bound* (T.83), so two conforming decoders legitimately differ by ±1 |
| JPEG progressive | +~600 lines | no |
| WebP lossless (VP8L) | ~800 lines | yes |
| WebP lossy (VP8) | ~3000 lines — bool-arithmetic coder, intra prediction, loop filter | yes, but any loop-filter error drifts silently |
| HEIC | an HEVC intra decoder — CABAC, 35 prediction modes, transform trees, SAO | not realistically |

HEIC is the one to say plainly: **no.** Nobody hand-rolls HEVC; `libheif` itself delegates to `libde265`, and it's patent-pool encumbered. "Dependency-free" and "HEIC" cannot both be true.

## But the formats you named mostly already work — without any codec

This is the part worth knowing before we spend anything. I checked what actually decodes images in this repo, and `sharp` is confined to `tools/generate/src/cli/` — the repro/diff pipeline, whose only inputs are Playwright screenshots, which are always 8-bit truecolour PNG.

The client-material path never decodes at all:

- `apps/control-app/src/material.ts` already accepts `jpeg, gif, webp, avif, svg` — it stores the bytes whole and records the content type.
- `apps/control-app/src/describe.ts` hands those bytes straight to the vision model (`VISION_MEDIA_TYPES` = jpeg/png/gif/webp) to produce the searchable body.
- `apps/public-site/src/content-type.ts` serves them by content type; the browser decodes.

So JPEG, GIF and WebP are supported today, end to end, because nothing in the product needs their *pixels* — only their bytes. Replacing `sharp` with a PNG-only codec doesn't narrow that by one file.

## HEIC is a real gap, and it isn't this ticket

An iPhone photo genuinely fails today, in three places, none of them `sharp`: it isn't in `MATERIAL_CONTENT_TYPES`, the Messages API won't take it so it can't be described, and no browser will display it so it can't be published. That's an ingestion-boundary problem whose fix is **transcode on upload**, and the honest options are a WASM `libheif` (a portable dependency, no native build, workerd-safe), Cloudflare Images if it accepts HEIC on input (I'd want to verify — I'm not confident it does), or an explicit refusal with a message telling the client to export as JPEG. Worth a separate ticket; I haven't created one.

Mitigating factor: iOS Safari commonly transcodes HEIC to JPEG when uploading through a web form, so the failure is narrower than it sounds — but it's behaviour-dependent and I wouldn't rely on it.

## What I propose for REQ-156

- Hand-rolled, dependency-free **PNG** codec (decode, encode RGB/RGBA, encode grayscale, dimensions, extract-rect). Bit-exact, so **AC2 asserts equality against a fixture corpus, not a bound**.
- Split `perceptual.ts` into a pure core+codec module and an fs/browser shell, so the workerd UAT has something importable.
- **Non-PNG input is refused explicitly**, with a message naming the format — a stated behaviour change, since `1c crop --input` currently takes anything `sharp` reads.
- **Narrow AC4 to the arithmetic cores** (`computeDiff`, `reconcileGates`, values-diff comparison) and leave the bundle reads to REQ-155, which owns them.
- Add GIF only if you want it — it's cheap, but nothing asks for it.
- Streaming decode+diff noted as a follow-up.

If you're happy with that, I'll fold it into the ticket body and start.

<!-- xgd-turn id="8207ab65-0cde-4bff-84a1-fc3326b288bf-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:37:01.489354+00:00" -->
#### You
on row lockstep - simple now

ok lets start with that

<!-- xgd-turn id="8207ab65-0cde-4bff-84a1-fc3326b288bf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:07:03.456841+00:00" -->
#### Claude
Ticket updated and branch cut at `free-REQ-156`. Building the fixture corpus first — the baseline has to be captured while `sharp` is still installed.

Important finding from the baseline: `sharp` **expands greyscale to RGB** on decode (`gray8` → 3 channels, `gray+alpha` → 4). Matching that is load-bearing, since `computeDiff` strides by channel count. Writing the codec to that contract.

Codec compiles. Now the UATs — starting with the node suite that pins AC1, AC2 and AC6.

Now the workerd suite for AC3 and AC4.

All UATs green in both runtimes. Adding the ticket-body language for behaviours the UATs assert that the body doesn't yet name.

These preflight suites pin facts REQ-156 legitimately changes. Updating them.

<!-- xgd-turn id="3266e66d-8bca-47b1-a96e-66f8ef226942-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T22:07:25.467221+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-turn id="3266e66d-8bca-47b1-a96e-66f8ef226942-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:11:20.124863+00:00" -->
#### Claude
Finishing the promotion — version bump, then `move-to-free-coded`.

The main checkout's `node_modules` was built against a different pnpm store than the one now resolved, so a plain install wants to purge all 500 packages. Trying the non-destructive route first.

The validator sees my bump commit displaced by two `xgd` ticket auto-commits that landed on top. Re-bumping as it instructs.

REQ-156 is free-coded and merged.

## What landed

**`tools/generate/src/cli/png.ts`** — the PNG codec, ~570 lines, no dependency. `DecompressionStream('deflate')` / `CompressionStream('deflate')` are platform globals in both Node and workerd, and `'deflate'` is exactly the zlib wrapping IDAT uses, so the work was the container: chunk walking, the five row filters, adaptive filter selection on encode, CRC32.

**The load-bearing discovery:** `sharp` doesn't return the source's channel count. It converts to sRGB on decode, so greyscale comes back as 3-channel RGB and greyscale+alpha as 4-channel RGBA. `computeDiff` strides its reads by `Raster.channels`, so a decoder that honestly returned 1 channel would read across pixel boundaries and silently move every number the gate depends on. I captured that from `sharp` before removing it — `tests/fixtures/png/` holds 11 hand-authored fixtures plus the sha256 of what `sharp` decoded each to. **Both runtimes assert byte-for-byte against those hashes.**

**`perceptual-core.ts`** splits the arithmetic out of `perceptual.ts` so workerd can import the diff without dragging `node:fs` into the isolate. Moved verbatim — rewriting on the way past would have made AC2 unverifiable.

Also: `1c crop` is PNG-only and refuses anything else *by name* (JPEG/GIF/WebP/HEIC/AVIF/BMP/TIFF/SVG, sniffed from magic bytes); greyscale heatmaps now write as colour type 0 instead of the RGB `sharp` was producing at 3× the size; `crop` leaves the preflight map entirely.

**AC6, measured:** 10.2 ms/MP → ~62ms for a 1280×4744 full page. Comfortably inside a Worker's budget, so the dependency question stays closed.

## Status against the ACs

AC1–AC4 and AC6 delivered. **AC5 is not** — `1c gate` end-to-end in workerd needs REQ-155's `ReferenceStore` port, which is `ready_to_reconcile` and not on this branch; `cmdGate` still resolves its reference with `fsReferenceBundle(opts.ref)` and passes a path down. The ticket's own sequencing note anticipated this, and I recorded it in the body rather than leaving it implied.

AC4 turned up one finding worth knowing: the l1-gate arithmetic is clean, but the `l1` **barrel** re-exports `roundtrip.ts`, which imports `node:http` — so a Worker must import `l1/fold` and `l1/probes` directly. An import path, not a port. `values-diff` needed nothing at all.

## Two things to know

**I updated two other tickets' suites.** `req44-install-preflight` and `reconciliation-1c-install-preflight` pinned `crop` in the gated set and `sharp` as a gated dependency. Those facts changed, so I updated the assertions and their explanatory comments with the REQ-156 reasoning rather than working around them.

**Your main checkout needs a `pnpm install`, and I couldn't run it.** I removed `sharp` from the lockfile and synced it in the worktree, but here pnpm wants to purge all ~500 packages first — this checkout's `node_modules` was built against `~/Library/pnpm/store/v11` while the resolved store is now the in-repo `.pnpm-store/` (a sandbox artifact predating this work). Pointing it back at the original store fails because the sandbox denies writes there. I stopped rather than risk an unrecoverable purge, so `test_UAT_FC_REQ-44_this_repos_own_install_is_healthy` reports lockfile-drift here until you run it with a TTY. Nothing was modified by the attempts.

Full suite: **2219 passed, 1 failed** — `bug32-webui-scope-rebrand`, which I confirmed fails identically on the base commit (it flags `test_UAT_FC_BUG-42_markdown_rendering.test.ts` restating the webui scope; unrelated to this work).

Promotion needed two version bumps: 0.2.38 was displaced at the tip by `xgd(ticket)` auto-commits landing between merge-back and promotion, which the validator reads as someone else publishing it. Final version 0.2.39, three commits recorded, branch cleaned and lock released.

<!-- xgd-chat-end -->