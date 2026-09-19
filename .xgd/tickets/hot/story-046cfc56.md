---
uid: story-046cfc56
id: STORY-148
type: story
title: 'The image layer belongs to the toolchain: PNG decoded and encoded in-repo,
  with the fidelity arithmetic running in the cloud runtime'
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:04:28.160135+00:00'
updated_at: '2026-09-19T13:54:28.603010+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-8e1807f6
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
---

## Story
**As an** operator running the `1c` fidelity toolchain, **I want** the image layer to
be part of the toolchain itself rather than a native module it has to install,
**so that** every pixel-comparing verb runs unchanged on my laptop and inside the
deployed serverless runtime, every fidelity number recorded before the change
stays comparable with every number after it, and a file the toolchain cannot read
is refused by name rather than silently misread.

## Description
The pixel half of the fidelity path — `1c diff`, `1c crop`, `1c aligned-crops` and
therefore `1c gate` — bottomed out in a **native** imaging module. A native module
cannot run in the deployed serverless runtime under any compatibility flag, so the
cloud was blocked for a reason that had nothing to do with the cloud. It was also
the last thing in this repo that made `pnpm install` platform-dependent.

Read honestly, that dependency was doing four things, all on PNG: decode to raw
pixels, encode raw pixels back, read dimensions, extract a rectangle. That is a
**codec, not an imaging library**, and the expensive half of a codec — DEFLATE —
is already a platform primitive in both runtimes. So the codec is written into
this repo: chunk walking, the five row filters, and the reverse.

**The load-bearing promise is that the verdicts do not move.** `1c diff` feeds
ranked regions, band statistics and mean/percentage floors to `1c gate`, which
reconciles them against the value diff and the L1 gate to choose between
`capture-incomplete`, `reproduction-wrong` and `unexplained-disagreement`. A codec
swap that shifted the pixels by one would make every fidelity result recorded to
date incomparable with every result after — and would do it **silently**, because
the new numbers look exactly as plausible as the old. Because the codec is ours
and PNG is lossless, this is pinned as **exact equality on decoded pixels**
against a recorded witness of what the native decoder produced, not as a tolerance
band; a band would hide precisely the drift it exists to catch.

**In scope**: decoding and encoding PNG in both runtimes; reproducing the previous
decoder's sRGB channel expansion exactly; the hand-authored fixture corpus and its
recorded pixel digests; refusing unsupported features, malformed files and non-PNG
inputs as three distinct, named failures; dimensions read without decoding;
`1c crop` narrowed to PNG and clamping an over-reaching box; greyscale heatmaps
stored as greyscale; a perceptual diff running end-to-end in the deployed
serverless runtime against stored images; the remaining fidelity comparisons
(value diff, responsive table and classifier, L1 three-probe gate) confirmed to
run there at their arithmetic cores; and the decode cost measured rather than
assumed.

**Out of scope, by the operator's explicit decision**: every non-PNG raster
format. Nothing reaching this layer is anything but a PNG — screenshots and the
tool's own output — while JPEG, GIF, WebP and AVIF travel the *material* path,
which stores bytes whole, hands them to a vision model and never decodes a pixel.
HEIC is a real gap, but it fails at the upload boundary rather than here and needs
its own ticket. Also out of scope: the install-preflight's requirement map, which
is an extension of an existing capability and is carried separately; `1c gate`
running end-to-end in the serverless runtime (see Technical Context); and the
streaming row-lockstep decode, deliberately deferred.

## Technical Context
- Hand-rolled over a package or a WASM binary, and this is a **reversible**
  decision: `DecompressionStream('deflate')` / `CompressionStream('deflate')` are
  platform globals in both runtimes and `'deflate'` is the zlib wrapping the image
  data actually uses, so what is left to own is the container. Taking a dependency
  stays available if decode ever proves too slow — which is exactly why the
  measurement is an acceptance criterion rather than a note.
- **The channel-count expansion is a compatibility contract, not cosmetics.** The
  previous decoder converted to sRGB on decode, so a greyscale image arrived as
  3-channel and greyscale+alpha as 4-channel. The diff strides its reads by the
  raster's channel count, so a decoder that honestly returned the source's own
  count would read across pixel boundaries and quietly change every number the
  gate depends on.
