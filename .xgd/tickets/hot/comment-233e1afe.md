---
uid: comment-233e1afe
id: COMMENT-1438
type: comment
title: Comment on request REQ-156
created_by: xgd
created_at: '2026-08-23T23:40:37.090863+00:00'
updated_at: '2026-08-23T23:48:01.555268+00:00'
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

<!-- xgd-chat-end -->