- The recorded pixel digests are **evidence, not a fixture**: they were captured
  while the native module was still installed, and regenerating them to make a
  test pass would delete the only record of the behaviour this story promises not
  to change.
- Fixtures are authored by hand rather than by an encoder, because asking an
  encoder for a specific row filter is asking it to hit one by luck.
- Equality is pinned on **decoded pixels, never on file bytes**: DEFLATE output is
  not canonical, so a byte-for-byte file comparison would be pinning the
  compressor rather than the image.
- The diff arithmetic was split out of the filesystem/browser shell **verbatim**,
  so that "the same code runs in the serverless runtime" is a statement about the
  same code. Removing the native module was only half of what stood in the way;
  the module that held the maths also read files and spawned a browser, so the
  import failed before a number was computed.
- **One porting finding, and it is an import path rather than a port.** The L1
  gate's arithmetic is clean, but its command entry point lives in a
  file-reading module and the L1 barrel re-exports a module importing an HTTP
  server, so reaching the fold and the three probes from the serverless runtime
  means importing them directly rather than through the barrel. Recorded so the
  next caller does not rediscover it. The value diff needed nothing; the
  responsive diff imports the filesystem at module scope for the report it writes,
  and that import resolves without being called.
- **`1c gate` end-to-end in the serverless runtime is deliberately not claimed
  here.** The intent defers it in its own words: the reference-store port was not
  on this branch to build against, so the gate still resolves its reference as a
  filesystem path. That port now lands beside this work (STORY-147), so the
  deferral is unblocked — but unblocked is not delivered, and no criterion of this
  story may claim it. It belongs to whatever ticket delivers it.
- **The "last native dependency" claim is deliberately the narrow one.** The
  imaging module is gone from the tool's declared dependencies and from its
  installed tree, but it still appears in the workspace lockfile transitively,
  through the harness that runs the serverless-runtime test project. So a
  developer's install still builds a native module — for the test harness, never
  for the tool. What this story asserts is that nothing the toolchain ships
  declares or loads one, and that no `1c` verb can fail because one is absent.
- Row-lockstep streaming decode is **deferred, not forgotten**: two full-page
  rasters plus a diff buffer is around 60 MB against a 128 MB isolate. The decoder
  already unfilters row by row internally, so this stays a change to one function
  and should wait until a real page exceeds the budget.
- This story and STORY-147 (reference bundle storage) touch in exactly one place —
  the ladder-screenshot accessor, which was split so that neither change eats the
  other's.

## Reconciliation Decisions
The intent states the codec's obligations at the level of "refuse what it cannot
do, by name". Three commitments the landed code makes are formalized here, in this
session, rather than left open:

- **A refusal names the format from the file's own leading bytes, and offers the
  remedy** (decided at reconciliation, 2026-09-13): the intent requires an explicit
  error naming the format an operator was given, but is silent on how that name is
  derived and on what happens when nothing matches. The landed code reads magic
  bytes and never the extension — the extension being precisely what is wrong in
  the case worth catching — names the common photographic and vector formats
  including the one an iPhone produces, suggests conversion, and reports
  "unrecognised" distinctly when the leading bytes match nothing. Formalized as
  part of AC-1779, because a refusal that named the wrong thing would send the
  operator looking for a corrupt file.
- **Encoding refuses a raster it cannot honestly write** (decided at
  reconciliation, 2026-09-13): the intent covers the decode side's refusals and
  says nothing about the encode side. A raster whose channel count no PNG colour
  type holds, or whose buffer is short for its declared dimensions, is refused by
  name rather than written out as a corrupt file that would fail much later, in
  someone else's verb. Formalized as part of AC-1779.
- **The measurement has a ceiling, not only a record** (decided at reconciliation,
  2026-09-13): the intent asks that decode time be "measured and recorded, not
  assumed". The landed code also fails the run if the projected full-page cost
  crosses a deliberately loose bound. Formalized as AC-1788, because a number
  nobody checks is a number that can silently double, and the bound is the thing
  the intent says would reopen the dependency question.

No contradiction between intent and code was found for this plan item.

## Dependencies
None.

## Story Points
3